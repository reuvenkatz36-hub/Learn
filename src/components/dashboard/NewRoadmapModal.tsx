'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Zap } from 'lucide-react'

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
      router.push(`/learn/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <h2 className="font-bold text-white">New Course</h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              What do you want to learn?
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Machine Learning, TypeScript, Guitar..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all border ${
                    difficulty === d
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-950 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Course</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
