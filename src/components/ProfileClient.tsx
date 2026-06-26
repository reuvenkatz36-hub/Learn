'use client'
import { useState } from 'react'
import { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Trophy, Flame, LogOut } from 'lucide-react'

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
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Avatar & stats */}
      <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl mb-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-gray-900 truncate">{name || 'Learner'}</div>
          <div className="text-sm text-gray-400">Level {level}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400" /> {profile?.total_xp ?? 0} XP</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {profile?.streak_count ?? 0} day streak</span>
          </div>
        </div>
      </div>

      {/* XP progress */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl mb-4 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-900">Level {level} → {level + 1}</span>
          <span className="text-gray-400">{xpInLevel}/100 XP</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${xpInLevel}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{100 - xpInLevel} XP to next level</p>
      </div>

      {/* Edit form */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
