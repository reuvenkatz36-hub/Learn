// Client-side certificate renderer. Draws a festive, share-ready image on a
// canvas — square (feed/WhatsApp) and vertical story variants — with Zendric
// branding, in the current UI language (RTL-aware via canvas direction).
import type { Lang } from '@/lib/i18n'

export interface CertificateData {
  userName: string
  courseTitle: string
  lessons: number
  difficulty: string
  date: string
  lang: Lang
}

const PALETTE = {
  bgTop: '#312E81',
  bgMid: '#4F46E5',
  bgBot: '#7C3AED',
  gold: '#FBBF24',
  white: '#FFFFFF',
}

const HE = {
  congrats: 'כל הכבוד!',
  completed: 'סיים/ה בהצלחה את הקורס',
  lessons: 'שיעורים',
  brand: 'Zendric',
  tagline: 'zendric — למידה עם AI',
}
const EN = {
  congrats: 'Congratulations!',
  completed: 'completed the course',
  lessons: 'lessons',
  brand: 'Zendric',
  tagline: 'zendric — AI-powered learning',
}

function confettiDots(ctx: CanvasRenderingContext2D, w: number, h: number, seedCount: number) {
  const colors = ['#FBBF24', '#F472B6', '#34D399', '#60A5FA', '#FB923C', '#FFFFFF']
  for (let i = 0; i < seedCount; i++) {
    // deterministic-ish scatter
    const x = ((i * 733) % 1000) / 1000 * w
    const y = ((i * 389) % 1000) / 1000 * h
    const r = 3 + ((i * 97) % 5)
    ctx.globalAlpha = 0.25 + ((i * 31) % 40) / 100
    ctx.fillStyle = colors[i % colors.length]
    ctx.beginPath()
    if (i % 3 === 0) {
      ctx.rect(x, y, r * 1.6, r * 0.7)
      ctx.fill()
    } else {
      ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, basePx: number, family: string, weight = 'bold') {
  let px = basePx
  do {
    ctx.font = `${weight} ${px}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    px -= 2
  } while (px > 18)
  return px
}

export function renderCertificate(data: CertificateData, variant: 'square' | 'story'): string {
  const w = variant === 'square' ? 1080 : 1080
  const h = variant === 'square' ? 1080 : 1920
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const isHe = data.lang === 'he'
  const S = isHe ? HE : EN
  const sans = isHe ? "'Noto Sans Hebrew', Arial, sans-serif" : "Inter, Arial, sans-serif"

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, w * 0.4, h)
  grad.addColorStop(0, PALETTE.bgTop)
  grad.addColorStop(0.55, PALETTE.bgMid)
  grad.addColorStop(1, PALETTE.bgBot)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Glow behind center
  const cy = variant === 'square' ? h * 0.42 : h * 0.4
  const glow = ctx.createRadialGradient(w / 2, cy, 40, w / 2, cy, w * 0.65)
  glow.addColorStop(0, 'rgba(255,255,255,0.22)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  confettiDots(ctx, w, h, variant === 'square' ? 70 : 110)

  ctx.textAlign = 'center'
  ctx.direction = isHe ? 'rtl' : 'ltr'

  // Medal
  const medalY = variant === 'square' ? 200 : 340
  ctx.font = `${variant === 'square' ? 130 : 160}px serif`
  ctx.fillText('🏅', w / 2, medalY)

  // Congrats
  ctx.fillStyle = PALETTE.gold
  ctx.font = `800 ${variant === 'square' ? 64 : 76}px ${sans}`
  ctx.fillText(S.congrats, w / 2, medalY + (variant === 'square' ? 110 : 140))

  // User name
  ctx.fillStyle = PALETTE.white
  const nameY = medalY + (variant === 'square' ? 210 : 280)
  const namePx = fitFont(ctx, data.userName, w * 0.85, variant === 'square' ? 76 : 88, sans, '800')
  ctx.font = `800 ${namePx}px ${sans}`
  ctx.fillText(data.userName, w / 2, nameY)

  // "completed the course"
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `500 ${variant === 'square' ? 36 : 44}px ${sans}`
  ctx.fillText(S.completed, w / 2, nameY + (variant === 'square' ? 70 : 90))

  // Course title
  ctx.fillStyle = PALETTE.white
  const titleY = nameY + (variant === 'square' ? 160 : 210)
  const titlePx = fitFont(ctx, `“${data.courseTitle}”`, w * 0.88, variant === 'square' ? 54 : 62, sans, '700')
  ctx.font = `700 ${titlePx}px ${sans}`
  ctx.fillText(`“${data.courseTitle}”`, w / 2, titleY)

  // Meta line: lessons · difficulty · date
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = `500 ${variant === 'square' ? 30 : 36}px ${sans}`
  const meta = `${data.lessons} ${S.lessons} · ${data.difficulty} · ${data.date}`
  ctx.fillText(meta, w / 2, titleY + (variant === 'square' ? 70 : 90))

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  const divY = variant === 'square' ? h - 200 : h - 320
  ctx.beginPath()
  ctx.moveTo(w * 0.3, divY)
  ctx.lineTo(w * 0.7, divY)
  ctx.stroke()

  // Brand
  ctx.fillStyle = PALETTE.white
  ctx.font = `800 ${variant === 'square' ? 56 : 64}px Inter, Arial, sans-serif`
  ctx.direction = 'ltr'
  ctx.fillText('⚡ Zendric', w / 2, divY + (variant === 'square' ? 80 : 100))
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `500 ${variant === 'square' ? 26 : 30}px Inter, Arial, sans-serif`
  ctx.fillText('zendric.app', w / 2, divY + (variant === 'square' ? 130 : 160))

  return canvas.toDataURL('image/png')
}
