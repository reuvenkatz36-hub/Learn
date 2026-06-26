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

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link href="/learn" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Learning
      </Link>

      {/* Roadmap header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
            roadmap.difficulty === 'beginner' && 'bg-green-50 text-green-600',
            roadmap.difficulty === 'intermediate' && 'bg-amber-50 text-amber-600',
            roadmap.difficulty === 'advanced' && 'bg-red-50 text-red-500',
          )}>
            {roadmap.difficulty}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {roadmap.estimated_hours}h estimated
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{roadmap.title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed">{roadmap.description}</p>

        {/* Overall progress */}
        <div className="mt-4">
          {(() => {
            const completed = lessons?.filter(l => l.status === 'completed').length ?? 0
            const total = lessons?.length ?? 0
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            return (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{completed}/{total} lessons complete</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        {lessons?.map((lesson, i) => {
          const section = sections[i]
          const isLocked = lesson.status === 'locked'
          const isCompleted = lesson.status === 'completed'
          const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress'

          return (
            <div key={lesson.id} className={cn(
              'flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all',
              isLocked && 'bg-gray-50 border-gray-100 opacity-60',
              isAvailable && 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm',
              isCompleted && 'bg-green-50 border-green-100',
            )}>
              {/* Status icon */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isLocked && 'bg-gray-100',
                isAvailable && 'bg-indigo-100',
                isCompleted && 'bg-green-100',
              )}>
                {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                {isAvailable && <span className="text-sm font-bold text-indigo-600">{i + 1}</span>}
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn('font-semibold text-sm', isLocked ? 'text-gray-400' : isCompleted ? 'text-green-700' : 'text-gray-900')}>
                    {lesson.title}
                  </h3>
                  {section && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" /> {section.estimatedMinutes}m
                    </span>
                  )}
                </div>
                {section?.description && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{section.description}</p>
                )}
                {section?.topics && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {section.topics.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {isAvailable && (
                <Link
                  href={`/learn/${roadmapId}/${lesson.id}`}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
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
