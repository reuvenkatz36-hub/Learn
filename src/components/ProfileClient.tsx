'use client'
import { useState } from 'react'
import { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Trophy, Flame } from 'lucide-react'

export default function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [name, setName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ display_name: name, bio }).eq('id', profile?.id ?? '')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const level = Math.floor((profile?.total_xp ?? 0) / 100)
  const xpInLevel = (profile?.total_xp ?? 0) % 100
  const xpToNext = 100 - xpInLevel

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      <div className="flex items-center gap-5 p-5 bg-white/[0.03] border border-white/5 rounded-2xl mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <div className="font-bold text-lg">{name || 'Learner'}</div>
          <div className="text-sm text-gray-400">Level {level}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> {profile?.total_xp ?? 0} XP</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {profile?.streak_count ?? 0} day streak</span>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Level {level} → {level + 1}</span>
          <span className="text-gray-400">{xpInLevel}/100 XP</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
            style={{ width: `${xpInLevel}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{xpToNext} XP to next level</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
