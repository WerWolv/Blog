function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatArchiveTimestamp(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('ArchivedLink received an invalid date')
  }

  return [
    date.getUTCFullYear().toString().padStart(4, '0'),
    padTwoDigits(date.getUTCMonth() + 1),
    padTwoDigits(date.getUTCDate()),
    padTwoDigits(date.getUTCHours()),
    padTwoDigits(date.getUTCMinutes()),
    padTwoDigits(date.getUTCSeconds()),
  ].join('')
}

function normalizeArchiveTimestamp(date: string | Date): string {
  if (date instanceof Date) {
    return formatArchiveTimestamp(date)
  }

  const trimmedDate = date.trim()
  const compactTimestampMatch = trimmedDate.match(/^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?$/)

  if (compactTimestampMatch) {
    const [, year, month = '01', day = '01', hour = '00', minute = '00', second = '00'] = compactTimestampMatch
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  return formatArchiveTimestamp(new Date(trimmedDate))
}

function buildArchiveHref(link: string, date: string | Date): string {
  const normalizedLink = new URL(link).href
  const timestamp = normalizeArchiveTimestamp(date)
  return `https://web.archive.org/web/${timestamp}/${normalizedLink}`
}

type ArchivedLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  link: string
  date: string | Date
}

export default function ArchivedLink({
  link,
  date,
  children,
  className = 'text-primary hover:underline',
  rel,
  target = '_blank',
  ...props
}: ArchivedLinkProps) {
  const href = buildArchiveHref(link, date)

  return (
    <a href={href} className={className} target={target} rel={rel ?? 'noopener noreferrer'} {...props}>
      <span className="icon-[lucide--archive] size-3.5 mr-0.5"></span>
      {children ?? link}
    </a>
  )
}
