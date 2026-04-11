import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts'

interface Signal {
  name: string
  color: string
}

interface OscilloscopeProps {
  signals: Signal[]
  channelData?: number[][]
  annotations?: Annotation[]
  sampleRate?: number
  windowSize?: number
}

interface Annotation {
  label: string
  bit?: number
  fromBit?: number
  toBit?: number
  color?: string
}

interface DataPoint {
  time: number
  [key: string]: number | null
}

export default function Oscilloscope({ signals, channelData = [], annotations = [], sampleRate = 60, windowSize = 16 }: OscilloscopeProps) {
  const SAMPLE_RATE = sampleRate
  const WINDOW_SIZE = windowSize
  const BIT_SHIFT = 1
  const MAX_VOLTAGE = signals.length * 1.5 + 0.5
  const MIN_VOLTAGE = -0.5

  const data = useMemo(() => {
    return Array.from({ length: WINDOW_SIZE }, (_, i) => {
      const point: DataPoint = { time: (i + BIT_SHIFT) / SAMPLE_RATE }

      signals.forEach((signal, idx) => {
        const offset = (signals.length - 1 - idx) * 1.5
        const samples = channelData[idx]
        const sampleCount = samples?.length ?? 0
        const hasSample = i < sampleCount
        const isBoundaryPoint = sampleCount > 0 && i === sampleCount
        const value = hasSample ? (samples?.[i] ?? 0) : isBoundaryPoint ? (samples?.[sampleCount - 1] ?? 0) : null
        point[signal.name.toLowerCase()] = value === null ? null : value + offset
      })

      return point
    })
  }, [signals, channelData, SAMPLE_RATE, WINDOW_SIZE])

  const preBitData = useMemo(() => {
    return signals.map((_, idx) => {
      const offset = (signals.length - 1 - idx) * 1.5
      const samples = channelData[idx]
      const firstValue = samples && samples.length > 0 ? (samples[0] ?? 0) : 0
      return [
        { time: 0, value: offset },
        { time: BIT_SHIFT / SAMPLE_RATE, value: offset },
        { time: BIT_SHIFT / SAMPLE_RATE, value: firstValue + offset },
      ]
    })
  }, [signals, channelData, SAMPLE_RATE, BIT_SHIFT])

  const postBitData = useMemo(() => {
    return signals.map((_, idx) => {
      const offset = (signals.length - 1 - idx) * 1.5
      const samples = channelData[idx]
      const sampleCount = Math.min(samples?.length ?? 0, WINDOW_SIZE)
      const tailStart = (sampleCount + BIT_SHIFT) / SAMPLE_RATE
      const tailEnd = WINDOW_SIZE / SAMPLE_RATE

      if (tailStart >= tailEnd) return []

      const lastSample = sampleCount > 0 ? (samples?.[sampleCount - 1] ?? 0) : 0
      const lastValue = lastSample + offset
      const zeroValue = offset

      return [
        { time: tailStart, value: lastValue },
        { time: tailStart, value: zeroValue },
        { time: tailEnd, value: zeroValue },
      ]
    })
  }, [signals, channelData, SAMPLE_RATE, WINDOW_SIZE, BIT_SHIFT])

  // Generate Y-axis ticks and labels
  const yTicks = signals.map((_, idx) => (signals.length - 1 - idx) * 1.5 + 0.5)
  const yTickFormatter = (value: number): string => {
    const idx = signals.findIndex((_, i) => Math.abs(value - ((signals.length - 1 - i) * 1.5 + 0.5)) < 0.1)
    return idx >= 0 ? signals[idx].name : ''
  }

  const normalizedAnnotations = useMemo(() => {
    return annotations
      .map((annotation, idx) => {
        const color = annotation.color ?? '#f7b500'

        if (typeof annotation.bit === 'number') {
          if (annotation.bit < 0 || annotation.bit >= WINDOW_SIZE) return null
          return {
            key: `bit-${idx}`,
            kind: 'bit' as const,
            label: annotation.label,
            color,
            x: (annotation.bit + BIT_SHIFT) / SAMPLE_RATE,
          }
        }

        if (typeof annotation.fromBit === 'number' && typeof annotation.toBit === 'number') {
          const start = Math.max(0, Math.min(annotation.fromBit, annotation.toBit))
          const end = Math.min(WINDOW_SIZE - 1, Math.max(annotation.fromBit, annotation.toBit))
          if (end < 0 || start >= WINDOW_SIZE) return null

          return {
            key: `range-${idx}`,
            kind: 'range' as const,
            label: annotation.label,
            color,
            x1: (start + BIT_SHIFT) / SAMPLE_RATE,
            x2: (end + BIT_SHIFT + 1) / SAMPLE_RATE,
          }
        }

        return null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [annotations, SAMPLE_RATE, WINDOW_SIZE, BIT_SHIFT])

  return (
    <div
      style={{
        width: '100%',
        height: '400px',
        backgroundColor: 'transparent',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
          {signals.map((signal, idx) => (
            <div key={idx} style={{ color: signal.color }}>
              ● {signal.name}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 0, right: 15, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis type="number" dataKey="time" stroke="#666" tick={false} domain={[0, 'dataMax']} />
          <YAxis stroke="#666" tick={{ fill: '#888' }} domain={[MIN_VOLTAGE, MAX_VOLTAGE]} ticks={yTicks} tickFormatter={yTickFormatter} />
          {signals.map((signal, idx) => (
            <Line
              key={`pre-${idx}`}
              data={preBitData[idx]}
              type="linear"
              dataKey="value"
              stroke={signal.color}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              strokeWidth={1.2}
              isAnimationActive={false}
            />
          ))}
          {normalizedAnnotations.map((annotation) => {
            if (annotation.kind === 'range') {
              return (
                <ReferenceArea
                  key={annotation.key}
                  x1={annotation.x1}
                  x2={annotation.x2}
                  y1={MIN_VOLTAGE}
                  y2={MAX_VOLTAGE}
                  stroke={annotation.color}
                  strokeOpacity={0.55}
                  fill={annotation.color}
                  fillOpacity={0.12}
                  label={{ value: annotation.label, position: 'insideTop', fill: annotation.color, fontSize: 11 }}
                />
              )
            }

            return (
              <ReferenceLine
                key={annotation.key}
                x={annotation.x - 0.08 / SAMPLE_RATE}
                stroke={annotation.color}
                strokeDasharray="4 8"
                ifOverflow="visible"
                label={{ value: annotation.label, position: 'insideTopLeft', fill: annotation.color, fontSize: 11 }}
              />
            )
          })}
          {signals.map((signal, idx) => (
            <Line
              key={`post-${idx}`}
              data={postBitData[idx]}
              type="linear"
              dataKey="value"
              stroke={signal.color}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              strokeWidth={1.2}
              isAnimationActive={false}
            />
          ))}
          {signals.map((signal, idx) => (
            <Line
              key={idx}
              type="stepAfter"
              dataKey={signal.name.toLowerCase()}
              stroke={signal.color}
              dot={false}
              activeDot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
