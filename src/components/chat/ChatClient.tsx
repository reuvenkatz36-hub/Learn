'use client'
import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/types/database'
import { Send, Loader2, Bot, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

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
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="font-bold text-white">AI Learning Coach</h1>
          <p className="text-xs text-zinc-500">Powered by Claude · Ask anything</p>
        </div>
        {roadmaps.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-600" />
            <select
              value={selectedRoadmap}
              onChange={e => setSelectedRoadmap(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-amber-400/50"
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
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Meet Maestro, your AI coach</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
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
                  className="text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 px-3 py-1.5 rounded-full transition-all text-zinc-400 hover:text-white"
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
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-amber-400 text-zinc-950 font-medium rounded-br-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {!msg.content && loading && <span className="animate-pulse text-amber-400">▊</span>}
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-zinc-800">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask your AI coach anything..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors resize-none max-h-32"
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 disabled:opacity-50 flex items-center justify-center transition-all flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
