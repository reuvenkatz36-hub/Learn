'use client'
import { useState } from 'react'
import { Award } from 'lucide-react'
import CertificateModal from '@/components/certificate/CertificateModal'
import { useLang } from '@/lib/useLang'
import { CREW } from '@/lib/crew'

const owl = CREW.owl

interface Props {
  userName: string
  courseTitle: string
  roadmapId: string
  lessons: number
  difficulty: string
}

export default function CourseCompleteBanner(props: Props) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-4 mb-6 rounded-2xl border" style={{ background: owl.accentSoft, borderColor: `${owl.accent}44` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl">🎉</span>
          <p className="text-sm font-semibold text-ink truncate">{t('learn.completedBanner')}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 transition-transform hover:-translate-y-0.5"
          style={{ background: owl.accent }}
        >
          <Award className="w-3.5 h-3.5" />
          {t('learn.getCertificate')}
        </button>
      </div>
      {open && <CertificateModal {...props} onClose={() => setOpen(false)} />}
    </>
  )
}
