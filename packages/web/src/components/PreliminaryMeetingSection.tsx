import { Badge } from '@/components/ui/badge'
import { isMeetingOutdated, parseMeetingDate, relativeMeetingTime } from '@/lib/meetingDate'
import { cn } from '@/lib/utils'

interface Props {
  date: string | null
  platform: string | null
  link: string | null
}

export function PreliminaryMeetingSection({ date, platform, link }: Props) {
  if (!date && !platform && !link) return null

  const meetingDate = parseMeetingDate(date)
  const isPast = meetingDate ? meetingDate.getTime() < Date.now() : null
  const isOutdated = meetingDate ? isMeetingOutdated(meetingDate) : false

  return (
    <section
      className={cn(
        'rounded-lg border p-3 flex flex-col gap-1.5',
        isOutdated && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/40',
        !isOutdated &&
          isPast === false &&
          'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
        !isOutdated && isPast !== false && 'border-border bg-muted/40',
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-sm">Preliminary Meeting</h2>
        {meetingDate && (
          <span
            className={cn(
              'text-xs font-medium rounded-full px-2 py-0.5',
              isOutdated
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                : isPast
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
            )}
          >
            {isOutdated ? 'Outdated' : isPast ? 'Past' : 'Upcoming'} ·{' '}
            {relativeMeetingTime(meetingDate)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {date && (
          <span
            className={cn(
              'font-mono',
              isPast ? 'text-muted-foreground' : 'text-green-800 dark:text-green-400',
            )}
          >
            {date}
          </span>
        )}
        {platform && <Badge variant="outline">{platform}</Badge>}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Join meeting →
          </a>
        )}
      </div>
    </section>
  )
}
