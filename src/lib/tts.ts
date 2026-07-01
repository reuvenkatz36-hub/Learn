// Character voices via the browser's built-in speech synthesis (Web Speech API).
// Free, offline-capable, English-only for now — matching the spec: Hebrew TTS
// waits until a natural-sounding Hebrew voice provider is chosen. Each crew
// member gets a distinct pitch/rate profile so the owl doesn't sound like the
// beaver. Swapping to a premium provider (ElevenLabs / Polly / Google TTS)
// later only means replacing `speak()`'s internals.
import type { CrewId } from '@/lib/crew'

const VOICE_PROFILE: Record<CrewId, { pitch: number; rate: number }> = {
  owl: { pitch: 0.8, rate: 0.95 },      // low, measured — the principal
  cat: { pitch: 1.25, rate: 1.05 },     // quick, sharp — the quizmaster
  beaver: { pitch: 0.9, rate: 1.0 },    // solid, practical
  dog: { pitch: 1.1, rate: 1.0 },       // warm, friendly
  elephant: { pitch: 0.7, rate: 0.9 },  // deep, calm
  fox: { pitch: 1.05, rate: 1.05 },     // bright guide
}

let cachedVoice: SpeechSynthesisVoice | null = null

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  // Prefer higher-quality local English voices when available.
  cachedVoice =
    voices.find(v => v.lang.startsWith('en') && /natural|premium|enhanced/i.test(v.name)) ??
    voices.find(v => v.lang === 'en-US') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  return cachedVoice
}

// Voice list loads async in some browsers.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickEnglishVoice() }
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speak one chunk of text in a character's voice.
 * Resolves when the chunk finishes (or is cancelled).
 */
export function speak(text: string, who: CrewId): Promise<void> {
  return new Promise(resolve => {
    if (!ttsSupported() || !text.trim()) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickEnglishVoice()
    if (voice) u.voice = voice
    u.lang = 'en-US'
    u.pitch = VOICE_PROFILE[who].pitch
    u.rate = VOICE_PROFILE[who].rate
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel()
}

export function pauseSpeaking() {
  if (ttsSupported()) window.speechSynthesis.pause()
}

export function resumeSpeaking() {
  if (ttsSupported()) window.speechSynthesis.resume()
}
