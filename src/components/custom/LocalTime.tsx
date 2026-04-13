function getTimeZoneOffset(date: Date, timeZone: string): number {
  let iso = date.toLocaleString('en-CA', { timeZone, hour12: false }).replace(', ', 'T')
  iso += '.' + date.getMilliseconds().toString().padStart(3, '0')

  const lie: Date = new Date(iso + 'Z')
  return -(lie.getTime() - date.getTime()) / 60 / 1000
}

function convertTime(time24h: string, fromTimezone: string): string {
  const [hours, minutes] = time24h.split(':').map(Number)

  const now = new Date()
  const referenceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

  const fromOffset = getTimeZoneOffset(referenceDate, fromTimezone)
  const toOffset = getTimeZoneOffset(referenceDate, Intl.DateTimeFormat().resolvedOptions().timeZone)
  const offsetDiff = toOffset - fromOffset

  let localMinutes = hours * 60 + minutes + offsetDiff
  localMinutes = (localMinutes + 24 * 60) % (24 * 60)

  const localHours = Math.floor(localMinutes / 60)
  const localMinutesRemainder = localMinutes % 60

  return `${localHours.toString().padStart(2, '0')}:${localMinutesRemainder.toString().padStart(2, '0')}`
}

export default function LocalTime({ time24h, fromTimezone }: { time24h: string; fromTimezone: string }) {
  return <span>{convertTime(time24h, fromTimezone)}</span>
}
