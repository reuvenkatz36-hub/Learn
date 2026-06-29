'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, BookOpen, MessageSquare, Brain, User, LogOut, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CREW, type CrewId } from '@/lib/crew'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import Mascot from '@/components/crew/Mascot'
import SoundToggle from '@/components/SoundToggle'

const nav: { href: string; icon: typeof BookOpen; label: string; who: CrewId }[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home', who: 'fox' },
  { href: '/learn', icon: BookOpen, label: 'Learn', who: 'owl' },
  { href: '/chat', icon: MessageSquare, label: 'Coach', who: 'dog' },
  { href: '/graph', icon: Brain, label: 'Brain', who: 'elephant' },
  { href: '/profile', icon: User, label: 'Profile', who: 'fox' },
]

export default function TopNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = (
    <>
      {nav.map(({ href, icon: Icon, label, who }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        const accent = CREW[who].accent
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
              active ? 'bg-paper' : 'hover:bg-paper/70',
            )}
            style={{ color: active ? accent : '#6B6864' }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Mascot who="fox" size={30} animate={false} />
            <span className="font-bold text-ink text-lg tracking-tight">Mastery</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">{links}</nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SoundToggle />
            <span className="hidden sm:flex items-center gap-1 text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg bg-paper" style={{ color: CREW.fox.accent }}>
              <Zap className="w-3.5 h-3.5" /> {(profile?.total_xp ?? 0).toLocaleString()}
            </span>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-soft hover:text-ink hover:bg-paper transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Mobile nav (scrollable) */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mt-0.5">{links}</nav>
      </div>
    </header>
  )
}
