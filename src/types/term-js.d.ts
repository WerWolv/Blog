declare module 'term.js' {
  interface TermJsOptions {
    cols?: number
    rows?: number
    cursorBlink?: boolean
    screenKeys?: boolean
    useStyle?: boolean
  }

  class Terminal {
    element?: HTMLDivElement
    constructor(options?: TermJsOptions)
    on(event: 'data' | 'open', handler: (data?: string) => void): void
    open(parent: HTMLElement): void
    write(data: string): boolean
    writeln(data: string): boolean
    focus(): void
    reset(): void
    destroy(): void
  }

  export = Terminal
}

declare module 'term.js/src/term.js' {
  interface TermJsOptions {
    cols?: number
    rows?: number
    cursorBlink?: boolean
    screenKeys?: boolean
    useStyle?: boolean
  }

  class Terminal {
    element?: HTMLDivElement
    constructor(options?: TermJsOptions)
    on(event: 'data' | 'open', handler: (data?: string) => void): void
    open(parent: HTMLElement): void
    write(data: string): boolean
    writeln(data: string): boolean
    focus(): void
    reset(): void
    destroy(): void
  }

  export = Terminal
}
