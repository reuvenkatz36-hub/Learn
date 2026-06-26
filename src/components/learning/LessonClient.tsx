'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lesson, Roadmap, Quiz, Assignment, LessonContentSection, QuizQuestion } from '@/types/database'
import { X, PenLine, Loader2, Zap } from 'lucide-react'
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

  useEffect(() => {
    applyStyles(0)
  }, [lines.length, applyStyles])

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
      <div className="shrink-0 px-5 py-2 flex items-center gap-3 border-b border-gray-100">
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scrollPct * 100}%`, transition: 'width 0.3s linear' }} />
        </div>
        <div className="relative flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-sm font-bold text-indigo-600 tabular-nums">{xp} XP</span>
          {xpPop && (
            <span className="pointer-events-none absolute -top-7 right-0 text-indigo-500 font-bold text-xs whitespace-nowrap animate-xp-pop">
              +10 XP
            </span>
          )}
        </div>
      </div>
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
          <div className="text-5xl">🎉</div>
          <p className="text-gray-400 text-sm">You read the whole lesson</p>
          <button
            onClick={() => {
              localStorage.removeItem(`read_pos_${lessonId}`)
              onFinish()
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold text-sm transition-colors"
          >
            Complete lesson ✓
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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-gray-400 text-sm font-medium">Crafting your lesson...</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-6 text-center px-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900">Lesson complete!</h2>
        <p className="text-gray-500">You earned <span className="font-bold text-indigo-600">+{xpEarned} XP</span></p>
        <button onClick={() => router.push(`/learn/${roadmapId}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-colors">
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
      <div className="text-5xl mb-4">🧠</div>
      <h3 className="font-bold text-gray-900 text-lg mb-1">Test yourself</h3>
      <p className="text-gray-400 text-sm mb-6">5 questions based on this lesson</p>
      <button onClick={generateQuiz} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate Quiz
      </button>
    </div>
  )

  const questions = quiz.questions as unknown as QuizQuestion[]

  if (submitted && result) {
    const pct = Math.round((result.score / result.maxScore) * 100)
    return (
      <div>
        <div className={cn('p-6 rounded-2xl border mb-6 text-center', pct >= 80 ? 'bg-green-50 border-green-100' : pct >= 60 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100')}>
          <div className={cn('text-4xl font-bold mb-1', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500')}>{result.score}/{result.maxScore}</div>
          <div className={cn('text-sm font-medium', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500')}>{pct}% — {pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good job!' : '💪 Keep going!'}</div>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correctIndex
            return (
              <div key={q.id} className={cn('p-4 rounded-2xl border', correct ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50')}>
                <p className="font-medium text-sm text-gray-900 mb-3">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => <div key={oi} className={cn('text-xs px-3 py-2 rounded-xl', oi === q.correctIndex && 'bg-green-100 text-green-700 font-medium', oi === answers[q.id] && oi !== q.correctIndex && 'bg-red-100 text-red-600', oi !== q.correctIndex && oi !== answers[q.id] && 'text-gray-400')}>{opt}</div>)}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">{q.explanation}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={q.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
          <p className="font-semibold text-sm text-gray-900 mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))} className={cn('w-full text-left text-sm px-4 py-3 rounded-xl border transition-all', answers[q.id] === oi ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>{opt}</button>)}
          </div>
        </div>
      ))}
      <button onClick={submitQuiz} disabled={loading || Object.keys(answers).length < questions.length} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
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
      <div className="text-5xl mb-4">✍️</div>
      <h3 className="font-bold text-gray-900 text-lg mb-1">Practical assignment</h3>
      <p className="text-gray-400 text-sm mb-6">Apply what you&apos;ve learned with a real task</p>
      <button onClick={generateAssignment} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />} Get Assignment
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <h3 className="font-semibold text-sm text-indigo-700 mb-2">Your Task</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{assignment.prompt}</p>
      </div>
      {!assignment.submission && (
        <div>
          <textarea value={submission} onChange={e => setSubmission(e.target.value)} rows={8} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 resize-none" placeholder="Write your response here..." />
          <button onClick={submitAssignment} disabled={streaming || !submission.trim()} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {streaming ? 'Getting feedback...' : 'Submit for AI Feedback'}
          </button>
        </div>
      )}
      {(feedback || assignment.ai_feedback) && (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">AI Feedback</h3>
            {score !== null && <span className={cn('text-sm font-bold px-3 py-1 rounded-full', score >= 80 ? 'bg-green-50 text-green-600' : score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500')}>{score}/100</span>}
          </div>
          <div className="prose prose-sm prose-gray max-w-none text-gray-600">
            <ReactMarkdown>{feedback || assignment.ai_feedback || ''}</ReactMarkdown>
          </div>
          {streaming && <span className="animate-pulse text-indigo-400 text-lg">▊</span>}
        </div>
      )}
    </div>
  )
}

export default function LessonClient({ lesson, roadmap, roadmapId, existingQuiz, existingAssignment }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')

  const tabs = [
    { id: 'content', label: '📖 Lesson' },
    { id: 'quiz', label: '🧠 Quiz' },
    { id: 'assignment', label: '✍️ Practice' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={() => router.back()} className="w-11 h-11 rounded-full bg-gray-100 active:bg-gray-300 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          {roadmap && <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide truncate">{roadmap.title}</p>}
          <p className="text-sm font-semibold text-gray-900 truncate">{lesson.title}</p>
        </div>
      </div>
      <div className="flex border-b border-gray-100 shrink-0 px-2">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={cn('flex-1 py-3 text-xs font-semibold transition-all border-b-2 -mb-px', activeTab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600')}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' && <LessonContent lesson={lesson} roadmapId={roadmapId} />}
        {activeTab === 'quiz' && <div className="h-full overflow-y-auto p-6"><QuizSection lessonId={lesson.id} existingQuiz={existingQuiz} /></div>}
        {activeTab === 'assignment' && <div className="h-full overflow-y-auto p-6"><AssignmentSection lessonId={lesson.id} existingAssignment={existingAssignment} /></div>}
      </div>
    </div>
  )
}
