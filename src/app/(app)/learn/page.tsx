import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'
import { Roadmap } from '@/types/database'

const owl = CREW.owl

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
      <div className="flex items-center gap-3 mb-8 pt-2">
        <Mascot who="owl" size={48} halo />
        <div>
          <h1 className="text-2xl font-bold text-ink">Your Courses</h1>
          <p className="text-ink-soft text-sm">{owl.name} keeps your lessons in order · {roadmaps?.length ?? 0} course{roadmaps?.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {!roadmaps?.length ? (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <Mascot who="owl" size={64} className="mx-auto mb-3" />
          <p className="text-ink font-semibold mb-1">No courses yet</p>
          <p className="text-ink-soft text-sm mb-6">Head to your dashboard to create one</p>
          <Link
            href="/dashboard"
            className="inline-flex text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: owl.accent }}
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {roadmaps.map(roadmap => {
            const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
            const completedSections = sections.filter(s => s.completed).length
            const progress = sections.length > 0 ? Math.round((completedSections / sections.length) * 100) : 0

            return (
              <Link
                key={roadmap.id}
                href={`/learn/${roadmap.id}`}
                className="group flex items-center gap-4 p-4 bg-surface hover:shadow-md hover:-translate-y-0.5 border border-line rounded-2xl transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: owl.accent, background: owl.accentSoft }}
                    >
                      {roadmap.difficulty}
                    </span>
                    <span className="text-ink-faint text-[10px]">{sections.length} lessons · {roadmap.estimated_hours}h</span>
                  </div>
                  <h3 className="font-semibold text-ink text-sm truncate mb-2.5">
                    {roadmap.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: owl.accent }} />
                    </div>
                    <span className="text-[10px] text-ink-soft tabular-nums">{completedSections}/{sections.length}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink flex-shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
