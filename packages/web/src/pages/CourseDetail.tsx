import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)

  useEffect(() => {
    // biome-ignore lint/style/noNonNullAssertion: id is always present when this route renders
    api.api.courses[':id'].$get({ param: { id: id! } }).then(async (res) => {
      if (res.ok) setCourse((await res.json()) as Course)
    })
  }, [id])

  if (!course) return <div className="p-8 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <Button variant="ghost" className="self-start" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold leading-snug">{course.title}</h1>
        {course.hasLeftoverSpots && <Badge variant="destructive">Spots available</Badge>}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">{course.type}</Badge>
        <span className="text-muted-foreground">{course.courseNumber}</span>
        {course.ects != null && <span>{course.ects} ECTS</span>}
        {course.language && <span>{course.language}</span>}
      </div>
      {(course.instructors as string[]).length > 0 && (
        <p className="text-sm">
          <strong>Instructors:</strong> {(course.instructors as string[]).join(', ')}
        </p>
      )}
      {course.maxParticipants != null && (
        <p className="text-sm">
          <strong>Max participants:</strong> {course.maxParticipants}
        </p>
      )}
      {course.description && (
        <section>
          <h2 className="font-semibold mb-1">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{course.description}</p>
        </section>
      )}
      {course.prerequisites && (
        <section>
          <h2 className="font-semibold mb-1">Prerequisites</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {course.prerequisites}
          </p>
        </section>
      )}
      <a
        href={course.tumonlineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        View on TUMonline →
      </a>
    </div>
  )
}
