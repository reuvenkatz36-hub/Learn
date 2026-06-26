'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lesson, Roadmap, Quiz, Assignment, LessonContentSection, QuizQuestion } from '@/types/database'
import { ArrowLeft, BookOpen, ClipboardList, PenLine, Loader2, CheckCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface Props {
  lesson: Lesson
  roadmap: Roadmap | null
  roadmapId: string
  existingQuiz: Quiz | null
  existingAssignment: Assignment | null
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-gray-100 rounded-2xl p-5">
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  const [sections, setSections] = useState<LessonContentSection[]>(
    Array.isArray(lesson.content) && lesson.content.length > 0
      ? lesson.content as unknown as LessonContentSection[]
      : []
  )
  const [streaming, setStreaming] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
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
              if (data.done && data.sections) {
                setSections(data.sections)
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
      <div>
        <div className="flex items-center gap-2.5 mb-6 text-indigo-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Generating your lesson...</span>
        </div>
        <SkeletonBlock />
      </div>
    )
  }

  return (
    <div className="flex gap-8">
      <div className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className={cn(
              'text-left px-3 py-2 rounded-xl text-sm transition-all',
              activeSection === i
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="text-xs text-gray-300 block mb-0.5">{i + 1}</span>
            {s.title}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {sections[activeSection] && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              {sections[activeSection].type && sections[activeSection].type !== 'text' && (
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide',
                  sections[activeSection].type === 'key_point' && 'bg-amber-50 text-amber-600',
                  sections[activeSection].type === 'example' && 'bg-blue-50 text-blue-600',
                  sections[activeSection].type === 'exercise' && 'bg-green-50 text-green-600',
                )}>
                  {sections[activeSection].type?.replace('_', ' ')}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{sections[activeSection].title}</h2>
            <div className="prose prose-gray prose-sm max-w-none text-gray-600 leading-relaxed">
              <ReactMarkdown>{sections[activeSection].content}</ReactMarkdown>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setActiveSection(i => Math.max(0, i - 1))}
                disabled={activeSection === 0}
                className="text-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-300">{activeSection + 1} / {sections.length}</span>
              <button
                onClick={() => setActiveSection(i => Math.min(sections.length - 1, i + 1))}
                disabled={activeSection === sections.length - 1}
                className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-colors font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        <div className="lg:hidden mt-6 flex gap-2 flex-wrap">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-semibold transition-all',
                activeSection === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
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
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-7 h-7 text-indigo-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Test your knowledge</h3>
        <p className="text-gray-400 text-sm mb-6">5 questions based on this lesson</p>
        <button
          onClick={generateQuiz}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto transition-colors"
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
          'p-6 rounded-2xl border mb-6 text-center',
          pct >= 80 ? 'bg-green-50 border-green-100' : pct >= 60 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
        )}>
          <div className={cn('text-4xl font-bold mb-1', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500')}>
            {result.score}/{result.maxScore}
          </div>
          <div className={cn('text-sm font-medium', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500')}>
            {pct}% — {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job!' : 'Keep practicing!'}
          </div>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correctIndex
            return (
              <div key={q.id} className={cn('p-4 rounded-2xl border', correct ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50')}>
                <p className="font-medium text-sm text-gray-900 mb-3">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn(
                      'text-xs px-3 py-2 rounded-xl',
                      oi === q.correctIndex && 'bg-green-100 text-green-700 font-medium',
                      oi === answers[q.id] && oi !== q.correctIndex && 'bg-red-100 text-red-600',
                      oi !== q.correctIndex && oi !== answers[q.id] && 'text-gray-400'
                    )}>
                      {opt}
                    </div>
                  ))}
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
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                className={cn(
                  'w-full text-left text-sm px-4 py-3 rounded-xl border transition-all',
                  answers[q.id] === oi
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
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
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PenLine className="w-7 h-7 text-indigo-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Practical assignment</h3>
        <p className="text-gray-400 text-sm mb-6">Apply what you've learned with a real task</p>
        <button
          onClick={generateAssignment}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Get Assignment
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <h3 className="font-semibold text-sm text-indigo-700 mb-2">Your Task</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{assignment.prompt}</p>
      </div>

      {!assignment.submission && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Your submission</label>
          <textarea
            value={submission}
            onChange={e => setSubmission(e.target.value)}
            rows={8}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
            placeholder="Write your response here..."
          />
          <button
            onClick={submitAssignment}
            disabled={streaming || !submission.trim()}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {streaming ? 'Getting feedback...' : 'Submit for AI Feedback'}
          </button>
        </div>
      )}

      {(feedback || assignment.ai_feedback) && (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">AI Feedback</h3>
            {score !== null && (
              <span className={cn(
                'text-sm font-bold px-3 py-1 rounded-full',
                score >= 80 ? 'bg-green-50 text-green-600' : score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
              )}>
                {score}/100
              </span>
            )}
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
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignment'>('content')

  const tabs = [
    { id: 'content', label: 'Lesson', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: ClipboardList },
    { id: 'assignment', label: 'Assignment', icon: PenLine },
  ] as const

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href={`/learn/${roadmapId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to course
      </Link>

      <div className="mb-8">
        {roadmap && <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{roadmap.title}</p>}
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.status === 'completed' && (
          <div className="flex items-center gap-1.5 text-green-500 text-xs mt-2 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-100 mb-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all',
              activeTab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'content' && <LessonContent lesson={lesson} />}
      {activeTab === 'quiz' && <QuizSection lessonId={lesson.id} existingQuiz={existingQuiz} />}
      {activeTab === 'assignment' && <AssignmentSection lessonId={lesson.id} existingAssignment={existingAssignment} />}
    </div>
  )
}
