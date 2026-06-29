import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Roadmap } from '@/types/database'
import BuildClient from './BuildClient'

export default async function BuildPage({ params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawRoadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', roadmapId)
    .eq('user_id', user.id)
    .single()

  const roadmap = rawRoadmap as Roadmap | null
  if (!roadmap) redirect('/learn')

  // Already built — skip straight to the course.
  if (roadmap.generation_status === 'ready') redirect(`/learn/${roadmapId}`)

  const lessonCount = Array.isArray(roadmap.sections) ? roadmap.sections.length : 8

  return <BuildClient roadmapId={roadmapId} title={roadmap.title} lessonCount={lessonCount} />
}
