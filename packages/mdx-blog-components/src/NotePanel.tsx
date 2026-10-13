import { useId, type CSSProperties } from 'react'
import { Bomb, CircleArrowOutUpLeft, CircleCheckBig, Clock, Info, Lightbulb, TriangleAlert, type LucideIcon } from 'lucide-react'

type NotePanelType = 'info' | 'note' | 'hint' | 'alert' | 'idea' | 'boom' | 'time' | 'link'

interface NotePanelProps {
  title: string
  type: NotePanelType
  children: React.ReactNode
  id?: string
}

const CircleRadius = 25
const IconGap = 4
const BorderWidth = 3
const WarningNotchPath = 'M17.552 1.5 L20.511 6.625 A9.25 9.25 0 0 1 12.5 20.5 H6 Q1.5 20.5 1.5 25 V27.5'

interface IconCircle {
  centerX: number
  centerY: number
  radius: number
  strokeWidth: number
}

function circularNotch(circle: IconCircle) {
  // Offset the visible icon outline, accounting for both strokes to leave the same gap as the warning.
  const radius = circle.radius + circle.strokeWidth / 2 + IconGap + BorderWidth / 2
  const capY = BorderWidth / 2
  const capX = circle.centerX + Math.sqrt(radius ** 2 - (capY - circle.centerY) ** 2)
  const joinX = Math.max(6, circle.centerX + 0.5)
  const arcHeight = Math.sqrt(radius ** 2 - (joinX - circle.centerX) ** 2)
  const joinY = circle.centerY + arcHeight
  const borderX = BorderWidth / 2
  const controlY = joinY + ((joinX - borderX) * (joinX - circle.centerX)) / arcHeight
  const value = (number: number) => Number(number.toFixed(3))
  return {
    capX: value(capX),
    path: `M${value(capX)} ${capY} A${value(radius)} ${value(radius)} 0 0 1 ${value(joinX)} ${value(joinY)} Q${borderX} ${value(controlY)} ${borderX} ${value(controlY + 4.5)} V${value(controlY + 7)}`,
  }
}

interface NotePanelStyle {
  backgroundColor: { dark: string; light: string }
  borderColor: { dark: string; light: string }
  icon: LucideIcon
  transform?: string
  /** Main icon contour in panel coordinates, after the existing icon transform. */
  circle?: IconCircle
}

const Types: Record<Exclude<NotePanelType, 'note'>, NotePanelStyle> = {
  ['info']: {
    backgroundColor: {
      dark: '#152032',
      light: '#f0f5fc',
    },
    borderColor: {
      dark: '#60a5fa',
      light: '#2563eb',
    },
    icon: Info,
  },
  ['hint']: {
    backgroundColor: {
      dark: '#15271f',
      light: '#eff8f3',
    },
    borderColor: {
      dark: '#4ade80',
      light: '#16734c',
    },
    icon: CircleCheckBig,
  },
  ['alert']: {
    backgroundColor: {
      dark: '#2c2416',
      light: '#fff8eb',
    },
    borderColor: {
      dark: '#fbbf24',
      light: '#b45309',
    },
    icon: TriangleAlert,
  },
  ['idea']: {
    backgroundColor: {
      dark: '#282617',
      light: '#faf8ed',
    },
    borderColor: {
      dark: '#e5c45b',
      light: '#8c6a12',
    },
    icon: Lightbulb,
    transform: 'rotate(0.15turn) scale(1.25) translate(0, 4px)',
    circle: { centerX: 3.511, centerY: 1.765, radius: 9.375, strokeWidth: 2.5 },
  },
  ['boom']: {
    backgroundColor: {
      dark: '#301b20',
      light: '#fff1f2',
    },
    borderColor: {
      dark: '#fb7185',
      light: '#b42332',
    },
    icon: Bomb,
    transform: 'translate(5px, 0)',
    circle: { centerX: 6.25, centerY: 3.75, radius: 11.25, strokeWidth: 2.5 },
  },
  ['time']: {
    backgroundColor: {
      dark: '#201e30',
      light: '#f3f4fa',
    },
    borderColor: {
      dark: '#a78bfa',
      light: '#6d5ac5',
    },
    icon: Clock,
  },
  ['link']: {
    backgroundColor: {
      dark: '#152630',
      light: '#eff7fb',
    },
    borderColor: {
      dark: '#7dd3fc',
      light: '#0369a1',
    },
    icon: CircleArrowOutUpLeft,
  },
}

export default function NotePanel({ title, type, children, id }: NotePanelProps) {
  const instanceId = useId()
  if (type === 'note') type = 'info'

  const config = Types[type]
  if (!config) {
    throw new Error(`Invalid NotePanel type: ${type}`)
  }

  const scopeId = `note-panel-${type}-${id ?? instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const isWarning = type === 'alert'
  const Icon = config.icon
  const notch = isWarning
    ? { path: WarningNotchPath, capX: 17.552 }
    : circularNotch(config.circle ?? { centerX: 2.5, centerY: 2.5, radius: 12.5, strokeWidth: 2.5 })
  return (
    <div
      id={scopeId}
      className="mdx-note-panel"
      style={
        {
          'position': 'relative',
          'margin': '2em 1em 2em 1em',
          '--note-light-bg': config.backgroundColor.light,
          '--note-dark-bg': config.backgroundColor.dark,
          '--note-light-accent': config.borderColor.light,
          '--note-dark-accent': config.borderColor.dark,
        } as CSSProperties
      }
    >
      <style>{`
        .mdx-note-panel {
          --bg-color: var(--note-light-bg);
          --border-color: var(--note-light-accent);
        }
        .dark .mdx-note-panel {
          --bg-color: var(--note-dark-bg);
          --border-color: var(--note-dark-accent);
        }
        .mdx-note-panel .note-panel-content > :first-child {
          margin-block-start: 0;
        }
        .mdx-note-panel .note-panel-content > :last-child {
          margin-block-end: 0;
        }
        .mdx-note-panel .note-panel-content :is(p, ul, ol, pre, blockquote) {
          margin-block: 0.75em;
        }
        .mdx-note-panel .note-panel-content a {
          color: var(--border-color);
          text-underline-offset: 0.2em;
        }
      `}</style>
      <svg aria-hidden="true" style={{ zIndex: 1, position: 'absolute', overflow: 'visible', pointerEvents: 'none' }}>
        <svg width={32} height={36} viewBox="0 0 32 36" fill="none" style={{ overflow: 'visible' }}>
          <path d={notch.path} stroke="var(--border-color)" strokeWidth={BorderWidth} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </svg>
      <span
        aria-hidden="true"
        style={{
          zIndex: 1,
          position: 'absolute',
          display: 'inline-block',
          width: '1em',
          height: '1em',
          overflow: 'visible',
          pointerEvents: 'none',
          fontSize: `${CircleRadius + 5}px`,
          transform: `translate(${-CircleRadius / 2}px, -${CircleRadius / 2}px) ${config.transform || ''}`,
          color: 'var(--border-color)',
        }}
      >
        <Icon width="100%" height="100%" strokeWidth={type === 'idea' ? 2 / 1.25 : 2} style={{ display: 'block' }} />
      </span>
      <div
        style={{
          backgroundColor: 'var(--bg-color)',
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 18px 16px 34px',
          border: '1px solid color-mix(in srgb, var(--border-color) 20%, transparent)',
          clipPath: `path(evenodd, "M -10,-10 H2000 V2000 H0 Z ${notch.path} H-10 V-10 H${notch.capX} Z")`,
          borderLeft: `${BorderWidth}px solid var(--border-color)`,
        }}
      >
        <h4
          style={{
            margin: '0 0 10px',
            paddingBottom: 10,
            borderBottom: '1px solid color-mix(in srgb, var(--border-color) 18%, transparent)',
            color: 'var(--border-color)',
            fontSize: '1em',
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {title}
        </h4>
        <div className="note-panel-content" style={{ fontSize: '0.9375em', lineHeight: 1.7, overflowWrap: 'break-word' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
