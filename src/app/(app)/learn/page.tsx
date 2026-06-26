import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Roadmap } from '@/types/database'

export default async function LearnPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const userId = user!.id

  const { data: rawRoadmaps } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  const roadmaps = rawRoadmaps as Roadmap[] | null

  return (
    <div className="p-5 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-bold text-white">Your Courses</h1>
        <p className="text-zinc-500 text-sm mt-1">{roadmaps?.length ?? 0} course{roadmaps?.length !== 1 ? 's' : ''}</p>
      </div>

      {!roadmaps?.length ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-300 font-semibold mb-1">No courses yet</p>
          <p className="text-zinc-600 text-sm mb-6">Go to your dashboard to create one</p>
          <Link
            href="/dashboard"
            className="inline-flex bg-amber-400 hover:bg-amber-300 transition-colors text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-bold"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {roadmaps.map(roadmap => {
            const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
            const completedSections = sections.filter(s => s.completed).length
            const progress = sections.length > 0 ? Math.round((completedSections / sections.length) * 100) : 0

            return (
              <Link
                key={roadmap.id}
                href={`/learn/${roadmap.id}`}
                className="group flex items-center gap-4 p-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      roadmap.difficulty === 'beginner' && 'text-emerald-400',
                      roadmap.difficulty === 'intermediate' && 'text-amber-400',
                      roadmap.difficulty === 'advanced' && 'text-red-400',
                    )}>
                      {roadmap.difficulty}
                    </span>
                    <span className="text-zinc-700 text-xs">·</span>
                    <span className="text-zinc-600 text-[10px]">{sections.length} lessons · {roadmap.estimated_hours}h</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm truncate group-hover:text-amber-400 transition-colors mb-2.5">
                    {roadmap.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-600 tabular-nums">{completedSections}/{sections.length}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
