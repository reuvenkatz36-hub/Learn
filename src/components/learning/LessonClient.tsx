'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lesson, Roadmap, Quiz, Assignment, LessonContentSection, QuizQuestion } from '@/types/database'
import { X, PenLine, Loader2, Zap, CheckCircle, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

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
      el.style.color = isActive ? '#0f172a' : '#374151'
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
    <div className="flex flex-col h-full bg-white">
      {/* Progress + XP */}
      <div className="shrink-0 px-5 py-2 flex items-center gap-3 border-b border-gray-100">
        <div className="flex-1 h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${scrollPct * 100}%`, transition: 'width 0.3s linear' }} />
        </div>
        <div className="relative flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm font-bold text-amber-600 tabular-nums">{xp} XP</span>
          {xpPop && (
            <span className="pointer-events-none absolute -top-7 right-0 text-amber-500 font-bold text-xs whitespace-nowrap animate-xp-pop">
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
                color: '#374151',
                transformOrigin: 'center center',
                transition: 'transform 0.22s ease, opacity 0.22s ease, color 0.18s ease, font-weight 0.18s ease',
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
        <div style={{ height: '42vh' }} className="flex flex-col items-center justify-start pt-12 gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-gray-400 text-sm">You read the whole lesson</p>
          <button
            onClick={() => {
              localStorage.removeItem(`read_pos_${lessonId}`)
              onFinish()
            }}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 px-8 py-3 rounded-xl font-bold text-sm transition-colors"
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
      <div className="flex flex-col items-center justify-center h-96 gap-4 bg-white">
        <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
        <p className="text-gray-400 text-sm font-medium">Crafting your lesson...</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-amber-200 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-6 text-center px-6 bg-white">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Lesson complete</h2>
        <p className="text-gray-400">You earned <span className="font-bold text-amber-500">+{xpEarned} XP</span></p>
        <button onClick={() => router.push(`/learn/${roadmapId}`)} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 px-6 py-3 rounded-xl font-bold text-sm transition-colors">
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
      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Brain className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="font-bold text-white text-lg mb-1">Test yourself</h3>
      <p className="text-zinc-500 text-sm mb-6">5 questions based on this lesson</p>
      <button onClick={generateQuiz} disabled={loading} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate Quiz
      </button>
    </div>
  )

  const questions = quiz.questions as unknown as QuizQuestion[]

  if (submitted && result) {
    const pct = Math.round((result.score / result.maxScore) * 100)
    const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good job' : 'Keep going'
    return (
      <div>
        <div className={cn('p-6 rounded-xl border mb-6 text-center', pct >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : pct >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20')}>
          <div className={cn('text-4xl font-bold mb-1', pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400')}>{result.score}/{result.maxScore}</div>
          <div className={cn('text-sm font-medium', pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400')}>{pct}% — {label}</div>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correctIndex
            return (
              <div key={q.id} className={cn('p-4 rounded-xl border', correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
                <p className="font-medium text-sm text-white mb-3">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn('text-xs px-3 py-2 rounded-lg',
                      oi === q.correctIndex && 'bg-emerald-500/20 text-emerald-400 font-medium',
                      oi === answers[q.id] && oi !== q.correctIndex && 'bg-red-500/20 text-red-400',
                      oi !== q.correctIndex && oi !== answers[q.id] && 'text-zinc-600',
                    )}>{opt}</div>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 mt-3 italic">{q.explanation}</p>
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
        <div key={q.id} className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <p className="font-semibold text-sm text-white mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                className={cn('w-full text-left text-sm px-4 py-3 rounded-xl border transition-all',
                  answers[q.id] === oi
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400 font-medium'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}>{opt}</button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submitQuiz} disabled={loading || Object.keys(answers).length < questions.length}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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
      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <PenLine className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="font-bold text-white text-lg mb-1">Practical assignment</h3>
      <p className="text-zinc-500 text-sm mb-6">Apply what you&apos;ve learned with a real task</p>
      <button onClick={generateAssignment} disabled={loading} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />} Get Assignment
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
        <h3 className="font-semibold text-xs text-amber-400 uppercase tracking-wider mb-2">Your Task</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">{assignment.prompt}</p>
      </div>
      {!assignment.submission && (
        <div>
          <textarea value={submission} onChange={e => setSubmission(e.target.value)} rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/50 resize-none placeholder-zinc-600"
            placeholder="Write your response here..." />
          <button onClick={submitAssignment} disabled={streaming || !submission.trim()}
            className="mt-3 w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {streaming ? 'Getting feedback...' : 'Submit for AI Feedback'}
          </button>
        </div>
      )}
      {(feedback || assignment.ai_feedback) && (
        <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">AI Feedback</h3>
            {score !== null && (
              <span className={cn('text-sm font-bold px-3 py-1 rounded-lg',
                score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
              )}>{score}/100</span>
            )}
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-zinc-400">
            <ReactMarkdown>{feedback || assignment.ai_feedback || ''}</ReactMarkdown>
          </div>
          {streaming && <span className="animate-pulse text-amber-400 text-lg">▊</span>}
        </div>
      )}
    </div>
  )
}

export default function LessonClient({ lesson, roadmap, roadmapId, existingQuiz, existingAssignment }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')

  const tabs = [
    { id: 'content', icon: BookOpen, label: 'Lesson' },
    { id: 'quiz', icon: Brain, label: 'Quiz' },
    { id: 'assignment', icon: PenLine, label: 'Practice' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors flex-shrink-0">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
        <div className="flex-1 min-w-0">
          {roadmap && <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wide truncate">{roadmap.title}</p>}
          <p className="text-sm font-semibold text-white truncate">{lesson.title}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all border-b-2 -mb-px',
              activeTab === id ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'
            )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' && <LessonContent lesson={lesson} roadmapId={roadmapId} />}
        {activeTab === 'quiz' && <div className="h-full overflow-y-auto p-6 bg-zinc-950"><QuizSection lessonId={lesson.id} existingQuiz={existingQuiz} /></div>}
        {activeTab === 'assignment' && <div className="h-full overflow-y-auto p-6 bg-zinc-950"><AssignmentSection lessonId={lesson.id} existingAssignment={existingAssignment} /></div>}
      </div>
    </div>
  )
}
