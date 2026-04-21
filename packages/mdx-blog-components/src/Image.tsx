export type ImageSource =
  | string
  | { src: string; width?: number; height?: number }
  | { default: string | { src: string; width?: number; height?: number } }
  | Promise<
      string | { src: string; width?: number; height?: number } | { default: string | { src: string; width?: number; height?: number } }
    >

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: ImageSource
  class?: string
}

function normalizeDimension(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function resolveSrcValue(value: unknown): { src: string; width?: number; height?: number } {
  if (typeof value === 'string') {
    return { src: value }
  }

  if (!value || typeof value !== 'object') {
    throw new Error('Image source is invalid.')
  }

  if ('default' in value) {
    return resolveSrcValue((value as { default: unknown }).default)
  }

  if ('src' in value && typeof (value as { src: unknown }).src === 'string') {
    return {
      src: (value as { src: string }).src,
      width: normalizeDimension((value as { width?: unknown }).width),
      height: normalizeDimension((value as { height?: unknown }).height),
    }
  }

  throw new Error('Image source must be a string or an object with a src field.')
}

export default async function Image({ src, class: classProp, className, alt, width, height, ...attributes }: Props) {
  if (alt === undefined || alt === null) {
    throw new Error('Image is missing required alt text.')
  }

  const resolved = resolveSrcValue(await Promise.resolve(src))
  const finalClassName = className ?? classProp

  return (
    <img
      src={resolved.src}
      alt={alt}
      width={normalizeDimension(width) ?? resolved.width}
      height={normalizeDimension(height) ?? resolved.height}
      className={finalClassName}
      {...attributes}
    />
  )
}
