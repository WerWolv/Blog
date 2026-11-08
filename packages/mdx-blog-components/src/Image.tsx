import { getImage } from 'astro:assets'
import type { ImageMetadata } from 'astro'

type ResolvedImageSource = string | ImageMetadata | { src: string; width?: number; height?: number }

export type ImageSource =
  ResolvedImageSource | { default: ResolvedImageSource } | Promise<ResolvedImageSource | { default: ResolvedImageSource }>

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

function resolveSrcValue(value: unknown): ResolvedImageSource {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    throw new Error('Image source is invalid.')
  }

  if ('default' in value) {
    return resolveSrcValue((value as { default: unknown }).default)
  }

  if ('src' in value && typeof (value as { src: unknown }).src === 'string') {
    // Preserve imported metadata (including Astro's internal file reference).
    return value as Exclude<ResolvedImageSource, string>
  }

  throw new Error('Image source must be a string or an object with a src field.')
}

export default async function Image({ src, class: classProp, className, alt, width, height, ...attributes }: Props) {
  if (alt === undefined || alt === null) {
    throw new Error('Image is missing required alt text.')
  }

  const resolved = resolveSrcValue(await Promise.resolve(src))
  const metadata = typeof resolved === 'object' && 'format' in resolved ? resolved : undefined
  const source = metadata ?? (typeof resolved === 'string' ? resolved : resolved.src)
  // Let Astro infer the other dimension for imports when only one is specified.
  const dimensions = !metadata && typeof resolved === 'object' ? resolved : undefined
  const image = await getImage({
    src: source,
    width: normalizeDimension(width) ?? dimensions?.width,
    height: normalizeDimension(height) ?? dimensions?.height,
  })
  const finalClassName = className ?? classProp

  return (
    <img
      {...image.attributes}
      {...attributes}
      src={image.src}
      srcSet={image.srcSet.attribute || attributes.srcSet}
      alt={alt}
      className={finalClassName}
    />
  )
}
