// Tiny synthesized UI sound kit. No audio files — every sound is generated with
// the Web Audio API, so it's a few bytes of code and infinitely tweakable. All
// sounds are deliberately soft and short to feel premium, not gamey.
//
// Browsers require a user gesture before audio can play, so the AudioContext is
// created lazily on the first interaction. A global mute flag is persisted to
// localStorage and broadcast to subscribers (for the nav toggle).

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let loaded = false
const listeners = new Set<(muted: boolean) => void>()

const STORAGE_KEY = 'mastery_sound_muted'

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  muted = localStorage.getItem(STORAGE_KEY) === '1'
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  // Autoplay policy: contexts start suspended until a gesture resumes them.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

interface ToneOpts {
  freq: number
  type?: OscillatorType
  /** seconds */
  duration?: number
  /** peak gain 0..1 */
  gain?: number
  /** glide to this frequency by the end */
  freqEnd?: number
  /** start offset in seconds (for chords/arpeggios) */
  delay?: number
}

function tone({ freq, type = 'sine', duration = 0.12, gain = 0.06, freqEnd, delay = 0 }: ToneOpts) {
  const ac = getCtx()
  if (!ac || !master || muted) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration)
  // Quick attack, smooth exponential release — soft and clicky, never harsh.
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

// ---- public sound vocabulary -------------------------------------------------

/** Soft click on any tap / button press. */
export function playTap() {
  ensureLoaded()
  tone({ freq: 220, freqEnd: 150, type: 'triangle', duration: 0.07, gain: 0.05 })
}

/** Very subtle high tick as a new line scrolls into focus while reading. */
export function playScrollTick() {
  ensureLoaded()
  tone({ freq: 1180, type: 'sine', duration: 0.035, gain: 0.018 })
}

/** Rising two-note confirm — selections, sends. */
export function playConfirm() {
  ensureLoaded()
  tone({ freq: 440, type: 'sine', duration: 0.09, gain: 0.05 })
  tone({ freq: 660, type: 'sine', duration: 0.11, gain: 0.05, delay: 0.06 })
}

/** Gentle three-note chime when a lesson is completed. */
export function playComplete() {
  ensureLoaded()
  const notes = [523.25, 659.25, 783.99] // C5 E5 G5
  notes.forEach((f, i) => tone({ freq: f, type: 'sine', duration: 0.5, gain: 0.06, delay: i * 0.1 }))
}

/** Bright sparkle for a good quiz result. */
export function playSuccess() {
  ensureLoaded()
  const notes = [659.25, 783.99, 987.77, 1318.5] // E5 G5 B5 E6
  notes.forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.3, gain: 0.05, delay: i * 0.08 }))
}

/** Low soft thud for errors / wrong answers. */
export function playError() {
  ensureLoaded()
  tone({ freq: 200, freqEnd: 120, type: 'sine', duration: 0.22, gain: 0.06 })
}

// ---- mute state --------------------------------------------------------------

export function isMuted(): boolean {
  ensureLoaded()
  return muted
}

export function setMuted(next: boolean) {
  ensureLoaded()
  muted = next
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  if (!next) {
    // Unmuting is a gesture — warm up the context and give light feedback.
    getCtx()
    tone({ freq: 600, type: 'sine', duration: 0.1, gain: 0.05 })
  }
  listeners.forEach(l => l(next))
}

export function toggleMuted() {
  setMuted(!isMuted())
}

export function subscribeMuted(fn: (muted: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
