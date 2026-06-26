'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, MessageSquare, GitBranch, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  { href: '/chat', icon: MessageSquare, label: 'Coach' },
  { href: '/graph', icon: GitBranch, label: 'Graph' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-amber-400' : 'text-zinc-600')} />
              <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-amber-400' : 'text-zinc-600')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
