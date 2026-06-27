// Flat-geometric mascot set. One cohesive style: rounded shapes, soft fills,
// smart accessories. Each takes an `accent` (the crew signature color) used on
// clothing/accessories. Eyes use the `crew-eye` class for the idle blink.
import type { CrewId } from '@/lib/crew'

interface MascotSvgProps {
  accent: string
}

const STROKE = '#1C1B1A'

function Eyes({ cx1, cx2, cy, r = 3 }: { cx1: number; cx2: number; cy: number; r?: number }) {
  return (
    <>
      <circle className="crew-eye" cx={cx1} cy={cy} r={r} fill={STROKE} />
      <circle className="crew-eye" cx={cx2} cy={cy} r={r} fill={STROKE} />
    </>
  )
}

function Fox({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* scarf */}
      <path d="M30 78c6 6 34 6 40 0l4 14c-16 8-32 8-48 0z" fill={accent} />
      <rect x="44" y="84" width="12" height="14" rx="3" fill={accent} />
      {/* ears */}
      <path d="M26 30l8 22-20-6z" fill="#E8743B" />
      <path d="M74 30l-8 22 20-6z" fill="#E8743B" />
      <path d="M28 34l5 14-11-4z" fill="#FBE3D2" />
      <path d="M72 34l-5 14 11-4z" fill="#FBE3D2" />
      {/* head */}
      <path d="M50 26c16 0 26 12 26 28S66 82 50 82 24 70 24 54 34 26 50 26Z" fill="#E8743B" />
      {/* cheeks / muzzle */}
      <path d="M50 50c10 0 18 4 18 4-2 14-10 22-18 22s-16-8-18-22c0 0 8-4 18-4Z" fill="#FBF3EC" />
      {/* nose */}
      <circle cx="50" cy="58" r="4" fill={STROKE} />
      <Eyes cx1={40} cx2={60} cy={46} />
    </svg>
  )
}

function Owl({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <path d="M50 24c18 0 28 14 28 32S68 88 50 88 22 74 22 56 32 24 50 24Z" fill="#8C6D52" />
      {/* belly */}
      <path d="M50 44c11 0 18 8 18 20s-7 20-18 20-18-8-18-20 7-20 18-20Z" fill="#D8C3A5" />
      {/* ear tufts */}
      <path d="M30 28l-6-12 14 6z" fill="#8C6D52" />
      <path d="M70 28l6-12-14 6z" fill="#8C6D52" />
      {/* glasses */}
      <circle cx="40" cy="46" r="11" stroke={accent} strokeWidth="3.5" fill="#fff" />
      <circle cx="60" cy="46" r="11" stroke={accent} strokeWidth="3.5" fill="#fff" />
      <path d="M51 46h-2" stroke={accent} strokeWidth="3.5" />
      <Eyes cx1={40} cx2={60} cy={46} r={3.5} />
      {/* beak */}
      <path d="M50 54l5 8h-10z" fill={accent === '#5B6CFF' ? '#F5A524' : accent} />
      {/* bow tie */}
      <path d="M50 78l-12-6v12zM50 78l12-6v12z" fill={accent} />
      <circle cx="50" cy="78" r="3.5" fill={accent} />
    </svg>
  )
}

function Cat({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* collar */}
      <path d="M32 80c4 5 32 5 36 0l4 16c-15 6-29 6-44 0z" fill={accent} />
      {/* ears */}
      <path d="M28 30l-4-16 18 10z" fill="#9AA3AD" />
      <path d="M72 30l4-16-18 10z" fill="#9AA3AD" />
      <path d="M30 28l-2-9 10 6z" fill="#C9CFD6" />
      <path d="M70 28l2-9-10 6z" fill="#C9CFD6" />
      {/* head */}
      <path d="M50 24c16 0 26 12 26 28S66 82 50 82 24 68 24 52 34 24 50 24Z" fill="#9AA3AD" />
      {/* spectacles */}
      <rect x="30" y="42" width="16" height="11" rx="3" stroke={accent} strokeWidth="3" fill="#fff" />
      <rect x="54" y="42" width="16" height="11" rx="3" stroke={accent} strokeWidth="3" fill="#fff" />
      <path d="M46 47h8" stroke={accent} strokeWidth="3" />
      <Eyes cx1={38} cx2={62} cy={48} r={2.8} />
      {/* nose + whiskers */}
      <path d="M50 58l3 4h-6z" fill={STROKE} />
      <path d="M40 60l-12-2M40 64l-11 3M60 60l12-2M60 64l11 3" stroke="#C9CFD6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Beaver({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* overalls */}
      <path d="M30 80c6 5 34 5 40 0l3 18H27z" fill={accent} />
      <rect x="40" y="74" width="5" height="16" rx="2" fill={accent} />
      <rect x="55" y="74" width="5" height="16" rx="2" fill={accent} />
      {/* ears */}
      <circle cx="28" cy="34" r="7" fill="#7A5230" />
      <circle cx="72" cy="34" r="7" fill="#7A5230" />
      {/* head */}
      <path d="M50 26c15 0 25 11 25 26S65 80 50 80 25 67 25 52 35 26 50 26Z" fill="#8B5E3C" />
      {/* muzzle */}
      <ellipse cx="50" cy="58" rx="15" ry="12" fill="#C99B6E" />
      {/* big teeth */}
      <rect x="46" y="60" width="8" height="11" rx="1.5" fill="#fff" stroke={STROKE} strokeWidth="1.2" />
      <path d="M50 60v11" stroke={STROKE} strokeWidth="1" />
      {/* nose */}
      <ellipse cx="50" cy="54" rx="4" ry="3" fill={STROKE} />
      <Eyes cx1={40} cx2={60} cy={44} />
    </svg>
  )
}

function Dog({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* sweater */}
      <path d="M28 80c8 6 36 6 44 0l4 18H24z" fill={accent} />
      <path d="M40 86h20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* ears */}
      <path d="M26 40c-6 4-8 18-2 26 6-2 8-10 8-18z" fill="#C98E3F" />
      <path d="M74 40c6 4 8 18 2 26-6-2-8-10-8-18z" fill="#C98E3F" />
      {/* head */}
      <path d="M50 26c15 0 25 11 25 26S65 80 50 80 25 67 25 52 35 26 50 26Z" fill="#E8B65A" />
      {/* muzzle */}
      <ellipse cx="50" cy="60" rx="14" ry="11" fill="#F6E2BC" />
      <Eyes cx1={41} cx2={59} cy={46} />
      {/* nose */}
      <ellipse cx="50" cy="56" rx="5" ry="4" fill={STROKE} />
      <path d="M50 60v6M50 66c-3 0-5-1-6-2M50 66c3 0 5-1 6-2" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Elephant({ accent }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* tie */}
      <path d="M50 76l-6 8 6 14 6-14z" fill={accent} />
      <path d="M46 74h8l-2 6h-4z" fill={accent} />
      {/* ears */}
      <ellipse cx="26" cy="48" rx="14" ry="18" fill="#9FB6C4" />
      <ellipse cx="74" cy="48" rx="14" ry="18" fill="#9FB6C4" />
      <ellipse cx="28" cy="48" rx="8" ry="11" fill="#B9CDD8" />
      <ellipse cx="72" cy="48" rx="8" ry="11" fill="#B9CDD8" />
      {/* head */}
      <path d="M50 24c14 0 23 10 23 24S64 78 50 78 27 62 27 48 36 24 50 24Z" fill="#AEC3CF" />
      {/* trunk */}
      <path d="M50 52c0 8-1 14 1 20 1 4 7 4 8 0" stroke="#AEC3CF" strokeWidth="9" strokeLinecap="round" fill="none" />
      <Eyes cx1={41} cx2={59} cy={44} />
    </svg>
  )
}

export const MASCOTS: Record<CrewId, (p: MascotSvgProps) => JSX.Element> = {
  fox: Fox,
  owl: Owl,
  cat: Cat,
  beaver: Beaver,
  dog: Dog,
  elephant: Elephant,
}
