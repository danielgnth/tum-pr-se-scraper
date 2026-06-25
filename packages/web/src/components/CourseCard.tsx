import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isMeetingOutdated, parseMeetingDate, relativeMeetingTime } from '@/lib/meetingDate'
import { cn } from '@/lib/utils'
import { EyeOff, Star } from 'lucide-react'
import { Link } from 'react-router'
import type { Course } from 'server/src/db/schema'

interface Props {
  course: Course
  isFavorite?: boolean
  isDismissed?: boolean
  onFavorite?: (id: string) => void
  onDismiss?: (id: string) => void
}

export function CourseCard({ course, isFavorite, isDismissed, onFavorite, onDismiss }: Props) {
  const meetingDate = parseMeetingDate(course.preliminaryMeetingDate)
  const isPast = meetingDate ? meetingDate.getTime() < Date.now() : null
  const isOutdated = meetingDate ? isMeetingOutdated(meetingDate) : false

  function stopAndCall(e: React.MouseEvent, fn?: (id: string) => void) {
    e.preventDefault()
    e.stopPropagation()
    fn?.(String(course.id))
  }

  return (
    <Link to={`/courses/${course.id}`} className="block no-underline">
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow gap-2',
          isFavorite && 'border-amber-300 bg-amber-50/30',
          isDismissed && 'opacity-50',
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {isFavorite && (
                <Star className="inline-block w-3.5 h-3.5 mb-0.5 mr-1 fill-amber-400 text-amber-400" />
              )}
              {course.title}
            </CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              {course.hasLeftoverSpots && (
                <Badge className="text-xs bg-green-100 text-gray-500">Spots available</Badge>
              )}
              <button
                type="button"
                onClick={(e) => stopAndCall(e, onFavorite)}
                className={cn(
                  'p-1 rounded hover:bg-amber-100 transition-colors',
                  isFavorite ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400',
                )}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={cn('w-4 h-4', isFavorite && 'fill-amber-400')} />
              </button>
              <button
                type="button"
                onClick={(e) => stopAndCall(e, onDismiss)}
                className={cn(
                  'p-1 rounded hover:bg-muted transition-colors',
                  isDismissed
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/40 hover:text-muted-foreground',
                )}
                title={isDismissed ? 'Restore course' : 'Not interested'}
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{course.type}</Badge>
            <span>{course.courseNumber}</span>
            {course.language && <span>{course.language}</span>}
            {course.onlineMode && (
              <span>{course.onlineMode === 'online' ? 'Online' : 'In person'}</span>
            )}
            {(course.instructors as string[]).length > 0 && (
              <span>{(course.instructors as string[]).join(', ')}</span>
            )}
          </div>
          {(course.preliminaryMeetingDate || course.preliminaryMeetingPlatform) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-muted-foreground text-xs">Prelim. meeting:</span>
              {course.preliminaryMeetingDate && meetingDate && (
                <span
                  className={cn(
                    'font-mono text-xs',
                    isPast ? 'text-muted-foreground line-through' : 'text-green-700',
                  )}
                >
                  {course.preliminaryMeetingDate}
                </span>
              )}
              {meetingDate && (
                <span
                  className={cn(
                    'text-xs font-medium rounded-full px-1.5 py-0',
                    isOutdated
                      ? 'text-amber-700 bg-amber-50'
                      : isPast
                        ? 'text-muted-foreground bg-muted'
                        : 'text-green-700 bg-green-50',
                  )}
                >
                  {isOutdated ? 'Outdated' : relativeMeetingTime(meetingDate)}
                </span>
              )}
              {course.preliminaryMeetingPlatform && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {course.preliminaryMeetingPlatform}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
