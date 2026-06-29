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
  /** A deeper shade of the accent — used for gradients / depth. */
  accentDeep: string
  /** Soft tint for backgrounds (rgba/hex with low alpha works in inline styles). */
  accentSoft: string
  /** Friendly one-liner used in headers / empty states. */
  blurb: string
}

/** Regal gold used for Principal Hoot's trim (cap, tassel, robe accents). */
export const HOOT_GOLD = '#E9B84A'

export const CREW: Record<CrewId, CrewMember> = {
  fox: {
    id: 'fox',
    name: 'Finn',
    animal: 'Fox',
    role: 'Your guide',
    accent: '#FF6B5E',
    accentDeep: '#E8472F',
    accentSoft: 'rgba(255,107,94,0.12)',
    blurb: 'Here to help you get started.',
  },
  owl: {
    id: 'owl',
    name: 'Principal Hoot',
    animal: 'Owl',
    role: 'The Principal',
    accent: '#4F46E5',
    accentDeep: '#3730A3',
    accentSoft: 'rgba(79,70,229,0.12)',
    blurb: 'Welcome. Let’s make you brilliant.',
  },
  cat: {
    id: 'cat',
    name: 'Quill',
    animal: 'Cat',
    role: 'Your quizmaster',
    accent: '#8B5CF6',
    accentDeep: '#6D28D9',
    accentSoft: 'rgba(139,92,246,0.12)',
    blurb: 'Think you’ve got it? Prove it.',
  },
  beaver: {
    id: 'beaver',
    name: 'Buck',
    animal: 'Beaver',
    role: 'Your coach for practice',
    accent: '#F5A524',
    accentDeep: '#D4860B',
    accentSoft: 'rgba(245,165,36,0.14)',
    blurb: 'Time to build something real.',
  },
  dog: {
    id: 'dog',
    name: 'Sunny',
    animal: 'Golden Retriever',
    role: 'Your coach',
    accent: '#22B07D',
    accentDeep: '#168562',
    accentSoft: 'rgba(34,176,125,0.12)',
    blurb: 'Ask me anything, anytime.',
  },
  elephant: {
    id: 'elephant',
    name: 'Memo',
    animal: 'Elephant',
    role: 'Your memory keeper',
    accent: '#3BA9E0',
    accentDeep: '#1E83B8',
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
