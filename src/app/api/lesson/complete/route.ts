import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { recordLevelUp } from '@/lib/rewards'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, xpEarned } = await req.json()
  const xp = Math.max(0, Number(xpEarned) || 10)
  const today = new Date().toISOString().split('T')[0]

  // Fetch current lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, roadmap_id, section_index, status')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single()

  if (!lesson || lesson.status === 'completed') {
    return NextResponse.json({ ok: true })
  }

  // 1. Mark lesson as completed
  await supabase
    .from('lessons')
    .update({ status: 'completed' })
    .eq('id', lessonId)
    .eq('user_id', user.id)

  // 2. Unlock next lesson in the roadmap
  await supabase
    .from('lessons')
    .update({ status: 'available' })
    .eq('roadmap_id', lesson.roadmap_id)
    .eq('user_id', user.id)
    .eq('section_index', lesson.section_index + 1)
    .eq('status', 'locked')

  // 3. Add XP to profile + update streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp, streak_count, last_activity_date')
    .eq('id', user.id)
    .single()

  let levelUp: { level: number } | null = null
  if (profile) {
    const lastActive = profile.last_activity_date
    const isNewDay = lastActive !== today
    const isConsecutive = lastActive === new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = isNewDay ? (isConsecutive ? (profile.streak_count ?? 0) + 1 : 1) : (profile.streak_count ?? 0)

    const oldXp = profile.total_xp ?? 0
    const newXp = oldXp + xp
    await supabase
      .from('profiles')
      .update({
        total_xp: newXp,
        streak_count: newStreak,
        last_activity_date: today,
      })
      .eq('id', user.id)

    levelUp = await recordLevelUp(supabase, user.id, oldXp, newXp)
  }

  // 4. Upsert daily activity
  const { data: existing } = await supabase
    .from('daily_activity')
    .select('id, lessons_completed, xp_earned')
    .eq('user_id', user.id)
    .eq('activity_date', today)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('daily_activity')
      .update({
        lessons_completed: (existing.lessons_completed ?? 0) + 1,
        xp_earned: (existing.xp_earned ?? 0) + xp,
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('daily_activity')
      .insert({ user_id: user.id, activity_date: today, lessons_completed: 1, xp_earned: xp })
  }

  // Did this completion finish the whole course? (drives the certificate)
  const { data: remaining } = await supabase
    .from('lessons')
    .select('id')
    .eq('roadmap_id', lesson.roadmap_id)
    .eq('user_id', user.id)
    .neq('status', 'completed')
    .limit(1)
  const courseComplete = (remaining?.length ?? 1) === 0

  return NextResponse.json({ ok: true, xpEarned: xp, levelUp, courseComplete })
}
