import Link from 'next/link'
import { Brain, BookOpen, Trophy, MessageSquare, GitBranch, BarChart2, Zap, CheckCircle } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Roadmaps', desc: 'Claude generates personalized learning paths for any topic' },
  { icon: BookOpen, title: 'Streaming Lessons', desc: 'Rich 8-section lessons streamed in real-time by AI' },
  { icon: Trophy, title: 'Quizzes & Assignments', desc: 'Test knowledge and get detailed AI feedback instantly' },
  { icon: MessageSquare, title: 'AI Coach Chat', desc: 'Ask your personal AI tutor anything, anytime' },
  { icon: GitBranch, title: 'Knowledge Graph', desc: 'Visualize concepts and track mastery across topics' },
  { icon: BarChart2, title: 'Progress Dashboard', desc: 'Streak calendar, XP charts, and completion metrics' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">MasteryAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-lg font-medium">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
            Master Anything with{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered
            </span>{' '}
            Learning
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Generate personalized roadmaps, stream rich lessons, ace quizzes, and chat with your AI coach &mdash; all in one place. Free, forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/25">
              Start Learning Free &rarr;
            </Link>
            <Link href="/auth/login" className="border border-white/10 hover:border-white/20 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg transition-all">
              Sign In
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            {['No credit card required', 'All features free', 'Powered by Claude'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need to master any subject</h2>
            <p className="text-gray-400">Six powerful AI tools working together for your learning journey</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:border-violet-500/40 transition-all">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-b from-violet-900/30 to-gray-900/50 border border-violet-500/20">
            <h2 className="text-3xl font-bold mb-4">Ready to start mastering?</h2>
            <p className="text-gray-400 mb-8">Join thousands of learners accelerating their growth with AI</p>
            <Link href="/auth/signup" className="inline-block bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/25">
              Get Started &mdash; It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        &copy; 2026 MasteryAI &middot; Built with Claude AI
      </footer>
    </div>
  )
}
