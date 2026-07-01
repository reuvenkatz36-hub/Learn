import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import {
  generateLessonContent,
  generateQuiz,
  generateAssignmentPrompt,
  summarizeContent,
} from '@/lib/generate'

export const maxDuration = 300
export const runtime = 'nodejs'

// All-in-one course build. Generates EVERY lesson's content, then every quiz
// and assignment, in parallel, and streams progress to the build screen.
export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roadmapId, language: bodyLanguage } = await req.json()

  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', roadmapId)
    .eq('user_id', user.id)
    .single()

  if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })

  // Course language: stored on the roadmap when the migration ran, otherwise
  // whatever the client says the UI language is right now.
  const language = ((roadmap as { language?: string }).language ?? bodyLanguage) === 'he' ? 'he' as const : 'en' as const

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, section_index, content')
    .eq('roadmap_id', roadmapId)
    .eq('user_id', user.id)
    .order('section_index')

  const lessonRows = lessons ?? []
  const total = lessonRows.length
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        send({ stage: 'lessons', done: 0, total })

        // 1. Lesson content — all in parallel, persist + count as each lands.
        let lessonsDone = 0
        const contents = await Promise.all(
          lessonRows.map(async (lesson) => {
            try {
              const sections = Array.isArray(lesson.content) && lesson.content.length > 0
                ? (lesson.content as unknown as Awaited<ReturnType<typeof generateLessonContent>>)
                : await generateLessonContent({
                    topic: roadmap.topic,
                    courseTitle: roadmap.title,
                    difficulty: roadmap.difficulty,
                    lessonTitle: lesson.title,
                    sectionIndex: lesson.section_index,
                    language,
                  })
              await supabase.from('lessons').update({ content: sections }).eq('id', lesson.id)
              lessonsDone++
              send({ stage: 'lessons', done: lessonsDone, total })
              return { lesson, sections }
            } catch (err) {
              console.error('Lesson gen failed (non-fatal):', lesson.id, err)
              lessonsDone++
              send({ stage: 'lessons', done: lessonsDone, total })
              return { lesson, sections: [] as Awaited<ReturnType<typeof generateLessonContent>> }
            }
          }),
        )

        // 2. Quizzes + assignments — all in parallel off the generated content.
        let extrasDone = 0
        const extrasTotal = contents.length * 2
        send({ stage: 'practice', done: 0, total: extrasTotal })

        await Promise.all(
          contents.flatMap(({ lesson, sections }) => [
            (async () => {
              try {
                const questions = await generateQuiz({
                  lessonTitle: lesson.title,
                  contentSummary: summarizeContent(sections),
                  language,
                })
                await supabase.from('quizzes').insert({
                  lesson_id: lesson.id,
                  user_id: user.id,
                  questions,
                  max_score: questions.length,
                })
              } catch (err) {
                console.error('Quiz gen failed (non-fatal):', lesson.id, err)
              } finally {
                extrasDone++
                send({ stage: 'practice', done: extrasDone, total: extrasTotal })
              }
            })(),
            (async () => {
              try {
                const { prompt, inputTypes } = await generateAssignmentPrompt({
                  lessonTitle: lesson.title,
                  topic: roadmap.topic,
                  difficulty: roadmap.difficulty,
                  language,
                })
                // input_types is a post-migration column — retry without it.
                const { error } = await supabase.from('assignments').insert({
                  lesson_id: lesson.id,
                  user_id: user.id,
                  prompt,
                  status: 'pending',
                  input_types: inputTypes,
                })
                if (error) {
                  await supabase.from('assignments').insert({
                    lesson_id: lesson.id,
                    user_id: user.id,
                    prompt,
                    status: 'pending',
                  })
                }
              } catch (err) {
                console.error('Assignment gen failed (non-fatal):', lesson.id, err)
              } finally {
                extrasDone++
                send({ stage: 'practice', done: extrasDone, total: extrasTotal })
              }
            })(),
          ]),
        )

        await supabase.from('roadmaps').update({ generation_status: 'ready' }).eq('id', roadmapId)
        send({ stage: 'done' })
        controller.close()
      } catch (err) {
        console.error('Course build error:', err)
        await supabase.from('roadmaps').update({ generation_status: 'error' }).eq('id', roadmapId)
        send({ stage: 'error', message: 'Build failed' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
