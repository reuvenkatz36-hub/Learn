'use client'
import { useMemo, useState } from 'react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const memo = CREW.elephant

// Each completed lesson lights one neuron. The brain starts dark and fills up
// as the learner finishes lessons across every course.
export interface BrainCourse {
  id: string
  title: string
  lessons: { id: string; completed: boolean }[]
}

interface Props {
  courses: BrainCourse[]
}

// Course colors cycle through the crew accents.
const PALETTE = [CREW.owl.accent, CREW.cat.accent, CREW.beaver.accent, CREW.dog.accent, CREW.fox.accent, CREW.elephant.accent]

// Deterministic PRNG so neuron positions are stable between renders.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Lobe ellipses — the brain silhouette is the union of these, and neurons are
// sampled inside them so they always sit within the shape.
const LOBES = [
  { cx: 68, cy: 64, rx: 30, ry: 30 },
  { cx: 132, cy: 64, rx: 30, ry: 30 },
  { cx: 100, cy: 52, rx: 46, ry: 28 },
  { cx: 100, cy: 84, rx: 54, ry: 32 },
  { cx: 100, cy: 108, rx: 44, ry: 24 },
]

function insideBrain(x: number, y: number) {
  return LOBES.some(l => ((x - l.cx) / l.rx) ** 2 + ((y - l.cy) / l.ry) ** 2 <= 1)
}

interface Neuron { x: number; y: number }

export default function BrainClient({ courses }: Props) {
  const [activeCourse, setActiveCourse] = useState<string | null>(null)

  // Flatten lessons in course order; each gets a color from its course.
  const lessons = useMemo(() => {
    return courses.flatMap((c, ci) =>
      c.lessons.map(l => ({ ...l, courseId: c.id, color: PALETTE[ci % PALETTE.length] }))
    )
  }, [courses])

  const completedCount = lessons.filter(l => l.completed).length
  const totalCount = lessons.length
  const fillPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Sample neuron positions: one per lesson, plus ambient dots for brain texture.
  const { neurons, ambient, synapses } = useMemo(() => {
    const rng = mulberry32(0xc0ffee)
    const want = Math.max(lessons.length, 0) + 55 // ambient texture dots
    const pts: Neuron[] = []
    let guard = 0
    while (pts.length < want && guard < want * 60) {
      guard++
      const x = 26 + rng() * 148
      const y = 26 + rng() * 110
      if (!insideBrain(x, y)) continue
      // keep some spacing so neurons don't clump
      if (pts.some(p => (p.x - x) ** 2 + (p.y - y) ** 2 < 36)) continue
      pts.push({ x, y })
    }
    const neuronPts = pts.slice(0, lessons.length)
    const ambientPts = pts.slice(lessons.length)
    // Synapses: connect each neuron to its nearest neighbor.
    const all = pts
    const syn: { x1: number; y1: number; x2: number; y2: number; lit: boolean }[] = []
    neuronPts.forEach((p, i) => {
      let best = -1
      let bestD = Infinity
      all.forEach((q, j) => {
        if (q === p) return
        const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2
        if (d < bestD) { bestD = d; best = j }
      })
      if (best >= 0 && bestD < 900) {
        const lit = lessons[i]?.completed && (best < lessons.length ? lessons[best]?.completed : false)
        syn.push({ x1: p.x, y1: p.y, x2: all[best].x, y2: all[best].y, lit: !!lit })
      }
    })
    return { neurons: neuronPts, ambient: ambientPts, synapses: syn }
  }, [lessons])

  return (
    <div className="min-h-full bg-paper">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <Mascot who="elephant" size={48} halo />
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Your Brain</h1>
            <p className="text-ink-soft text-sm">{memo.name} lights up a neuron for every lesson you finish.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 p-5 bg-surface border border-line rounded-2xl">
          <div>
            <div className="text-2xl font-bold text-ink tabular-nums">{fillPct}%</div>
            <div className="text-xs text-ink-soft mt-0.5">brain lit up</div>
          </div>
          <div className="w-px h-8 bg-line" />
          <div>
            <div className="text-2xl font-bold text-ink tabular-nums">{completedCount}</div>
            <div className="text-xs text-ink-soft mt-0.5">neurons fired</div>
          </div>
          <div className="w-px h-8 bg-line" />
          <div>
            <div className="text-2xl font-bold text-ink tabular-nums">{totalCount - completedCount}</div>
            <div className="text-xs text-ink-soft mt-0.5">still to learn</div>
          </div>
        </div>

        {/* Brain */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 mb-6">
          <svg viewBox="0 0 200 165" className="w-full" style={{ maxHeight: '60vh' }} role="img" aria-label="Your knowledge brain">
            <defs>
              <radialGradient id="brain-base" cx="0.45" cy="0.4" r="0.7">
                <stop offset="0" stopColor="#2A2740" />
                <stop offset="1" stopColor="#181626" />
              </radialGradient>
              <filter id="brain-soft"><feGaussianBlur stdDeviation="1.1" /></filter>
            </defs>

            {/* silhouette = union of lobes */}
            <g filter="url(#brain-soft)">
              {LOBES.map((l, i) => (
                <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="url(#brain-base)" />
              ))}
              {/* brain stem */}
              <path d="M94 124c0 12 2 22 6 22s6-10 6-22z" fill="url(#brain-base)" />
            </g>

            {/* gyri texture */}
            <g stroke="#3A3658" strokeWidth="1" fill="none" opacity="0.55" strokeLinecap="round">
              <path d="M100 30 V120" />
              <path d="M60 46q10 10 0 22q-10 10 0 22" />
              <path d="M140 46q-10 10 0 22q10 10 0 22" />
              <path d="M44 70q14 4 22 -4" />
              <path d="M156 70q-14 4 -22 -4" />
              <path d="M70 100q14 8 30 2" />
              <path d="M130 100q-14 8 -30 2" />
            </g>

            {/* synapses */}
            <g>
              {synapses.map((s, i) => (
                <line
                  key={i}
                  x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={s.lit ? '#9be7ff' : '#3A3658'}
                  strokeWidth={s.lit ? 0.7 : 0.4}
                  opacity={s.lit ? 0.55 : 0.3}
                />
              ))}
            </g>

            {/* ambient texture dots (never lit) */}
            <g fill="#3A3658" opacity="0.5">
              {ambient.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.2} />)}
            </g>

            {/* lesson neurons */}
            <g>
              {neurons.map((p, i) => {
                const lesson = lessons[i]
                if (!lesson) return null
                const dimmed = activeCourse && lesson.courseId !== activeCourse
                if (lesson.completed) {
                  return (
                    <g key={lesson.id} opacity={dimmed ? 0.2 : 1}>
                      <circle cx={p.x} cy={p.y} r={6} fill={lesson.color} opacity={0.22} className="brain-glow" />
                      <circle cx={p.x} cy={p.y} r={2.7} fill={lesson.color} />
                      <circle cx={p.x - 0.8} cy={p.y - 0.8} r={0.9} fill="#fff" opacity={0.8} />
                    </g>
                  )
                }
                return (
                  <circle key={lesson.id} cx={p.x} cy={p.y} r={2.1} fill="#544F74" opacity={dimmed ? 0.25 : 0.85} />
                )
              })}
            </g>
          </svg>

          {totalCount === 0 && (
            <p className="text-center text-ink-soft text-sm mt-2">
              Your brain is empty. Finish a lesson and watch the first neuron light up.
            </p>
          )}
        </div>

        {/* Course legend / focus */}
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {courses.map((c, ci) => {
              const color = PALETTE[ci % PALETTE.length]
              const done = c.lessons.filter(l => l.completed).length
              const active = activeCourse === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCourse(active ? null : c.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
                  style={active
                    ? { borderColor: color, background: `${color}1a`, color: '#1C1B1A' }
                    : { borderColor: '#ECEAE4', color: '#6B6864' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="truncate max-w-[160px]">{c.title}</span>
                  <span className="text-ink-faint tabular-nums">{done}/{c.lessons.length}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
