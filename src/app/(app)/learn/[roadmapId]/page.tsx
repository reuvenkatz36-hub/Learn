import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Lock, ChevronRight, Clock, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'
import { RoadmapSection, Roadmap, Lesson } from '@/types/database'

const owl = CREW.owl

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
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      {/* Roadmap header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <Mascot who="owl" size={48} halo />
          <div className="flex items-center gap-2 pt-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: owl.accent, background: owl.accentSoft }}
            >
              {roadmap.difficulty}
            </span>
            <span className="text-ink-faint text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {roadmap.estimated_hours}h estimated
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">{roadmap.title}</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-5">{roadmap.description}</p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: owl.accent }} />
          </div>
          <span className="text-xs text-ink-soft tabular-nums">{completed}/{total}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: owl.accent }}>{pct}%</span>
        </div>
      </div>

      {/* Lessons list */}
      <div className="space-y-2.5">
        {lessons?.map((lesson, i) => {
          const section = sections[i]
          const isLocked = lesson.status === 'locked'
          const isCompleted = lesson.status === 'completed'
          const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress'

          return (
            <div
              key={lesson.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-2xl border bg-surface transition-all',
                isLocked && 'opacity-60',
                isAvailable && 'border-line hover:shadow-md',
                isCompleted && 'border-line',
              )}
              style={isAvailable ? { borderColor: owl.accent } : undefined}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: isCompleted ? 'rgba(34,176,125,0.12)' : isAvailable ? owl.accentSoft : '#F1EFEA',
                }}
              >
                {isLocked && <Lock className="w-3.5 h-3.5 text-ink-faint" />}
                {isAvailable && <span className="text-xs font-bold" style={{ color: owl.accent }}>{i + 1}</span>}
                {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className={cn('font-semibold text-sm', isLocked ? 'text-ink-faint' : isCompleted ? 'text-ink-soft' : 'text-ink')}>
                    {lesson.title}
                  </h3>
                  {section && (
                    <span className="text-[10px] text-ink-faint flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" /> {section.estimatedMinutes}m
                    </span>
                  )}
                </div>
                {section?.description && (
                  <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{section.description}</p>
                )}
                {section?.topics && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {section.topics.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] bg-paper border border-line text-ink-soft px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {isAvailable && (
                <Link
                  href={`/learn/${roadmapId}/${lesson.id}`}
                  className="flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 transition-transform hover:-translate-y-0.5"
                  style={{ background: owl.accent }}
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
