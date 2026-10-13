import { useEffect, useId, useRef, useState } from 'react'

/** Times use the same units as the timeline. Range ends are exclusive. */
export interface WaveformAnnotation {
  start: number
  end?: number
  label: string
  color?: string
}

export interface WaveformPoint {
  time: number
  value: number | null
}

/** An opaque bus value occupying [start, end) on the shared timeline. */
export interface WaveformTransaction {
  start: number
  end: number
  value: string | number | null
}

/** A shared timeline interval to omit from all channels. */
export interface WaveformBreak {
  start: number
  end: number
}

interface SignalBase {
  name: string
  color?: string
  /** Draw an overbar on the channel name to indicate active-low logic. */
  activeLow?: boolean
  /** Override the shared sample rate for this channel. */
  sampleRate?: number
  annotations?: WaveformAnnotation[]
}

interface BreakEdge {
  levels: number[]
  known: boolean
}

export type OscilloscopeSignal =
  | (SignalBase & {
      type?: 'digital'
      data: (number | null)[] | WaveformPoint[] | string
      showValues?: boolean
      /** Mark matching transitions, or only transitions at the given timeline times. */
      edgeArrows?: 'rising' | 'falling' | 'both' | number[]
    })
  | (SignalBase & { type: 'analog'; data: (number | null)[] | WaveformPoint[]; min?: number; max?: number; unit?: string })
  | (SignalBase & { type: 'bus'; data: (string | number | null)[] | WaveformTransaction[] })

export interface OscilloscopeProps {
  signals: OscilloscopeSignal[]
  title?: string
  /** Samples per timeline unit. Defaults to one sample per unit. */
  sampleRate?: number
  /** Timeline end; inferred from the data when omitted. */
  duration?: number
  timeUnit?: string
  annotations?: WaveformAnnotation[]
  /** Default for digital channels; may be overridden per signal. */
  showValues?: boolean
  /** Collapse uninteresting time ranges into double-slash gaps. */
  breaks?: WaveformBreak[]
}

const COLORS = ['#0891b2', '#a855f7', '#10b981', '#f59e0b', '#f43f5e']
const MIN_PLOT_WIDTH = 600
const PLOT_PADDING = 16
const BREAK_WIDTH = 32
const LANE = 120
const format = (value: number) => Number(value.toPrecision(4)).toString()

function pointsFor(signal: Exclude<OscilloscopeSignal, { type: 'bus' }>, sampleRate: number): WaveformPoint[] {
  const data =
    typeof signal.data === 'string'
      ? Array.from(signal.data.replace(/\s/g, ''), (bit) => (bit === '0' ? 0 : bit === '1' ? 1 : null))
      : signal.data
  return data
    .map((sample, index) => (typeof sample === 'object' && sample !== null ? sample : { time: index / sampleRate, value: sample }))
    .filter((point) => Number.isFinite(point.time) && point.time >= 0)
    .map((point) => ({
      ...point,
      value:
        point.value !== null && Number.isFinite(point.value) ? (signal.type === 'analog' ? point.value : point.value === 0 ? 0 : 1) : null,
    }))
    .sort((a, b) => a.time - b.time)
}

function transactionsFor(signal: Extract<OscilloscopeSignal, { type: 'bus' }>, sampleRate: number): WaveformTransaction[] {
  return signal.data
    .map((value, index) =>
      typeof value === 'object' && value !== null ? value : { start: index / sampleRate, end: (index + 1) / sampleRate, value }
    )
    .filter(
      (transaction) =>
        Number.isFinite(transaction.start) &&
        Number.isFinite(transaction.end) &&
        transaction.start >= 0 &&
        transaction.end > transaction.start
    )
    .sort((a, b) => a.start - b.start)
}

function transactionLabel(value: string | number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? `0x${value.toString(16).toUpperCase()}` : String(value)
}

function normalizeBreaks(breaks: WaveformBreak[], duration: number): WaveformBreak[] {
  const ranges = breaks
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
    .map((range) => ({ start: Math.max(0, range.start), end: Math.min(duration, range.end) }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start)
  const merged: WaveformBreak[] = []
  for (const range of ranges) {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  // A break needs some recorded time left to display.
  return merged.reduce((total, range) => total + range.end - range.start, 0) < duration ? merged : []
}

export default function Oscilloscope({
  signals,
  title = 'Signal capture',
  sampleRate = 1,
  duration,
  timeUnit = 'samples',
  annotations = [],
  showValues = false,
  breaks = [],
}: OscilloscopeProps) {
  const id = useId()
  const plotRef = useRef<HTMLDivElement>(null)
  const axisRef = useRef<SVGSVGElement>(null)
  const [plotWidth, setPlotWidth] = useState(MIN_PLOT_WIDTH)
  const [axisWidth, setAxisWidth] = useState(80)
  const LEFT = axisWidth
  const WIDTH = LEFT + plotWidth

  useEffect(() => {
    const plot = plotRef.current
    if (!plot) return
    const observer = new ResizeObserver(([entry]) => {
      setPlotWidth(Math.max(MIN_PLOT_WIDTH, entry.contentRect.width))
    })
    observer.observe(plot)
    return () => observer.disconnect()
  }, [signals.length === 0])

  const rate = Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 1
  const channels = signals.map((signal, index) => {
    const channelRate =
      signal.sampleRate !== undefined && Number.isFinite(signal.sampleRate) && signal.sampleRate > 0 ? signal.sampleRate : rate
    const points = signal.type === 'bus' ? [] : pointsFor(signal, channelRate)
    const transactions = signal.type === 'bus' ? transactionsFor(signal, channelRate) : []
    const values = points.flatMap((point) => (point.value === null ? [] : [point.value]))
    let min = signal.type === 'analog' ? (signal.min ?? values.reduce((a, b) => Math.min(a, b), values[0] ?? 0)) : 0
    let max = signal.type === 'analog' ? (signal.max ?? values.reduce((a, b) => Math.max(a, b), values[0] ?? 1)) : 1
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      min = 0
      max = 1
    } else if (max === min) {
      min -= 0.5
      max += 0.5
    }
    const last = points.at(-1)
    // Digital samples occupy intervals; analog samples are interpolation points.
    const end =
      signal.type === 'bus'
        ? transactions.reduce((finish, transaction) => Math.max(finish, transaction.end), 0)
        : last
          ? last.time + (signal.type === 'analog' ? 0 : 1 / channelRate)
          : 0
    return { signal, points, transactions, min, max, end, color: signal.color ?? COLORS[index % COLORS.length] }
  })

  useEffect(() => {
    const axis = axisRef.current
    if (!axis) return
    let active = true
    const measure = () => {
      if (!active) return
      const labels = Array.from(
        axis.querySelectorAll<SVGTextElement>('[data-axis-label]'),
        (text) => Number(text.getAttribute('x')) + text.getComputedTextLength()
      )
      const scales = Array.from(axis.querySelectorAll<SVGTextElement>('[data-axis-scale]'), (text) => text.getComputedTextLength())
      // Names/types and scale values occupy separate columns, even when their rows overlap.
      const labelColumn = Math.max(20, ...labels)
      const scaleColumn = scales.length ? Math.max(...scales) + 12 : 0
      setAxisWidth(Math.ceil(labelColumn + 12 + scaleColumn))
    }
    measure()
    void document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => {
      active = false
      document.fonts.removeEventListener('loadingdone', measure)
    }
  }, [signals, rate])
  const inferredEnd = Math.max(1 / rate, ...channels.map((channel) => channel.end))
  const end = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : inferredEnd
  const skipped = normalizeBreaks(breaks, end)
  const visibleIntervals: WaveformBreak[] = []
  let cursor = 0
  for (const range of skipped) {
    if (range.start > cursor) visibleIntervals.push({ start: cursor, end: range.start })
    cursor = range.end
  }
  if (cursor < end) visibleIntervals.push({ start: cursor, end })
  const visibleDuration = visibleIntervals.reduce((total, range) => total + range.end - range.start, 0)
  const gapWidth = Math.min(BREAK_WIDTH, (plotWidth - 2 * PLOT_PADDING) / (2 * (skipped.length + 1)))
  const pixelsPerTime = (plotWidth - 2 * PLOT_PADDING - skipped.length * gapWidth) / visibleDuration
  const top = annotations.length ? 62 : 24
  const bottom = top + signals.length * LANE
  const height = bottom + 46
  const x = (time: number) => {
    let omitted = 0
    let gaps = 0
    for (const range of skipped) {
      if (time <= range.start) break
      if (time < range.end) {
        return (
          LEFT +
          PLOT_PADDING +
          (range.start - omitted) * pixelsPerTime +
          gaps * gapWidth +
          ((time - range.start) / (range.end - range.start)) * gapWidth
        )
      }
      omitted += range.end - range.start
      gaps++
    }
    return LEFT + PLOT_PADDING + (time - omitted) * pixelsPerTime + gaps * gapWidth
  }
  const tickStep = (() => {
    const rough = visibleDuration / 8
    const magnitude = 10 ** Math.floor(Math.log10(rough))
    return [1, 2, 5, 10].find((step) => step * magnitude >= rough)! * magnitude
  })()
  const ticks = [
    ...new Set(
      visibleIntervals.flatMap((range) => {
        const first = Math.ceil(range.start / tickStep)
        const count = Math.max(0, Math.floor(range.end / tickStep) - first + 1)
        return [range.start, ...Array.from({ length: count }, (_, index) => (first + index) * tickStep), range.end]
      })
    ),
  ].sort((a, b) => a - b)

  function labelSpan(start: number, finish: number) {
    return visibleIntervals
      .map((range) => ({ start: Math.max(start, range.start), end: Math.min(finish, range.end) }))
      .filter((range) => range.end > range.start)
      .sort((a, b) => b.end - b.start - (a.end - a.start))[0]
  }

  function breakMarks(edges: number | ((range: WaveformBreak) => { before: BreakEdge; after: BreakEdge }), color: string) {
    return skipped.map((range, index) => {
      const middle = (x(range.start) + x(range.end)) / 2
      const { before, after } =
        typeof edges === 'function'
          ? edges(range)
          : {
              before: { levels: [edges], known: true },
              after: { levels: [edges], known: true },
            }
      const topY = Math.min(...before.levels, ...after.levels) - 16
      const bottomY = Math.max(...before.levels, ...after.levels) + 16
      const halfWidth = Math.min(7, gapWidth / 4)
      const separation = Math.min(3, gapWidth / 8)
      const slashX = (level: number, offset: number) => middle + offset - halfWidth + ((bottomY - level) / (bottomY - topY)) * 2 * halfWidth
      return (
        <g key={index} data-waveform-break fill="none" stroke={color} strokeWidth={1.5}>
          <title>{`Skipped ${format(range.start)}–${format(range.end)} ${timeUnit}`}</title>
          {before.levels.map((level, levelIndex) => (
            <line
              key={`before-${levelIndex}`}
              data-break-connector
              x1={x(range.start)}
              x2={slashX(level, -separation)}
              y1={level}
              y2={level}
              strokeDasharray={before.known ? undefined : '2 4'}
              strokeOpacity={before.known ? 1 : 0.65}
            />
          ))}
          {after.levels.map((level, levelIndex) => (
            <line
              key={`after-${levelIndex}`}
              data-break-connector
              x1={slashX(level, separation)}
              x2={x(range.end)}
              y1={level}
              y2={level}
              strokeDasharray={after.known ? undefined : '2 4'}
              strokeOpacity={after.known ? 1 : 0.65}
            />
          ))}
          <path
            data-break-slashes
            d={`M${middle - separation - halfWidth},${bottomY} L${middle - separation + halfWidth},${topY} M${middle + separation - halfWidth},${bottomY} L${middle + separation + halfWidth},${topY}`}
          />
        </g>
      )
    })
  }

  function annotationElements(items: WaveformAnnotation[], y: number, span: number, defaultColor: string) {
    return items.map((annotation, index) => {
      const finish = annotation.end ?? annotation.start
      if (
        !Number.isFinite(annotation.start) ||
        !Number.isFinite(finish) ||
        finish < annotation.start ||
        finish < 0 ||
        annotation.start > end
      )
        return null
      const startX = x(Math.max(0, annotation.start))
      const endX = x(Math.min(end, finish))
      const color = annotation.color ?? defaultColor
      const range = finish > annotation.start
      const labelRange = range ? labelSpan(Math.max(0, annotation.start), Math.min(end, finish)) : undefined
      if (range ? !labelRange : skipped.some((gap) => annotation.start > gap.start && annotation.start < gap.end)) return null
      return (
        <g key={index} fill={color} stroke={color}>
          <title>{`${annotation.label}: ${format(annotation.start)}${range ? `–${format(finish)}` : ''} ${timeUnit}`}</title>
          {range ? (
            <>
              <rect
                x={startX}
                y={y}
                width={endX - startX}
                height={span}
                fillOpacity={0.08}
                stroke="none"
                clipPath={`url(#${id}-visible)`}
              />
              <path
                d={`M${startX},${y + 18} V${y + 4} H${endX} V${y + 18}`}
                fill="none"
                strokeOpacity={0.65}
                clipPath={`url(#${id}-visible)`}
              />
            </>
          ) : (
            <line x1={startX} x2={startX} y1={y + 18} y2={y + span} strokeDasharray="3 4" strokeOpacity={0.65} />
          )}
          {range ? (
            <foreignObject
              x={x(labelRange!.start)}
              y={y + 5}
              width={x(labelRange!.end) - x(labelRange!.start)}
              height={Math.max(0, span - 5)}
            >
              <div
                data-annotation-label
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '0 8px',
                  color,
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: '14px',
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  overflowWrap: 'normal',
                  wordBreak: 'normal',
                }}
              >
                {annotation.label}
              </div>
            </foreignObject>
          ) : (
            <text
              x={Math.min(startX + 5, WIDTH - 8)}
              y={y + 16}
              textAnchor={startX > WIDTH - 100 ? 'end' : 'start'}
              stroke="none"
              fontSize={12}
              fontWeight={600}
            >
              {annotation.label}
            </text>
          )}
        </g>
      )
    })
  }

  return (
    <figure
      style={{
        margin: '1.5em 0',
        fontFamily: 'monospace',
        border: '1px solid color-mix(in srgb, currentColor 20%, transparent)',
        background: 'color-mix(in srgb, currentColor 3%, var(--color-background, white))',
      }}
    >
      <figcaption
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px 20px',
          padding: '12px',
          borderBottom: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
          background: 'color-mix(in srgb, currentColor 6%, var(--color-background, white))',
          fontSize: 13,
        }}
      >
        <strong>{title}</strong>
        <span style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span style={{ borderLeft: '1px solid color-mix(in srgb, currentColor 20%, transparent)', paddingLeft: 12 }}>
            <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.08em', opacity: 0.6 }}>Channels</span>
            {signals.length}
          </span>
          <span style={{ borderLeft: '1px solid color-mix(in srgb, currentColor 20%, transparent)', paddingLeft: 12 }}>
            <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.08em', opacity: 0.6 }}>Span</span>
            {format(end)} {timeUnit}
          </span>
        </span>
      </figcaption>
      {signals.length === 0 ? (
        <p style={{ padding: '0 16px' }}>No signals to display.</p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
          <svg
            ref={axisRef}
            data-waveform-axis
            viewBox={`0 0 ${LEFT} ${height}`}
            width={LEFT}
            height={height}
            aria-hidden="true"
            style={{ display: 'block', flexShrink: 0, background: 'color-mix(in srgb, currentColor 5%, var(--color-background, white))' }}
          >
            <line x1={LEFT - 0.5} x2={LEFT - 0.5} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.2} />
            {channels.map(({ signal, min, max, color }, index) => {
              const laneTop = top + index * LANE
              const unit = signal.type === 'analog' ? (signal.unit ?? '') : ''
              return (
                <g key={index}>
                  <line x1={0} x2={LEFT} y1={laneTop + LANE} y2={laneTop + LANE} stroke="currentColor" strokeOpacity={0.2} />
                  <text data-axis-label x={12} y={laneTop + 24} fill="currentColor" fillOpacity={0.5} fontSize={10} letterSpacing={1}>
                    CH {String(index + 1).padStart(2, '0')}
                  </text>
                  <rect x={12} y={laneTop + 45} width={3} height={32} fill={color} />
                  <text
                    data-axis-label
                    x={23}
                    y={laneTop + 58}
                    fill={color}
                    fontSize={13}
                    fontWeight={600}
                    style={{ textDecoration: signal.activeLow ? 'overline' : undefined }}
                  >
                    <title>{signal.name}</title>
                    {signal.name}
                  </text>
                  <text data-axis-label x={23} y={laneTop + 75} fill="currentColor" fillOpacity={0.55} fontSize={9} letterSpacing={0.5}>
                    {signal.type === 'analog' ? 'Analog' : signal.type === 'bus' ? 'Bus' : 'Digital'}
                  </text>
                  {signal.type !== 'bus' &&
                    [min, max].map((value, valueIndex) => (
                      <g key={valueIndex}>
                        <line
                          x1={LEFT - 5}
                          x2={LEFT}
                          y1={laneTop + (valueIndex === 0 ? 94 : 42)}
                          y2={laneTop + (valueIndex === 0 ? 94 : 42)}
                          stroke="currentColor"
                          strokeOpacity={0.4}
                        />
                        <text
                          data-axis-scale
                          x={LEFT - 12}
                          y={laneTop + (valueIndex === 0 ? 98 : 46)}
                          textAnchor="end"
                          fill="currentColor"
                          fontSize={10}
                        >
                          {format(value)}
                          {unit && ` ${unit}`}
                        </text>
                      </g>
                    ))}
                </g>
              )
            })}
          </svg>
          <div style={{ overflowX: 'auto', flex: 1, minWidth: 0 }} tabIndex={0} role="region" aria-label={`${title} waveform viewer`}>
            <div ref={plotRef} style={{ minWidth: MIN_PLOT_WIDTH, height }}>
              <svg
                height={height}
                role="img"
                aria-labelledby={`${id}-title ${id}-description`}
                style={{ display: 'block', width: '100%', overflow: 'hidden' }}
              >
                <title id={`${id}-title`}>{title}</title>
                <desc id={`${id}-description`}>
                  {`Waveforms from 0 to ${format(end)} ${timeUnit}. ${signals.map((signal) => `${signal.name} (${signal.type ?? 'digital'}${signal.activeLow ? ', active-low' : ''})${signal.annotations?.length ? `: ${signal.annotations.map((annotation) => annotation.label).join(', ')}` : ''}`).join('; ')}. ${annotations.map((annotation) => annotation.label).join(', ')}. ${skipped.map((range) => `Skipped ${format(range.start)}–${format(range.end)} ${timeUnit}`).join('; ')}`}
                </desc>
                <g transform={`translate(${-LEFT}, 0)`}>
                  <defs>
                    <clipPath id={`${id}-plot`}>
                      {visibleIntervals.map((range, index) => (
                        <rect key={index} x={x(range.start)} y={top} width={x(range.end) - x(range.start)} height={bottom - top} />
                      ))}
                    </clipPath>
                    <clipPath id={`${id}-visible`}>
                      {visibleIntervals.map((range, index) => {
                        const startX = range.start === 0 ? LEFT : x(range.start)
                        const endX = range.end === end ? WIDTH : x(range.end)
                        return <rect key={index} x={startX} y={0} width={endX - startX} height={height} />
                      })}
                    </clipPath>
                  </defs>
                  {ticks.map((time) => (
                    <g key={time} stroke="currentColor" fill="currentColor">
                      <line x1={x(time)} x2={x(time)} y1={top} y2={bottom} strokeOpacity={0.12} strokeDasharray="2 5" />
                      <text
                        x={x(time)}
                        y={bottom + 23}
                        stroke="none"
                        textAnchor={
                          time === 0 || skipped.some((range) => time === range.end)
                            ? 'start'
                            : time === end || skipped.some((range) => time === range.start)
                              ? 'end'
                              : 'middle'
                        }
                        fontSize={11}
                        fillOpacity={0.65}
                      >
                        {format(time)}
                      </text>
                    </g>
                  ))}
                  {channels.map(({ signal, points, transactions, min, max, end: channelEnd, color }, index) => {
                    const laneTop = top + index * LANE
                    const high = laneTop + 42
                    const low = laneTop + 94
                    const y = (value: number) => low - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * (low - high)
                    const digital = signal.type === undefined || signal.type === 'digital'
                    // Preserve analog interpolation in real time on either side of a compressed gap.
                    const renderPoints =
                      signal.type === 'analog'
                        ? points.flatMap((point, pointIndex) => {
                            const previous = points[pointIndex - 1]
                            if (point.value === null || previous?.value == null) return [point]
                            const clamp = (value: number) => Math.max(min, Math.min(max, value))
                            const boundaryPoints = skipped
                              .flatMap((range) => [range.start, range.end])
                              .filter((time) => time > previous.time && time < point.time)
                              .map((time) => ({
                                time,
                                value:
                                  clamp(previous.value!) +
                                  ((time - previous.time) / (point.time - previous.time)) * (clamp(point.value!) - clamp(previous.value!)),
                              }))
                            return [...boundaryPoints, point]
                          })
                        : points
                    const boundaryEdge = (time: number, side: 'before' | 'after'): BreakEdge => {
                      const center = (high + low) / 2
                      if (signal.type === 'bus') {
                        const active = transactions.find(
                          (transaction) =>
                            transaction.value !== null &&
                            (typeof transaction.value !== 'number' || Number.isFinite(transaction.value)) &&
                            (side === 'before'
                              ? transaction.start < time && transaction.end >= time
                              : transaction.start <= time && transaction.end > time)
                        )
                        return { levels: active && time !== active.start && time !== active.end ? [high, low] : [center], known: !!active }
                      }
                      const beforeIndex = renderPoints.findLastIndex((point) =>
                        digital && side === 'before' ? point.time < time : point.time <= time
                      )
                      const before = renderPoints[beforeIndex]
                      if (before?.value == null) return { levels: [center], known: false }
                      const after = renderPoints[beforeIndex + 1]
                      if (digital) {
                        return { levels: [y(before.value)], known: time <= (after?.time ?? channelEnd) }
                      }
                      if (before.time === time) return { levels: [y(before.value)], known: true }
                      if (after?.value != null) {
                        const level =
                          y(before.value) + ((time - before.time) / (after.time - before.time)) * (y(after.value) - y(before.value))
                        return { levels: [level], known: true }
                      }
                      return { levels: [y(before.value)], known: false }
                    }
                    let path = ''
                    let previous: WaveformPoint | null = null
                    for (const point of renderPoints) {
                      if (point.value === null) {
                        if (digital && previous?.value != null) path += ` H${x(point.time)}`
                        previous = null
                        continue
                      }
                      path +=
                        previous === null
                          ? ` M${x(point.time)},${y(point.value)}`
                          : digital
                            ? ` H${x(point.time)} V${y(point.value)}`
                            : ` L${x(point.time)},${y(point.value)}`
                      previous = point
                    }
                    if (digital && previous?.value != null) path += ` H${x(channelEnd)}`
                    const firstKnown = points.find((point) => point.value !== null && point.time <= end)
                    const lastKnownIndex = points.findLastIndex((point) => point.value !== null && point.time <= end)
                    const lastKnown = points[lastKnownIndex]
                    const nextPoint = points[lastKnownIndex + 1]
                    const knownTransactions = transactions.filter(
                      (transaction) =>
                        transaction.value !== null &&
                        transaction.start <= end &&
                        (typeof transaction.value !== 'number' || Number.isFinite(transaction.value))
                    )
                    let knownStart = firstKnown?.time
                    let knownEnd = lastKnown ? (digital ? Math.min(nextPoint?.time ?? channelEnd, end) : lastKnown.time) : undefined
                    let firstY = firstKnown?.value != null ? y(firstKnown.value) : (high + low) / 2
                    let lastY = lastKnown?.value != null ? y(lastKnown.value) : (high + low) / 2
                    if (signal.type === 'analog' && lastKnown?.value != null && nextPoint?.value != null && nextPoint.time > end) {
                      const fraction = (end - lastKnown.time) / (nextPoint.time - lastKnown.time)
                      knownEnd = end
                      lastY = y(lastKnown.value) + fraction * (y(nextPoint.value) - y(lastKnown.value))
                    }
                    if (signal.type === 'bus') {
                      knownStart = knownTransactions[0]?.start
                      knownEnd = knownTransactions.length
                        ? Math.min(end, Math.max(...knownTransactions.map((transaction) => transaction.end)))
                        : undefined
                      firstY = lastY = (high + low) / 2
                    }
                    const busGaps: WaveformBreak[] = []
                    let previousTransactionEnd = knownTransactions[0]?.end
                    for (const transaction of knownTransactions.slice(1)) {
                      if (previousTransactionEnd !== undefined && transaction.start > previousTransactionEnd) {
                        busGaps.push({ start: previousTransactionEnd, end: transaction.start })
                      }
                      previousTransactionEnd = Math.max(previousTransactionEnd ?? 0, transaction.end)
                    }
                    return (
                      <g key={index}>
                        <line
                          x1={LEFT}
                          x2={WIDTH}
                          y1={laneTop + LANE}
                          y2={laneTop + LANE}
                          stroke="currentColor"
                          strokeOpacity={0.2}
                          clipPath={`url(#${id}-visible)`}
                        />
                        {signal.type !== 'bus' &&
                          [min, max].map((value) => (
                            <g key={value}>
                              <line
                                x1={LEFT}
                                x2={WIDTH}
                                y1={y(value)}
                                y2={y(value)}
                                stroke="currentColor"
                                strokeOpacity={0.08}
                                clipPath={`url(#${id}-visible)`}
                              />
                            </g>
                          ))}
                        <g clipPath={`url(#${id}-plot)`}>
                          {transactions.map((transaction, transactionIndex) => {
                            if (
                              transaction.value === null ||
                              transaction.start >= end ||
                              (typeof transaction.value === 'number' && !Number.isFinite(transaction.value))
                            )
                              return null
                            const startX = x(transaction.start)
                            const endX = x(Math.min(transaction.end, end))
                            const labelRange = labelSpan(transaction.start, Math.min(transaction.end, end))
                            if (!labelRange) return null
                            const labelStart = x(labelRange.start)
                            const labelEnd = x(labelRange.end)
                            const bevel = Math.min(6, (endX - startX) / 4)
                            const centerY = (high + low) / 2
                            const label = transactionLabel(transaction.value)
                            const availableCharacters = Math.max(0, Math.floor((labelEnd - labelStart - 2 * bevel - 8) / 7.2))
                            const visibleLabel =
                              label.length <= availableCharacters
                                ? label
                                : availableCharacters > 1
                                  ? `${label.slice(0, availableCharacters - 1)}…`
                                  : ''
                            return (
                              <g key={transactionIndex} data-waveform-transaction>
                                <title>{`${label}: ${format(transaction.start)}–${format(transaction.end)} ${timeUnit}`}</title>
                                <path
                                  d={`M${startX},${centerY} L${startX + bevel},${high} H${endX - bevel} L${endX},${centerY} L${endX - bevel},${low} H${startX + bevel} Z`}
                                  fill={color}
                                  fillOpacity={0.08}
                                  stroke={color}
                                  strokeWidth={1.5}
                                />
                                <text x={(labelStart + labelEnd) / 2} y={centerY + 4} textAnchor="middle" fill={color} fontSize={12}>
                                  {visibleLabel}
                                </text>
                              </g>
                            )
                          })}
                          <path d={path} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                          {digital &&
                            ('showValues' in signal ? (signal.showValues ?? showValues) : showValues) &&
                            points.map((point, pointIndex) => {
                              const finish = Math.min(points[pointIndex + 1]?.time ?? channelEnd, end)
                              const labelRange = labelSpan(point.time, finish)
                              if (point.value === null || !labelRange || x(labelRange.end) - x(labelRange.start) < 16) return null
                              return (
                                <text
                                  key={pointIndex}
                                  x={(x(labelRange.start) + x(labelRange.end)) / 2}
                                  y={laneTop + 72}
                                  textAnchor="middle"
                                  fill={color}
                                  fontSize={12}
                                >
                                  {point.value ? '1' : '0'}
                                </text>
                              )
                            })}
                          {signal.type === 'analog' && points.length === 1 && points[0].value !== null && (
                            <circle cx={x(points[0].time)} cy={y(points[0].value)} r={3} fill={color} />
                          )}
                        </g>
                        <g
                          data-waveform-undetermined
                          stroke={color}
                          strokeWidth={1.5}
                          strokeDasharray="2 4"
                          strokeOpacity={0.65}
                          clipPath={`url(#${id}-visible)`}
                        >
                          <title>Undetermined outside the recorded waveform</title>
                          {busGaps.map((range, gapIndex) => (
                            <line key={gapIndex} x1={x(range.start)} x2={x(range.end)} y1={(high + low) / 2} y2={(high + low) / 2} />
                          ))}
                          {knownStart === undefined || knownEnd === undefined ? (
                            <line x1={LEFT} x2={WIDTH} y1={firstY} y2={firstY} />
                          ) : (
                            <>
                              <line x1={LEFT} x2={x(knownStart)} y1={firstY} y2={firstY} />
                              <line x1={x(knownEnd)} x2={WIDTH} y1={lastY} y2={lastY} />
                            </>
                          )}
                        </g>
                        {digital &&
                          'edgeArrows' in signal &&
                          signal.edgeArrows &&
                          points.map((point, pointIndex) => {
                            const previous = points[pointIndex - 1]
                            if (
                              point.value === null ||
                              previous?.value == null ||
                              point.value === previous.value ||
                              point.time > end ||
                              skipped.some((range) => point.time >= range.start && point.time < range.end)
                            )
                              return null
                            const edge = point.value > previous.value ? 'rising' : 'falling'
                            const selected = signal.edgeArrows
                            if (Array.isArray(selected) ? !selected.includes(point.time) : selected !== 'both' && selected !== edge)
                              return null
                            const edgeX = x(point.time)
                            const centerY = (high + low) / 2
                            const direction = edge === 'rising' ? -1 : 1
                            const tipY = centerY + direction * 10
                            return (
                              <g key={pointIndex} data-waveform-edge={edge}>
                                <title>{`${edge === 'rising' ? 'Rising' : 'Falling'} edge at ${format(point.time)} ${timeUnit}`}</title>
                                <path
                                  d={`M${edgeX},${centerY - direction * 10} V${tipY} M${edgeX - 4},${tipY - direction * 6} L${edgeX},${tipY} L${edgeX + 4},${tipY - direction * 6}`}
                                  fill="none"
                                  stroke={color}
                                  strokeWidth={2}
                                  strokeLinejoin="miter"
                                />
                              </g>
                            )
                          })}
                        {annotationElements(signal.annotations ?? [], laneTop + 2, LANE - 8, color)}
                        {breakMarks(
                          (range) => ({ before: boundaryEdge(range.start, 'before'), after: boundaryEdge(range.end, 'after') }),
                          color
                        )}
                      </g>
                    )
                  })}
                  {annotationElements(annotations, 8, bottom - 8, 'currentColor')}
                  {skipped.map((range, index) => (
                    <g key={index} data-axis-break>
                      <title>{`Skipped ${format(range.start)}–${format(range.end)} ${timeUnit}`}</title>
                      <line
                        x1={x(range.start)}
                        x2={x(range.end)}
                        y1={bottom}
                        y2={bottom}
                        stroke="currentColor"
                        strokeOpacity={0.4}
                        strokeDasharray="2 4"
                      />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>
          <span
            data-axis-unit
            title="Time unit"
            style={{
              position: 'absolute',
              right: 8,
              top: height - 18,
              fontSize: 10,
              lineHeight: '12px',
              opacity: 0.65,
              pointerEvents: 'none',
            }}
          >
            {timeUnit}
          </span>
        </div>
      )}
    </figure>
  )
}
