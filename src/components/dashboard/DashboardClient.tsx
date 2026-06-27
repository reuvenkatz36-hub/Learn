'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Profile, Roadmap, DailyActivity } from '@/types/database'
import { Plus, ChevronRight, BookOpen, Zap, Flame } from 'lucide-react'
import NewRoadmapModal from '@/components/dashboard/NewRoadmapModal'
import WelcomeModal from '@/components/dashboard/WelcomeModal'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

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

const fox = CREW.fox
const owl = CREW.owl

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
      {/* Header with Finn the Fox */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div className="flex items-center gap-3">
          <Mascot who="fox" size={52} halo />
          <div>
            <p className="text-ink-soft text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {profile?.display_name ?? 'Learner'}
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowNewRoadmap(true)}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: fox.accent }}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-10 p-5 bg-surface border border-line rounded-2xl">
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{(profile?.total_xp ?? 0).toLocaleString()}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ color: fox.accent }} /> XP earned
          </div>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{profile?.streak_count ?? 0}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> day streak
          </div>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{totalLessons}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-ink-faint" /> lessons done
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-ink-faint uppercase tracking-widest">Your Courses</h2>
          {roadmaps.length > 0 && (
            <Link href="/learn" className="text-xs text-ink-soft hover:text-ink flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {roadmaps.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center">
            <Mascot who="owl" size={64} className="mx-auto mb-3" />
            <p className="text-ink font-semibold mb-1">{owl.name} is ready when you are</p>
            <p className="text-ink-soft text-sm mb-6">Generate your first course to get started</p>
            <button
              onClick={() => setShowNewRoadmap(true)}
              className="text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: fox.accent }}
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {roadmaps.slice(0, 6).map(roadmap => {
              const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
              const progress = sections.length > 0 ? Math.round((sections.filter(s => s.completed).length / sections.length) * 100) : 0
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
                      <span className="text-ink-faint text-[10px]">{sections.length} lessons</span>
                    </div>
                    <h3 className="font-semibold text-ink text-sm truncate mb-2.5">
                      {roadmap.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: owl.accent }} />
                      </div>
                      <span className="text-[10px] text-ink-soft tabular-nums w-6 text-right">{progress}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink flex-shrink-0 transition-colors" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Explore */}
      <div>
        <h2 className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-4">Explore Topics</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => { setSuggestedTopic(topic); setShowNewRoadmap(true) }}
              className="text-left text-sm text-ink-soft hover:text-ink px-3.5 py-3 bg-surface hover:shadow-sm border border-line rounded-xl transition-all font-medium"
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
