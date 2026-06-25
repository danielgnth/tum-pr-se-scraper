import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router'
import type { Course } from 'server/src/db/schema'

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link to={`/courses/${course.id}`} className="block no-underline">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
            {course.hasLeftoverSpots && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                Spots available
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{course.type}</Badge>
            <span>{course.courseNumber}</span>
            {course.ects != null && <span>{course.ects} ECTS</span>}
            {course.language && <span>{course.language}</span>}
            {(course.instructors as string[]).length > 0 && (
              <span>{(course.instructors as string[]).join(', ')}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
