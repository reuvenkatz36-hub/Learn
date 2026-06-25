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

  const sections = Array.isArray(roadmap!.sections) ? roadmap!.sections as unknown as RoadmapSection[] : []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/learn" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Learning
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            roadmap!.difficulty === 'beginner' && 'bg-green-500/10 text-green-400',
            roadmap!.difficulty === 'intermediate' && 'bg-yellow-500/10 text-yellow-400',
            roadmap!.difficulty === 'advanced' && 'bg-red-500/10 text-red-400',
          )}>
            {roadmap!.difficulty}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {roadmap!.estimated_hours}h estimated
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{roadmap!.title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed">{roadmap!.description}</p>

        <div className="mt-4">
          {(() => {
            const completed = lessons?.filter(l => l.status === 'completed').length ?? 0
            const total = lessons?.length ?? 0
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            return (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{completed}/{total} sections complete</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="space-y-3">
        {lessons?.map((lesson, i) => {
          const section = sections[i]
          const isLocked = lesson.status === 'locked'
          const isCompleted = lesson.status === 'completed'
          const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress'

          return (
            <div key={lesson.id} className={cn(
              'flex items-start gap-4 p-5 rounded-2xl border transition-all',
              isLocked && 'bg-white/[0.02] border-white/5 opacity-60',
              isAvailable && 'bg-white/[0.03] border-white/5 hover:border-violet-500/30 cursor-pointer',
              isCompleted && 'bg-green-500/5 border-green-500/20',
            )}>
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isLocked && 'bg-gray-800',
                isAvailable && 'bg-violet-500/20',
                isCompleted && 'bg-green-500/20',
              )}>
                {isLocked && <Lock className="w-4 h-4 text-gray-600" />}
                {isAvailable && <span className="text-sm font-bold text-violet-400">{i + 1}</span>}
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn('font-semibold text-sm', isLocked && 'text-gray-500')}>{lesson.title}</h3>
                  {section && (
                    <span className="text-xs text-gray-600 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" /> {section.estimatedMinutes}m
                    </span>
                  )}
                </div>
                {section?.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{section.description}</p>
                )}
                {section?.topics && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {section.topics.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {isAvailable && (
                <Link
                  href={`/learn/${roadmapId}/${lesson.id}`}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0"
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
