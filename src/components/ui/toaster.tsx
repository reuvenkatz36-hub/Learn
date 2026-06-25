'use client'
import { useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
}>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl',
              t.type === 'success' ? 'bg-green-900/80 border-green-500/30 text-green-100' : 'bg-red-900/80 border-red-500/30 text-red-100'
            )}
          >
            {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {t.message}
            <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}>
              <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
