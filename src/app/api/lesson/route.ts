import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await req.json()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, roadmaps(*)')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const roadmap = lesson.roadmaps as { topic: string; title: string; difficulty: string } | null

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Create a detailed educational lesson for:
Topic: ${roadmap?.topic}
Course: ${roadmap?.title}
Level: ${roadmap?.difficulty}
Lesson: "${lesson.title}" (Section ${lesson.section_index + 1} of 8)

Return ONLY valid JSON with exactly 8 sections:
{
  "sections": [
    {
      "title": "string",
      "content": "string (300-500 words of rich educational content with examples)",
      "type": "text|example|key_point|exercise"
    }
  ]
}

Use varied section types. Make it engaging, practical, and educational. No markdown outside JSON strings.`
          }]
        })

        let fullText = ''
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }

        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const lessonData = JSON.parse(jsonMatch[0])
            await supabase.from('lessons').update({
              content: lessonData.sections,
              status: 'in_progress',
            }).eq('id', lessonId)

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sections: lessonData.sections })}\n\n`))
          }
        } catch (parseErr) {
          console.error('Parse error:', parseErr)
        }

        controller.close()
      } catch (err) {
        console.error('Stream error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
