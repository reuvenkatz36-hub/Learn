// Full-body flat-geometric mascot set. One cohesive style with soft shaded
// fills for depth. Each figure exposes animatable parts via class names so the
// Mascot wrapper can drive poses:
//   .crew-eye    -> idle blink
//   .crew-arm-r  -> wave / think / cheer (right arm)
//   .crew-arm-l  -> cheer (left arm)
//   .crew-mouth  -> talk
// viewBox is 0 0 100 120 (head + torso + arms + feet).
import type { CrewId } from '@/lib/crew'
import { HOOT_GOLD } from '@/lib/crew'

interface MascotSvgProps {
  accent: string
  accentDeep: string
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

// Shared body: clothing torso (accent gradient) + two arms in `fur` + feet.
function Body({ accent, accentDeep, fur, gradId }: { accent: string; accentDeep: string; fur: string; gradId: string }) {
  return (
    <>
      {/* feet */}
      <ellipse cx="40" cy="113" rx="7" ry="4" fill={fur} />
      <ellipse cx="60" cy="113" rx="7" ry="4" fill={fur} />
      {/* arms (behind torso) */}
      <g className="crew-arm-l">
        <rect x="20" y="74" width="10" height="26" rx="5" fill={fur} />
      </g>
      <g className="crew-arm-r">
        <rect x="70" y="74" width="10" height="26" rx="5" fill={fur} />
      </g>
      {/* torso / clothing */}
      <path d="M32 72c0-3 5-6 18-6s18 3 18 6l4 34c0 4-44 4-44 0z" fill={`url(#${gradId})`} />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>
      </defs>
    </>
  )
}

function Fox({ accent, accentDeep }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Body accent={accent} accentDeep={accentDeep} fur="#E8743B" gradId="g-fox" />
      {/* ears */}
      <path d="M26 22l8 22-20-6z" fill="#E8743B" />
      <path d="M74 22l-8 22 20-6z" fill="#E8743B" />
      <path d="M28 26l5 14-11-4z" fill="#FBE3D2" />
      <path d="M72 26l-5 14 11-4z" fill="#FBE3D2" />
      {/* head */}
      <path d="M50 18c16 0 26 12 26 28S66 74 50 74 24 62 24 46 34 18 50 18Z" fill="#E8743B" />
      {/* muzzle */}
      <path d="M50 42c10 0 18 4 18 4-2 14-10 22-18 22s-16-8-18-22c0 0 8-4 18-4Z" fill="#FBF3EC" />
      <circle cx="50" cy="50" r="4" fill={STROKE} />
      <ellipse className="crew-mouth" cx="50" cy="60" rx="4" ry="2.5" fill="#7A2E1E" />
      <Eyes cx1={40} cx2={60} cy={38} />
    </svg>
  )
}

function Owl({ accent, accentDeep }: MascotSvgProps) {
  // Principal Hoot — mortarboard cap, gown, gold trim, dignified.
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* gown body */}
      <ellipse cx="40" cy="113" rx="7" ry="4" fill="#8C6D52" />
      <ellipse cx="60" cy="113" rx="7" ry="4" fill="#8C6D52" />
      <g className="crew-arm-l"><rect x="20" y="74" width="10" height="26" rx="5" fill="#8C6D52" /></g>
      <g className="crew-arm-r"><rect x="70" y="74" width="10" height="26" rx="5" fill="#8C6D52" /></g>
      <path d="M30 72c0-3 7-6 20-6s20 3 20 6l5 34c0 4-50 4-50 0z" fill="url(#g-owl)" />
      {/* gold robe trim (V-stole) */}
      <path d="M50 68l-9 38h4l5-30 5 30h4z" fill={HOOT_GOLD} opacity="0.95" />
      <defs>
        <linearGradient id="g-owl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>
      </defs>
      {/* ear tufts */}
      <path d="M32 22l-5-10 12 5z" fill="#8C6D52" />
      <path d="M68 22l5-10-12 5z" fill="#8C6D52" />
      {/* head */}
      <path d="M50 16c17 0 27 13 27 30S67 76 50 76 23 63 23 46 33 16 50 16Z" fill="#8C6D52" />
      {/* facial disc */}
      <path d="M50 32c12 0 19 8 19 20s-7 18-19 18-19-7-19-18 7-20 19-20Z" fill="#D8C3A5" />
      {/* distinguished round glasses */}
      <circle cx="40" cy="44" r="10" stroke={STROKE} strokeWidth="2.5" fill="#fff" />
      <circle cx="60" cy="44" r="10" stroke={STROKE} strokeWidth="2.5" fill="#fff" />
      <path d="M48 44h4" stroke={STROKE} strokeWidth="2.5" />
      <Eyes cx1={40} cx2={60} cy={44} r={3.2} />
      {/* beak + subtle smile */}
      <path d="M50 52l4 6h-8z" fill={HOOT_GOLD} />
      <path className="crew-mouth" d="M44 60q6 5 12 0" stroke="#7A5230" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* mortarboard cap */}
      <rect x="42" y="6" width="16" height="9" rx="2" fill="#241B4D" />
      <path d="M28 12l22-7 22 7-22 7z" fill="#2B2160" />
      <circle cx="50" cy="12" r="2.2" fill={HOOT_GOLD} />
      {/* gold tassel */}
      <path d="M50 12c10 1 14 3 14 8" stroke={HOOT_GOLD} strokeWidth="1.6" fill="none" />
      <rect x="62" y="19" width="4" height="8" rx="2" fill={HOOT_GOLD} />
    </svg>
  )
}

function Cat({ accent, accentDeep }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Body accent={accent} accentDeep={accentDeep} fur="#9AA3AD" gradId="g-cat" />
      {/* ears */}
      <path d="M28 22l-4-16 18 10z" fill="#9AA3AD" />
      <path d="M72 22l4-16-18 10z" fill="#9AA3AD" />
      <path d="M30 20l-2-9 10 6z" fill="#C9CFD6" />
      <path d="M70 20l2-9-10 6z" fill="#C9CFD6" />
      {/* head */}
      <path d="M50 16c16 0 26 12 26 28S66 74 50 74 24 60 24 44 34 16 50 16Z" fill="#9AA3AD" />
      {/* spectacles */}
      <rect x="30" y="36" width="16" height="11" rx="3" stroke={accentDeep} strokeWidth="3" fill="#fff" />
      <rect x="54" y="36" width="16" height="11" rx="3" stroke={accentDeep} strokeWidth="3" fill="#fff" />
      <path d="M46 41h8" stroke={accentDeep} strokeWidth="3" />
      <Eyes cx1={38} cx2={62} cy={42} r={2.8} />
      <path d="M50 52l3 4h-6z" fill={STROKE} />
      <path className="crew-mouth" d="M45 58q5 4 10 0" stroke="#5b6470" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 54l-12-2M40 58l-11 3M60 54l12-2M60 58l11 3" stroke="#C9CFD6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Beaver({ accent, accentDeep }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Body accent={accent} accentDeep={accentDeep} fur="#8B5E3C" gradId="g-beaver" />
      {/* ears */}
      <circle cx="28" cy="26" r="7" fill="#7A5230" />
      <circle cx="72" cy="26" r="7" fill="#7A5230" />
      {/* head */}
      <path d="M50 18c15 0 25 11 25 26S65 72 50 72 25 59 25 44 35 18 50 18Z" fill="#8B5E3C" />
      <ellipse cx="50" cy="50" rx="15" ry="12" fill="#C99B6E" />
      <rect x="46" y="52" width="8" height="11" rx="1.5" fill="#fff" stroke={STROKE} strokeWidth="1.2" />
      <path d="M50 52v11" stroke={STROKE} strokeWidth="1" />
      <ellipse cx="50" cy="46" rx="4" ry="3" fill={STROKE} />
      <Eyes cx1={40} cx2={60} cy={36} />
    </svg>
  )
}

function Dog({ accent, accentDeep }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Body accent={accent} accentDeep={accentDeep} fur="#E8B65A" gradId="g-dog" />
      {/* ears */}
      <path d="M26 32c-6 4-8 18-2 26 6-2 8-10 8-18z" fill="#C98E3F" />
      <path d="M74 32c6 4 8 18 2 26-6-2-8-10-8-18z" fill="#C98E3F" />
      {/* head */}
      <path d="M50 18c15 0 25 11 25 26S65 72 50 72 25 59 25 44 35 18 50 18Z" fill="#E8B65A" />
      <ellipse cx="50" cy="52" rx="14" ry="11" fill="#F6E2BC" />
      <Eyes cx1={41} cx2={59} cy={38} />
      <ellipse cx="50" cy="48" rx="5" ry="4" fill={STROKE} />
      <path className="crew-mouth" d="M50 52v6M50 58c-3 0-5-1-6-2M50 58c3 0 5-1 6-2" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Elephant({ accent, accentDeep }: MascotSvgProps) {
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Body accent={accent} accentDeep={accentDeep} fur="#AEC3CF" gradId="g-ele" />
      {/* ears */}
      <ellipse cx="26" cy="42" rx="14" ry="18" fill="#9FB6C4" />
      <ellipse cx="74" cy="42" rx="14" ry="18" fill="#9FB6C4" />
      <ellipse cx="28" cy="42" rx="8" ry="11" fill="#B9CDD8" />
      <ellipse cx="72" cy="42" rx="8" ry="11" fill="#B9CDD8" />
      {/* head */}
      <path d="M50 16c14 0 23 10 23 24S64 70 50 70 27 54 27 40 36 16 50 16Z" fill="#AEC3CF" />
      {/* trunk */}
      <path className="crew-mouth" d="M50 44c0 8-1 14 1 20 1 4 7 4 8 0" stroke="#AEC3CF" strokeWidth="9" strokeLinecap="round" fill="none" />
      <Eyes cx1={41} cx2={59} cy={36} />
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
