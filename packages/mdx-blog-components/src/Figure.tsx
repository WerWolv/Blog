import Image, { type ImageSource } from './Image'
import { cn } from './utils'

interface Props {
  src: ImageSource
  alt: string
  className?: string
  class?: string
}

export default function Figure({ src, alt, className, class: classProp }: Props) {
  return (
    <figure>
      <Image src={src as any} alt={alt} class={cn('rounded-sm shadow-lg my-6 flex flex-col items-center', className, classProp)} />
      <figcaption className="-m-3">{alt}</figcaption>
    </figure>
  )
}
