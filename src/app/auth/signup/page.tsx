'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const fox = CREW.fox

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Mascot who="fox" size={88} halo className="mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <h2 className="text-xl font-bold text-ink">Account created</h2>
          </div>
          <p className="text-ink-soft mt-2 text-sm">{fox.name} is taking you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Mascot who="fox" size={88} halo className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ink">Join the crew</h1>
          <p className="text-ink-soft mt-1 text-sm">{fox.name} and the team are ready to teach you</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as string]: fox.accent }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as string]: fox.accent }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as string]: fox.accent }}
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-transform hover:enabled:-translate-y-0.5"
            style={{ background: fox.accent }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Free Account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-faint mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium transition-colors" style={{ color: fox.accent }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
