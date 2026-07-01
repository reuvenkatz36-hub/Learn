'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Upload, FileText, Sparkles } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'
import { useLang } from '@/lib/useLang'

const owl = CREW.owl

// Keep below typical serverless request-body limits (PDF → base64 adds ~37%).
const MAX_PDF_BYTES = 3 * 1024 * 1024

interface Props {
  onClose: () => void
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:application/pdf;base64," prefix.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function ImportModal({ onClose }: Props) {
  const router = useRouter()
  const { t, lang } = useLang()
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    setError('')
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Please choose a PDF file.'); return }
    if (f.size > MAX_PDF_BYTES) { setError('PDF is too large (max 3 MB).'); return }
    setFile(f)
  }

  const canSubmit = (!!file || text.trim().length >= 40) && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const body = file
        ? { pdfBase64: await readAsBase64(file), language: lang }
        : { text: text.trim(), language: lang }
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to import')
      onClose()
      router.push(`/learn/${data.roadmapId}/${data.lessonId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
      <div className="bg-surface border border-line shadow-xl rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Mascot who="owl" size={40} animate={false} />
            <div>
              <h2 className="font-bold text-ink leading-tight">{t('modal.importTitle')}</h2>
              <p className="text-xs text-ink-soft">{owl.name} {t('modal.importSub')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PDF drop / picker */}
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
              {t('modal.uploadPdf')}
            </label>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed text-left transition-all"
              style={{ borderColor: file ? owl.accent : '#D8D5CE', background: file ? owl.accentSoft : 'transparent' }}
            >
              {file ? (
                <>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: owl.accent }} />
                  <span className="text-sm text-ink truncate flex-1">{file.name}</span>
                  <span
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="text-ink-faint hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-ink-faint flex-shrink-0" />
                  <span className="text-sm text-ink-soft">{t('modal.dropPdf')}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">{t('modal.orPaste')}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Paste text */}
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              disabled={!!file}
              placeholder={t('modal.pastePlaceholder')}
              className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all resize-none disabled:opacity-40"
              style={{ ['--tw-ring-color' as string]: owl.accent }}
            />
          </div>

          {error && (
            <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:enabled:-translate-y-0.5"
            style={{ background: owl.accent }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('modal.building')}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {t('modal.createLesson')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
