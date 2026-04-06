interface NotePanelProps {
  title: string
  type: 'info|hint|alert'
  children: React.ReactNode
  id?: string
}

const CircleRadius = 25

const Types: any = {
  ['info']: {
    backgroundColor: {
      dark: '#172436',
      light: '#e8f1fc',
    },
    borderColor: {
      dark: '#3366ff',
      light: '#4433ff',
    },
    icon: 'icon-[lucide--info]',
  },
  ['hint']: {
    backgroundColor: {
      dark: '#112221',
      light: '#ecf8f4',
    },
    borderColor: {
      dark: '#00cc88',
      light: '#008035',
    },
    icon: 'icon-[lucide--circle-check-big]',
  },
  ['alert']: {
    backgroundColor: {
      dark: '#231c15',
      light: '#fbf4d0',
    },
    borderColor: {
      dark: '#ff9d00',
      light: '#ff9d00',
    },
    icon: 'icon-[lucide--badge-alert]',
  },
}

export default function NotePanel({ title, type, children, id }: NotePanelProps) {
  let config = Types[type]
  const scopeId = `note-panel-${type}${id ? `-${id}` : ''}`
  return (
    <div id={scopeId} style={{ position: 'relative' }}>
      <style>{`
        #${scopeId} {
          --bg-color: ${config.backgroundColor.light};
          --border-color: ${config.borderColor.light};
        }
        .dark #${scopeId} {
        --bg-color: ${config.backgroundColor.dark};
        --border-color: ${config.borderColor.dark};
        }
      `}</style>
      <svg style={{ zIndex: 1, position: 'absolute', overflow: 'visible', pointerEvents: 'none' }}>
        <path
          d={`M ${CircleRadius},0 A ${CircleRadius},${CircleRadius} 0 0,1 0,${CircleRadius}`}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="3px"
        />{' '}
      </svg>
      <span
        style={{
          zIndex: 1,
          position: 'absolute',
          overflow: 'visible',
          pointerEvents: 'none',
          fontSize: `${CircleRadius + 5}px`,
          transform: `translate(${-CircleRadius / 2}px, -${CircleRadius / 2}px)`,
          color: 'var(--border-color)',
        }}
        className={config.icon}
      ></span>
      <div
        style={{
          backgroundColor: 'var(--bg-color)',
          width: '100%',
          padding: '10px 1em 1px 2em',
          marginBottom: '1em',
          border: 'none',
          clipPath: `path(evenodd, "M -10,-10 H 2000 V 2000 H 0 Z M 0,0 m ${CircleRadius},0 a ${CircleRadius},${CircleRadius} 0 1,0 -${CircleRadius * 2},0 a ${CircleRadius},${CircleRadius} 0 1,0 ${CircleRadius * 2},0")`,
          borderLeft: 'solid var(--border-color)',
          borderWidth: '3px',
        }}
      >
        <h4>{title}</h4>
        {children}
      </div>
    </div>
  )
}
