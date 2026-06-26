import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, action } = await req.json()

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
Make questions test understanding, not just memorization.`
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

  await awardXP(supabase, user.id, xpEarned, 0, 1)

  if (score >= questions.length * 0.6) {
    await unlockNextLesson(supabase, user.id, lessonId)
  }

  return NextResponse.json({ score, maxScore: questions.length, xpEarned })
}

async function awardXP(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  userId: string,
  xp: number,
  lessons: number,
  quizzes: number
) {
  const today = new Date().toISOString().split('T')[0]

  await supabase.from('daily_activity').upsert({
    user_id: userId,
    activity_date: today,
    xp_earned: xp,
    lessons_completed: lessons,
    quizzes_taken: quizzes,
  }, {
    onConflict: 'user_id,activity_date',
    ignoreDuplicates: false,
  })

  const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', userId).single()
  if (profile) {
    await supabase.from('profiles').update({ total_xp: (profile.total_xp ?? 0) + xp }).eq('id', userId)
  }
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

  await supabase.from('lessons')
    .update({ status: 'available' })
    .eq('roadmap_id', currentLesson.roadmap_id)
    .eq('user_id', userId)
    .eq('section_index', currentLesson.section_index + 1)
}
