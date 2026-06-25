'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lesson, Roadmap, Quiz, Assignment, LessonContentSection, QuizQuestion } from '@/types/database'
import { ArrowLeft, BookOpen, ClipboardList, PenLine, Loader2, CheckCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface Props {
  lesson: Lesson
  roadmap: Roadmap | null
  roadmapId: string
  existingQuiz: Quiz | null
  existingAssignment: Assignment | null
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  const [sections, setSections] = useState<LessonContentSection[]>(
    Array.isArray(lesson.content) && lesson.content.length > 0
      ? lesson.content as unknown as LessonContentSection[]
      : []
  )
  const [streaming, setStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
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
              if (data.chunk) setStreamedText(prev => prev + data.chunk)
              if (data.done && data.sections) {
                setSections(data.sections)
                setStreamedText('')
              }
            } catch {}
          }
        }
      }
      setStreaming(false)
    }).catch(() => setStreaming(false))
  }, [lesson.id, sections.length])

  if (streaming && sections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-violet-400 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Generating your lesson...</span>
        </div>
        {streamedText && (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
            {streamedText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border transition-all overflow-hidden',
            section.type === 'key_point' && 'border-violet-500/30 bg-violet-500/5',
            section.type === 'example' && 'border-cyan-500/30 bg-cyan-500/5',
            section.type === 'exercise' && 'border-orange-500/30 bg-orange-500/5',
            section.type === 'text' && 'border-white/5 bg-white/[0.02]',
          )}
        >
          <button
            onClick={() => setExpanded(prev => {
              const next = new Set(prev)
              if (next.has(i)) { next.delete(i) } else { next.add(i) }
              return next
            })}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                section.type === 'key_point' && 'bg-violet-500/20 text-violet-400',
                section.type === 'example' && 'bg-cyan-500/20 text-cyan-400',
                section.type === 'exercise' && 'bg-orange-500/20 text-orange-400',
                section.type === 'text' && 'bg-gray-700 text-gray-400',
              )}>
                {i + 1}
              </div>
              <h3 className="font-semibold text-sm">{section.title}</h3>
              {section.type !== 'text' && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  section.type === 'key_point' && 'bg-violet-500/10 text-violet-400',
                  section.type === 'example' && 'bg-cyan-500/10 text-cyan-400',
                  section.type === 'exercise' && 'bg-orange-500/10 text-orange-400',
                )}>
                  {section.type.replace('_', ' ')}
                </span>
              )}
            </div>
            {expanded.has(i) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {expanded.has(i) && (
            <div className="px-4 pb-4">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
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
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, action: 'generate' }),
    })
    const data = await res.json()
    setQuiz(data)
    setLoading(false)
  }

  const submitQuiz = async () => {
    if (!quiz) return
    setLoading(true)
    const res = await fetch('/api/quiz', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: quiz.id, answers, lessonId }),
    })
    const data = await res.json()
    setResult({ score: data.score, maxScore: data.maxScore })
    setSubmitted(true)
    setLoading(false)
  }

  if (!quiz) {
    return (
      <div className="text-center py-10">
        <ClipboardList className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 font-medium mb-4">Test your knowledge with a quiz</p>
        <button
          onClick={generateQuiz}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Generate Quiz
        </button>
      </div>
    )
  }

  const questions = quiz.questions as unknown as QuizQuestion[]

  if (submitted && result) {
    const pct = Math.round((result.score / result.maxScore) * 100)
    return (
      <div>
        <div className={cn(
          'p-5 rounded-2xl border mb-5 text-center',
          pct >= 80 ? 'bg-green-500/10 border-green-500/20' : pct >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'
        )}>
          <div className="text-3xl font-bold mb-1">{result.score}/{result.maxScore}</div>
          <div className={cn('text-sm font-medium', pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400')}>
            {pct}% — {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practicing!'}
          </div>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id]
            const correct = userAnswer === q.correctIndex
            return (
              <div key={q.id} className={cn('p-4 rounded-xl border', correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}>
                <p className="font-medium text-sm mb-2">{i + 1}. {q.question}</p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn(
                      'text-xs px-3 py-1.5 rounded-lg',
                      oi === q.correctIndex && 'bg-green-500/20 text-green-300',
                      oi === userAnswer && oi !== q.correctIndex && 'bg-red-500/20 text-red-300',
                      oi !== q.correctIndex && oi !== userAnswer && 'text-gray-500'
                    )}>
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>
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
        <div key={q.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
          <p className="font-medium text-sm mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                className={cn(
                  'w-full text-left text-xs px-4 py-2.5 rounded-lg border transition-all',
                  answers[q.id] === oi
                    ? 'border-violet-500 bg-violet-500/15 text-violet-200'
                    : 'border-white/5 hover:border-white/15 text-gray-300'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={submitQuiz}
        disabled={loading || Object.keys(answers).length < questions.length}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Submit Quiz
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
    const res = await fetch('/api/assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    })
    const data = await res.json()
    setAssignment(data)
    setLoading(false)
  }

  const submitAssignment = async () => {
    if (!assignment || !submission.trim()) return
    setStreaming(true)
    setFeedback('')

    const res = await fetch('/api/assignment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId: assignment.id, submission }),
    })

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

  if (!assignment) {
    return (
      <div className="text-center py-10">
        <PenLine className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 font-medium mb-4">Complete a practical assignment</p>
        <button
          onClick={generateAssignment}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Get Assignment
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-5 bg-violet-500/5 border border-violet-500/20 rounded-xl">
        <h3 className="font-semibold text-sm text-violet-300 mb-2">Assignment</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{assignment.prompt}</p>
      </div>

      {!assignment.submission && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Your submission</label>
          <textarea
            value={submission}
            onChange={e => setSubmission(e.target.value)}
            rows={8}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
            placeholder="Write your response here..."
          />
          <button
            onClick={submitAssignment}
            disabled={streaming || !submission.trim()}
            className="mt-3 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit for AI Feedback
          </button>
        </div>
      )}

      {(feedback || assignment.ai_feedback) && (
        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">AI Feedback</h3>
            {score !== null && (
              <span className={cn(
                'text-sm font-bold px-3 py-1 rounded-full',
                score >= 80 ? 'bg-green-500/15 text-green-400' : score >= 60 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
              )}>
                {score}/100
              </span>
            )}
          </div>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{feedback || assignment.ai_feedback || ''}</ReactMarkdown>
          </div>
          {streaming && <span className="animate-pulse text-violet-400">▊</span>}
        </div>
      )}
    </div>
  )
}

export default function LessonClient({ lesson, roadmap, roadmapId, existingQuiz, existingAssignment }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')

  const tabs = [
    { id: 'content', label: 'Lesson', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: ClipboardList },
    { id: 'assignment', label: 'Assignment', icon: PenLine },
  ] as const

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/learn/${roadmapId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Roadmap
      </Link>

      <div className="mb-6">
        {roadmap && <p className="text-xs text-gray-500 mb-1">{roadmap.title}</p>}
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {lesson.status === 'completed' && (
          <div className="flex items-center gap-1.5 text-green-400 text-xs mt-2">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'content' && <LessonContent lesson={lesson} />}
      {activeTab === 'quiz' && <QuizSection lessonId={lesson.id} existingQuiz={existingQuiz} />}
      {activeTab === 'assignment' && <AssignmentSection lessonId={lesson.id} existingAssignment={existingAssignment} />}
    </div>
  )
}
