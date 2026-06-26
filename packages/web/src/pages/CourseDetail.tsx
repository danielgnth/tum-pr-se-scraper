import { PreliminaryMeetingSection } from '@/components/PreliminaryMeetingSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type CourseOverride,
  applyOverride,
  clearOverride,
  loadOverrides,
  saveOverride,
} from '@/lib/courseOverrides'
import { useCoursePreferences } from '@/lib/coursePreferences'
import { cn } from '@/lib/utils'
import { EyeOff, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLoaderData, useLocation, useNavigate, useRevalidator } from 'react-router'
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

export async function clientLoader({ params }: { params: { id?: string } }) {
  const id = params.id
  if (!id) return { course: null, override: {} as CourseOverride }
  const res = await api.api.courses[':id'].$get({ param: { id } })
  if (!res.ok) return { course: null, override: {} as CourseOverride }
  const course = (await res.json()) as Course
  const override = loadOverrides()[course.tumonlineId] ?? {}
  return { course: applyOverride(course, override), override }
}

export default function CourseDetail() {
  const loaderData = useLoaderData<typeof clientLoader>()
  const { revalidate } = useRevalidator()
  const navigate = useNavigate()
  const location = useLocation()
  const [note, setNoteText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { favorites, dismissed, toggleFavorite, toggleDismiss } = useCoursePreferences()

  const [editingOverride, setEditingOverride] = useState(false)
  const [draftDate, setDraftDate] = useState('')
  const [draftPlatform, setDraftPlatform] = useState('')
  const [draftRoom, setDraftRoom] = useState('')
  const [draftLink, setDraftLink] = useState('')

  // biome-ignore lint/correctness/useExhaustiveDependencies: dev SSR workaround — same as CourseList
  useEffect(() => {
    if (!loaderData) navigate(location, { replace: true })
  }, [])

  const course = loaderData?.course
  const activeOverride = loaderData?.override ?? {}
  const hasOverride = Object.keys(activeOverride).length > 0

  useEffect(() => {
    if (course) setNoteText(loadNote(course.tumonlineId))
  }, [course])

  useEffect(() => {
    if (course) {
      setDraftDate(course.preliminaryMeetingDate ?? '')
      setDraftPlatform(course.preliminaryMeetingPlatform ?? '')
      setDraftRoom(activeOverride.room ?? '')
      // If the link was auto-generated from a room override, don't pre-fill the link field
      setDraftLink(activeOverride.room ? '' : (course.preliminaryMeetingLink ?? ''))
    }
  }, [course, activeOverride])

  function handleNoteChange(text: string) {
    if (!course) return
    setNoteText(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(course.tumonlineId, text), 400)
  }

  function handleSaveOverride() {
    if (!course) return
    const override: CourseOverride = {}
    if (draftDate.trim()) override.preliminaryMeetingDate = draftDate.trim()
    if (draftPlatform.trim()) override.preliminaryMeetingPlatform = draftPlatform.trim()
    if (draftRoom.trim()) {
      override.room = draftRoom.trim()
      // nav link is auto-generated from room; don't store an explicit link
    } else if (draftLink.trim()) {
      override.preliminaryMeetingLink = draftLink.trim()
    }
    if (Object.keys(override).length > 0) {
      saveOverride(course.tumonlineId, override)
    } else {
      clearOverride(course.tumonlineId)
    }
    revalidate()
    setEditingOverride(false)
  }

  function handleClearOverride() {
    if (!course) return
    clearOverride(course.tumonlineId)
    revalidate()
    setEditingOverride(false)
  }

  if (!course) return <div className="p-8 text-center text-muted-foreground">Loading…</div>

  const inputClass =
    'w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'

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
        {course.types.map((t) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Meeting override</span>
          {hasOverride && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Active</span>
          )}
          <button
            type="button"
            onClick={() => setEditingOverride((v) => !v)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {editingOverride ? 'Cancel' : 'Edit'}
          </button>
          {hasOverride && !editingOverride && (
            <button
              type="button"
              onClick={handleClearOverride}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {editingOverride && (
          <div className="flex flex-col gap-2 pl-0.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="override-date" className="text-xs text-muted-foreground">
                Date
              </label>
              <input
                id="override-date"
                type="text"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                placeholder="e.g. Mon 14.07.2025 14:00"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="override-platform" className="text-xs text-muted-foreground">
                Platform
              </label>
              <input
                id="override-platform"
                type="text"
                value={draftPlatform}
                onChange={(e) => setDraftPlatform(e.target.value)}
                placeholder="e.g. Zoom, Teams, In person"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="override-room" className="text-xs text-muted-foreground">
                Room
              </label>
              <input
                id="override-room"
                type="text"
                value={draftRoom}
                onChange={(e) => setDraftRoom(e.target.value)}
                placeholder="e.g. MW 2050"
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground/60">
                Generates a nav.tum.de link · overrides the link field below
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="override-link" className="text-xs text-muted-foreground">
                Link
              </label>
              <input
                id="override-link"
                type="text"
                value={draftLink}
                onChange={(e) => setDraftLink(e.target.value)}
                placeholder="https://… (for online meetings)"
                className={inputClass}
                disabled={!!draftRoom.trim()}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveOverride}>
                Save
              </Button>
              {hasOverride && (
                <Button size="sm" variant="ghost" onClick={handleClearOverride}>
                  Clear override
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
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
