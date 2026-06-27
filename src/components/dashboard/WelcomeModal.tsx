'use client'
import { X } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW, type CrewId } from '@/lib/crew'

interface Props {
  name: string
  onStart: () => void
  onDismiss: () => void
}

const lineup: { who: CrewId; what: string }[] = [
  { who: 'owl', what: 'teaches your lessons' },
  { who: 'cat', what: 'runs your quizzes' },
  { who: 'beaver', what: 'sets your practice' },
  { who: 'dog', what: 'coaches you anytime' },
]

const fox = CREW.fox

export default function WelcomeModal({ name, onStart, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
      <div className="bg-surface border border-line shadow-xl rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
          <span className="font-bold text-ink text-sm">Welcome{name ? `, ${name}` : ''} 👋</span>
          <button onClick={onDismiss} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Host intro */}
          <div className="flex flex-col items-center text-center mb-6">
            <Mascot who="fox" size={84} halo />
            <p className="mt-3 font-bold text-ink">Hi, I&apos;m {fox.name} the Fox</p>
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">
              I&apos;ll show you around. You&apos;ve got a whole crew here to help you learn.
            </p>
          </div>

          {/* The crew */}
          <div className="space-y-2 mb-6">
            {lineup.map(({ who, what }) => {
              const m = CREW[who]
              return (
                <div key={who} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: m.accentSoft }}>
                  <Mascot who={who} size={36} animate={false} />
                  <div className="text-sm">
                    <span className="font-semibold text-ink">{m.name}</span>
                    <span className="text-ink-soft"> {what}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={onStart}
            className="w-full text-white py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: fox.accent }}
          >
            Pick your first topic
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-ink-faint text-xs mt-2 py-2 hover:text-ink-soft transition-colors"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  )
}
