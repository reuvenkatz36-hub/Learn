'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Profile, Roadmap, DailyActivity } from '@/types/database'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, BookOpen, Trophy, Flame, Target, ChevronRight, Brain } from 'lucide-react'
import { format, subDays } from 'date-fns'
import NewRoadmapModal from '@/components/dashboard/NewRoadmapModal'
import { cn } from '@/lib/utils'

interface Props {
  profile: Profile | null
  roadmaps: Roadmap[]
  activity: DailyActivity[]
}

function StreakCalendar({ activity }: { activity: DailyActivity[] }) {
  const days = Array.from({ length: 84 }, (_, i) => subDays(new Date(), 83 - i))
  const activityMap = new Map(activity.map(a => [a.activity_date, a]))

  return (
    <div>
      <div className="grid grid-cols-[repeat(12,1fr)] gap-1">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd')
          const act = activityMap.get(key)
          const xp = act?.xp_earned ?? 0
          const intensity = xp === 0 ? 0 : xp < 20 ? 1 : xp < 50 ? 2 : xp < 100 ? 3 : 4
          return (
            <div
              key={i}
              title={`${format(day, 'MMM d')}: ${xp} XP`}
              className={cn(
                'aspect-square rounded-sm transition-all',
                intensity === 0 && 'bg-gray-800',
                intensity === 1 && 'bg-violet-900/60',
                intensity === 2 && 'bg-violet-700/70',
                intensity === 3 && 'bg-violet-500/80',
                intensity === 4 && 'bg-violet-400',
              )}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end text-xs text-gray-600">
        <span>Less</span>
        {[0,1,2,3,4].map(i => (
          <div key={i} className={cn('w-3 h-3 rounded-sm',
            i === 0 && 'bg-gray-800',
            i === 1 && 'bg-violet-900/60',
            i === 2 && 'bg-violet-700/70',
            i === 3 && 'bg-violet-500/80',
            i === 4 && 'bg-violet-400',
          )} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

export default function DashboardClient({ profile, roadmaps, activity }: Props) {
  const [showNewRoadmap, setShowNewRoadmap] = useState(false)

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i)
    const key = format(day, 'yyyy-MM-dd')
    const act = activity.find(a => a.activity_date === key)
    return { date: format(day, 'MMM d'), xp: act?.xp_earned ?? 0 }
  })

  const totalLessons = activity.reduce((s, a) => s + a.lessons_completed, 0)
  const totalQuizzes = activity.reduce((s, a) => s + a.quizzes_taken, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.display_name ?? 'Learner'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ready to continue your learning journey?</p>
        </div>
        <button
          onClick={() => setShowNewRoadmap(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Roadmap
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Trophy, label: 'Total XP', value: (profile?.total_xp ?? 0).toLocaleString(), color: 'text-yellow-400' },
          { icon: Flame, label: 'Day Streak', value: `${profile?.streak_count ?? 0} days`, color: 'text-orange-400' },
          { icon: BookOpen, label: 'Lessons Done', value: totalLessons, color: 'text-cyan-400' },
          { icon: Target, label: 'Quizzes Taken', value: totalQuizzes, color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <Icon className={cn('w-5 h-5 mb-3', color)} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* XP Chart */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-gray-300">XP Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={16}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                itemStyle={{ color: '#a78bfa' }}
              />
              <Bar dataKey="xp" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.xp > 0 ? '#8b5cf6' : '#374151'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Streak calendar */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-gray-300">Activity Calendar</h2>
          <StreakCalendar activity={activity} />
        </div>
      </div>

      {/* Roadmaps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Your Learning Paths</h2>
          <Link href="/learn" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {roadmaps.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-1">No learning paths yet</p>
            <p className="text-gray-600 text-sm mb-6">Generate your first AI roadmap to get started</p>
            <button
              onClick={() => setShowNewRoadmap(true)}
              className="bg-violet-600 hover:bg-violet-500 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              Create Roadmap
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
                  className="group bg-white/[0.03] border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      roadmap.difficulty === 'beginner' && 'bg-green-500/10 text-green-400',
                      roadmap.difficulty === 'intermediate' && 'bg-yellow-500/10 text-yellow-400',
                      roadmap.difficulty === 'advanced' && 'bg-red-500/10 text-red-400',
                    )}>
                      {roadmap.difficulty}
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      roadmap.status === 'completed' && 'bg-green-500/10 text-green-400',
                      roadmap.status === 'active' && 'bg-violet-500/10 text-violet-400',
                      roadmap.status === 'paused' && 'bg-gray-500/10 text-gray-400',
                    )}>
                      {roadmap.status}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">{roadmap.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{roadmap.description}</p>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>{sections.length} sections</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
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
        <NewRoadmapModal onClose={() => setShowNewRoadmap(false)} />
      )}
    </div>
  )
}
