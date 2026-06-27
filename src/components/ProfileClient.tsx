'use client'
import { useState } from 'react'
import { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Trophy, Flame, LogOut, Zap } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const fox = CREW.fox

export default function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [name, setName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ display_name: name, bio }).eq('id', profile?.id ?? '')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const level = Math.floor((profile?.total_xp ?? 0) / 100)
  const xpInLevel = (profile?.total_xp ?? 0) % 100

  return (
    <div className="p-5 sm:p-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-rose-600 transition-colors"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign out
        </button>
      </div>

      {/* Avatar & identity */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-surface border border-line rounded-2xl">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
          style={{ background: fox.accent }}
        >
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-ink text-lg">{name || 'Learner'}</div>
          <div className="text-ink-soft text-sm">Level {level}</div>
        </div>
        <Mascot who="fox" size={44} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 p-5 bg-surface border border-line rounded-2xl">
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{(profile?.total_xp ?? 0).toLocaleString()}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ color: fox.accent }} /> XP earned
          </div>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{profile?.streak_count ?? 0}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> day streak
          </div>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <div className="text-2xl font-bold text-ink tabular-nums">{level}</div>
          <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Trophy className="w-3 h-3" style={{ color: fox.accent }} /> level
          </div>
        </div>
      </div>

      {/* XP progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-ink-soft mb-2">
          <span>Level {level} → {level + 1}</span>
          <span>{xpInLevel}/100 XP</span>
        </div>
        <div className="h-2 bg-line rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${xpInLevel}%`, background: fox.accent }}
          />
        </div>
        <p className="text-xs text-ink-faint mt-2">{100 - xpInLevel} XP to next level</p>
      </div>

      {/* Edit form */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Display Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 transition-all"
            style={{ ['--tw-ring-color' as string]: fox.accent }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 transition-all resize-none placeholder-ink-faint"
            style={{ ['--tw-ring-color' as string]: fox.accent }}
            placeholder="Tell us about yourself..."
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform hover:enabled:-translate-y-0.5"
          style={{ background: fox.accent }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
