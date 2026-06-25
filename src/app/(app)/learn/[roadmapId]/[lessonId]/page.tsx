import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LessonClient from '@/components/learning/LessonClient'
import type { Lesson, Roadmap } from '@/types/database'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ roadmapId: string; lessonId: string }>
}) {
  const { roadmapId, lessonId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const userId = user!.id

  const { data: rawLesson } = await supabase
    .from('lessons')
    .select('*, roadmaps(*)')
    .eq('id', lessonId)
    .eq('user_id', userId)
    .single()

  const lesson = rawLesson as (Lesson & { roadmaps: Roadmap | null }) | null

  if (!lesson || lesson.status === 'locked') redirect(`/learn/${roadmapId}`)

  const [{ data: quiz }, { data: assignment }] = await Promise.all([
    supabase.from('quizzes').select('*').eq('lesson_id', lessonId).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('assignments').select('*').eq('lesson_id', lessonId).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const safeLesson = lesson!

  return (
    <LessonClient
      lesson={safeLesson}
      roadmap={safeLesson.roadmaps}
      roadmapId={roadmapId}
      existingQuiz={quiz}
      existingAssignment={assignment}
    />
  )
}
