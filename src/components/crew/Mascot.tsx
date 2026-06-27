import { CREW, type CrewId } from '@/lib/crew'
import { MASCOTS } from './mascots'
import { cn } from '@/lib/utils'

interface MascotProps {
  who: CrewId
  /** pixel size of the square mascot */
  size?: number
  /** gentle idle bob; on by default */
  animate?: boolean
  /** draw a soft accent-tinted disc behind the character */
  halo?: boolean
  className?: string
}

/**
 * Renders a crew member. Illustration-agnostic slot: the SVG set lives in
 * mascots.tsx and can later be swapped for commissioned art / Lottie without
 * touching call sites.
 */
export default function Mascot({ who, size = 56, animate = true, halo = false, className }: MascotProps) {
  const member = CREW[who]
  const Svg = MASCOTS[who]

  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0', className)}
      style={halo ? { background: member.accentSoft, borderRadius: '9999px', padding: size * 0.16 } : undefined}
    >
      <span
        className={cn('block', animate && 'crew-bob')}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${member.name} the ${member.animal}`}
      >
        <Svg accent={member.accent} />
      </span>
    </span>
  )
}
