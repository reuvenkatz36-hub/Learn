import Link from 'next/link'
import { Brain, BookOpen, Trophy, MessageSquare, GitBranch, BarChart2, Zap, ArrowRight } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Roadmaps', desc: 'Personalized learning paths generated for any topic you choose.' },
  { icon: BookOpen, title: 'Focus Reader', desc: 'Rich lessons in a distraction-free reader built for deep work.' },
  { icon: Trophy, title: 'Quizzes & Practice', desc: 'Test your knowledge and get detailed feedback instantly.' },
  { icon: MessageSquare, title: 'Personal Coach', desc: 'Ask your tutor anything, anytime, with full course context.' },
  { icon: GitBranch, title: 'Knowledge Graph', desc: 'Visualize concepts and track mastery across every topic.' },
  { icon: BarChart2, title: 'Progress Tracking', desc: 'Streaks, XP, and completion metrics to keep momentum.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="font-bold tracking-tight">Mastery</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors px-4 py-2 rounded-lg font-bold">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-zinc-400 border border-zinc-800 bg-zinc-900/50 px-3 py-1 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Your personal learning studio
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-[1.05] tracking-tight">
            Master anything,
            <br />
            <span className="text-amber-400">one lesson at a time.</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Build a structured course on any subject, read it in a focus-first reader,
            and prove what you know — all in one calm, deliberate place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="group inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 px-7 py-3.5 rounded-xl font-bold transition-colors">
              Start learning free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 px-7 py-3.5 rounded-xl font-semibold transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 max-w-lg">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Everything you need to learn deeply.</h2>
            <p className="text-zinc-500">Six focused tools, designed to work together — nothing you don&apos;t need.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-7 bg-zinc-950 hover:bg-zinc-900/60 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-5">
                  <Icon className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to start?</h2>
          <p className="text-zinc-500 mb-8">Create your first course in under a minute. No card required.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 px-8 py-3.5 rounded-xl font-bold transition-colors">
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-zinc-600 text-sm">
        © 2026 Mastery
      </footer>
    </div>
  )
}
