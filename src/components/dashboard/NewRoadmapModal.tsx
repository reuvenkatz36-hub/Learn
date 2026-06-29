'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Sparkles } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const owl = CREW.owl

interface Props {
  onClose: () => void
  initialTopic?: string
}

export default function NewRoadmapModal({ onClose, initialTopic }: Props) {
  const router = useRouter()
  const [topic, setTopic] = useState(initialTopic ?? '')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create roadmap')
      onClose()
      router.push(`/learn/${data.id}/build`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
      <div className="bg-surface border border-line shadow-xl rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Mascot who="owl" size={40} animate={false} />
            <div>
              <h2 className="font-bold text-ink leading-tight">New Course</h2>
              <p className="text-xs text-ink-soft">{owl.name} will build it for you</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
              What do you want to learn?
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Machine Learning, TypeScript, Guitar..."
              className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as string]: owl.accent }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map(d => {
                const selected = difficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all border"
                    style={selected
                      ? { borderColor: owl.accent, background: owl.accentSoft, color: owl.accent }
                      : { borderColor: '#ECEAE4', color: '#6B6864' }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:enabled:-translate-y-0.5"
            style={{ background: owl.accent }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Course</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
