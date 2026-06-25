import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const roadmapId = url.searchParams.get('roadmapId')

  const query = supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('user_id', user.id)

  if (roadmapId) query.eq('roadmap_id', roadmapId)

  const edgeQuery = supabase
    .from('knowledge_edges')
    .select('*')
    .eq('user_id', user.id)

  if (roadmapId) edgeQuery.eq('roadmap_id', roadmapId)

  const [{ data: nodes }, { data: edges }] = await Promise.all([query, edgeQuery])

  return NextResponse.json({ nodes: nodes ?? [], edges: edges ?? [] })
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nodeId, position } = await req.json()

  await supabase.from('knowledge_nodes').update({ position }).eq('id', nodeId).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
