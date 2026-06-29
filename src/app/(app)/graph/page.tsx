import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BrainClient, { type BrainCourse } from '@/components/graph/BrainClient'

export default async function BrainPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: roadmaps }, { data: lessons }] = await Promise.all([
    supabase.from('roadmaps').select('id, title').eq('user_id', user.id).order('created_at'),
    supabase.from('lessons').select('id, status, roadmap_id, section_index').eq('user_id', user.id).order('section_index'),
  ])

  const courses: BrainCourse[] = (roadmaps ?? []).map(r => ({
    id: r.id,
    title: r.title,
    lessons: (lessons ?? [])
      .filter(l => l.roadmap_id === r.id)
      .map(l => ({ id: l.id, completed: l.status === 'completed' })),
  }))

  return <BrainClient courses={courses} />
}
