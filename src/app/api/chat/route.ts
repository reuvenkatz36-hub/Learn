import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { languageDirective } from '@/lib/generate'

export async function POST(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, roadmapId, history, language } = await req.json()

  // Get roadmap context if provided
  let context = ''
  if (roadmapId) {
    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('title, topic, difficulty, sections')
      .eq('id', roadmapId)
      .single()
    if (roadmap) {
      context = `The student is studying: ${roadmap.title} (${roadmap.topic}, ${roadmap.difficulty} level).`
    }
  }

  // Save user message
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    roadmap_id: roadmapId ?? null,
    role: 'user',
    content: message,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = ''
        const messages = [
          ...(history ?? []).slice(-10),
          { role: 'user' as const, content: message }
        ]

        const aiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1500,
          system: `You are an expert AI learning coach and tutor named Maestro. ${context}
Your role is to:
- Answer questions clearly and concisely
- Explain concepts with practical examples
- Encourage and motivate the student
- Break down complex topics into digestible parts
- Suggest what to study next when appropriate
Be warm, encouraging, and educational.${languageDirective(language)}`,
          messages,
        })

        for await (const chunk of aiStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullResponse += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }

        // Save assistant message
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          roadmap_id: roadmapId ?? null,
          role: 'assistant',
          content: fullResponse,
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err) {
        console.error('Chat error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
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

export async function GET(req: Request) {
  const supabase = await createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const roadmapId = url.searchParams.get('roadmapId')

  const query = supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (roadmapId) query.eq('roadmap_id', roadmapId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
