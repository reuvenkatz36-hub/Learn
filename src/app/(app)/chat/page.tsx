import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ChatClient from '@/components/chat/ChatClient'

export default async function ChatPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: messages }, { data: roadmaps }] = await Promise.all([
    supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at').limit(100),
    supabase.from('roadmaps').select('id, title').eq('user_id', user.id).eq('status', 'active'),
  ])

  return <ChatClient initialMessages={messages ?? []} roadmaps={roadmaps ?? []} />
}
