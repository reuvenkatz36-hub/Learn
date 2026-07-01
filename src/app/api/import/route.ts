import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase-server'
import { generateLessonFromSource } from '@/lib/generate'

export const maxDuration = 120
export const runtime = 'nodejs'

// Import flow: take pasted text or a PDF, turn it into a one-lesson "mini course"
// (reading + quiz) with a single model call, then drop the learner straight into
// the reader. No build screen — everything is ready on creation.
export async function POST(req: Request) {
  try {
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text, pdfBase64, language } = await req.json()

    const trimmedText = typeof text === 'string' ? text.trim() : ''
    if (!pdfBase64 && trimmedText.length < 40) {
      return NextResponse.json({ error: 'Paste at least a paragraph of text, or upload a PDF.' }, { status: 400 })
    }

    const imported = await generateLessonFromSource({
      text: trimmedText || undefined,
      pdfBase64: typeof pdfBase64 === 'string' ? pdfBase64 : undefined,
      language: language === 'he' ? 'he' : 'en',
    })

    // One roadmap = one imported reading. Reuse the existing schema so the reader,
    // quiz, and course pages all work unchanged.
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: user.id,
        title: imported.title,
        description: 'Imported reading with a quiz',
        topic: imported.title,
        difficulty: 'beginner',
        estimated_hours: 1,
        sections: [{
          index: 0,
          title: imported.title,
          description: 'Imported reading',
          topics: [],
          estimatedMinutes: 10,
        }],
        status: 'active',
        generation_status: 'ready',
      })
      .select()
      .single()

    if (roadmapError || !roadmap) throw roadmapError ?? new Error('Failed to create roadmap')

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        roadmap_id: roadmap.id,
        user_id: user.id,
        title: imported.title,
        section_index: 0,
        content: imported.sections,
        status: 'available',
      })
      .select()
      .single()

    if (lessonError || !lesson) throw lessonError ?? new Error('Failed to create lesson')

    await supabase.from('quizzes').insert({
      lesson_id: lesson.id,
      user_id: user.id,
      questions: imported.questions,
      max_score: imported.questions.length,
    })

    return NextResponse.json({ roadmapId: roadmap.id, lessonId: lesson.id })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Failed to import. Try a smaller file or less text.' }, { status: 500 })
  }
}
