import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight } from 'lucide-react'
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Learning Paths</h1>
          <p className="text-gray-400 text-sm mt-1">Your AI-generated roadmaps</p>
        </div>
      </div>

      {!roadmaps?.length ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-2">No learning paths yet</p>
          <p className="text-gray-600 text-sm mb-6">Go to your dashboard to create one</p>
          <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-500 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {roadmaps.map(roadmap => {
            const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
            const completedSections = sections.filter(s => s.completed).length
            const progress = sections.length > 0 ? Math.round((completedSections / sections.length) * 100) : 0

            return (
              <Link
                key={roadmap.id}
                href={`/learn/${roadmap.id}`}
                className="group flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 hover:border-violet-500/30 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold group-hover:text-violet-300 transition-colors">{roadmap.title}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      roadmap.difficulty === 'beginner' && 'bg-green-500/10 text-green-400',
                      roadmap.difficulty === 'intermediate' && 'bg-yellow-500/10 text-yellow-400',
                      roadmap.difficulty === 'advanced' && 'bg-red-500/10 text-red-400',
                    )}>
                      {roadmap.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {roadmap.estimated_hours}h
                    </span>
                    <span>{sections.length} sections</span>
                    <span>{completedSections} completed</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-400">{progress}%</span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
