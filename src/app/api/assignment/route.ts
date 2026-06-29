import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await req.json()

  const { data: lessonRow } = await supabase
    .from('lessons')
    .select('*, roadmaps(topic, difficulty)')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single() as { data: { id: string; title: string; roadmaps: { topic: string; difficulty: string } | null } | null; error: unknown }

  if (!lessonRow) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const roadmap = lessonRow.roadmaps

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Create a practical assignment for lesson "${lessonRow.title}" in a ${roadmap?.topic} course (${roadmap?.difficulty} level).
Return ONLY valid JSON:
{
  "prompt": "string (clear assignment instructions, 150-250 words, including what to do, deliverables, and success criteria)"
}
Make it hands-on and achievable within 20-30 minutes.`
    }]
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Failed to generate assignment' }, { status: 500 })

  const { prompt } = JSON.parse(jsonMatch[0])

  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      prompt,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(assignment)
}

export async function PATCH(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assignmentId, submission } = await req.json()

  const { data: assignmentRow } = await supabase
    .from('assignments')
    .select('*, lessons(title, roadmaps(topic))')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .single() as { data: {
      id: string; prompt: string; submission: string | null; ai_feedback: string | null; score: number | null;
      lessons: { title: string; roadmaps: { topic: string } | null } | null
    } | null; error: unknown }

  if (!assignmentRow) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  const lesson = assignmentRow.lessons

  // Stream AI feedback
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullFeedback = ''
        const aiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are an expert teacher reviewing a student's assignment.

Lesson: "${lesson?.title}"
Topic: ${lesson?.roadmaps?.topic}
Assignment: ${assignmentRow.prompt}
Student Submission: ${submission}

Provide detailed, constructive feedback. Include:
1. What they did well (be specific)
2. Areas for improvement
3. Specific suggestions to make it better
4. A score out of 100 with justification

Format your response as clear paragraphs, not JSON.`
          }]
        })

        for await (const chunk of aiStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullFeedback += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }

        // Extract score from feedback
        const scoreMatch = fullFeedback.match(/\b(\d{1,3})\s*(?:\/\s*100|out of 100)/i)
        const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 75

        await supabase.from('assignments').update({
          submission,
          ai_feedback: fullFeedback,
          score,
          status: 'graded',
          submitted_at: new Date().toISOString(),
        }).eq('id', assignmentId)

        // Award XP
        const today = new Date().toISOString().split('T')[0]
        await supabase.from('daily_activity').upsert({
          user_id: user.id,
          activity_date: today,
          xp_earned: Math.round(score * 0.3),
          lessons_completed: 0,
          quizzes_taken: 0,
        }, { onConflict: 'user_id,activity_date', ignoreDuplicates: false })

        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
        if (profile) {
          await supabase.from('profiles').update({ total_xp: (profile.total_xp ?? 0) + Math.round(score * 0.3) }).eq('id', user.id)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, score })}\n\n`))
        controller.close()
      } catch (err) {
        console.error('Assignment feedback error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate feedback' })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
