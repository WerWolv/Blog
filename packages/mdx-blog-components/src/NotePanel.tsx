type NotePanelType = 'info' | 'note' | 'hint' | 'alert' | 'idea' | 'boom' | 'time' | 'link'

interface NotePanelProps {
  title: string
  type: NotePanelType
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
  ['idea']: {
    backgroundColor: {
      dark: '#232215',
      light: '#fffdf2',
    },
    borderColor: {
      dark: '#ffd000',
      light: '#ffea00',
    },
    icon: 'icon-[lucide--lightbulb]',
    transform: 'rotate(0.15turn) scale(1.25) translate(0, 4px)',
  },
  ['boom']: {
    backgroundColor: {
      dark: '#2a1a1a',
      light: '#ffe6e6',
    },
    borderColor: {
      dark: '#ff0000',
      light: '#ff0000',
    },
    icon: 'icon-[lucide--bomb]',
    transform: 'translate(5px, 0)',
  },
  ['time']: {
    backgroundColor: {
      dark: '#1a202c',
      light: '#f0f4ff',
    },
    borderColor: {
      dark: '#3366ff',
      light: '#3366ff',
    },
    icon: 'icon-[lucide--clock]',
  },
  ['link']: {
    backgroundColor: {
      dark: '#1a202c',
      light: '#f0f4ff',
    },
    borderColor: {
      dark: '#3366ff',
      light: '#3366ff',
    },
    icon: 'icon-[lucide--circle-arrow-out-up-left]',
  },
}

export default function NotePanel({ title, type, children, id }: NotePanelProps) {
  if (type === 'note') type = 'info'

  let config = Types[type]
  if (!config) {
    throw new Error(`Invalid NotePanel type: ${type}`)
  }

  const scopeId = `note-panel-${type}${id ? `-${id}` : ''}`
  return (
    <div id={scopeId} style={{ position: 'relative', margin: '2em' }}>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="28.5" height="34.5" fill="none" viewBox="0 1 57 69" preserveAspectRatio="none">
          <path
            fill="var(--border-color)"
            stroke="var(--border-color)"
            strokeWidth="0px"
            d="M57 4C57 2.5 56 1 54 1C52.5 1 51 2 51 4L57 4ZM9 52L8.5 49L9 52ZM6 69V59H0V69H6ZM10 55L14 54L13 48L8.5 49L10 55ZM14 54C38 49 56 28 57 4L51 4C50 25 34 44 13 48L14 54ZM6 59C6 57 7.5 55 10 55L8.5 49C3.5 50 0 54 0 59H6Z"
          ></path>
        </svg>
      </svg>
      <span
        style={{
          zIndex: 1,
          position: 'absolute',
          overflow: 'visible',
          pointerEvents: 'none',
          fontSize: `${CircleRadius + 5}px`,
          transform: `translate(${-CircleRadius / 2}px, -${CircleRadius / 2}px) ${config.transform || ''}`,
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
          clipPath: `path(evenodd, "M -10,-10 H 2000 V 2000 H 0 Z M 0,0 m ${CircleRadius + 3},0 a ${CircleRadius + 3},${CircleRadius + 3} 0 1,0 -${(CircleRadius + 3) * 2},0 a ${CircleRadius + 3},${CircleRadius + 3} 0 1,0 ${(CircleRadius + 3) * 2},0")`,
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
