// Full-body mascot set — restyled for depth and a serious, focused demeanor.
// Each head/body uses a top-light → bottom-dark gradient for volume, a soft
// specular highlight, a darker rim for separation, lowered "focused" brows, and
// a neutral mouth (no cartoon smiles). Animatable parts keep their class hooks
// so the Mascot wrapper can still drive poses:
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

// Per-character fur palette: [light, mid, dark]. Light up top, dark at the base.
const FUR: Record<CrewId, [string, string, string]> = {
  fox: ['#F2925F', '#E8743B', '#C2541F'],
  owl: ['#A6886C', '#8C6D52', '#67503A'],
  cat: ['#B7BEC6', '#9AA3AD', '#727B85'],
  beaver: ['#A2734E', '#8B5E3C', '#67462C'],
  dog: ['#F2CC82', '#E8B65A', '#C28E36'],
  elephant: ['#C4D4DE', '#AEC3CF', '#8AA1AF'],
}

// Realistic eyes: a dark iris with a small specular catchlight for life.
function Eyes({ cx1, cx2, cy, r = 3.1 }: { cx1: number; cx2: number; cy: number; r?: number }) {
  return (
    <>
      {[cx1, cx2].map((cx, i) => (
        <g className="crew-eye" key={i}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r + 0.6} fill={STROKE} />
          <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.34} fill="#fff" opacity="0.92" />
        </g>
      ))}
    </>
  )
}

// Lowered, slightly inward brows — reads as focused / serious rather than happy.
function Brows({ cx1, cx2, cy }: { cx1: number; cx2: number; cy: number }) {
  const by = cy - 8
  return (
    <>
      <path d={`M${cx1 - 7} ${by} L${cx1 + 6} ${by + 3.2}`} stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${cx2 + 7} ${by} L${cx2 - 6} ${by + 3.2}`} stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
}

// Shared gradient + highlight defs for one character's head and body.
function Defs({ id, fur, accent, accentDeep }: { id: string; fur: [string, string, string]; accent: string; accentDeep: string }) {
  return (
    <defs>
      <linearGradient id={`head-${id}`} x1="0.25" y1="0" x2="0.75" y2="1">
        <stop offset="0" stopColor={fur[0]} />
        <stop offset="0.55" stopColor={fur[1]} />
        <stop offset="1" stopColor={fur[2]} />
      </linearGradient>
      <linearGradient id={`body-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={accent} />
        <stop offset="1" stopColor={accentDeep} />
      </linearGradient>
      <radialGradient id={`shine-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

// Shared body: feet + arms (fur dark) + clothing torso (accent gradient).
function Body({ id, furDark }: { id: string; furDark: string }) {
  return (
    <>
      <ellipse cx="40" cy="113" rx="7" ry="4" fill={furDark} />
      <ellipse cx="60" cy="113" rx="7" ry="4" fill={furDark} />
      <g className="crew-arm-l"><rect x="20" y="74" width="10" height="26" rx="5" fill={furDark} /></g>
      <g className="crew-arm-r"><rect x="70" y="74" width="10" height="26" rx="5" fill={furDark} /></g>
      <path d="M32 72c0-3 5-6 18-6s18 3 18 6l4 34c0 4-44 4-44 0z" fill={`url(#body-${id})`} />
    </>
  )
}

function Fox({ accent, accentDeep }: MascotSvgProps) {
  const fur = FUR.fox
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="fox" fur={fur} accent={accent} accentDeep={accentDeep} />
      <Body id="fox" furDark={fur[2]} />
      {/* ears */}
      <path d="M26 22l8 22-20-6z" fill={fur[2]} />
      <path d="M74 22l-8 22 20-6z" fill={fur[2]} />
      <path d="M28 26l5 14-11-4z" fill="#FBE3D2" />
      <path d="M72 26l-5 14 11-4z" fill="#FBE3D2" />
      {/* head */}
      <path d="M50 18c16 0 26 12 26 28S66 74 50 74 24 62 24 46 34 18 50 18Z" fill={`url(#head-fox)`} />
      <path d="M50 18c16 0 26 12 26 28S66 74 50 74 24 62 24 46 34 18 50 18Z" fill="none" stroke={fur[2]} strokeWidth="1" opacity="0.5" />
      <ellipse cx="42" cy="34" rx="14" ry="12" fill="url(#shine-fox)" />
      {/* muzzle */}
      <path d="M50 42c10 0 18 4 18 4-2 14-10 22-18 22s-16-8-18-22c0 0 8-4 18-4Z" fill="#FBF3EC" />
      <circle cx="50" cy="50" r="4" fill={STROKE} />
      <line className="crew-mouth" x1="46" y1="60" x2="54" y2="60" stroke="#7A2E1E" strokeWidth="2.4" strokeLinecap="round" />
      <Eyes cx1={40} cx2={60} cy={38} />
      <Brows cx1={40} cx2={60} cy={38} />
    </svg>
  )
}

function Owl({ accent, accentDeep }: MascotSvgProps) {
  // Principal Hoot — mortarboard cap, gown, gold trim, stern and dignified.
  const fur = FUR.owl
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="owl" fur={fur} accent={accent} accentDeep={accentDeep} />
      {/* gown body */}
      <ellipse cx="40" cy="113" rx="7" ry="4" fill={fur[2]} />
      <ellipse cx="60" cy="113" rx="7" ry="4" fill={fur[2]} />
      <g className="crew-arm-l"><rect x="20" y="74" width="10" height="26" rx="5" fill={fur[2]} /></g>
      <g className="crew-arm-r"><rect x="70" y="74" width="10" height="26" rx="5" fill={fur[2]} /></g>
      <path d="M30 72c0-3 7-6 20-6s20 3 20 6l5 34c0 4-50 4-50 0z" fill="url(#body-owl)" />
      <path d="M50 68l-9 38h4l5-30 5 30h4z" fill={HOOT_GOLD} opacity="0.95" />
      {/* ear tufts */}
      <path d="M32 22l-5-10 12 5z" fill={fur[2]} />
      <path d="M68 22l5-10-12 5z" fill={fur[2]} />
      {/* head */}
      <path d="M50 16c17 0 27 13 27 30S67 76 50 76 23 63 23 46 33 16 50 16Z" fill="url(#head-owl)" />
      <ellipse cx="42" cy="32" rx="15" ry="13" fill="url(#shine-owl)" />
      {/* facial disc */}
      <path d="M50 32c12 0 19 8 19 20s-7 18-19 18-19-7-19-18 7-20 19-20Z" fill="#D8C3A5" />
      {/* distinguished round glasses */}
      <circle cx="40" cy="44" r="10" stroke={STROKE} strokeWidth="2.5" fill="#fff" fillOpacity="0.55" />
      <circle cx="60" cy="44" r="10" stroke={STROKE} strokeWidth="2.5" fill="#fff" fillOpacity="0.55" />
      <path d="M48 44h4" stroke={STROKE} strokeWidth="2.5" />
      <Eyes cx1={40} cx2={60} cy={44} r={3.2} />
      <Brows cx1={40} cx2={60} cy={42} />
      {/* beak + neutral set mouth */}
      <path d="M50 52l4 6h-8z" fill={HOOT_GOLD} />
      <line className="crew-mouth" x1="45" y1="62" x2="55" y2="62" stroke="#7A5230" strokeWidth="2" strokeLinecap="round" />
      {/* mortarboard cap */}
      <rect x="42" y="6" width="16" height="9" rx="2" fill="#241B4D" />
      <path d="M28 12l22-7 22 7-22 7z" fill="#2B2160" />
      <circle cx="50" cy="12" r="2.2" fill={HOOT_GOLD} />
      <path d="M50 12c10 1 14 3 14 8" stroke={HOOT_GOLD} strokeWidth="1.6" fill="none" />
      <rect x="62" y="19" width="4" height="8" rx="2" fill={HOOT_GOLD} />
    </svg>
  )
}

function Cat({ accent, accentDeep }: MascotSvgProps) {
  const fur = FUR.cat
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="cat" fur={fur} accent={accent} accentDeep={accentDeep} />
      <Body id="cat" furDark={fur[2]} />
      {/* ears */}
      <path d="M28 22l-4-16 18 10z" fill={fur[2]} />
      <path d="M72 22l4-16-18 10z" fill={fur[2]} />
      <path d="M30 20l-2-9 10 6z" fill="#C9CFD6" />
      <path d="M70 20l2-9-10 6z" fill="#C9CFD6" />
      {/* head */}
      <path d="M50 16c16 0 26 12 26 28S66 74 50 74 24 60 24 44 34 16 50 16Z" fill="url(#head-cat)" />
      <ellipse cx="42" cy="32" rx="14" ry="12" fill="url(#shine-cat)" />
      {/* spectacles */}
      <rect x="30" y="36" width="16" height="11" rx="3" stroke={accentDeep} strokeWidth="3" fill="#fff" fillOpacity="0.5" />
      <rect x="54" y="36" width="16" height="11" rx="3" stroke={accentDeep} strokeWidth="3" fill="#fff" fillOpacity="0.5" />
      <path d="M46 41h8" stroke={accentDeep} strokeWidth="3" />
      <Eyes cx1={38} cx2={62} cy={42} r={2.9} />
      <Brows cx1={38} cx2={62} cy={39} />
      <path d="M50 52l3 4h-6z" fill={STROKE} />
      <line className="crew-mouth" x1="46" y1="59" x2="54" y2="59" stroke="#5b6470" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 54l-12-2M40 58l-11 3M60 54l12-2M60 58l11 3" stroke="#C9CFD6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Beaver({ accent, accentDeep }: MascotSvgProps) {
  const fur = FUR.beaver
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="beaver" fur={fur} accent={accent} accentDeep={accentDeep} />
      <Body id="beaver" furDark={fur[2]} />
      {/* ears */}
      <circle cx="28" cy="26" r="7" fill={fur[2]} />
      <circle cx="72" cy="26" r="7" fill={fur[2]} />
      {/* head */}
      <path d="M50 18c15 0 25 11 25 26S65 72 50 72 25 59 25 44 35 18 50 18Z" fill="url(#head-beaver)" />
      <ellipse cx="42" cy="33" rx="13" ry="11" fill="url(#shine-beaver)" />
      <ellipse cx="50" cy="50" rx="15" ry="12" fill="#C99B6E" />
      <rect x="46" y="52" width="8" height="11" rx="1.5" fill="#fff" stroke={STROKE} strokeWidth="1.2" />
      <path d="M50 52v11" stroke={STROKE} strokeWidth="1" />
      <ellipse cx="50" cy="46" rx="4" ry="3" fill={STROKE} />
      <Eyes cx1={40} cx2={60} cy={36} />
      <Brows cx1={40} cx2={60} cy={36} />
    </svg>
  )
}

function Dog({ accent, accentDeep }: MascotSvgProps) {
  const fur = FUR.dog
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="dog" fur={fur} accent={accent} accentDeep={accentDeep} />
      <Body id="dog" furDark={fur[2]} />
      {/* ears */}
      <path d="M26 32c-6 4-8 18-2 26 6-2 8-10 8-18z" fill={fur[2]} />
      <path d="M74 32c6 4 8 18 2 26-6-2-8-10-8-18z" fill={fur[2]} />
      {/* head */}
      <path d="M50 18c15 0 25 11 25 26S65 72 50 72 25 59 25 44 35 18 50 18Z" fill="url(#head-dog)" />
      <ellipse cx="42" cy="33" rx="13" ry="11" fill="url(#shine-dog)" />
      <ellipse cx="50" cy="52" rx="14" ry="11" fill="#F6E2BC" />
      <Eyes cx1={41} cx2={59} cy={38} />
      <Brows cx1={41} cx2={59} cy={38} />
      <ellipse cx="50" cy="48" rx="5" ry="4" fill={STROKE} />
      <path className="crew-mouth" d="M50 52v6M44 58h12" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Elephant({ accent, accentDeep }: MascotSvgProps) {
  const fur = FUR.elephant
  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs id="ele" fur={fur} accent={accent} accentDeep={accentDeep} />
      <Body id="ele" furDark={fur[2]} />
      {/* ears */}
      <ellipse cx="26" cy="42" rx="14" ry="18" fill={fur[2]} />
      <ellipse cx="74" cy="42" rx="14" ry="18" fill={fur[2]} />
      <ellipse cx="28" cy="42" rx="8" ry="11" fill="#B9CDD8" />
      <ellipse cx="72" cy="42" rx="8" ry="11" fill="#B9CDD8" />
      {/* head */}
      <path d="M50 16c14 0 23 10 23 24S64 70 50 70 27 54 27 40 36 16 50 16Z" fill="url(#head-ele)" />
      <ellipse cx="42" cy="30" rx="13" ry="11" fill="url(#shine-ele)" />
      {/* trunk */}
      <path className="crew-mouth" d="M50 44c0 8-1 14 1 20 1 4 7 4 8 0" stroke={fur[1]} strokeWidth="9" strokeLinecap="round" fill="none" />
      <Eyes cx1={41} cx2={59} cy={36} />
      <Brows cx1={41} cx2={59} cy={36} />
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
