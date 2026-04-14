import { useCallback, useEffect, useRef, useState } from 'react'
import Terminal, { type TerminalRef } from '@/Terminal'

import Emulator from '../wasm/emulator'

type EmulatorInstance = {
  ccall: (ident: string, returnType: string | null, argTypes?: string[], args?: unknown[]) => unknown
}

export default function Linux({ id }: { id: string }) {
  const terminalRef = useRef<TerminalRef | null>(null)
  const moduleRef = useRef<EmulatorInstance | null>(null)
  const isMountedRef = useRef(true)
  const cleanupRef = useRef<(() => void) | null>(null)
  const hasStartedRef = useRef(false)
  const [hasStarted, setHasStarted] = useState(false)

  const init = useCallback(async () => {
    try {
      const module = (await Emulator({})) as EmulatorInstance
      if (!isMountedRef.current) return

      moduleRef.current = module

      const flushOutput = () => {
        const instance = moduleRef.current
        if (!instance) return

        const chunk = instance.ccall('getOutputQueue', 'string', [], [])
        if (typeof chunk === 'string' && chunk.length > 0) {
          terminalRef.current?.write(chunk)
        }
      }

      module.ccall('startEmulator', null, [], [])

      flushOutput()
      const intervalId = window.setInterval(flushOutput, 16)

      const unsubscribe = terminalRef.current?.onInput(() => {
        flushOutput()
      })

      cleanupRef.current = () => {
        window.clearInterval(intervalId)
        unsubscribe?.()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      terminalRef.current?.write(`[emulator error] ${message}\r\n`)
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      cleanupRef.current?.()
      cleanupRef.current = null
      moduleRef.current = null
    }
  }, [])

  const onTerminalInput = useCallback((): void => {
    const instance = moduleRef.current
    if (!instance) return

    const chunk = instance.ccall('getOutputQueue', 'string', [], [])
    if (typeof chunk === 'string' && chunk.length > 0) {
      terminalRef.current?.write(chunk)
    }
  }, [])

  const onStartupClick = useCallback((): void => {
    if (hasStartedRef.current) return

    hasStartedRef.current = true
    setHasStarted(true)
    void init()
  }, [init])

  return (
    <div className="relative">
      <Terminal ref={terminalRef} id={id} rows={25} cols={72} onInputChar={onTerminalInput} />
      {!hasStarted && (
        <div className="absolute inset-0 grid place-items-center">
          <button
            type="button"
            onClick={onStartupClick}
            className="px-5 py-2 rounded-md border border-neutral-500/70 bg-neutral-800/95 text-neutral-100 text-sm font-medium shadow-md hover:bg-neutral-700/95 transition-colors"
          >
            Startup Machine
          </button>
        </div>
      )}
    </div>
  )
}
