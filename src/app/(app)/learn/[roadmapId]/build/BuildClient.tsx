'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const hoot = CREW.owl

interface Props {
  roadmapId: string
  title: string
  lessonCount: number
}

type Stage = 'lessons' | 'practice' | 'done' | 'error'

const STAGE_LABEL: Record<Exclude<Stage, 'done' | 'error'>, string> = {
  lessons: 'Writing your lessons',
  practice: 'Setting your quizzes & practice',
}

export default function BuildClient({ roadmapId, title }: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('lessons')
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    ;(async () => {
      try {
        const res = await fetch('/api/roadmap/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadmapId }),
        })
        const reader = res.body?.getReader()
        if (!reader) throw new Error('no stream')
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            try {
              const ev = JSON.parse(part.slice(6))
              if (ev.stage === 'done') {
                setStage('done')
                setTimeout(() => { router.replace(`/learn/${roadmapId}`); router.refresh() }, 900)
              } else if (ev.stage === 'error') {
                setStage('error')
              } else {
                setStage(ev.stage)
                setDone(ev.done)
                setTotal(ev.total)
              }
            } catch {}
          }
        }
      } catch {
        setStage('error')
      }
    })()
  }, [roadmapId, router])

  const pct = total > 0 ? Math.round((done / total) * 100) : 5
  const overall = stage === 'practice' ? Math.min(100, 50 + pct / 2) : stage === 'done' ? 100 : pct / 2

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-2">
        <Mascot who="owl" size={120} aura pose={stage === 'done' ? 'cheer' : 'talk'} />
      </div>

      <h1 className="text-2xl font-bold text-ink mt-2">
        {stage === 'done'
          ? 'Your course is ready!'
          : stage === 'error'
            ? 'Something interrupted the build'
            : `${hoot.name} is building your course`}
      </h1>
      <p className="text-ink-soft text-sm mt-2 max-w-sm">
        {stage === 'done'
          ? `“${title}” is fully prepared — every lesson, quiz, and practice task is ready.`
          : stage === 'error'
            ? 'A few pieces may still be finishing. You can open the course and anything missing will fill in.'
            : 'Sit tight — I’m preparing every lesson, quiz, and practice task up front so it’s all here when you start.'}
      </p>

      {stage !== 'error' && (
        <div className="w-full max-w-sm mt-8">
          <div className="flex justify-between text-xs text-ink-soft mb-2">
            <span>{stage === 'done' ? 'Complete' : STAGE_LABEL[stage]}</span>
            <span className="tabular-nums">{Math.round(overall)}%</span>
          </div>
          <div className="h-2.5 bg-line rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overall}%`, background: `linear-gradient(90deg, ${hoot.accent}, ${hoot.accentDeep})` }}
            />
          </div>
          {total > 0 && stage !== 'done' && (
            <p className="text-xs text-ink-faint mt-2 tabular-nums">{done} / {total}</p>
          )}
        </div>
      )}

      {stage === 'error' && (
        <button
          onClick={() => { router.replace(`/learn/${roadmapId}`); router.refresh() }}
          className="mt-8 text-white px-6 py-3 rounded-xl text-sm font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: hoot.accent }}
        >
          Open course anyway
        </button>
      )}
    </div>
  )
}
