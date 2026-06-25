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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('daily_activity').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(90),
  ])

  return <DashboardClient profile={profile} roadmaps={roadmaps ?? []} activity={activity ?? []} />
}
