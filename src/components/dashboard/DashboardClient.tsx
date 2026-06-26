'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Profile, Roadmap, DailyActivity } from '@/types/database'
import { Plus, ChevronRight, Brain, Zap, Flame, BookOpen } from 'lucide-react'
import NewRoadmapModal from '@/components/dashboard/NewRoadmapModal'
import WelcomeModal from '@/components/dashboard/WelcomeModal'
import { cn } from '@/lib/utils'

const TOPICS = [
  'Machine Learning', 'Personal Finance', 'Python Programming',
  'UI/UX Design', 'Psychology', 'Stock Market',
  'Spanish Language', 'Photography', 'Fitness & Nutrition',
  'React & Next.js', 'Guitar', 'Mathematics',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface Props {
  profile: Profile | null
  roadmaps: Roadmap[]
  activity: DailyActivity[]
}

export default function DashboardClient({ profile, roadmaps, activity }: Props) {
  const [showNewRoadmap, setShowNewRoadmap] = useState(false)
  const [suggestedTopic, setSuggestedTopic] = useState<string | undefined>()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('mastery_welcomed')) setShowWelcome(true)
  }, [])

  const dismissWelcome = () => { localStorage.setItem('mastery_welcomed', '1'); setShowWelcome(false) }
  const startFromWelcome = () => { localStorage.setItem('mastery_welcomed', '1'); setShowWelcome(false); setShowNewRoadmap(true) }

  const totalLessons = activity.reduce((s, a) => s + a.lessons_completed, 0)

  return (
    <div className="p-5 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pt-2">
        <div>
          <p className="text-zinc-500 text-sm mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {profile?.display_name ?? 'Learner'}
          </h1>
        </div>
        <button
          onClick={() => setShowNewRoadmap(true)}
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 transition-colors text-zinc-950 px-4 py-2 rounded-lg text-sm font-bold mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-10 pb-8 border-b border-zinc-800">
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">{(profile?.total_xp ?? 0).toLocaleString()}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> XP earned
          </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">{profile?.streak_count ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" /> day streak
          </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">{totalLessons}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-zinc-500" /> lessons done
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Courses</h2>
          {roadmaps.length > 0 && (
            <Link href="/learn" className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {roadmaps.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
            <Brain className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-300 font-semibold mb-1">No courses yet</p>
            <p className="text-zinc-600 text-sm mb-6">Generate your first AI course to get started</p>
            <button
              onClick={() => setShowNewRoadmap(true)}
              className="bg-amber-400 hover:bg-amber-300 transition-colors text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-bold"
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {roadmaps.slice(0, 6).map(roadmap => {
              const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
              const progress = sections.length > 0 ? Math.round((sections.filter(s => s.completed).length / sections.length) * 100) : 0
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
                      <span className="text-zinc-600 text-[10px]">{sections.length} lessons</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm truncate group-hover:text-amber-400 transition-colors mb-2.5">
                      {roadmap.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-600 tabular-nums w-6 text-right">{progress}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Explore */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Explore Topics</h2>
        <div className="grid grid-cols-2 gap-2">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => { setSuggestedTopic(topic); setShowNewRoadmap(true) }}
              className="text-left text-sm text-zinc-400 hover:text-white px-3.5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all font-medium"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {showNewRoadmap && (
        <NewRoadmapModal onClose={() => { setShowNewRoadmap(false); setSuggestedTopic(undefined) }} initialTopic={suggestedTopic} />
      )}
      {showWelcome && (
        <WelcomeModal name={profile?.display_name ?? ''} onStart={startFromWelcome} onDismiss={dismissWelcome} />
      )}
    </div>
  )
}
