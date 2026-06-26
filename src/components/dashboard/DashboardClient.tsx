'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Profile, Roadmap, DailyActivity } from '@/types/database'
import { Plus, BookOpen, Trophy, Flame, Target, ChevronRight, Brain, Compass } from 'lucide-react'
import NewRoadmapModal from '@/components/dashboard/NewRoadmapModal'
import WelcomeModal from '@/components/dashboard/WelcomeModal'
import { cn } from '@/lib/utils'

const TOPIC_SUGGESTIONS = [
  { emoji: '🤖', label: 'Machine Learning', category: 'Tech' },
  { emoji: '💰', label: 'Personal Finance', category: 'Life' },
  { emoji: '🐍', label: 'Python Programming', category: 'Tech' },
  { emoji: '🎨', label: 'UI/UX Design', category: 'Creative' },
  { emoji: '🧠', label: 'Psychology', category: 'Science' },
  { emoji: '📈', label: 'Stock Market Investing', category: 'Finance' },
  { emoji: '🌍', label: 'Spanish Language', category: 'Language' },
  { emoji: '📸', label: 'Photography', category: 'Creative' },
  { emoji: '🏋️', label: 'Fitness & Nutrition', category: 'Health' },
  { emoji: '⚡', label: 'React & Next.js', category: 'Tech' },
  { emoji: '🎸', label: 'Guitar', category: 'Music' },
  { emoji: '🧮', label: 'Mathematics', category: 'Science' },
]

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
    if (!localStorage.getItem('mastery_welcomed')) {
      setShowWelcome(true)
    }
  }, [])

  const dismissWelcome = () => {
    localStorage.setItem('mastery_welcomed', '1')
    setShowWelcome(false)
  }

  const startFromWelcome = () => {
    localStorage.setItem('mastery_welcomed', '1')
    setShowWelcome(false)
    setShowNewRoadmap(true)
  }

  const totalLessons = activity.reduce((s, a) => s + a.lessons_completed, 0)
  const totalQuizzes = activity.reduce((s, a) => s + a.quizzes_taken, 0)

  const stats = [
    { icon: Trophy, label: 'Total XP', value: (profile?.total_xp ?? 0).toLocaleString(), color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Flame, label: 'Day Streak', value: `${profile?.streak_count ?? 0}`, sub: 'days', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: BookOpen, label: 'Lessons', value: String(totalLessons), sub: 'completed', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { icon: Target, label: 'Quizzes', value: String(totalQuizzes), sub: 'taken', color: 'text-green-500', bg: 'bg-green-50' },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.display_name ?? 'Learner'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Keep up the great work</p>
        </div>
        <button
          onClick={() => setShowNewRoadmap(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value} {sub && <span className="text-base font-normal text-gray-400">{sub}</span>}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Discover Topics */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-gray-900 text-lg">Discover</h2>
          <span className="text-xs text-gray-400 font-medium">— tap any topic to start learning</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPIC_SUGGESTIONS.map(({ emoji, label }) => (
            <button
              key={label}
              onClick={() => { setSuggestedTopic(label); setShowNewRoadmap(true) }}
              className="flex items-center gap-1.5 bg-white border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-full transition-all shadow-sm"
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Your Courses</h2>
          <Link href="/learn" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {roadmaps.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">No courses yet</p>
            <p className="text-gray-400 text-sm mb-6">Generate your first AI course to get started</p>
            <button
              onClick={() => setShowNewRoadmap(true)}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.slice(0, 6).map(roadmap => {
              const sections = Array.isArray(roadmap.sections) ? (roadmap.sections as unknown as Array<{ completed?: boolean }>) : []
              const progress = sections.length > 0 ? Math.round((sections.filter(s => s.completed).length / sections.length) * 100) : 0
              return (
                <Link
                  key={roadmap.id}
                  href={`/learn/${roadmap.id}`}
                  className="group bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
                      roadmap.difficulty === 'beginner' && 'bg-green-50 text-green-600',
                      roadmap.difficulty === 'intermediate' && 'bg-amber-50 text-amber-600',
                      roadmap.difficulty === 'advanced' && 'bg-red-50 text-red-500',
                    )}>
                      {roadmap.difficulty}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{roadmap.title}</h3>
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{roadmap.description}</p>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>{sections.length} sections</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {showNewRoadmap && (
        <NewRoadmapModal onClose={() => { setShowNewRoadmap(false); setSuggestedTopic(undefined) }} initialTopic={suggestedTopic} />
      )}
      {showWelcome && (
        <WelcomeModal
          name={profile?.display_name ?? ''}
          onStart={startFromWelcome}
          onDismiss={dismissWelcome}
        />
      )}
    </div>
  )
}
