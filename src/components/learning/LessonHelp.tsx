'use client'
import { useState } from 'react'
import { HelpCircle, X, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'
import { useLang } from '@/lib/useLang'

const dog = CREW.dog

// Floating "ask about this lesson" bubble. Sits above the lesson content;
// answers are grounded in the current lesson via /api/lesson/ask.
export default function LessonHelp({ lessonId }: { lessonId: string }) {
  const { t, lang, isRtl } = useLang()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)

  const ask = async () => {
    const q = question.trim()
    if (!q || asking) return
    setAsking(true)
    setAnswer('')
    try {
      const res = await fetch('/api/lesson/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, question: q, language: lang }),
      })
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
              if (data.chunk) setAnswer(prev => prev + data.chunk)
            } catch {}
          }
        }
      }
    } finally {
      setAsking(false)
    }
  }

  return (
    <>
      {/* floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t('lesson.help.title')}
        className="fixed bottom-5 z-[55] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{ background: dog.accent, [isRtl ? 'left' : 'right']: '1.25rem' }}
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div
          className="fixed bottom-20 z-[55] w-[min(22rem,calc(100vw-2.5rem))] bg-surface border border-line rounded-2xl shadow-2xl p-4"
          style={{ [isRtl ? 'left' : 'right']: '1.25rem' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Mascot who="dog" size={30} animate={false} />
            <h3 className="font-bold text-ink text-sm">{t('lesson.help.title')}</h3>
          </div>

          {answer && (
            <div className="prose prose-sm max-w-none text-ink-soft mb-3 max-h-56 overflow-y-auto bg-paper border border-line rounded-xl p-3">
              <ReactMarkdown>{answer}</ReactMarkdown>
              {asking && <span className="animate-pulse" style={{ color: dog.accent }}>▊</span>}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ask() }}
              placeholder={t('lesson.help.placeholder')}
              className="flex-1 bg-paper border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: dog.accent }}
            />
            <button
              onClick={ask}
              disabled={asking || !question.trim()}
              aria-label={t('lesson.help.send')}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-transform hover:enabled:-translate-y-0.5 shrink-0"
              style={{ background: dog.accent }}
            >
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
