import { cn } from '~/lib/utils'

interface Props {
  icon?: string
  colorClass?: string
  lineColorClass?: string
}

export default function Divider({
  icon = 'lucide--sparkles',
  colorClass = 'text-indigo-300 dark:text-indigo-700',
  lineColorClass = 'text-neutral-200 dark:text-neutral-800',
}: Props) {
  return (
    <div className={cn('my-12 flex items-center justify-center gap-4', lineColorClass)}>
      <div className="h-px bg-linear-to-r from-transparent to-current flex-1"></div>
      <span className={cn(`icon-[${icon}]`, 'block size-4', colorClass)} aria-hidden="true"></span>
      <div className="h-px bg-linear-to-l from-transparent to-current flex-1"></div>
    </div>
  )
}
