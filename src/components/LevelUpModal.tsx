'use client'
import { Trophy, Award, Gift } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'
import { useLang } from '@/lib/useLang'

const fox = CREW.fox

export interface LevelUpInfo {
  level: number
  rewards: { level: number; type: 'badge' | 'free_course' }[]
}

export default function LevelUpModal({ info, onClose }: { info: LevelUpInfo; onClose: () => void }) {
  const { t } = useLang()
  const freeCourses = info.rewards.filter(r => r.type === 'free_course')
  const badges = info.rewards.filter(r => r.type === 'badge')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-surface border border-line shadow-2xl rounded-3xl w-full max-w-sm p-8 text-center relative overflow-hidden">
        {/* confetti dots */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${(i * 137) % 100}%`,
                background: [fox.accent, CREW.owl.accent, CREW.cat.accent, CREW.dog.accent, CREW.beaver.accent][i % 5],
                animationDelay: `${(i % 6) * 0.18}s`,
              }}
            />
          ))}
        </div>

        <Mascot who="fox" size={88} pose="cheer" className="mx-auto mb-3" />
        <h2 className="text-2xl font-black text-ink mb-1">{t('level.up')}</h2>
        <p className="text-ink-soft text-sm mb-5">
          {t('level.reached')} <span className="font-black text-lg" style={{ color: fox.accent }}>{info.level}</span>
        </p>

        <div className="space-y-2 mb-6">
          {badges.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink bg-paper border border-line rounded-xl px-4 py-3">
              <Award className="w-4 h-4" style={{ color: fox.accent }} />
              {t('level.badgeEarned')} · {badges.map(b => b.level).join(', ')}
            </div>
          )}
          {freeCourses.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-white rounded-xl px-4 py-3" style={{ background: fox.accent }}>
              <Gift className="w-4 h-4" />
              {t('level.freeCourse')}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5"
          style={{ background: fox.accent }}
        >
          <Trophy className="w-4 h-4" />
          {t('level.keep')}
        </button>
      </div>
    </div>
  )
}
