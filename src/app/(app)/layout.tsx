import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/TopNav'
import SoundController from '@/components/SoundController'
import type { Profile } from '@/types/database'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <SoundController />
      <TopNav profile={profile as Profile | null} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
