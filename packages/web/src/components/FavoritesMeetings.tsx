import { parseMeetingDate, relativeMeetingTime } from '@/lib/meetingDate'
import { cn } from '@/lib/utils'
import { Link } from 'react-router'
import type { Course } from 'server/src/db/schema'

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  favorites: Set<string>
  courses: Course[]
}

export function FavoritesMeetings({ favorites, courses }: Props) {
  const entries = courses
    .filter((c) => favorites.has(c.tumonlineId) && c.preliminaryMeetingDate)
    .flatMap((c) => {
      const date = parseMeetingDate(c.preliminaryMeetingDate)
      return date ? [{ course: c, date }] : []
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (entries.length === 0) return null

  const now = new Date()

  return (
    <div className="rounded-lg border bg-card divide-y">
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Favorited Meetings
      </p>
      {entries.map(({ course, date }) => {
        const isPast = date < now
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0
        const dateLabel = `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${MONTH_NAMES[date.getMonth()]}`
        const timeLabel = hasTime
          ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
          : null

        return (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors no-underline group"
          >
            <div
              className={cn(
                'flex flex-col shrink-0 w-28',
                isPast ? 'text-muted-foreground' : 'text-primary',
              )}
            >
              <span className="text-xs font-medium tabular-nums">{dateLabel}</span>
              {timeLabel && <span className="text-xs tabular-nums">{timeLabel}</span>}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'text-sm truncate group-hover:underline',
                  isPast && 'text-muted-foreground',
                )}
              >
                {course.title}
              </span>
              {course.preliminaryMeetingPlatform && (
                <span className="text-xs text-muted-foreground">
                  {course.preliminaryMeetingPlatform}
                </span>
              )}
            </div>
            <span
              className={cn(
                'ml-auto text-xs shrink-0 font-medium',
                isPast ? 'text-muted-foreground' : 'text-primary',
              )}
            >
              {relativeMeetingTime(date)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
