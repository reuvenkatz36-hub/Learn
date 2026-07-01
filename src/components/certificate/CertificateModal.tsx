'use client'
import { useState, useEffect, useMemo } from 'react'
import { X, Share2, Download, Loader2 } from 'lucide-react'
import { renderCertificate } from '@/lib/certificate'
import { useLang } from '@/lib/useLang'
import { playSuccess } from '@/lib/sound'
import { supabase } from '@/lib/supabase'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const owl = CREW.owl

interface Props {
  userName: string
  courseTitle: string
  roadmapId: string
  lessons: number
  difficulty: string
  onClose: () => void
}

function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: mime })
}

export default function CertificateModal({ userName, courseTitle, roadmapId, lessons, difficulty, onClose }: Props) {
  const { t, lang } = useLang()
  const [variant, setVariant] = useState<'square' | 'story'>('square')
  const [sharing, setSharing] = useState(false)

  const date = useMemo(() => new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), [lang])

  const imageUrl = useMemo(
    () => renderCertificate({ userName, courseTitle, lessons, difficulty, date, lang }, variant),
    [userName, courseTitle, lessons, difficulty, date, lang, variant],
  )

  // Celebrate once + best-effort record (needs the certificates table migration).
  useEffect(() => {
    playSuccess()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('certificates').insert({ user_id: user.id, roadmap_id: roadmapId, language: lang })
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const download = () => {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `zendric-certificate-${variant}.png`
    a.click()
  }

  const share = async () => {
    setSharing(true)
    try {
      const file = dataUrlToFile(imageUrl, 'zendric-certificate.png')
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Zendric', text: courseTitle })
        // bump share_count best-effort
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: cert } = await supabase.from('certificates').select('id, share_count').eq('user_id', user.id).eq('roadmap_id', roadmapId).order('created_at', { ascending: false }).limit(1).maybeSingle()
            if (cert) await supabase.from('certificates').update({ share_count: (cert.share_count ?? 0) + 1 }).eq('id', cert.id)
          }
        } catch {}
      } else {
        download() // desktop fallback
      }
    } catch {} finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-line shadow-2xl rounded-3xl w-full max-w-md p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Mascot who="owl" size={38} pose="cheer" animate={false} />
            <div>
              <h2 className="font-bold text-ink leading-tight">{t('cert.congrats')}</h2>
              <p className="text-xs text-ink-soft">{t('cert.title')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors" aria-label={t('common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variant toggle */}
        <div className="flex items-center gap-2 mb-3">
          {([['square', t('cert.square')], ['story', t('cert.story')]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={variant === v
                ? { color: owl.accent, borderColor: owl.accent, background: owl.accentSoft }
                : { color: '#6B6864', borderColor: '#ECEAE4' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={t('cert.title')}
          className="w-full rounded-2xl border border-line mb-4"
          style={variant === 'story' ? { maxHeight: '50vh', objectFit: 'contain', background: '#111' } : undefined}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={share}
            disabled={sharing}
            className="flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm transition-transform hover:enabled:-translate-y-0.5 disabled:opacity-50"
            style={{ background: owl.accent }}
          >
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            {t('cert.share')}
          </button>
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border border-line text-ink-soft hover:text-ink hover:bg-paper transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('cert.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
