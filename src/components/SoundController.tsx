'use client'
import { useEffect } from 'react'
import { playTap } from '@/lib/sound'

// Mounts once (in the app shell) and gives every tap a soft click. Uses
// pointerdown so it fires immediately on press, for taps and clicks alike.
export default function SoundController() {
  useEffect(() => {
    const onPointerDown = () => playTap()
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])
  return null
}
