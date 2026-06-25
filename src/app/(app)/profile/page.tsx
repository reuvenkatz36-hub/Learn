import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return <ProfileClient profile={profile} />
}
