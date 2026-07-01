'use client'
import { useState, useEffect } from 'react'
import { Globe, BookOpen, Volume2, VolumeX, AudioLines, AlignLeft, Sparkles, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang, switchLang } from '@/lib/useLang'
import { READING_MODES, type ReadingMode, type Lang } from '@/lib/i18n'
import { isMuted, setMuted, subscribeMuted } from '@/lib/sound'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const fox = CREW.fox

const MODE_ICONS: Record<ReadingMode, typeof BookOpen> = {
  spotify: AudioLines,
  book: BookOpen,
  plain: AlignLeft,
  story: Sparkles,
}

export default function SettingsClient() {
  const { t, lang } = useLang()
  const [readingMode, setReadingMode] = useState<ReadingMode>('spotify')
  const [muted, setMutedState] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('zendric_reading_mode')
    if (saved === 'book' || saved === 'plain' || saved === 'story' || saved === 'spotify') setReadingMode(saved)
    setMutedState(isMuted())
    return subscribeMuted(setMutedState)
  }, [])

  const pickLang = async (next: Lang) => {
    if (next === lang) return
    // Best-effort profile persistence (needs the migration); the cookie is the
    // source of truth either way.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({ preferred_language: next }).eq('id', user.id)
    } catch {}
    switchLang(next)
  }

  const pickMode = async (mode: ReadingMode) => {
    setReadingMode(mode)
    localStorage.setItem('zendric_reading_mode', mode)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').update({ preferred_reading_mode: mode }).eq('id', user.id)
    } catch {}
  }

  return (
    <div className="p-5 sm:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8 pt-2">
        <Mascot who="fox" size={48} halo />
        <h1 className="text-2xl font-bold text-ink">{t('settings.title')}</h1>
      </div>

      {/* Language */}
      <div className="mb-6 p-5 bg-surface border border-line rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4" style={{ color: fox.accent }} />
          <h2 className="font-bold text-ink text-sm">{t('settings.language')}</h2>
        </div>
        <p className="text-xs text-ink-soft mb-4">{t('settings.langNote')}</p>
        <div className="grid grid-cols-2 gap-2">
          {([['en', 'English'], ['he', 'עברית']] as const).map(([code, label]) => (
            <button
              key={code}
              onClick={() => pickLang(code)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all"
              style={lang === code
                ? { borderColor: fox.accent, background: fox.accentSoft, color: fox.accent }
                : { borderColor: '#ECEAE4', color: '#6B6864' }}
            >
              {lang === code && <Check className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reading mode */}
      <div className="mb-6 p-5 bg-surface border border-line rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4" style={{ color: fox.accent }} />
          <h2 className="font-bold text-ink text-sm">{t('settings.readingMode')}</h2>
        </div>
        <p className="text-xs text-ink-soft mb-4">{t('settings.readingNote')}</p>
        <div className="grid grid-cols-2 gap-2">
          {READING_MODES.map(mode => {
            const Icon = MODE_ICONS[mode]
            const selected = readingMode === mode
            return (
              <button
                key={mode}
                onClick={() => pickMode(mode)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all"
                style={selected
                  ? { borderColor: fox.accent, background: fox.accentSoft, color: fox.accent }
                  : { borderColor: '#ECEAE4', color: '#6B6864' }}
              >
                <Icon className="w-4 h-4" />
                {t(`lesson.mode.${mode}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sounds */}
      <div className="p-5 bg-surface border border-line rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          {muted ? <VolumeX className="w-4 h-4" style={{ color: fox.accent }} /> : <Volume2 className="w-4 h-4" style={{ color: fox.accent }} />}
          <h2 className="font-bold text-ink text-sm">{t('settings.sound')}</h2>
        </div>
        <p className="text-xs text-ink-soft mb-4">{t('settings.soundNote')}</p>
        <div className="grid grid-cols-2 gap-2">
          {([[false, t('settings.soundOn')], [true, t('settings.soundOff')]] as const).map(([m, label]) => (
            <button
              key={String(m)}
              onClick={() => setMuted(m)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all"
              style={muted === m
                ? { borderColor: fox.accent, background: fox.accentSoft, color: fox.accent }
                : { borderColor: '#ECEAE4', color: '#6B6864' }}
            >
              {muted === m && <Check className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
