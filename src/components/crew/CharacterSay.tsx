'use client'
import { useState, useEffect, useRef } from 'react'
import Mascot, { type MascotPose } from './Mascot'
import { CREW, type CrewId } from '@/lib/crew'

interface CharacterSayProps {
  who: CrewId
  /** the line(s) to type out */
  text: string
  size?: number
  /** pose to hold once finished talking */
  restPose?: MascotPose
  /** typing speed in ms per character */
  speed?: number
  className?: string
}

/**
 * A crew member that "speaks": the mouth animates (pose=talk) while a speech
 * bubble types out the line, then settles into restPose. Reusable presence
 * moment used in greetings, empty states, and reactions.
 */
export default function CharacterSay({
  who,
  text,
  size = 72,
  restPose = 'idle',
  speed = 24,
  className,
}: CharacterSayProps) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const member = CREW[who]
  const idx = useRef(0)

  useEffect(() => {
    setShown('')
    setDone(false)
    idx.current = 0
    const t = setInterval(() => {
      idx.current += 1
      setShown(text.slice(0, idx.current))
      if (idx.current >= text.length) {
        clearInterval(t)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(t)
  }, [text, speed])

  return (
    <div className={`flex items-end gap-3 ${className ?? ''}`}>
      <Mascot who={who} size={size} pose={done ? restPose : 'talk'} />
      <div
        className="crew-bubble relative bg-surface border border-line rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-ink shadow-soft max-w-xs"
        style={{ ['--line' as string]: '#ECEAE4' }}
      >
        <span className="font-semibold" style={{ color: member.accent }}>{member.name}:</span>{' '}
        {shown}
        {!done && <span className="animate-pulse">▍</span>}
      </div>
    </div>
  )
}
