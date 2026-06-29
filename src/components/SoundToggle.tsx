'use client'
import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isMuted, toggleMuted, subscribeMuted } from '@/lib/sound'

export default function SoundToggle({ className }: { className?: string }) {
  const [muted, setMutedState] = useState(false)

  useEffect(() => {
    setMutedState(isMuted())
    return subscribeMuted(setMutedState)
  }, [])

  return (
    <button
      onClick={toggleMuted}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      title={muted ? 'Sound off' : 'Sound on'}
      className={
        'w-9 h-9 rounded-xl flex items-center justify-center text-ink-soft hover:text-ink hover:bg-paper transition-colors ' +
        (className ?? '')
      }
    >
      {muted ? <VolumeX className="w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px]" />}
    </button>
  )
}
