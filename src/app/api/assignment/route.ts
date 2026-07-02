import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { languageDirective, type ContentLanguage } from '@/lib/generate'
import { recordLevelUp, bumpDailyActivity } from '@/lib/rewards'
import type Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, language } = await req.json() as { lessonId: string; language?: ContentLanguage }

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
  "prompt": "string (clear assignment instructions, 150-250 words, including what to do, deliverables, and success criteria)",
  "inputTypes": ["text" and/or "drawing"]
}
inputTypes marks how the answer should be submitted: "text" for written answers (essays, code, explanations), "drawing" for sketches, diagrams, geometry, flowcharts or visual work. Include both when either would work.
Make it hands-on and achievable within 20-30 minutes.${languageDirective(language)}`
    }]
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Failed to generate assignment' }, { status: 500 })

  const parsed = JSON.parse(jsonMatch[0]) as { prompt: string; inputTypes?: string[] }
  const inputTypes = Array.isArray(parsed.inputTypes) && parsed.inputTypes.length > 0
    ? parsed.inputTypes.filter(t => t === 'text' || t === 'drawing')
    : ['text']

  // input_types is a post-migration column — retry without it on older schemas.
  let { data: assignment, error } = await supabase
    .from('assignments')
    .insert({ lesson_id: lessonId, user_id: user.id, prompt: parsed.prompt, status: 'pending', input_types: inputTypes })
    .select()
    .single()
  if (error) {
    ;({ data: assignment, error } = await supabase
      .from('assignments')
      .insert({ lesson_id: lessonId, user_id: user.id, prompt: parsed.prompt, status: 'pending' })
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...assignment, input_types: inputTypes })
}

export async function PATCH(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assignmentId, submission, drawingDataUrl, language } = await req.json() as {
    assignmentId: string
    submission?: string
    drawingDataUrl?: string
    language?: ContentLanguage
  }

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
  const isDrawing = !!drawingDataUrl

  // Validate/split the drawing data URL for Claude's image input.
  let drawingBase64 = ''
  let drawingMedia: 'image/png' | 'image/jpeg' = 'image/png'
  if (isDrawing) {
    const m = drawingDataUrl!.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/)
    if (!m) return NextResponse.json({ error: 'Invalid drawing data' }, { status: 400 })
    drawingMedia = m[1] as typeof drawingMedia
    drawingBase64 = m[2]
  }

  const reviewInstruction = `You are an expert teacher reviewing a student's assignment.

Lesson: "${lesson?.title}"
Topic: ${lesson?.roadmaps?.topic}
Assignment: ${assignmentRow.prompt}
${isDrawing ? 'The student submitted the attached drawing/diagram as their answer. Review the drawing itself.' : `Student Submission: ${submission}`}

Provide detailed, constructive feedback. Include:
1. What they did well (be specific)
2. Areas for improvement
3. Specific suggestions to make it better
4. A score out of 100 with justification (always write the score as "NN/100")

Format your response as clear paragraphs, not JSON.${languageDirective(language)}`

  const content: Anthropic.ContentBlockParam[] = isDrawing
    ? [
        { type: 'image', source: { type: 'base64', media_type: drawingMedia, data: drawingBase64 } },
        { type: 'text', text: reviewInstruction },
      ]
    : [{ type: 'text', text: reviewInstruction }]

  // Stream AI feedback
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullFeedback = ''
        const aiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1500,
          messages: [{ role: 'user', content }],
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

        const baseUpdate = {
          submission: isDrawing ? (submission || '[drawing]') : submission,
          ai_feedback: fullFeedback,
          score,
          status: 'graded' as const,
          submitted_at: new Date().toISOString(),
        }
        // submission_type / drawing_data are post-migration columns — retry without.
        const { error: updErr } = await supabase.from('assignments').update({
          ...baseUpdate,
          submission_type: isDrawing ? 'drawing' : 'text',
          drawing_data: isDrawing ? drawingDataUrl : null,
        }).eq('id', assignmentId)
        if (updErr) {
          await supabase.from('assignments').update(baseUpdate).eq('id', assignmentId)
        }

        // Award XP: increment (don't overwrite) today's counters + level-up check.
        const xp = Math.round(score * 0.3)
        await bumpDailyActivity(supabase, user.id, { xp })
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
        let levelUp = null
        if (profile) {
          const oldXp = profile.total_xp ?? 0
          await supabase.from('profiles').update({ total_xp: oldXp + xp }).eq('id', user.id)
          levelUp = await recordLevelUp(supabase, user.id, oldXp, oldXp + xp)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, score, levelUp })}\n\n`))
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
