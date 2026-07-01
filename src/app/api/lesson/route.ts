import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { languageDirective, generateStoryVersion, type ContentLanguage, type LessonContentSection } from '@/lib/generate'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, language, mode } = await req.json() as {
    lessonId: string
    language?: ContentLanguage
    mode?: 'standard' | 'story'
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, roadmaps(*)')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const roadmap = lesson.roadmaps as { topic: string; title: string; difficulty: string; language?: string } | null
  const lang: ContentLanguage = (roadmap?.language ?? language) === 'he' ? 'he' : 'en'

  // Story Mode: retell the existing lesson content as a narrative. Non-streamed
  // single response — the client caches it per lesson.
  if (mode === 'story') {
    const sections = Array.isArray(lesson.content) ? lesson.content as unknown as LessonContentSection[] : []
    if (sections.length === 0) return NextResponse.json({ error: 'Lesson has no content yet' }, { status: 400 })
    try {
      const story = await generateStoryVersion({ lessonTitle: lesson.title, sections, language: lang })
      return NextResponse.json({ sections: story })
    } catch (err) {
      console.error('Story generation failed:', err)
      return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 })
    }
  }

  // Return a streaming response
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

Use varied section types. Make it engaging, practical, and educational. No markdown outside JSON strings.${languageDirective(lang)}`
          }]
        })

        let fullText = ''
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }

        // Parse and save
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
