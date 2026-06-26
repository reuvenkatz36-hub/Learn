'use client'
import { useState } from 'react'
import { Brain, BookOpen, Trophy, Zap, X } from 'lucide-react'

interface Props {
  name: string
  onStart: () => void
  onDismiss: () => void
}

const steps = [
  {
    icon: Brain,
    title: 'AI builds your roadmap',
    desc: 'Type any topic — we create a full structured course with sections and lessons just for you.',
  },
  {
    icon: BookOpen,
    title: 'Read like Spotify',
    desc: 'Scroll through lessons in our focus reader — each line comes alive as you read.',
  },
  {
    icon: Trophy,
    title: 'Earn XP as you go',
    desc: 'Complete lessons, ace quizzes, and get AI feedback. Track your streak every day.',
  },
]

export default function WelcomeModal({ name, onStart, onDismiss }: Props) {
  const [step, setStep] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <span className="font-bold text-white text-sm">Welcome{name ? `, ${name}` : ''}</span>
          </div>
          <button onClick={onDismiss} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-1 mb-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${i === step ? 'bg-zinc-800' : 'opacity-40 hover:opacity-60'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${i === step ? 'text-amber-400' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-px rounded-full transition-all ${i === step ? 'w-6 bg-amber-400' : 'w-2 bg-zinc-700'}`}
              />
            ))}
          </div>

          <button
            onClick={onStart}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Pick your first topic
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-zinc-600 text-xs mt-2 py-2 hover:text-zinc-400 transition-colors"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  )
}
