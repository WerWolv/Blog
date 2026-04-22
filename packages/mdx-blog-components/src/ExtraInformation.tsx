import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

let extraInfoStyleInjected = false

interface Particle {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  duration: number
  delay: number
  size: number
}

export default function ExtraInformation({ name, children }: { name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const triggerRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const portalNode = useRef<HTMLDivElement | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    if (!extraInfoStyleInjected && typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes extra-info-fly {
          0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
          15%  { transform: translate(0, 0) scale(1);   opacity: 0.9; }
          100% { transform: translate(var(--ei-tx), var(--ei-ty)) scale(0.2); opacity: 0; }
        }
      `
      document.head.appendChild(style)
      extraInfoStyleInjected = true
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || portalNode.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!triggerRef.current) return

    // Walk up to find the nearest block-level ancestor (e.g. the <p> wrapping inline MDX)
    let blockEl: Element | null = triggerRef.current.parentElement
    while (blockEl && blockEl !== document.body) {
      const display = window.getComputedStyle(blockEl).display
      if (display === 'block' || display === 'flow-root' || display === 'list-item') break
      blockEl = blockEl.parentElement
    }
    if (!blockEl) return

    // Insert after any existing ExtraInformation panels so order is preserved
    let insertAfter: Element = blockEl
    while (insertAfter.nextElementSibling instanceof HTMLElement && insertAfter.nextElementSibling.dataset.extraInfoPanel === 'true') {
      insertAfter = insertAfter.nextElementSibling
    }

    const container = document.createElement('div')
    container.dataset.extraInfoPanel = 'true'
    container.style.cssText = 'margin: 0; padding: 0; font-size: 0; line-height: 0;'
    insertAfter.after(container)
    portalNode.current = container
    setPortalReady(true)

    return () => {
      container.remove()
      portalNode.current = null
      setPortalReady(false)
    }
  }, [])

  useEffect(() => {
    if (!innerRef.current) return
    const ro = new ResizeObserver(() => {
      setContentHeight(innerRef.current?.scrollHeight ?? 0)
    })
    ro.observe(innerRef.current)
    return () => ro.disconnect()
  }, [portalReady])

  const spawnOne = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width * Math.random() + window.scrollX
    const cy = rect.top + (rect.height / 8) * Math.random() + window.scrollY
    const angle = (Math.random() * 0.1 * Math.PI) / 2 - Math.PI / 2
    const dist = 18 + Math.random() * 28
    const p: Particle = {
      id: `${Date.now()}-${Math.random()}`,
      x: cx,
      y: cy,
      dx: Math.cos(angle) * dist,
      dy: -10,
      duration: 1600 + Math.random() * 400,
      delay: 0,
      size: 0.45 + Math.random() * 0.35,
    }
    setParticles((prev) => [...prev, p])
    setTimeout(() => {
      setParticles((prev) => prev.filter((x) => x.id !== p.id))
    }, p.duration + 50)
  }

  useEffect(() => {
    const schedule = () => {
      spawnOne()
      timer = window.setTimeout(schedule, 100 + Math.random() * 500)
    }
    let timer = window.setTimeout(schedule, 1)
    return () => window.clearTimeout(timer)
  }, [])

  const panel = (
    <div
      style={{
        height: open ? contentHeight : 0,
        overflow: 'hidden',
        transition: 'height 320ms cubic-bezier(0.4, 0, 0.2, 1)',
        width: 'calc(100% + 4em)',
        marginLeft: '-2em',
        marginBottom: '-2em',
        fontSize: '1rem',
        lineHeight: '1.75',
      }}
    >
      <div
        ref={innerRef}
        style={{
          padding: '1.25em 2em',
          background: 'hsl(var(--muted) / 0.2)',
          boxShadow:
            'inset 0 6px 18px rgba(0,0,0,0.13), inset 0 -6px 14px rgba(0,0,0,0.07), inset 1px 0 3px rgba(0,0,0,0.015), inset -1px 0 3px rgba(0,0,0,0.015)',
        }}
      >
        {children}
      </div>
    </div>
  )

  return (
    <>
      <span
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLSpanElement).style.color = 'hsl(var(--foreground))'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLSpanElement).style.color = 'hsl(var(--muted-foreground))'
        }}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25em',
          color: 'hsl(var(--muted-foreground))',
          userSelect: 'none',
          textDecoration: 'red wavy underline',
        }}
      >
        {name}
      </span>
      {portalReady && portalNode.current ? createPortal(panel, portalNode.current) : null}
      {particles.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          particles.map((p) => (
            <span
              key={p.id}
              style={
                {
                  'position': 'absolute',
                  'left': p.x,
                  'top': p.y,
                  '--ei-tx': `${p.dx}px`,
                  '--ei-ty': `${p.dy}px`,
                  'animation': `extra-info-fly ${p.duration}ms ${p.delay}ms ease-out forwards`,
                  'pointerEvents': 'none',
                  'fontSize': `${p.size}em`,
                  'color': 'hsl(var(--muted-foreground) / 0.75)',
                  'userSelect': 'none',
                  'zIndex': 9999,
                  'fontWeight': 'bold',
                  'lineHeight': 1,
                } as React.CSSProperties
              }
            >
              ?
            </span>
          )),
          document.body
        )}
    </>
  )
}
