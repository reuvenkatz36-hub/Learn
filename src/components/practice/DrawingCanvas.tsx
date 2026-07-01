'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { useLang } from '@/lib/useLang'

const COLORS = ['#1C1B1A', '#E8472F', '#4F46E5', '#22B07D', '#F5A524']

interface Props {
  /** Called with a PNG data URL whenever the drawing changes (throttled to stroke end). */
  onChange: (dataUrl: string | null) => void
  accent: string
}

// Pointer-events canvas: works with mouse, touch and stylus alike.
export default function DrawingCanvas({ onChange, accent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [color, setColor] = useState(COLORS[0])
  const colorRef = useRef(color)
  colorRef.current = color
  const history = useRef<ImageData[]>([])
  const [hasInk, setHasInk] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Size the bitmap to the displayed size × devicePixelRatio for crisp lines.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const ctx = canvas.getContext('2d')!
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (history.current.length > 20) history.current.shift()
    drawing.current = true
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = colorRef.current
    ctx.lineWidth = e.pointerType === 'pen' ? Math.max(1.5, e.pressure * 5) : 3
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    setHasInk(true)
    onChange(canvasRef.current?.toDataURL('image/png') ?? null)
  }, [onChange])

  const undo = () => {
    const canvas = canvasRef.current
    const prev = history.current.pop()
    if (!canvas || !prev) return
    canvas.getContext('2d')!.putImageData(prev, 0, 0)
    const empty = history.current.length === 0
    setHasInk(!empty)
    onChange(empty ? null : canvas.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    history.current = []
    setHasInk(false)
    onChange(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2" dir="ltr">
        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
              className="w-6 h-6 rounded-full border-2 transition-transform"
              style={{ background: c, borderColor: color === c ? accent : 'transparent', transform: color === c ? 'scale(1.15)' : 'scale(1)' }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!hasInk} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-ink hover:bg-paper disabled:opacity-30 transition-colors" aria-label="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={clear} disabled={!hasInk} className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink hover:bg-paper disabled:opacity-30 transition-colors">
            <Eraser className="w-3.5 h-3.5" /> {t('practice.clear')}
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="w-full h-72 bg-white border border-line rounded-2xl touch-none cursor-crosshair"
      />
    </div>
  )
}
