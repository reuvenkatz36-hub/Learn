import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { languageDirective, summarizeContent, type ContentLanguage } from '@/lib/generate'

// Floating help button: a free-form question answered in the context of the
// lesson currently on screen. Streams the answer.
export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, question, language } = await req.json() as {
    lessonId: string
    question: string
    language?: ContentLanguage
  }
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const { data: lesson } = await supabase
    .from('lessons')
    .select('title, content, roadmaps(title, topic, difficulty)')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const roadmap = lesson.roadmaps as unknown as { title: string; topic: string; difficulty: string } | null
  const contentSummary = summarizeContent(lesson.content).slice(0, 6000)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1000,
          system: `You are a patient, encouraging tutor. The student is in the middle of this lesson and asked for help with something they didn't understand.

Course: ${roadmap?.title} (${roadmap?.topic}, ${roadmap?.difficulty})
Lesson: "${lesson.title}"
Lesson content summary:
${contentSummary}

Answer their question clearly and concisely, grounded in this lesson's content. Use a simple example if it helps. Keep it short — a few sentences to a short paragraph.${languageDirective(language)}`,
          messages: [{ role: 'user', content: question.slice(0, 2000) }],
        })

        for await (const chunk of aiStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err) {
        console.error('Lesson ask error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
