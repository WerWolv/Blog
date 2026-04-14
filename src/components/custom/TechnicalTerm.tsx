import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TechnicalTermProps {
  children: React.ReactNode
  className?: string
  term?: React.ReactNode
  defaultOpen?: boolean
  blueColor?: string
  violetColor?: string
}

const POPUP_WIDTH = 300
const POPUP_GAP = 8
const VIEWPORT_PADDING = 10
const EXIT_ANIMATION_MS = 220

function buildWavePath(amplitude: number, phase = 0): string {
  const width = 200
  const baseline = 6
  const steps = 40
  const points: Array<[number, number]> = []

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = t * width
    const primary = Math.sin(t * Math.PI * 4 + phase) * amplitude
    const harmonic = Math.sin(t * Math.PI * 9 + phase * 1.7) * amplitude * 0.24
    const micro = Math.sin(t * Math.PI * 15 + phase * 0.35) * amplitude * 0.1
    const y = baseline + primary + harmonic + micro
    points.push([x, y])
  }

  let d = `M ${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i][0]},${points[i][1]}`
  }

  return d
}

export default function TechnicalTerm({
  children,
  className = '',
  term,
  defaultOpen = false,
  blueColor = '#3b82f6',
  violetColor = '#8b5cf6',
}: TechnicalTermProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)

  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const closeTimeoutRef = useRef<number | null>(null)
  const measureRafRef = useRef<number | null>(null)
  const showRafRef = useRef<number | null>(null)

  const [popupPosition, setPopupPosition] = useState({
    left: 0,
    top: 0,
    placement: 'bottom' as 'bottom' | 'top',
    width: POPUP_WIDTH,
    maxHeight: 280,
  })

  const id = useId()
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_')
  const popupId = `technical-term-popup-${safeId}`

  const mainPathA = useMemo(() => buildWavePath(1.1, 0), [])
  const mainPathB = useMemo(() => buildWavePath(1.2, Math.PI / 3), [])
  const mainPathC = useMemo(() => buildWavePath(0.95, Math.PI * 0.72), [])
  const mainPathD = useMemo(() => buildWavePath(1.3, Math.PI * 1.06), [])
  const mainPathE = useMemo(() => buildWavePath(1.02, Math.PI * 1.58), [])

  const glowPathA = useMemo(() => buildWavePath(1.6, Math.PI / 3), [])
  const glowPathB = useMemo(() => buildWavePath(1.8, Math.PI / 1.45), [])
  const glowPathC = useMemo(() => buildWavePath(1.45, Math.PI * 0.95), [])
  const glowPathD = useMemo(() => buildWavePath(1.75, Math.PI * 1.36), [])
  const glowPathE = useMemo(() => buildWavePath(1.5, Math.PI * 1.8), [])

  const triggerText = term

  const clearScheduledWork = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (measureRafRef.current !== null) {
      cancelAnimationFrame(measureRafRef.current)
      measureRafRef.current = null
    }

    if (showRafRef.current !== null) {
      cancelAnimationFrame(showRafRef.current)
      showRafRef.current = null
    }
  }

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  useEffect(() => {
    setIsMounted(true)

    return () => {
      clearScheduledWork()
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    clearScheduledWork()

    if (isOpen) {
      setIsRendered(true)
      setIsVisible(false)
      setIsPositioned(false)
      return
    }

    setIsVisible(false)

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsRendered(false)
      setIsPositioned(false)
    }, EXIT_ANIMATION_MS)

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [isOpen, isMounted])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      const insideTrigger = rootRef.current?.contains(target) ?? false
      const insidePopup = popupRef.current?.contains(target) ?? false

      if (!insideTrigger && !insidePopup) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isMounted || !isRendered) return

    const updatePopupPosition = () => {
      const triggerEl = triggerRef.current
      const popupEl = popupRef.current
      if (!triggerEl || !popupEl) return

      const triggerRect = triggerEl.getBoundingClientRect()
      const popupRect = popupEl.getBoundingClientRect()
      const articleRect = triggerEl.closest('article')?.getBoundingClientRect()

      const boundsLeft = articleRect ? articleRect.left + VIEWPORT_PADDING : VIEWPORT_PADDING
      const boundsRight = articleRect ? articleRect.right - VIEWPORT_PADDING : window.innerWidth - VIEWPORT_PADDING
      const boundsTop = articleRect ? articleRect.top + VIEWPORT_PADDING : VIEWPORT_PADDING
      const boundsBottom = articleRect ? articleRect.bottom - VIEWPORT_PADDING : window.innerHeight - VIEWPORT_PADDING

      const maxAllowedWidth = Math.max(220, boundsRight - boundsLeft)
      const width = Math.min(POPUP_WIDTH, maxAllowedWidth)

      let left = triggerRect.left
      if (left + width > boundsRight) {
        left = boundsRight - width
      }
      if (left < boundsLeft) {
        left = boundsLeft
      }

      const belowTop = triggerRect.bottom + POPUP_GAP
      const availableBelow = Math.max(80, Math.floor(boundsBottom - belowTop))
      const availableAbove = Math.max(80, Math.floor(triggerRect.top - POPUP_GAP - boundsTop))

      let placement: 'bottom' | 'top' = 'bottom'
      if (availableBelow < 160 && availableAbove > availableBelow) {
        placement = 'top'
      }

      const maxHeight = Math.max(80, Math.min(320, placement === 'top' ? availableAbove : availableBelow))
      const measuredHeight = Math.min(popupRect.height || maxHeight, maxHeight)

      const top =
        placement === 'top'
          ? Math.max(boundsTop, triggerRect.top - POPUP_GAP - measuredHeight)
          : Math.min(belowTop, boundsBottom - measuredHeight)

      setPopupPosition({
        left,
        top,
        placement,
        width,
        maxHeight,
      })

      setIsPositioned(true)
    }

    measureRafRef.current = requestAnimationFrame(() => {
      updatePopupPosition()

      showRafRef.current = requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })

    const handleWindowChange = () => {
      updatePopupPosition()
    }

    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && popupRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updatePopupPosition()
      })
      resizeObserver.observe(popupRef.current)
    }

    return () => {
      if (measureRafRef.current !== null) {
        cancelAnimationFrame(measureRafRef.current)
        measureRafRef.current = null
      }

      if (showRafRef.current !== null) {
        cancelAnimationFrame(showRafRef.current)
        showRafRef.current = null
      }

      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
      resizeObserver?.disconnect()
    }
  }, [isMounted, isRendered])

  return (
    <>
      <span
        ref={rootRef}
        title="Click to learn more about this term"
        className={className}
        style={{ display: 'inline-block', position: 'relative', maxWidth: '100%' }}
      >
        <span
          ref={triggerRef}
          role="button"
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          style={{
            display: 'inline-block',
            position: 'relative',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            outline: 'none',
            paddingBottom: '0',
          }}
          aria-expanded={isOpen}
          aria-controls={popupId}
          aria-haspopup="dialog"
        >
          {triggerText}

          <svg
            aria-hidden="true"
            focusable="false"
            style={{
              position: 'absolute',
              left: '-10%',
              bottom: -3,
              width: '120%',
              height: 14,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`wave-gradient-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={blueColor} />
                <stop offset="100%" stopColor={violetColor} />
              </linearGradient>
              <filter id={`wave-glow-${safeId}`} x="-20%" y="-200%" width="140%" height="400%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1.2 0" result="strongGlow" />
                <feMerge>
                  <feMergeNode in="strongGlow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id={`wave-edge-fade-${safeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="9%" stopColor="white" stopOpacity="1" />
                <stop offset="91%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id={`wave-mask-${safeId}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="12">
                <rect x="0" y="0" width="200" height="12" fill={`url(#wave-edge-fade-${safeId})`} />
              </mask>
            </defs>

            <g mask={`url(#wave-mask-${safeId})`}>
              <path
                d={glowPathA}
                fill="none"
                stroke={`url(#wave-gradient-${safeId})`}
                strokeWidth={4.2}
                strokeLinecap="round"
                opacity={0.35}
                filter={`url(#wave-glow-${safeId})`}
              >
                <animate
                  attributeName="d"
                  values={`${glowPathA};${glowPathB};${glowPathC};${glowPathD};${glowPathE};${glowPathA}`}
                  dur="2.35s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d={mainPathA}
                fill="none"
                stroke={`url(#wave-gradient-${safeId})`}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <animate
                  attributeName="d"
                  values={`${mainPathA};${mainPathB};${mainPathC};${mainPathD};${mainPathE};${mainPathA}`}
                  dur="5s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </svg>
        </span>
      </span>

      {isMounted && isRendered
        ? createPortal(
            <div
              id={popupId}
              ref={popupRef}
              role="dialog"
              aria-hidden={!isOpen}
              style={{
                position: 'fixed',
                left: popupPosition.left,
                top: popupPosition.top,
                zIndex: 10,
                width: popupPosition.width,
                maxWidth: popupPosition.width,
                maxHeight: popupPosition.maxHeight,
                opacity: isVisible ? 1 : 0,
                visibility: isPositioned ? 'visible' : 'hidden',
                transform: isVisible
                  ? 'translateY(0) scale(1)'
                  : popupPosition.placement === 'top'
                    ? 'translateY(6px) scale(0.98)'
                    : 'translateY(-6px) scale(0.98)',
                transformOrigin: popupPosition.placement === 'top' ? 'bottom left' : 'top left',
                transition: 'opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                pointerEvents: isOpen && isVisible ? 'auto' : 'none',
              }}
            >
              <div
                className="markdown rounded-lg bg-background border-solid border-1 p-1 pl-3 pr-3 drop-shadow-2xl"
                style={{ maxHeight: popupPosition.maxHeight, overflow: 'auto' }}
              >
                {children}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
