'use client'
import { useState } from 'react'
import { LANG_COOKIE, normalizeLang, makeT, dirFor, type Lang } from '@/lib/i18n'

export function getClientLang(): Lang {
  if (typeof document === 'undefined') return 'en'
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`))
  return normalizeLang(m?.[1])
}

/** Current language + bound translator for client components. */
export function useLang() {
  const [lang] = useState<Lang>(getClientLang)
  return { lang, t: makeT(lang), dir: dirFor(lang), isRtl: lang === 'he' }
}

/**
 * Switch language: cookie + full reload so every server- and client-rendered
 * string (and <html dir>) flips at once. Language changes are rare — a reload
 * is the simple, always-correct path.
 */
export function switchLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`
  window.location.reload()
}
