import { useRef, useState, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useFloating, autoUpdate, offset, shift, arrow, FloatingPortal, flip } from '@floating-ui/react'

interface TooltipContextType {
  showTooltip: (element: HTMLElement, content: string) => void
  hideTooltip: () => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [content, setContent] = useState('')
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    refs,
    floatingStyles,
    middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
  } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    elements: {
      reference: referenceElement,
    },
    middleware: [
      offset(8),
      flip(),
      shift({
        padding: 8,
        crossAxis: true,
      }),
      arrow({ element: arrowRef }),
    ],
  })

  const showTooltip = (element: HTMLElement, tooltipContent: string) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setReferenceElement(element)
    setContent(tooltipContent)
    setIsOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)))
  }

  const hideTooltip = () => {
    setIsVisible(false)
    hideTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={`z-50 px-2 py-1 text-xs bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded whitespace-nowrap shadow-lg transition-opacity duration-150 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {content}
            <div
              ref={arrowRef}
              style={{
                position: 'absolute',
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                width: '6px',
                height: '6px',
                background: 'inherit',
                transform: 'rotate(45deg)',
                zIndex: -1,
              }}
            />
          </div>
        )}
      </FloatingPortal>
    </TooltipContext.Provider>
  )
}

export default function Tooltip({
  content,
  children,
  className = '',
  disabled = false,
}: {
  content: string
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  const tooltipContext = useContext(TooltipContext)
  const ref = useRef<HTMLDivElement>(null)

  if (!tooltipContext) {
    throw new Error('Tooltip must be used within TooltipProvider')
  }

  const { showTooltip, hideTooltip } = tooltipContext

  return (
    <div
      ref={ref}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => !disabled && ref.current && showTooltip(ref.current, content)}
      onMouseLeave={() => !disabled && hideTooltip()}
    >
      {children}
    </div>
  )
}
