'use client'
import { useEffect } from 'react'
import { playTap, playClick, playNav, playPick } from '@/lib/sound'

// Mounts once (in the app shell) and gives interactions distinct sounds based on
// what was pressed — links/tabs, buttons, inputs/options, and plain taps each
// sound different, so it isn't "the same click for everything".
export default function SoundController() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      const el = target?.closest?.(
        'a, button, [role="tab"], [role="button"], input, textarea, select, label, [role="option"]'
      ) as HTMLElement | null

      if (!el) return playTap()

      const tag = el.tagName.toLowerCase()
      const role = el.getAttribute('role')
      if (tag === 'a' || role === 'tab') playNav()
      else if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'label' || role === 'option') playPick()
      else playClick()
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])
  return null
}
