import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface TechnicalTermProps {
  children: React.ReactNode
  className?: string
  term?: React.ReactNode
  defaultOpen?: boolean
  color?: string
  accentColor?: string
  /** Choose a repeatable waveform; otherwise each component instance gets its own seed. */
  seed?: string | number
}

const POPUP_WIDTH = 320
const POPUP_GAP = 10
const VIEWPORT_PADDING = 12

function buildWavePath(amplitude: number, phase: number, frequencies: number[]): string {
  const points = Array.from({ length: 41 }, (_, index) => {
    const t = index / 40
    const primary = Math.sin(t * Math.PI * 2 * frequencies[0] + phase) * amplitude
    const harmonic = Math.sin(t * Math.PI * 2 * frequencies[1] + phase * 1.7) * amplitude * 0.24
    const micro = Math.sin(t * Math.PI * 2 * frequencies[2] + phase * 0.35) * amplitude * 0.1
    return `${t * 200},${(6 + primary + harmonic + micro).toFixed(3)}`
  })
  return `M ${points.join(' L ')}`
}

function seededWaves(seed: string) {
  let state = 2166136261
  for (let index = 0; index < seed.length; index++) state = Math.imul(state ^ seed.charCodeAt(index), 16777619)
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  const frequencies = [1.6 + random() * 0.9, 3.5 + random() * 1.4, 6 + random() * 2]
  const amplitude = 0.9 + random() * 0.4
  const phase = random() * Math.PI * 2
  const phaseStep = 0.8 + random() * 0.5
  const phases = Array.from({ length: 5 }, (_, index) => phase + index * phaseStep)
  return {
    main: phases.map((value) => buildWavePath(amplitude, value, frequencies)),
    glow: phases.map((value) => buildWavePath(amplitude * 1.35, value, frequencies)),
    duration: `${(4.5 + random() * 1.5).toFixed(2)}s`,
  }
}
const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]'

function focusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert], [aria-hidden="true"]')
  )
}

export default function TechnicalTerm({
  children,
  className = '',
  term,
  defaultOpen = false,
  color = '#3b82f6',
  accentColor = '#8b5cf6',
  seed,
}: TechnicalTermProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isRendered, setIsRendered] = useState(defaultOpen)
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: POPUP_WIDTH,
    maxHeight: 360,
    placement: 'bottom',
    positioned: false,
    anchorVisible: true,
  })
  const safeId = useId().replace(/[^a-zA-Z0-9_-]/g, '_')
  const waves = useMemo(() => seededWaves(String(seed ?? safeId)), [seed, safeId])
  const popupId = `technical-term-popup-${safeId}`
  const colors = { '--tt-color': color, '--tt-accent': accentColor } as React.CSSProperties

  const close = (returnFocus = false) => {
    setIsOpen(false)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    setIsMounted(true)
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      return
    }
    setIsVisible(false)
    const timer = window.setTimeout(() => setIsRendered(false), reducedMotion ? 0 : 140)
    return () => window.clearTimeout(timer)
  }, [isOpen, reducedMotion])

  useEffect(() => {
    if (!isOpen) return
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (triggerRef.current?.contains(target) || popupRef.current?.contains(target))
    const onOutside = (event: Event) => {
      if (!inside(event.target)) setIsOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
      }
    }
    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('focusin', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onOutside, true)
      document.removeEventListener('focusin', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isMounted || !isRendered) return
    let measureFrame = 0
    let active = true
    const update = () => {
      const trigger = triggerRef.current
      const popup = popupRef.current
      if (!trigger || !popup || !active) return
      const anchor = trigger.getBoundingClientRect()
      const viewport = window.visualViewport
      const leftBound = (viewport?.offsetLeft ?? 0) + VIEWPORT_PADDING
      const topBound = (viewport?.offsetTop ?? 0) + VIEWPORT_PADDING
      const rightBound = leftBound + (viewport?.width ?? window.innerWidth) - 2 * VIEWPORT_PADDING
      const bottomBound = topBound + (viewport?.height ?? window.innerHeight) - 2 * VIEWPORT_PADDING
      const width = Math.min(POPUP_WIDTH, Math.max(0, rightBound - leftBound))
      const headerHeight = popup.querySelector<HTMLElement>('.technical-term-header')?.offsetHeight ?? 60
      const naturalHeight = Math.min(360, headerHeight + (contentRef.current?.scrollHeight ?? 0) + 4)
      const below = Math.max(0, Math.min(bottomBound - topBound, bottomBound - anchor.bottom - POPUP_GAP))
      const above = Math.max(0, Math.min(bottomBound - topBound, anchor.top - POPUP_GAP - topBound))
      const placement = below < naturalHeight && above > below ? 'top' : 'bottom'
      const maxHeight = Math.min(360, placement === 'top' ? above : below)
      const height = Math.min(naturalHeight, maxHeight)
      const left = Math.max(leftBound, Math.min(anchor.left, rightBound - width))
      const desiredTop = placement === 'top' ? anchor.top - POPUP_GAP - height : anchor.bottom + POPUP_GAP
      const top = Math.max(topBound, Math.min(desiredTop, bottomBound - height))
      const round = (value: number) => Math.round(value * window.devicePixelRatio) / window.devicePixelRatio
      const next = {
        left: round(left),
        top: round(top),
        width,
        maxHeight,
        placement,
        positioned: true,
        anchorVisible: anchor.bottom >= topBound && anchor.top <= bottomBound && anchor.right >= leftBound && anchor.left <= rightBound,
      }
      setPosition((previous) =>
        Object.keys(next).every((key) => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next
      )
      if (isOpen) setIsVisible(true)
    }
    const schedule = () => {
      cancelAnimationFrame(measureFrame)
      measureFrame = requestAnimationFrame(update)
    }
    schedule()
    const observer = new ResizeObserver(schedule)
    if (triggerRef.current) observer.observe(triggerRef.current)
    if (popupRef.current) observer.observe(popupRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    document.fonts.addEventListener('loadingdone', schedule)
    void document.fonts.ready.then(() => {
      if (active) schedule()
    })
    return () => {
      active = false
      cancelAnimationFrame(measureFrame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
      document.fonts.removeEventListener('loadingdone', schedule)
    }
  }, [isMounted, isRendered, isOpen, children, term])

  const onPopupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !popupRef.current) return
    const elements = focusableElements(popupRef.current)
    if (event.shiftKey && document.activeElement === elements[0]) {
      event.preventDefault()
      triggerRef.current?.focus()
    } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
      event.preventDefault()
      const pageElements = focusableElements(document).filter((element) => !popupRef.current?.contains(element))
      const next = pageElements[pageElements.indexOf(triggerRef.current!) + 1]
      close()
      const focusTarget = next ?? triggerRef.current
      focusTarget?.focus()
    }
  }

  return (
    <>
      <style>{`
        .technical-term-trigger:focus-visible,
        .technical-term-close:focus-visible {
          outline: 2px solid var(--tt-color);
          outline-offset: 4px;
        }
        .technical-term-trigger .technical-term-wave { opacity: 0.9; }
        .technical-term-trigger:is(:hover, :focus-visible, [aria-expanded="true"]) .technical-term-wave { opacity: 1; }
        .technical-term-close { background: transparent; opacity: 0.65; }
        .technical-term-close:hover {
          opacity: 1;
          background: color-mix(in srgb, currentColor 8%, transparent);
        }
        .technical-term-body > :first-child { margin-block-start: 0; }
        .technical-term-body > :last-child { margin-block-end: 0; }
        .technical-term-body :is(p, ul, ol, pre, blockquote) { margin-block: 0.75em; }
        .technical-term-body a { color: var(--tt-color); text-underline-offset: 0.2em; }
        @media (prefers-reduced-motion: reduce) {
          .technical-term-popup { transition: none !important; }
        }
      `}</style>
      <button
        ref={triggerRef}
        type="button"
        className={`technical-term-trigger ${className}`}
        onClick={() => setIsOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (isOpen && (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey))) {
            const first = popupRef.current && focusableElements(popupRef.current)[0]
            if (first) {
              event.preventDefault()
              first.focus()
            }
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isRendered ? popupId : undefined}
        style={{
          ...colors,
          appearance: 'none',
          display: 'inline-block',
          position: 'relative',
          maxWidth: '100%',
          background: 'none',
          border: 0,
          padding: 0,
          color: 'inherit',
          font: 'inherit',
          lineHeight: 'inherit',
          textAlign: 'inherit',
          verticalAlign: 'baseline',
          cursor: 'pointer',
        }}
      >
        {term}
        <svg
          className="technical-term-wave"
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 200 12"
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: '-6%', bottom: -3, width: '112%', height: 14, overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id={`tt-gradient-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={accentColor} />
            </linearGradient>
            <filter id={`tt-glow-${safeId}`} x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <linearGradient id={`tt-fade-${safeId}`}>
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="8%" stopColor="white" />
              <stop offset="92%" stopColor="white" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id={`tt-mask-${safeId}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="12">
              <rect width="200" height="12" fill={`url(#tt-fade-${safeId})`} />
            </mask>
          </defs>
          <g mask={`url(#tt-mask-${safeId})`} fill="none" stroke={`url(#tt-gradient-${safeId})`} strokeLinecap="round">
            <path d={waves.glow[0]} strokeWidth={3} opacity={0.25} filter={`url(#tt-glow-${safeId})`}>
              {!reducedMotion && (
                <animate
                  attributeName="d"
                  values={[...waves.glow, waves.glow[0]].join(';')}
                  dur={waves.duration}
                  repeatCount="indefinite"
                />
              )}
            </path>
            <path d={waves.main[0]} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke">
              {!reducedMotion && (
                <animate
                  attributeName="d"
                  values={[...waves.main, waves.main[0]].join(';')}
                  dur={waves.duration}
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
        </svg>
      </button>
      {isMounted &&
        isRendered &&
        createPortal(
          <div
            id={popupId}
            ref={popupRef}
            role="dialog"
            aria-labelledby={`${popupId}-heading`}
            aria-hidden={!isOpen || !position.anchorVisible}
            className="technical-term-popup"
            inert={!isOpen}
            onKeyDown={onPopupKeyDown}
            style={{
              ...colors,
              position: 'fixed',
              left: position.left,
              top: position.top,
              zIndex: 100,
              boxSizing: 'border-box',
              width: position.width,
              maxWidth: `calc(100vw - ${2 * VIEWPORT_PADDING}px)`,
              maxHeight: position.maxHeight,
              visibility: position.positioned && position.anchorVisible ? 'visible' : 'hidden',
              pointerEvents: isOpen ? 'auto' : 'none',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : `translateY(${position.placement === 'top' ? 4 : -4}px)`,
              transition: reducedMotion ? 'none' : 'opacity 140ms ease, transform 140ms ease',
              border: '2px solid var(--color-border, #d4d4d8)',
              borderLeft: '4px solid var(--tt-color)',
              borderRadius: 4,
              overflow: 'hidden',
              background: 'color-mix(in srgb, var(--tt-color) 3%, var(--color-background, white))',
              color: 'var(--color-foreground, #18181b)',
              boxShadow: '0 4px 12px rgb(0 0 0 / 15%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: Math.max(0, position.maxHeight - 4),
                minHeight: 0,
                background: 'inherit',
                overflow: 'hidden',
              }}
            >
              <div
                className="technical-term-header"
                style={{
                  display: 'flex',
                  textTransform: 'capitalize',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexShrink: 0,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--color-border, #e4e4e7)',
                }}
              >
                <h4
                  id={`${popupId}-heading`}
                  style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--tt-color)' }}
                >
                  {term}
                </h4>
                <button
                  type="button"
                  className="technical-term-close"
                  aria-label="Close definition"
                  onClick={() => close(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    padding: 5,
                    border: 0,
                    borderRadius: 4,
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
              <div
                ref={contentRef}
                className="markdown technical-term-body"
                style={{
                  minHeight: 0,
                  overflow: 'auto',
                  padding: '13px 14px 15px',
                  fontSize: 14,
                  lineHeight: 1.65,
                  overflowWrap: 'break-word',
                }}
              >
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
