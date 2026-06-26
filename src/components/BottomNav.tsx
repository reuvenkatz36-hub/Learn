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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-2xl transition-all',
                active ? 'bg-indigo-100' : ''
              )}>
                <Icon className={cn('w-5 h-5 transition-all', active ? 'text-indigo-600' : 'text-gray-400')} />
              </div>
              <span className={cn('text-[10px] font-medium transition-all', active ? 'text-indigo-600' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
