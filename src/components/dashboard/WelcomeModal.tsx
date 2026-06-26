'use client'
import { useState } from 'react'
import { Brain, BookOpen, Zap, Trophy, X } from 'lucide-react'

interface Props {
  name: string
  onStart: () => void
  onDismiss: () => void
}

const steps = [
  {
    icon: Brain,
    color: 'bg-violet-100 text-violet-600',
    title: 'AI builds your roadmap',
    desc: 'Type any topic — Claude creates a full structured course with sections and lessons just for you.',
  },
  {
    icon: BookOpen,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Read like Spotify',
    desc: 'Scroll through lessons in our focus reader — each line comes alive as you read. No walls of text.',
  },
  {
    icon: Trophy,
    color: 'bg-amber-100 text-amber-600',
    title: 'Earn XP as you go',
    desc: 'Complete lessons, ace quizzes, and get AI feedback on assignments. Track your streak every day.',
  },
]

export default function WelcomeModal({ name, onStart, onDismiss }: Props) {
  const [step, setStep] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 px-6 pt-8 pb-6 text-white text-center">
          <button onClick={onDismiss} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Welcome, {name || 'Learner'}!</h2>
          <p className="text-white/70 text-sm mt-1">Here&apos;s how MasteryAI works</p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5">
          <div className="space-y-4">
            {steps.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={i}
                className={`flex gap-4 p-3 rounded-2xl transition-all cursor-pointer ${i === step ? 'bg-gray-50' : ''}`}
                onClick={() => setStep(i)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-5 mb-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-indigo-600' : 'w-1.5 bg-gray-200'}`}
              />
            ))}
          </div>

          <button
            onClick={onStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-semibold text-sm transition-colors"
          >
            Pick your first topic →
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-gray-400 text-xs mt-2 py-2"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  )
}
