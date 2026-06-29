'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lesson, Roadmap, Quiz, Assignment, LessonContentSection, QuizQuestion } from '@/types/database'
import { X, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import Mascot from '@/components/crew/Mascot'
import { CREW, type CrewId } from '@/lib/crew'

const owl = CREW.owl
const cat = CREW.cat
const beaver = CREW.beaver

interface Props {
  lesson: Lesson
  roadmap: Roadmap | null
  roadmapId: string
  existingQuiz: Quiz | null
  existingAssignment: Assignment | null
}

interface Line {
  text: string
  isTitle: boolean
}

function buildLines(sections: LessonContentSection[]): Line[] {
  const out: Line[] = []
  sections.forEach(s => {
    if (s.title) out.push({ text: s.title, isTitle: true })
    const sentences = (s.content ?? '')
      .split(/(?<=[.!?])\s+/)
      .flatMap(sent => {
        sent = sent.trim()
        if (!sent) return []
        if (sent.length > 80) {
          const parts = sent.split(/,\s+/)
          if (parts.length > 1) return parts.map(p => p.trim()).filter(Boolean)
        }
        return [sent]
      })
    sentences.forEach(t => { if (t) out.push({ text: t, isTitle: false }) })
  })
  return out
}

function SpotifyReader({ lines, lessonId, onFinish }: { lines: Line[]; lessonId: string; onFinish: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const activeIdxRef = useRef(0)
  const [xp, setXp] = useState(0)
  const [xpPop, setXpPop] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const lastXpMilestone = useRef(-1)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const restored = useRef(false)

  const applyStyles = useCallback((activeIdx: number) => {
    lineRefs.current.forEach((el, i) => {
      if (!el) return
      const dist = Math.abs(i - activeIdx)
      const isActive = dist === 0
      const scale = isActive ? 1.55 : dist === 1 ? 1.15 : dist === 2 ? 0.95 : 0.85
      const opacity = isActive ? 1 : dist === 1 ? 0.45 : dist === 2 ? 0.25 : 0.12
      el.style.transform = `scale(${scale})`
      el.style.opacity = String(opacity)
      el.style.color = isActive ? '#1C1B1A' : '#6B6864'
      el.style.fontWeight = isActive ? (el.dataset.title === 'true' ? '800' : '600') : '400'
    })
  }, [])

  useEffect(() => {
    if (restored.current || lines.length === 0) return
    restored.current = true
    const saved = localStorage.getItem(`read_pos_${lessonId}`)
    if (saved) {
      const idx = Math.min(parseInt(saved, 10), lines.length - 1)
      if (idx > 0) {
        setTimeout(() => {
          lineRefs.current[idx]?.scrollIntoView({ behavior: 'instant', block: 'center' })
          activeIdxRef.current = idx
          applyStyles(idx)
        }, 100)
      }
    }
  }, [lines.length, lessonId, applyStyles])

  useEffect(() => { applyStyles(0) }, [lines.length, applyStyles])

  const onScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const container = scrollRef.current
      if (!container) return
      const containerMid = container.scrollTop + container.clientHeight / 2
      const total = container.scrollHeight - container.clientHeight
      setScrollPct(total > 0 ? Math.min(container.scrollTop / total, 1) : 0)
      let closestIdx = activeIdxRef.current
      let closestDist = Infinity
      lineRefs.current.forEach((el, i) => {
        if (!el) return
        const elMid = el.offsetTop + el.offsetHeight / 2
        const dist = Math.abs(elMid - containerMid)
        if (dist < closestDist) { closestDist = dist; closestIdx = i }
      })
      if (closestIdx !== activeIdxRef.current) {
        activeIdxRef.current = closestIdx
        applyStyles(closestIdx)
      }
      const milestone = Math.floor(closestIdx / 8)
      if (milestone > lastXpMilestone.current) {
        lastXpMilestone.current = milestone
        setXp(prev => prev + 10)
        setXpPop(true)
        setTimeout(() => setXpPop(false), 700)
      }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(`read_pos_${lessonId}`, String(closestIdx))
      }, 1500)
    })
  }, [lessonId, applyStyles])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onScroll])

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Progress + XP */}
      <div className="shrink-0 px-5 py-2 flex items-center gap-3 border-b border-line">
        <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${scrollPct * 100}%`, background: owl.accent, transition: 'width 0.3s linear' }} />
        </div>
        <div className="relative flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5" style={{ color: owl.accent }} />
          <span className="text-sm font-bold tabular-nums" style={{ color: owl.accent }}>{xp} XP</span>
          {xpPop && (
            <span className="pointer-events-none absolute -top-7 right-0 font-bold text-xs whitespace-nowrap animate-xp-pop" style={{ color: owl.accent }}>
              +10 XP
            </span>
          )}
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div style={{ height: '42vh' }} />
        <div className="flex flex-col items-center px-8 gap-7" style={{ maxWidth: 520, margin: '0 auto' }}>
          {lines.map((line, i) => (
            <div
              key={i}
              ref={el => { lineRefs.current[i] = el }}
              data-title={line.isTitle ? 'true' : 'false'}
              className="text-center w-full cursor-default select-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '20px',
                lineHeight: 1.4,
                opacity: 0.12,
                color: '#6B6864',
                transformOrigin: 'center center',
                transition: 'transform 0.22s ease, opacity 0.22s ease, color 0.18s ease, font-weight 0.18s ease',
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
        <div style={{ height: '42vh' }} className="flex flex-col items-center justify-start pt-12 gap-4">
          <Mascot who="owl" size={64} />
          <p className="text-ink-soft text-sm">You read the whole lesson</p>
          <button
            onClick={() => {
              localStorage.removeItem(`read_pos_${lessonId}`)
              onFinish()
            }}
            className="text-white px-8 py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: owl.accent }}
          >
            Complete lesson
          </button>
        </div>
      </div>
    </div>
  )
}

function LessonContent({ lesson, roadmapId }: { lesson: Lesson; roadmapId: string }) {
  const router = useRouter()
  const [sections, setSections] = useState<LessonContentSection[]>(
    Array.isArray(lesson.content) && lesson.content.length > 0
      ? lesson.content as unknown as LessonContentSection[]
      : []
  )
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (sections.length > 0 || initialized.current) return
    initialized.current = true
    setStreaming(true)
    fetch('/api/lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id }),
    }).then(async res => {
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done && data.sections) setSections(data.sections)
            } catch {}
          }
        }
      }
      setStreaming(false)
    }).catch(() => setStreaming(false))
  }, [lesson.id, sections.length])

  if (streaming && sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 bg-surface">
        <Mascot who="owl" size={72} />
        <p className="text-ink-soft text-sm font-medium">{owl.name} is writing your lesson...</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: owl.accent, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-5 text-center px-6 bg-surface">
        <Mascot who="owl" size={96} aura pose="cheer" />
        <h2 className="text-2xl font-bold text-ink">Lesson complete</h2>
        <p className="text-ink-soft">You earned <span className="font-bold" style={{ color: owl.accent }}>+{xpEarned} XP</span></p>
        <button onClick={() => router.push(`/learn/${roadmapId}`)} className="text-white px-6 py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5" style={{ background: owl.accent }}>
          Back to course
        </button>
      </div>
    )
  }

  const lines = buildLines(sections)
  return (
    <SpotifyReader
      lines={lines}
      lessonId={lesson.id}
      onFinish={async () => {
        const earned = Math.max(10, Math.floor(lines.length / 8) * 10)
        setXpEarned(earned)
        setDone(true)
        fetch('/api/lesson/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id, xpEarned: earned }),
        }).catch(() => {})
      }}
    />
  )
}

function QuizSection({ lessonId, existingQuiz }: { lessonId: string; existingQuiz: Quiz | null }) {
  const [quiz, setQuiz] = useState<Quiz | null>(existingQuiz)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(!!existingQuiz?.submitted_at)
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(
    existingQuiz?.score != null ? { score: existingQuiz.score, maxScore: existingQuiz.max_score ?? 5 } : null
  )

  const generateQuiz = async () => {
    setLoading(true)
    const res = await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, action: 'generate' }) })
    setQuiz(await res.json())
    setLoading(false)
  }

  const submitQuiz = async () => {
    if (!quiz) return
    setLoading(true)
    const res = await fetch('/api/quiz', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: quiz.id, answers, lessonId }) })
    const data = await res.json()
    setResult({ score: data.score, maxScore: data.maxScore })
    setSubmitted(true)
    setLoading(false)
  }

  if (!quiz) return (
    <div className="text-center py-16">
      <Mascot who="cat" size={80} className="mx-auto mb-4" />
      <h3 className="font-bold text-ink text-lg mb-1">{cat.name} wants to test you</h3>
      <p className="text-ink-soft text-sm mb-6">5 questions based on this lesson</p>
      <button onClick={generateQuiz} disabled={loading} className="text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto disabled:opacity-50 transition-transform hover:enabled:-translate-y-0.5" style={{ background: cat.accent }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate Quiz
      </button>
    </div>
  )

  const questions = quiz.questions as unknown as QuizQuestion[]

  if (submitted && result) {
    const pct = Math.round((result.score / result.maxScore) * 100)
    const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good job' : 'Keep going'
    const tone = pct >= 80 ? '#22B07D' : pct >= 60 ? cat.accent : '#E11D48'
    return (
      <div>
        <div className="p-6 rounded-2xl border mb-6 text-center" style={{ background: `${tone}14`, borderColor: `${tone}33` }}>
          <Mascot who="cat" size={64} className="mx-auto mb-2" pose={pct >= 80 ? 'cheer' : pct >= 60 ? 'idle' : 'sad'} />
          <div className="text-4xl font-bold mb-1" style={{ color: tone }}>{result.score}/{result.maxScore}</div>
          <div className="text-sm font-medium" style={{ color: tone }}>{pct}% — {label}</div>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correctIndex
            return (
              <div key={q.id} className="p-4 rounded-2xl border bg-surface" style={{ borderColor: correct ? 'rgba(34,176,125,0.3)' : 'rgba(225,29,72,0.25)' }}>
                <p className="font-medium text-sm text-ink mb-3">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn('text-xs px-3 py-2 rounded-lg',
                      oi === q.correctIndex && 'bg-emerald-50 text-emerald-700 font-medium',
                      oi === answers[q.id] && oi !== q.correctIndex && 'bg-rose-50 text-rose-700',
                      oi !== q.correctIndex && oi !== answers[q.id] && 'text-ink-faint',
                    )}>{opt}</div>
                  ))}
                </div>
                <p className="text-xs text-ink-soft mt-3 italic">{q.explanation}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="p-4 bg-surface border border-line rounded-2xl">
          <p className="font-semibold text-sm text-ink mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi
              return (
                <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                  className="w-full text-left text-sm px-4 py-3 rounded-xl border transition-all"
                  style={selected
                    ? { borderColor: cat.accent, background: cat.accentSoft, color: cat.accent, fontWeight: 500 }
                    : { borderColor: '#ECEAE4', color: '#6B6864' }}>{opt}</button>
              )
            })}
          </div>
        </div>
      ))}
      <button onClick={submitQuiz} disabled={loading || Object.keys(answers).length < questions.length}
        className="w-full text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-transform hover:enabled:-translate-y-0.5" style={{ background: cat.accent }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Quiz
      </button>
    </div>
  )
}

function AssignmentSection({ lessonId, existingAssignment }: { lessonId: string; existingAssignment: Assignment | null }) {
  const [assignment, setAssignment] = useState<Assignment | null>(existingAssignment)
  const [loading, setLoading] = useState(false)
  const [submission, setSubmission] = useState(existingAssignment?.submission ?? '')
  const [streaming, setStreaming] = useState(false)
  const [feedback, setFeedback] = useState(existingAssignment?.ai_feedback ?? '')
  const [score, setScore] = useState<number | null>(existingAssignment?.score ?? null)

  const generateAssignment = async () => {
    setLoading(true)
    const res = await fetch('/api/assignment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId }) })
    setAssignment(await res.json())
    setLoading(false)
  }

  const submitAssignment = async () => {
    if (!assignment || !submission.trim()) return
    setStreaming(true)
    setFeedback('')
    const res = await fetch('/api/assignment', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: assignment.id, submission }) })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    if (!reader) { setStreaming(false); return }
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.chunk) setFeedback(prev => prev + data.chunk)
            if (data.done) setScore(data.score)
          } catch {}
        }
      }
    }
    setStreaming(false)
  }

  if (!assignment) return (
    <div className="text-center py-16">
      <Mascot who="beaver" size={80} className="mx-auto mb-4" />
      <h3 className="font-bold text-ink text-lg mb-1">{beaver.name} has a build for you</h3>
      <p className="text-ink-soft text-sm mb-6">Apply what you&apos;ve learned with a real task</p>
      <button onClick={generateAssignment} disabled={loading} className="text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto disabled:opacity-50 transition-transform hover:enabled:-translate-y-0.5" style={{ background: beaver.accent }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Get Assignment
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border" style={{ background: beaver.accentSoft, borderColor: `${beaver.accent}33` }}>
        <h3 className="font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: beaver.accent }}>Your Task</h3>
        <p className="text-sm text-ink leading-relaxed">{assignment.prompt}</p>
      </div>
      {!assignment.submission && (
        <div>
          <textarea value={submission} onChange={e => setSubmission(e.target.value)} rows={8}
            className="w-full bg-surface border border-line rounded-2xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 resize-none placeholder-ink-faint"
            style={{ ['--tw-ring-color' as string]: beaver.accent }}
            placeholder="Write your response here..." />
          <button onClick={submitAssignment} disabled={streaming || !submission.trim()}
            className="mt-3 w-full text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-transform hover:enabled:-translate-y-0.5" style={{ background: beaver.accent }}>
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {streaming ? 'Getting feedback...' : 'Submit for Feedback'}
          </button>
        </div>
      )}
      {(feedback || assignment.ai_feedback) && (
        <div className="p-4 bg-surface border border-line rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mascot who="beaver" size={28} animate={false} />
              <h3 className="font-semibold text-xs text-ink-soft uppercase tracking-wider">{beaver.name}&apos;s Feedback</h3>
            </div>
            {score !== null && (
              <span className="text-sm font-bold px-3 py-1 rounded-lg" style={{
                background: score >= 80 ? 'rgba(34,176,125,0.12)' : score >= 60 ? beaver.accentSoft : 'rgba(225,29,72,0.1)',
                color: score >= 80 ? '#22B07D' : score >= 60 ? beaver.accent : '#E11D48',
              }}>{score}/100</span>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-ink-soft">
            <ReactMarkdown>{feedback || assignment.ai_feedback || ''}</ReactMarkdown>
          </div>
          {streaming && <span className="animate-pulse text-lg" style={{ color: beaver.accent }}>▊</span>}
        </div>
      )}
    </div>
  )
}

export default function LessonClient({ lesson, roadmap, roadmapId, existingQuiz, existingAssignment }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')

  const tabs: { id: 'content' | 'quiz' | 'assignment'; who: CrewId; label: string }[] = [
    { id: 'content', who: 'owl', label: 'Lesson' },
    { id: 'quiz', who: 'cat', label: 'Quiz' },
    { id: 'assignment', who: 'beaver', label: 'Practice' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line shrink-0">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-paper hover:bg-line flex items-center justify-center transition-colors flex-shrink-0">
          <X className="w-4 h-4 text-ink-soft" />
        </button>
        <div className="flex-1 min-w-0">
          {roadmap && <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide truncate">{roadmap.title}</p>}
          <p className="text-sm font-semibold text-ink truncate">{lesson.title}</p>
        </div>
      </div>

      {/* Tabs — each owned by a crew member */}
      <div className="flex border-b border-line shrink-0">
        {tabs.map(({ id, who, label }) => {
          const active = activeTab === id
          const accent = CREW[who].accent
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold transition-all border-b-2 -mb-px"
              style={{ borderColor: active ? accent : 'transparent', color: active ? accent : '#9C9892' }}>
              <span className={cn(active ? 'opacity-100' : 'opacity-50 grayscale')} style={{ transition: 'all 0.2s' }}>
                <Mascot who={who} size={24} animate={false} />
              </span>
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' && <LessonContent lesson={lesson} roadmapId={roadmapId} />}
        {activeTab === 'quiz' && <div className="h-full overflow-y-auto p-6 bg-paper"><QuizSection lessonId={lesson.id} existingQuiz={existingQuiz} /></div>}
        {activeTab === 'assignment' && <div className="h-full overflow-y-auto p-6 bg-paper"><AssignmentSection lessonId={lesson.id} existingAssignment={existingAssignment} /></div>}
      </div>
    </div>
  )
}
