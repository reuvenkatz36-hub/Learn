import { anthropic, MODEL } from '@/lib/anthropic'

// Centralized content generation. Pure functions: they call Claude and return
// parsed data (no DB). Reused by the on-demand routes AND the all-in-one
// /api/roadmap/build endpoint so prompts live in exactly one place.

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in model response')
  return JSON.parse(match[0])
}

async function complete(prompt: string, maxTokens: number): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

export interface RoadmapSectionPlan {
  index: number
  title: string
  description: string
  topics: string[]
  estimatedMinutes: number
}

export interface RoadmapPlan {
  title: string
  description: string
  estimatedHours: number
  sections: RoadmapSectionPlan[]
}

export async function generateRoadmapPlan(topic: string, difficulty: string): Promise<RoadmapPlan> {
  const text = await complete(
    `Create a comprehensive learning roadmap for "${topic}" at ${difficulty} level.
Return ONLY valid JSON matching this exact structure:
{
  "title": "string (concise roadmap title)",
  "description": "string (2-3 sentence overview)",
  "estimatedHours": number,
  "sections": [
    {
      "index": 0,
      "title": "string",
      "description": "string (what this section covers)",
      "topics": ["topic1", "topic2", "topic3"],
      "estimatedMinutes": number
    }
  ]
}
Create exactly 8 sections. Make it practical and progressive. No markdown, just JSON.`,
    2000,
  )
  return extractJson(text) as RoadmapPlan
}

export interface LessonContentSection {
  title: string
  content: string
  type: 'text' | 'example' | 'key_point' | 'exercise'
}

export async function generateLessonContent(params: {
  topic: string
  courseTitle: string
  difficulty: string
  lessonTitle: string
  sectionIndex: number
}): Promise<LessonContentSection[]> {
  const text = await complete(
    `Create a detailed educational lesson for:
Topic: ${params.topic}
Course: ${params.courseTitle}
Level: ${params.difficulty}
Lesson: "${params.lessonTitle}" (Section ${params.sectionIndex + 1} of 8)

Return ONLY valid JSON with exactly 8 sections:
{
  "sections": [
    {
      "title": "string",
      "content": "string (300-500 words of rich educational content with examples)",
      "type": "text|example|key_point|exercise"
    }
  ]
}

Use varied section types. Make it engaging, practical, and educational. No markdown outside JSON strings.`,
    4000,
  )
  const data = extractJson(text) as { sections: LessonContentSection[] }
  return data.sections
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export async function generateQuiz(params: {
  lessonTitle: string
  contentSummary: string
}): Promise<QuizQuestion[]> {
  const text = await complete(
    `Create a 5-question quiz for this lesson: "${params.lessonTitle}"
Based on content: ${params.contentSummary}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "string explaining the correct answer"
    }
  ]
}
Make questions test understanding, not just memorization.`,
    2000,
  )
  const data = extractJson(text) as { questions: QuizQuestion[] }
  return data.questions
}

export async function generateAssignmentPrompt(params: {
  lessonTitle: string
  topic: string
  difficulty: string
}): Promise<string> {
  const text = await complete(
    `Create a practical assignment for lesson "${params.lessonTitle}" in a ${params.topic} course (${params.difficulty} level).
Return ONLY valid JSON:
{
  "prompt": "string (clear assignment instructions, 150-250 words, including what to do, deliverables, and success criteria)"
}
Make it hands-on and achievable within 20-30 minutes.`,
    800,
  )
  const data = extractJson(text) as { prompt: string }
  return data.prompt
}

export function summarizeContent(content: unknown): string {
  return Array.isArray(content)
    ? content.map((s: { title: string; content: string }) => `${s.title}: ${s.content?.slice(0, 200)}`).join('\n')
    : ''
}
