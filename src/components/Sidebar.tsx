'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import {
  LayoutDashboard, BookOpen, MessageSquare, GitBranch, User, Zap, LogOut, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/learn', icon: BookOpen, label: 'Learning' },
  { href: '/chat', icon: MessageSquare, label: 'AI Coach' },
  { href: '/graph', icon: GitBranch, label: 'Knowledge Graph' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-gray-900/50 border-r border-white/5 flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">MasteryAI</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
            {profile?.display_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile?.display_name ?? 'User'}</div>
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <Trophy className="w-3 h-3" />
              {profile?.total_xp ?? 0} XP
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
