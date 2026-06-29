import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: roadmaps },
    { data: activity },
    { data: lessons },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('daily_activity').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(90),
    supabase.from('lessons').select('roadmap_id, status').eq('user_id', user.id),
  ])

  // Real per-course progress comes from the lessons table, not roadmap.sections.
  const progress: Record<string, { completed: number; total: number }> = {}
  for (const l of lessons ?? []) {
    const p = (progress[l.roadmap_id] ??= { completed: 0, total: 0 })
    p.total++
    if (l.status === 'completed') p.completed++
  }

  return <DashboardClient profile={profile} roadmaps={roadmaps ?? []} activity={activity ?? []} progress={progress} />
}
