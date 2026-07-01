import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, MODEL } from '@/lib/anthropic'

// Centralized content generation. Pure functions: they call Claude and return
// parsed data (no DB). Reused by the on-demand routes AND the all-in-one
// /api/roadmap/build endpoint so prompts live in exactly one place.

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in model response')
  return JSON.parse(match[0])
}

export type ContentLanguage = 'en' | 'he'

/**
 * Appended to every generation prompt. When the user's language is Hebrew, all
 * AI-produced content (titles, lessons, questions, feedback) comes back in
 * natural Hebrew; JSON keys stay English so parsing is unaffected.
 */
export function languageDirective(lang?: ContentLanguage): string {
  return lang === 'he'
    ? '\n\nIMPORTANT: Write ALL user-facing text (titles, content, questions, options, explanations, feedback) in natural, fluent Hebrew. Keep all JSON keys and structure in English exactly as specified.'
    : ''
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

export async function generateRoadmapPlan(topic: string, difficulty: string, language?: ContentLanguage): Promise<RoadmapPlan> {
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
Create exactly 8 sections. Make it practical and progressive. No markdown, just JSON.${languageDirective(language)}`,
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
  language?: ContentLanguage
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

Use varied section types. Make it engaging, practical, and educational. No markdown outside JSON strings.${languageDirective(params.language)}`,
    4000,
  )
  const data = extractJson(text) as { sections: LessonContentSection[] }
  return data.sections
}

/**
 * Story Mode: retell existing lesson sections as an engaging narrative — plot,
 * characters, light tension — that still faithfully teaches the same material.
 */
export async function generateStoryVersion(params: {
  lessonTitle: string
  sections: LessonContentSection[]
  language?: ContentLanguage
}): Promise<LessonContentSection[]> {
  const source = params.sections.map(s => `## ${s.title}\n${s.content}`).join('\n\n')
  const text = await complete(
    `Rewrite this lesson as an engaging STORY the learner reads for fun — a narrative with characters, a light plot and gentle tension that carries the learner through the material. Every important concept from the source must still be taught accurately inside the story.

Lesson: "${params.lessonTitle}"

SOURCE MATERIAL:
${source}

Return ONLY valid JSON:
{
  "sections": [
    { "title": "string (chapter title)", "content": "string (200-400 words of story)", "type": "text" }
  ]
}
Write 5-8 chapters. Make it genuinely fun to read — not a dry lesson with a thin story wrapper. No markdown outside JSON strings.${languageDirective(params.language)}`,
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
  language?: ContentLanguage
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
Make questions test understanding, not just memorization.${languageDirective(params.language)}`,
    2000,
  )
  const data = extractJson(text) as { questions: QuizQuestion[] }
  return data.questions
}

export async function generateAssignmentPrompt(params: {
  lessonTitle: string
  topic: string
  difficulty: string
  language?: ContentLanguage
}): Promise<{ prompt: string; inputTypes: string[] }> {
  const text = await complete(
    `Create a practical assignment for lesson "${params.lessonTitle}" in a ${params.topic} course (${params.difficulty} level).
Return ONLY valid JSON:
{
  "prompt": "string (clear assignment instructions, 150-250 words, including what to do, deliverables, and success criteria)",
  "inputTypes": ["text" and/or "drawing"]
}
inputTypes marks how the answer should be submitted: "text" for written answers, "drawing" for sketches, diagrams, geometry or visual work. Include both when either would work.
Make it hands-on and achievable within 20-30 minutes.${languageDirective(params.language)}`,
    800,
  )
  const data = extractJson(text) as { prompt: string; inputTypes?: string[] }
  const inputTypes = Array.isArray(data.inputTypes) && data.inputTypes.length > 0
    ? data.inputTypes.filter(t => t === 'text' || t === 'drawing')
    : ['text']
  return { prompt: data.prompt, inputTypes }
}

export interface ImportedLesson {
  title: string
  sections: LessonContentSection[]
  questions: QuizQuestion[]
}

// Turn raw source material (pasted text or a PDF) into a single self-contained
// micro-lesson plus quiz in ONE model call. Powers the "drop a PDF or text"
// importer — the reading feeds the same Spotify-style reader, the questions feed
// the same quiz UI.
export async function generateLessonFromSource(params: {
  text?: string
  pdfBase64?: string
  language?: ContentLanguage
}): Promise<ImportedLesson> {
  const instruction = `You are turning the user's source material into a single engaging micro-lesson with a quiz, formatted for a calm, focused reading experience.

Return ONLY valid JSON with this exact shape:
{
  "title": "string (concise lesson title, max 8 words)",
  "sections": [
    { "title": "string", "content": "string (150-350 words, clear and engaging)", "type": "text|example|key_point|exercise" }
  ],
  "questions": [
    { "id": "q1", "question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "string explaining the correct answer" }
  ]
}

Rules:
- Write 4 to 7 sections with varied types that faithfully teach the source material.
- Write exactly 5 quiz questions that test understanding (not just recall) of the material.
- Base everything strictly on the provided source material — do not invent facts that aren't supported by it.
- No markdown outside JSON strings.${languageDirective(params.language)}`

  const content: Anthropic.ContentBlockParam[] = params.pdfBase64
    ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: params.pdfBase64 } },
        { type: 'text', text: instruction },
      ]
    : [{ type: 'text', text: `${instruction}\n\nSOURCE MATERIAL:\n${params.text ?? ''}` }]

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content }],
  })

  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  const data = extractJson(text) as ImportedLesson
  if (!data.title || !Array.isArray(data.sections) || !Array.isArray(data.questions)) {
    throw new Error('Model response missing expected fields')
  }
  return data
}

export function summarizeContent(content: unknown): string {
  return Array.isArray(content)
    ? content.map((s: { title: string; content: string }) => `${s.title}: ${s.content?.slice(0, 200)}`).join('\n')
    : ''
}
