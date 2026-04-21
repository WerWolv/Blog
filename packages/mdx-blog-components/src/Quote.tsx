export default function Quote({ author, title, children }: { author?: string; title?: string; children: React.ReactNode }) {
  return (
    <figure className="my-8 rounded-s bg-neutral-50 dark:bg-neutral-900/50 p-6 sm:p-8 flex items-start gap-4 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div className="text-indigo-500/30 shrink-0 pt-1">
        <span className="icon-[lucide--quote] block size-8" aria-hidden="true"></span>
      </div>
      <div className="flex-1 w-0">
        <div className="text-lg/relaxed font-medium italic text-neutral-800 dark:text-neutral-200 m-0 p-0 border-0"></div>
        {children}
        {(author || title) && (
          <figcaption className="mt-4 flex items-center gap-2">
            {author && <span className="font-semibold text-neutral-900 dark:text-white">{author}</span>}
            {author && title && <span className="text-neutral-400 dark:text-neutral-500">—</span>}
            {title && <span className="text-sm text-neutral-500 dark:text-neutral-400">{title}</span>}
          </figcaption>
        )}
      </div>
    </figure>
  )
}
