// The Crew — one character owns each section of the app.
// Single source of truth for identity + signature accent color.

export type CrewId = 'fox' | 'owl' | 'cat' | 'beaver' | 'dog' | 'elephant'

export interface CrewMember {
  id: CrewId
  name: string
  animal: string
  role: string
  /** Solid signature accent (hex). */
  accent: string
  /** Soft tint for backgrounds (rgba/hex with low alpha works in inline styles). */
  accentSoft: string
  /** Friendly one-liner used in headers / empty states. */
  blurb: string
}

export const CREW: Record<CrewId, CrewMember> = {
  fox: {
    id: 'fox',
    name: 'Finn',
    animal: 'Fox',
    role: 'Your guide',
    accent: '#FF6B5E',
    accentSoft: 'rgba(255,107,94,0.12)',
    blurb: 'Here to help you get started.',
  },
  owl: {
    id: 'owl',
    name: 'Professor Hoot',
    animal: 'Owl',
    role: 'Your teacher',
    accent: '#5B6CFF',
    accentSoft: 'rgba(91,108,255,0.12)',
    blurb: 'Let’s read through this together.',
  },
  cat: {
    id: 'cat',
    name: 'Quill',
    animal: 'Cat',
    role: 'Your quizmaster',
    accent: '#8B5CF6',
    accentSoft: 'rgba(139,92,246,0.12)',
    blurb: 'Think you’ve got it? Prove it.',
  },
  beaver: {
    id: 'beaver',
    name: 'Buck',
    animal: 'Beaver',
    role: 'Your coach for practice',
    accent: '#F5A524',
    accentSoft: 'rgba(245,165,36,0.14)',
    blurb: 'Time to build something real.',
  },
  dog: {
    id: 'dog',
    name: 'Sunny',
    animal: 'Golden Retriever',
    role: 'Your coach',
    accent: '#22B07D',
    accentSoft: 'rgba(34,176,125,0.12)',
    blurb: 'Ask me anything, anytime.',
  },
  elephant: {
    id: 'elephant',
    name: 'Memo',
    animal: 'Elephant',
    role: 'Your memory keeper',
    accent: '#3BA9E0',
    accentSoft: 'rgba(59,169,224,0.12)',
    blurb: 'See how it all connects.',
  },
}

// Section → owning crew member.
export const SECTION_CREW = {
  dashboard: 'fox',
  learn: 'owl',
  lesson: 'owl',
  quiz: 'cat',
  practice: 'beaver',
  coach: 'dog',
  graph: 'elephant',
  profile: 'fox',
} as const

export type SectionId = keyof typeof SECTION_CREW

export function crewFor(section: SectionId): CrewMember {
  return CREW[SECTION_CREW[section]]
}
