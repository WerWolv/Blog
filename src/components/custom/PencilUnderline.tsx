import React, { useId, useMemo } from 'react'

interface PencilUnderlineProps {
  children: React.ReactNode
  color?: string
  strokeWidth?: number
  className?: string
  roughness?: number
}

function seededRng(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return () => {
    h ^= h << 13
    h ^= h >> 17
    h ^= h << 5
    return (h >>> 0) / 0xffffffff
  }
}

function buildPencilPath(rng: () => number, roughness: number): string {
  // The path is drawn in a 200×6 viewBox, scaled to fit the element via preserveAspectRatio=none.
  // Two slightly offset strokes give the pencil "grain" feeling.
  const jitter = () => (rng() - 0.5) * roughness * 3

  // Main stroke: a series of short line segments that drift up and down slightly.
  const steps = 12
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 200
    const y = 3 + jitter()
    points.push([x, y])
  }

  // Build path as a polyline with cubic bezier smoothing
  let d = `M ${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const cpx1 = x0 + (x1 - x0) * 0.6
    const cpy1 = y0 + (y1 - y0) * 0.6
    const cpx2 = x1 - (x2 - x0) * 0.15
    const cpy2 = y1 - (y2 - y0) * 0.15
    d += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x1},${y1}`
  }
  const last = points[points.length - 1]
  d += ` L ${last[0]},${last[1]}`

  return d
}

export default function PencilUnderline({
  children,
  color = 'currentColor',
  strokeWidth = 1.5,
  roughness = 0.75,
  className = '',
}: PencilUnderlineProps) {
  const id = useId()
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_')

  const rng = useMemo(() => seededRng(safeId), [safeId])

  const mainPath = useMemo(() => buildPencilPath(rng, roughness), [rng, roughness])
  const grainPath = useMemo(() => buildPencilPath(rng, roughness * 0.6), [rng, roughness])

  const gap = strokeWidth + 2

  return (
    <span className={className} style={{ display: 'inline', position: 'relative', whiteSpace: 'nowrap' }}>
      {children}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{
          position: 'absolute',
          left: 0,
          bottom: -gap,
          width: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        height={8}
      >
        <defs>
          <filter id={`pencil-grain-${safeId}`} x="-5%" y="-50%" width="110%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={roughness * 1.2} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Faint secondary stroke for pencil grain */}
        <path
          d={grainPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 0.4}
          strokeLinecap="round"
          opacity={0.25}
          filter={`url(#pencil-grain-${safeId})`}
          transform="translate(0.5, 0.8)"
        />

        {/* Main stroke */}
        <path
          d={mainPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.88}
          filter={`url(#pencil-grain-${safeId})`}
        />
      </svg>
    </span>
  )
}
