'use client'
import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/types/database'
import { Send, Loader2, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const dog = CREW.dog

interface Props {
  initialMessages: ChatMessage[]
  roadmaps: { id: string; title: string }[]
}

export default function ChatClient({ initialMessages, roadmaps }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: '',
      roadmap_id: selectedRoadmap || null,
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    const assistantId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      user_id: '',
      roadmap_id: selectedRoadmap || null,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          roadmapId: selectedRoadmap || undefined,
          history,
        }),
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
              if (data.chunk) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + data.chunk } : m
                ))
              }
            } catch {}
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-paper">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-surface">
        <div className="flex items-center gap-3">
          <Mascot who="dog" size={40} halo />
          <div>
            <h1 className="font-bold text-ink leading-tight">{dog.name}, your coach</h1>
            <p className="text-xs text-ink-soft">{dog.blurb}</p>
          </div>
        </div>
        {roadmaps.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ink-faint" />
            <select
              value={selectedRoadmap}
              onChange={e => setSelectedRoadmap(e.target.value)}
              className="bg-paper border border-line rounded-lg px-3 py-1.5 text-sm text-ink-soft focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: dog.accent }}
            >
              <option value="">General chat</option>
              {roadmaps.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <Mascot who="dog" size={96} halo pose="wave" />
            <h3 className="font-bold text-ink mt-4 mb-2">Hi, I&apos;m {dog.name}!</h3>
            <p className="text-sm text-ink-soft max-w-sm">
              Ask me anything about your learning journey. I can explain concepts, answer questions, and help you stay on track.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                'Explain recursion simply',
                'What should I learn next?',
                'Give me a study plan',
                'Quiz me on this topic',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                  className="text-xs bg-surface border border-line hover:shadow-sm px-3 py-1.5 rounded-full transition-all text-ink-soft hover:text-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
            {msg.role === 'assistant' && (
              <span className="shrink-0 mt-0.5"><Mascot who="dog" size={32} animate={false} /></span>
            )}
            <div className={cn(
              'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'text-white rounded-br-sm'
                : 'bg-surface border border-line text-ink rounded-bl-sm'
            )}
              style={msg.role === 'user' ? { background: dog.accent } : undefined}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {!msg.content && loading && <span className="animate-pulse" style={{ color: dog.accent }}>▊</span>}
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-line flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-ink-soft" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-line bg-surface">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Ask ${dog.name} anything...`}
            className="flex-1 bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all resize-none max-h-32"
            style={{ overflowY: 'auto', ['--tw-ring-color' as string]: dog.accent }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl text-white disabled:opacity-50 flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: dog.accent }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-ink-faint mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
