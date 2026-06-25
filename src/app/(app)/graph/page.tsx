import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import KnowledgeGraphClient from '@/components/graph/KnowledgeGraphClient'

export default async function GraphPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: roadmaps } = await supabase
    .from('roadmaps')
    .select('id, title')
    .eq('user_id', user.id)

  return <KnowledgeGraphClient roadmaps={roadmaps ?? []} />
}
