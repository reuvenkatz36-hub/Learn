import type { createClientFromRequest } from '@/lib/supabase-server'

type Supa = Awaited<ReturnType<typeof createClientFromRequest>>

export const XP_PER_LEVEL = 100

export function levelForXp(xp: number) {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL)
}

export interface LevelUpResult {
  level: number
  rewards: { level: number; type: 'badge' | 'free_course' }[]
}

/**
 * Called after any XP award. If the user crossed one or more level boundaries,
 * records a reward per level in level_rewards (badge every level, a free-course
 * credit every 10th) and returns what happened so the client can celebrate.
 *
 * Best-effort: if the level_rewards table hasn't been migrated yet, the level-up
 * is still reported — only the persistence is skipped.
 */
export async function recordLevelUp(
  supabase: Supa,
  userId: string,
  oldXp: number,
  newXp: number,
): Promise<LevelUpResult | null> {
  const oldLevel = levelForXp(oldXp)
  const newLevel = levelForXp(newXp)
  if (newLevel <= oldLevel) return null

  const rewards: LevelUpResult['rewards'] = []
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    const type = lvl % 10 === 0 ? 'free_course' as const : 'badge' as const
    rewards.push({ level: lvl, type })
  }

  try {
    const { error } = await supabase.from('level_rewards').insert(
      rewards.map(r => ({
        user_id: userId,
        level: r.level,
        reward_type: r.type,
        reward_value: r.type === 'free_course' ? { credits: 1 } : { badge: `level_${r.level}` },
        claimed: r.type === 'badge', // badges are auto-claimed; credits are granted below
      }))
    )
    if (error) console.error('level_rewards insert failed (run migration?):', error.message)
  } catch (err) {
    console.error('level_rewards insert failed:', err)
  }

  // Grant a course credit for every 10th level (profiles.credits already exists).
  const freeCourses = rewards.filter(r => r.type === 'free_course').length
  if (freeCourses > 0) {
    const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (p && typeof p.credits === 'number') {
      await supabase.from('profiles').update({ credits: p.credits + freeCourses }).eq('id', userId)
    }
  }

  return { level: newLevel, rewards }
}

/**
 * Shared daily-activity increment. Reads the existing row for today and adds,
 * instead of upserting absolute values (which overwrote the day's counters).
 */
export async function bumpDailyActivity(
  supabase: Supa,
  userId: string,
  delta: { xp?: number; lessons?: number; quizzes?: number },
) {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('daily_activity')
    .select('id, xp_earned, lessons_completed, quizzes_taken')
    .eq('user_id', userId)
    .eq('activity_date', today)
    .maybeSingle()

  if (existing) {
    await supabase.from('daily_activity').update({
      xp_earned: (existing.xp_earned ?? 0) + (delta.xp ?? 0),
      lessons_completed: (existing.lessons_completed ?? 0) + (delta.lessons ?? 0),
      quizzes_taken: (existing.quizzes_taken ?? 0) + (delta.quizzes ?? 0),
    }).eq('id', existing.id)
  } else {
    await supabase.from('daily_activity').insert({
      user_id: userId,
      activity_date: today,
      xp_earned: delta.xp ?? 0,
      lessons_completed: delta.lessons ?? 0,
      quizzes_taken: delta.quizzes ?? 0,
    })
  }
}
