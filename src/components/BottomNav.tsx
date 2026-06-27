'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, MessageSquare, GitBranch, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CREW, type CrewId } from '@/lib/crew'

const nav: { href: string; icon: typeof BookOpen; label: string; who: CrewId }[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home', who: 'fox' },
  { href: '/learn', icon: BookOpen, label: 'Learn', who: 'owl' },
  { href: '/chat', icon: MessageSquare, label: 'Coach', who: 'dog' },
  { href: '/graph', icon: GitBranch, label: 'Graph', who: 'elephant' },
  { href: '/profile', icon: User, label: 'Profile', who: 'fox' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-line">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {nav.map(({ href, icon: Icon, label, who }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const accent = CREW[who].accent
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: active ? accent : '#9C9892' }}
              />
              <span
                className={cn('text-[10px] font-semibold transition-colors')}
                style={{ color: active ? accent : '#9C9892' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
