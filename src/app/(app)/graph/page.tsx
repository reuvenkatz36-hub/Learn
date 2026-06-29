import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BrainClient, { type BrainCourse } from '@/components/graph/BrainClient'

export default async function BrainPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: roadmaps }, { data: lessons }, { data: quizzes }] = await Promise.all([
    supabase.from('roadmaps').select('id, title').eq('user_id', user.id).order('created_at'),
    supabase.from('lessons').select('id, status, roadmap_id, section_index').eq('user_id', user.id).order('section_index'),
    supabase.from('quizzes').select('lesson_id, score, max_score').eq('user_id', user.id),
  ])

  // Best quiz ratio (0..1) per lesson.
  const quizRatio: Record<string, number> = {}
  for (const q of quizzes ?? []) {
    if (q.score == null || !q.max_score) continue
    const r = Math.min(1, q.score / q.max_score)
    if (r > (quizRatio[q.lesson_id] ?? 0)) quizRatio[q.lesson_id] = r
  }

  // A neuron's strength: reading the lesson gets you partway (0.45); fully
  // lighting it up requires acing its quiz too. So 100% means completing every
  // lesson AND mastering every quiz — a real achievement, not just finishing.
  const strengthFor = (lessonId: string, completed: boolean) => {
    const base = completed ? 0.45 : 0
    const bonus = 0.55 * (quizRatio[lessonId] ?? 0)
    return Math.min(1, base + bonus)
  }

  const courses: BrainCourse[] = (roadmaps ?? []).map(r => ({
    id: r.id,
    title: r.title,
    lessons: (lessons ?? [])
      .filter(l => l.roadmap_id === r.id)
      .map(l => ({ id: l.id, strength: strengthFor(l.id, l.status === 'completed') })),
  }))

  return <BrainClient courses={courses} />
}
