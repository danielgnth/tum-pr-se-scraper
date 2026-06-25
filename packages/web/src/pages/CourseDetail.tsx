import { PreliminaryMeetingSection } from '@/components/PreliminaryMeetingSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCoursePreferences } from '@/lib/coursePreferences'
import { cn } from '@/lib/utils'
import { EyeOff, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'

function loadNote(id: string): string {
  try {
    return (
      (JSON.parse(localStorage.getItem('course-notes') ?? '{}') as Record<string, string>)[id] ?? ''
    )
  } catch {
    return ''
  }
}

function saveNote(id: string, text: string) {
  try {
    const all = JSON.parse(localStorage.getItem('course-notes') ?? '{}') as Record<string, string>
    if (text.trim()) all[id] = text
    else delete all[id]
    localStorage.setItem('course-notes', JSON.stringify(all))
  } catch {}
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [note, setNoteText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { favorites, dismissed, toggleFavorite, toggleDismiss } = useCoursePreferences()

  useEffect(() => {
    // biome-ignore lint/style/noNonNullAssertion: id is always present when this route renders
    api.api.courses[':id'].$get({ param: { id: id! } }).then(async (res) => {
      if (res.ok) setCourse((await res.json()) as Course)
    })
  }, [id])

  useEffect(() => {
    if (course) setNoteText(loadNote(course.tumonlineId))
  }, [course])

  function handleNoteChange(text: string) {
    if (!course) return
    setNoteText(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(course.tumonlineId, text), 400)
  }

  if (!course) return <div className="p-8 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="self-start" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleFavorite(course.tumonlineId)}
            className={cn(
              'p-1.5 rounded hover:bg-amber-100 transition-colors',
              favorites.has(course.tumonlineId)
                ? 'text-amber-400'
                : 'text-muted-foreground/40 hover:text-amber-400',
            )}
            title={favorites.has(course.tumonlineId) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={cn('w-5 h-5', favorites.has(course.tumonlineId) && 'fill-amber-400')}
            />
          </button>
          <button
            type="button"
            onClick={() => toggleDismiss(course.tumonlineId)}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              dismissed.has(course.tumonlineId)
                ? 'text-muted-foreground'
                : 'text-muted-foreground/40 hover:text-muted-foreground',
            )}
            title={dismissed.has(course.tumonlineId) ? 'Restore course' : 'Not interested'}
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold leading-snug">{course.title}</h1>
        {course.hasLeftoverSpots && (
          <Badge className="bg-green-600 text-white hover:bg-green-600">Spots available</Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">{course.type}</Badge>
        <span className="text-muted-foreground">{course.courseNumber}</span>
        {course.language && <span>{course.language}</span>}
        {course.onlineMode && (
          <Badge variant="outline">{course.onlineMode === 'online' ? 'Online' : 'In person'}</Badge>
        )}
      </div>
      {(course.instructors as string[]).length > 0 && (
        <p className="text-sm">
          <strong>Instructors:</strong> {(course.instructors as string[]).join(', ')}
        </p>
      )}
      <PreliminaryMeetingSection
        date={course.preliminaryMeetingDate}
        platform={course.preliminaryMeetingPlatform}
        link={course.preliminaryMeetingLink}
      />
      {course.registrationInfo && (
        <section>
          <h2 className="font-semibold mb-1">Registration & Preliminary Meeting</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {course.registrationInfo}
          </p>
        </section>
      )}
      {course.description && (
        <section>
          <h2 className="font-semibold mb-1">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{course.description}</p>
        </section>
      )}
      {course.courseObjective && (
        <section>
          <h2 className="font-semibold mb-1">Objectives</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {course.courseObjective}
          </p>
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
      {course.teachingMethod && (
        <section>
          <h2 className="font-semibold mb-1">Teaching Method</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {course.teachingMethod}
          </p>
        </section>
      )}
      <section>
        <h2 className="font-semibold mb-1">Notes</h2>
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Add your personal notes here…"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
        />
      </section>
      <a
        href={course.tumonlineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        View on TUMonline →
      </a>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Debug (ID: {course.id})</summary>
        <pre className="mt-2 p-3 bg-muted rounded overflow-auto text-xs whitespace-pre-wrap break-all">
          {JSON.stringify(course, null, 2)}
        </pre>
      </details>
    </div>
  )
}
