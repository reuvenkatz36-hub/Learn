import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { anthropic, MODEL } from '@/lib/anthropic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { topic, difficulty } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a comprehensive learning roadmap for "${topic}" at ${difficulty} level.
Return ONLY valid JSON matching this exact structure:
{
  "title": "string (concise roadmap title)",
  "description": "string (2-3 sentence overview)",
  "estimatedHours": number,
  "sections": [
    {
      "index": 0,
      "title": "string",
      "description": "string (what this section covers)",
      "topics": ["topic1", "topic2", "topic3"],
      "estimatedMinutes": number
    }
  ]
}
Create exactly 8 sections. Make it practical and progressive. No markdown, just JSON.`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')
    const roadmapData = JSON.parse(jsonMatch[0])

    const { data: roadmap, error } = await supabase
      .from('roadmaps')
      .insert({
        user_id: user.id,
        title: roadmapData.title,
        description: roadmapData.description,
        topic,
        difficulty,
        estimated_hours: roadmapData.estimatedHours ?? 10,
        sections: roadmapData.sections,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    const lessonInserts = roadmapData.sections.map((s: { index: number; title: string }, i: number) => ({
      roadmap_id: roadmap.id,
      user_id: user.id,
      title: s.title,
      section_index: i,
      status: i === 0 ? 'available' : 'locked',
    }))

    await supabase.from('lessons').insert(lessonInserts)
    await generateKnowledgeGraph(supabase, user.id, roadmap.id, roadmapData, topic)

    return NextResponse.json({ id: roadmap.id })
  } catch (err) {
    console.error('Roadmap creation error:', err)
    return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 })
  }
}

async function generateKnowledgeGraph(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  roadmapId: string,
  roadmapData: { title: string; sections: Array<{ title: string; topics: string[] }> },
  topic: string
) {
  try {
    const nodes: Array<{ user_id: string; roadmap_id: string; label: string; node_type: 'topic' | 'concept' | 'skill'; position: { x: number; y: number }; mastery_level: number }> = []

    nodes.push({
      user_id: userId,
      roadmap_id: roadmapId,
      label: topic,
      node_type: 'topic',
      position: { x: 400, y: 50 },
      mastery_level: 0,
    })

    roadmapData.sections.forEach((section, si) => {
      const sectionX = (si % 4) * 200
      const sectionY = Math.floor(si / 4) * 200 + 200
      nodes.push({
        user_id: userId,
        roadmap_id: roadmapId,
        label: section.title,
        node_type: 'concept',
        position: { x: sectionX, y: sectionY },
        mastery_level: 0,
      })

      section.topics.slice(0, 2).forEach((t, ti) => {
        nodes.push({
          user_id: userId,
          roadmap_id: roadmapId,
          label: t,
          node_type: 'skill',
          position: { x: sectionX + (ti === 0 ? -60 : 60), y: sectionY + 120 },
          mastery_level: 0,
        })
      })
    })

    const { data: insertedNodes } = await supabase
      .from('knowledge_nodes')
      .insert(nodes)
      .select()

    if (!insertedNodes || insertedNodes.length === 0) return

    const rootNode = insertedNodes[0]
    const sectionNodes = insertedNodes.slice(1).filter((n: { node_type: string }) => n.node_type === 'concept')
    const skillNodes = insertedNodes.filter((n: { node_type: string }) => n.node_type === 'skill')

    const edges = [
      ...sectionNodes.map((sn: { id: string }) => ({ user_id: userId, roadmap_id: roadmapId, source_id: rootNode.id, target_id: sn.id })),
      ...skillNodes
        .map((sk: { id: string }, i: number) => {
          const parentSection = sectionNodes[Math.floor(i / 2)]
          return parentSection
            ? { user_id: userId, roadmap_id: roadmapId, source_id: parentSection.id, target_id: sk.id }
            : null
        })
        .filter((e): e is { user_id: string; roadmap_id: string; source_id: string; target_id: string } => e !== null)
    ]

    if (edges.length > 0) {
      await supabase.from('knowledge_edges').insert(edges)
    }
  } catch (err) {
    console.error('Knowledge graph error (non-fatal):', err)
  }
}
