import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { languageDirective, type ContentLanguage } from '@/lib/generate'
import { recordLevelUp, bumpDailyActivity } from '@/lib/rewards'

export const maxDuration = 120
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, action, language } = await req.json() as { lessonId: string; action: string; language?: ContentLanguage }

  if (action === 'generate') {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*, roadmaps(topic, difficulty)')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single()

    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    const contentSummary = Array.isArray(lesson.content)
      ? lesson.content.map((s: { title: string; content: string }) => `${s.title}: ${s.content?.slice(0, 200)}`).join('\n')
      : ''

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a 5-question quiz for this lesson: "${lesson.title}"
Based on content: ${contentSummary}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "string explaining the correct answer"
    }
  ]
}
Make questions test understanding, not just memorization.${languageDirective(language)}`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })

    const quizData = JSON.parse(jsonMatch[0])
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        questions: quizData.questions,
        max_score: quizData.questions.length,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(quiz)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function PATCH(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { quizId, answers, lessonId } = await req.json()

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('user_id', user.id)
    .single()

  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  const questions = quiz.questions as Array<{ id: string; correctIndex: number }>
  let score = 0
  questions.forEach(q => {
    if (answers[q.id] === q.correctIndex) score++
  })

  const xpEarned = score * 10

  await supabase.from('quizzes').update({
    score,
    submitted_at: new Date().toISOString(),
  }).eq('id', quizId)

  // Award XP: increment today's counters (upserting absolute values used to wipe
  // the day's other activity), bump total XP, and detect level-ups.
  await bumpDailyActivity(supabase, user.id, { xp: xpEarned, quizzes: 1 })
  const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
  let levelUp = null
  if (profile) {
    const oldXp = profile.total_xp ?? 0
    await supabase.from('profiles').update({ total_xp: oldXp + xpEarned }).eq('id', user.id)
    levelUp = await recordLevelUp(supabase, user.id, oldXp, oldXp + xpEarned)
  }

  // If perfect or near-perfect, unlock next lesson
  if (score >= questions.length * 0.6) {
    await unlockNextLesson(supabase, user.id, lessonId)
  }

  return NextResponse.json({ score, maxScore: questions.length, xpEarned, levelUp })
}

async function unlockNextLesson(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  userId: string,
  lessonId: string
) {
  const { data: currentLesson } = await supabase
    .from('lessons')
    .select('roadmap_id, section_index')
    .eq('id', lessonId)
    .single()

  if (!currentLesson) return

  await supabase.from('lessons').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', lessonId)

  // Only unlock a lesson that is actually locked — never demote one the user
  // already completed or started.
  await supabase.from('lessons')
    .update({ status: 'available' })
    .eq('roadmap_id', currentLesson.roadmap_id)
    .eq('user_id', userId)
    .eq('section_index', currentLesson.section_index + 1)
    .eq('status', 'locked')
}
