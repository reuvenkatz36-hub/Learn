import { CREW, type CrewId } from '@/lib/crew'
import { MASCOTS } from './mascots'
import { cn } from '@/lib/utils'

export type MascotPose = 'idle' | 'wave' | 'talk' | 'think' | 'cheer' | 'sad'

interface MascotProps {
  who: CrewId
  /** pixel size of the square mascot */
  size?: number
  /** gentle idle bob; on by default */
  animate?: boolean
  /** reaction pose layered on top of idle */
  pose?: MascotPose
  /** draw a soft accent-tinted disc behind the character */
  halo?: boolean
  /** stronger radial "aura" glow (used for Principal Hoot) */
  aura?: boolean
  className?: string
}

/**
 * Renders a crew member. Illustration-agnostic slot: the full-body SVG set
 * lives in mascots.tsx and exposes animatable parts (.crew-arm-r, .crew-mouth,
 * .crew-eye) that the `pose` class drives via keyframes in globals.css.
 */
export default function Mascot({
  who,
  size = 56,
  animate = true,
  pose = 'idle',
  halo = false,
  aura = false,
  className,
}: MascotProps) {
  const member = CREW[who]
  const Svg = MASCOTS[who]
  // figures are 100x120 — keep aspect ratio
  const h = size * 1.2

  const wrapStyle = aura
    ? { background: `radial-gradient(circle at 50% 45%, ${member.accentSoft}, transparent 70%)`, padding: size * 0.22 }
    : halo
      ? { background: member.accentSoft, borderRadius: '9999px', padding: size * 0.16 }
      : undefined

  return (
    <span className={cn('inline-flex items-center justify-center shrink-0', className)} style={wrapStyle}>
      <span
        className={cn('block', animate && 'crew-bob', `crew-pose-${pose}`)}
        style={{ width: size, height: h }}
        role="img"
        aria-label={`${member.name} the ${member.animal}`}
      >
        <Svg accent={member.accent} accentDeep={member.accentDeep} />
      </span>
    </span>
  )
}
