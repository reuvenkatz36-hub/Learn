import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Lock, ChevronRight, Clock, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoadmapSection, Roadmap, Lesson } from '@/types/database'

export default async function RoadmapPage({ params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const userId = user!.id

  const [{ data: rawRoadmap }, { data: rawLessons }] = await Promise.all([
    supabase.from('roadmaps').select('*').eq('id', roadmapId).eq('user_id', userId).single(),
    supabase.from('lessons').select('*').eq('roadmap_id', roadmapId).eq('user_id', userId).order('section_index'),
  ])

  const roadmap = rawRoadmap as Roadmap | null
  const lessons = rawLessons as Lesson[] | null

  if (!roadmap) redirect('/learn')

  const sections = Array.isArray(roadmap.sections) ? roadmap.sections as unknown as RoadmapSection[] : []
  const completed = lessons?.filter(l => l.status === 'completed').length ?? 0
  const total = lessons?.length ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-5 sm:p-8 max-w-2xl mx-auto">
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      {/* Roadmap header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            roadmap.difficulty === 'beginner' && 'text-emerald-400',
            roadmap.difficulty === 'intermediate' && 'text-amber-400',
            roadmap.difficulty === 'advanced' && 'text-red-400',
          )}>
            {roadmap.difficulty}
          </span>
          <span className="text-zinc-700 text-xs">·</span>
          <span className="text-zinc-600 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> {roadmap.estimated_hours}h estimated
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{roadmap.title}</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-5">{roadmap.description}</p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums">{completed}/{total}</span>
          <span className="text-xs font-bold text-amber-400 tabular-nums">{pct}%</span>
        </div>
      </div>

      {/* Lessons list */}
      <div className="space-y-2">
        {lessons?.map((lesson, i) => {
          const section = sections[i]
          const isLocked = lesson.status === 'locked'
          const isCompleted = lesson.status === 'completed'
          const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress'

          return (
            <div
              key={lesson.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border transition-all',
                isLocked && 'bg-zinc-900/50 border-zinc-800/50 opacity-50',
                isAvailable && 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
                isCompleted && 'bg-zinc-900/50 border-zinc-800/50',
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                isLocked && 'bg-zinc-800',
                isAvailable && 'bg-amber-400/10',
                isCompleted && 'bg-emerald-400/10',
              )}>
                {isLocked && <Lock className="w-3.5 h-3.5 text-zinc-600" />}
                {isAvailable && <span className="text-xs font-bold text-amber-400">{i + 1}</span>}
                {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isLocked && 'text-zinc-600',
                    isCompleted && 'text-zinc-500',
                    isAvailable && 'text-white',
                  )}>
                    {lesson.title}
                  </h3>
                  {section && (
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" /> {section.estimatedMinutes}m
                    </span>
                  )}
                </div>
                {section?.description && (
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{section.description}</p>
                )}
                {section?.topics && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {section.topics.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {isAvailable && (
                <Link
                  href={`/learn/${roadmapId}/${lesson.id}`}
                  className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 transition-colors text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  {lesson.status === 'in_progress' ? 'Continue' : 'Start'}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
