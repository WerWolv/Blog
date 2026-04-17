import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

type TerminalEventName = 'data' | 'open'

interface TermJsTerminal {
  element?: HTMLDivElement
  on(event: TerminalEventName, handler: (data?: string) => void): void
  open(parent: HTMLElement): void
  write(data: string): boolean
  writeln(data: string): boolean
  focus(): void
  reset(): void
  destroy(): void
}

type TermJsConstructor = new (options: {
  cols?: number
  rows?: number
  screenKeys?: boolean
  cursorBlink?: boolean
  useStyle?: boolean
}) => TermJsTerminal

type TermJsModule = TermJsConstructor | { default?: TermJsConstructor }

type TerminalInputPayload = { id: string; data: string }
type TerminalInputListener = (char: string, payload: TerminalInputPayload) => void

export type TerminalRef = {
  write: (data: string) => void
  writeln: (data: string) => void
  clear: () => void
  focus: () => void
  onInput: (listener: TerminalInputListener) => () => void
}

export interface TerminalProps {
  id: string
  className?: string
  cols?: number
  rows?: number
  cursorBlink?: boolean
  screenKeys?: boolean
  initialText?: string
  onInput?: (data: string) => void
  onInputChar?: (char: string) => void
}

function resolveConstructor(module: TermJsModule): TermJsConstructor {
  return typeof module === 'function' ? module : (module.default as TermJsConstructor)
}

const Terminal = forwardRef<TerminalRef, TerminalProps>(function Terminal(
  { id, className, cols = 80, rows = 24, cursorBlink = true, screenKeys = true, initialText, onInput, onInputChar }: TerminalProps,
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<TermJsTerminal | null>(null)
  const inputListenersRef = useRef<Set<TerminalInputListener>>(new Set())

  useImperativeHandle(
    ref,
    () => ({
      write(data: string) {
        data = data.replaceAll('\n', '\r\n')
        termRef.current?.write(data)
      },
      writeln(data: string) {
        data = data.replaceAll('\n', '\r\n')
        termRef.current?.writeln(data)
      },
      clear() {
        termRef.current?.reset()
      },
      focus() {
        termRef.current?.focus()
      },
      onInput(listener: TerminalInputListener) {
        inputListenersRef.current.add(listener)
        return () => {
          inputListenersRef.current.delete(listener)
        }
      },
    }),
    []
  )

  useEffect(() => {
    let disposed = false
    let term: TermJsTerminal | null = null
    let detachFocusHandlers: (() => void) | null = null
    const timeoutIds: number[] = []

    const mount = async () => {
      const container = mountRef.current
      if (!container) return

      const module = (await import('term.js/src/term.js')) as unknown as TermJsModule
      if (disposed) return

      const Term = resolveConstructor(module)

      term = new Term({
        cols,
        rows,
        cursorBlink,
        screenKeys,
        useStyle: true,
      })
      termRef.current = term

      term.on('data', (data = '') => {
        onInput?.(data)

        for (const char of data) {
          onInputChar?.(char)
          inputListenersRef.current.forEach((listener) => listener(char, { id, data }))
        }

        window.dispatchEvent(
          new CustomEvent('blog-terminal-input', {
            detail: {
              id,
              data,
              chars: Array.from(data),
            },
          })
        )
      })

      term.open(container)

      if (term.element) {
        // Prevent auto-scroll on focus
        term.element.focus = () => {}

        term.element.style.float = 'none'
        term.element.style.width = '100%'
        term.element.style.maxWidth = '100%'
        term.element.style.overflow = 'auto'
        term.element.style.borderRadius = '10px'
        term.element.style.borderWidth = '1px'
        term.element.style.borderColor = 'rgba(148, 163, 184, 0.35)'
        term.element.style.boxSizing = 'border-box'
        term.element.style.padding = '10px'
        term.element.style.fontFamily = 'SF Mono, SF Mono Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
        term.element.style.fontSize = '12px'
        term.element.style.lineHeight = '1.15'
        term.element.style.cursor = 'text'
        term.element.style.userSelect = 'none'
        term.element.style.overscrollBehaviorY = 'contain'
      }

      container.style.cursor = 'text'

      if (initialText) {
        term.write(initialText)
      }

      window.dispatchEvent(new CustomEvent('blog-terminal-ready', { detail: { id } }))
    }

    mount()

    return () => {
      disposed = true
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      inputListenersRef.current.clear()
      termRef.current = null
      term?.destroy()
    }
  }, [cols, cursorBlink, id, initialText, onInput, onInputChar, rows, screenKeys])

  return <div id={id} ref={mountRef} className={className} style={{ width: '100%', overflowX: 'auto' }} />
})

export default Terminal
