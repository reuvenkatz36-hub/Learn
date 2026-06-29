import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import CharacterSay from '@/components/crew/CharacterSay'
import { CREW, type CrewId } from '@/lib/crew'

const fox = CREW.fox
const hoot = CREW.owl

const crewLineup: { who: CrewId; title: string; desc: string }[] = [
  { who: 'owl', title: 'Lessons', desc: 'Principal Hoot runs the school and teaches your lessons, one focused line at a time.' },
  { who: 'cat', title: 'Quizzes', desc: 'Quill checks what stuck with sharp, quick questions.' },
  { who: 'beaver', title: 'Practice', desc: 'Buck sets hands-on builds so you actually apply it.' },
  { who: 'dog', title: 'Coaching', desc: 'Sunny answers anything, anytime, with your context.' },
  { who: 'elephant', title: 'Memory', desc: 'Memo maps how every concept connects together.' },
  { who: 'fox', title: 'Your guide', desc: 'Finn keeps you on track and cheering you on.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mascot who="owl" size={28} animate={false} />
            <span className="font-bold tracking-tight text-lg">Mastery</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/auth/login" className="text-sm text-ink-soft hover:text-ink transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm text-white transition-transform hover:-translate-y-0.5 px-4 py-2 rounded-lg font-bold" style={{ background: fox.accent }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 text-center bg-hero-glow">
        <div className="max-w-3xl mx-auto">
          {/* Principal Hoot — the face of Mastery */}
          <div className="flex justify-center mb-5">
            <Mascot who="owl" size={132} aura />
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-ink-soft border border-line bg-surface px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: hoot.accent }} />
            Meet {hoot.name}, your principal
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-[1.05] tracking-tight">
            Learn anything with a
            <br />
            <span className="bg-brand-regal bg-clip-text text-transparent">crew that&apos;s got your back.</span>
          </h1>
          <p className="text-lg text-ink-soft mb-8 max-w-xl mx-auto leading-relaxed">
            {hoot.name} runs the school. A teacher, a quizmaster, a coach, and more — each an
            expert at their part of how you learn. Build a course and they take it from there.
          </p>
          <div className="flex justify-center mb-10">
            <CharacterSay who="owl" size={64} text="Welcome. Tell me what you'd like to master — I'll have my crew prepare the whole course for you." />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="group inline-flex items-center justify-center gap-2 text-white px-7 py-3.5 rounded-xl font-bold transition-transform hover:-translate-y-0.5" style={{ background: fox.accent }}>
              Start learning free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center border border-line hover:bg-surface text-ink-soft px-7 py-3.5 rounded-xl font-semibold transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Meet the crew */}
      <section className="py-20 px-6 border-t border-line">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-lg">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Meet the crew.</h2>
            <p className="text-ink-soft">Each character owns one part of your learning — so every step has a friendly expert.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crewLineup.map(({ who, title, desc }) => {
              const m = CREW[who]
              return (
                <div key={who} className="bg-surface border border-line rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <Mascot who={who} size={56} halo />
                  <div className="mt-4 flex items-baseline gap-2">
                    <h3 className="font-bold text-ink">{m.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: m.accent, background: m.accentSoft }}>{title}</span>
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed mt-1.5">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-line">
        <div className="max-w-2xl mx-auto text-center">
          <Mascot who="fox" size={72} halo className="mx-auto mb-5" />
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to meet them?</h2>
          <p className="text-ink-soft mb-8">Create your first course in under a minute. No card required.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-bold transition-transform hover:-translate-y-0.5" style={{ background: fox.accent }}>
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 px-6 text-center text-ink-faint text-sm">
        © 2026 Mastery
      </footer>
    </div>
  )
}
