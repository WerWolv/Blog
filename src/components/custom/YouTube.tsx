export interface Props {
  id: string
  start?: string | number
}

export default function YouTube({ id, start }: Props) {
  const src = start ? `https://www.youtube.com/embed/${id}?start=${start}` : `https://www.youtube.com/embed/${id}`

  return (
    <div
      className="my-8 relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
      style={{ paddingBottom: '56.25%' }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full border-0"
        src={src}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  )
}
