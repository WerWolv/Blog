import React, { useId, useMemo } from 'react'

type PencilMode = 'underline' | 'double-arc' | 'highlighter'

interface PencilMarkedProps {
  children: React.ReactNode
  color?: string
  strokeWidth?: number
  className?: string
  roughness?: number
  mode?: PencilMode
  /** Highlighter opacity in light mode (default 0.38) */
  opacityLight?: number
  /** Highlighter opacity in dark mode (default 0.18) */
  opacityDark?: number
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
  // The path is drawn in a 200×8 viewBox, scaled to fit the element via preserveAspectRatio=none.
  // Two slightly offset strokes give the pencil "grain" feeling.
  const jitter = () => (rng() - 0.5) * roughness * 3

  const steps = 12
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 200
    const y = jitter() - 2
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

// Smooth upward-bowing arc for the marker double-underline mode.
// The middle of the arc rises toward the text (−sin), ends sit lower.
// Jitter is intentionally tiny — markers leave clean lines.
function buildMarkerArc(rng: () => number, yBase: number, arcDepth: number): string {
  const jitter = () => (rng() - 0.5) * 0.2
  const steps = 16
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([t * 200, yBase - Math.sin(t * Math.PI) * arcDepth + jitter()])
  }
  let d = `M ${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const cpx1 = x0 + (x1 - x0) * 0.6,
      cpy1 = y0 + (y1 - y0) * 0.6
    const cpx2 = x1 - (x2 - x0) * 0.15,
      cpy2 = y1 - (y2 - y0) * 0.15
    d += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x1},${y1}`
  }
  d += ` L ${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`
  return d
}

// One sloppy filled band for the highlighter mode.
// Coordinates live in a 0-100 y viewBox mapped to the text's em-square.
function buildHighlighterBand(rng: () => number, yTop: number, yBot: number, xStart: number, xEnd: number): string {
  const jitter = (s: number) => (rng() - 0.5) * s
  const steps = 8
  const topPts: [number, number][] = []
  const botPts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = xStart + t * (xEnd - xStart)
    topPts.push([x + jitter(3), yTop + jitter(3)])
    botPts.push([x + jitter(3), yBot + jitter(3)])
  }
  let d = `M ${topPts[0][0]},${topPts[0][1]}`
  for (let i = 1; i < topPts.length; i++) d += ` L ${topPts[i][0]},${topPts[i][1]}`
  for (let i = botPts.length - 1; i >= 0; i--) d += ` L ${botPts[i][0]},${botPts[i][1]}`
  return d + ' Z'
}

export default function PencilMarked({
  children,
  color = 'currentColor',
  strokeWidth = 1.5,
  roughness = 0.75,
  mode = 'underline',
  className = '',
  opacityLight = 0.38,
  opacityDark = 0.18,
}: PencilMarkedProps) {
  const id = useId()
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_')

  const paths = useMemo(() => {
    const r = seededRng(safeId)
    const underlineMain = buildPencilPath(r, roughness)
    const underlineGrain = buildPencilPath(r, roughness * 0.6)

    const r2 = seededRng(safeId + '_arc')
    const arc1 = buildMarkerArc(r2, 9, 2.5)
    const arc2 = buildMarkerArc(r2, 13, 2.5)

    const r3 = seededRng(safeId + '_hl')
    // Two horizontal passes — first stroke slightly higher, second slightly lower.
    // xStart/xEnd slightly overshoot the text edges for a sloppy marker feel.
    const hlBand1 = buildHighlighterBand(r3, -60, 40, 5, 202)
    const hlBand2 = buildHighlighterBand(r3, -30, 70, 2, 207)

    return { underlineMain, underlineGrain, arc1, arc2, hlBand1, hlBand2 }
  }, [safeId, roughness])

  const gap = strokeWidth + 2
  const filterId = `pencil-grain-${safeId}`
  const pencilFilter = (
    <defs>
      <filter id={filterId} x="-5%" y="-50%" width="110%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={roughness * 1.2} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  )

  if (mode === 'highlighter') {
    const hlClass = `pm-hl-${safeId}`
    return (
      <span
        className={`${className} ${hlClass}`}
        style={{ display: 'inline-block', position: 'relative', whiteSpace: 'nowrap', isolation: 'isolate' }}
      >
        <style>
          {[
            `.${hlClass} .pm-hl-1 { opacity: ${opacityLight}; }`,
            `.${hlClass} .pm-hl-2 { opacity: ${opacityLight * 0.8}; }`,
            `.dark .${hlClass} .pm-hl-1 { opacity: ${opacityDark}; }`,
            `.dark .${hlClass} .pm-hl-2 { opacity: ${opacityDark * 0.8}; }`,
          ].join('\n')}
        </style>
        {/* SVG sits behind the text via zIndex -1 inside the isolation context */}
        <svg
          aria-hidden="true"
          focusable="false"
          style={{
            position: 'absolute',
            left: '-4px',
            bottom: '0.1em',
            width: 'calc(100% + 8px)',
            height: '0.82em',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: -1,
          }}
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
        >
          <path className="pm-hl-1" d={paths.hlBand1} fill={color} />
          <path className="pm-hl-2" d={paths.hlBand2} fill={color} />
        </svg>
        {children}
      </span>
    )
  }

  if (mode === 'double-arc') {
    return (
      <span className={className} style={{ display: 'inline-block', position: 'relative', whiteSpace: 'nowrap' }}>
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
          viewBox="0 0 200 16"
          preserveAspectRatio="none"
          height={16}
        >
          <path
            d={paths.arc1}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
          <path
            d={paths.arc2}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </svg>
      </span>
    )
  }

  // Default: underline
  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', whiteSpace: 'nowrap' }}>
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
        {pencilFilter}
        {/* Faint secondary stroke for pencil grain */}
        <path
          d={paths.underlineGrain}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 0.4}
          strokeLinecap="round"
          opacity={0.25}
          filter={`url(#${filterId})`}
          transform="translate(0.5, 0.8)"
        />
        {/* Main stroke */}
        <path
          d={paths.underlineMain}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.88}
          filter={`url(#${filterId})`}
        />
      </svg>
    </span>
  )
}
