import { Button } from '@/components/ui/button'
import { applyOverrides, loadOverrides } from '@/lib/courseOverrides'
import { useCoursePreferences } from '@/lib/coursePreferences'
import { applyRanking, loadRanking, saveRanking } from '@/lib/courseRanking'
import { useExternalApplications } from '@/lib/externalApplications'
import { parseMeetingDate } from '@/lib/meetingDate'
import { useTheme } from '@/lib/useTheme'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'
import { BackupPanel } from '../components/BackupPanel'
import { CourseCard } from '../components/CourseCard'
import { FavoritesMeetings } from '../components/FavoritesMeetings'
import { FilterBar } from '../components/FilterBar'
import { MatchingTimeline } from '../components/MatchingTimeline'
import { SortableCourseCard } from '../components/SortableCourseCard'
import type { Route } from './+types/CourseList'

interface ScrapeRun {
  finishedAt: string | null
  coursesUpserted: number | null
  status: string
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url)
  const typesParam = url.searchParams.get('types') ?? ''
  const leftoverOnly = url.searchParams.get('leftover') === 'true'
  const search = url.searchParams.get('q') ?? ''
  const platformsParam = url.searchParams.get('platforms') ?? ''
  const selectedPlatforms = platformsParam ? platformsParam.split(',') : []
  const sortBy = (url.searchParams.get('sort') ?? 'title') as 'title' | 'date'

  const query: Record<string, string> = {}
  if (typesParam) query.type = typesParam
  if (leftoverOnly) query.leftoverOnly = 'true'

  const [coursesRes, runsRes] = await Promise.all([
    api.api.courses.$get({ query }),
    api.api['scrape-runs'].$get(),
  ])

  let courses = (await coursesRes.json()) as Course[]
  const lastRun = ((await runsRes.json()) as ScrapeRun[])[0] ?? null

  if (search) {
    const q = search.toLowerCase()
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.courseNumber.toLowerCase().includes(q) ||
        (c.instructors as string[]).some((i) => i.toLowerCase().includes(q)),
    )
  }

  if (selectedPlatforms.length > 0) {
    courses = courses.filter((c) =>
      c.preliminaryMeetingPlatform
        ? selectedPlatforms.includes(c.preliminaryMeetingPlatform)
        : false,
    )
  }

  courses = [...courses].sort((a, b) => {
    if (sortBy === 'date') {
      const diff =
        (parseMeetingDate(a.preliminaryMeetingDate)?.getTime() ?? Number.POSITIVE_INFINITY) -
        (parseMeetingDate(b.preliminaryMeetingDate)?.getTime() ?? Number.POSITIVE_INFINITY)
      if (diff !== 0) return diff
    }
    return a.title.localeCompare(b.title)
  })

  courses = applyOverrides(courses, loadOverrides())

  return { courses, lastRun }
}

function generateMarkdown(courses: Course[], notes: Record<string, string>): string {
  const lines: string[] = [
    '# TUM Course Favorites',
    '',
    `*${new Date().toLocaleDateString()} — ${courses.length} course${courses.length !== 1 ? 's' : ''}*`,
    '',
  ]

  for (const [i, c] of courses.entries()) {
    lines.push('---', '', `## ${i + 1}. ${c.title}`, '')

    if (c.types.length > 0) lines.push(`**Type:** ${c.types.join(' / ')}`)
    lines.push(`**Course:** ${c.courseNumber}`)
    if (c.language) lines.push(`**Language:** ${c.language}`)
    if ((c.instructors as string[]).length > 0)
      lines.push(`**Instructors:** ${(c.instructors as string[]).join(', ')}`)
    if (c.preliminaryMeetingDate) {
      const meeting = [c.preliminaryMeetingDate, c.preliminaryMeetingPlatform]
        .filter(Boolean)
        .join(' · ')
      lines.push(`**Preliminary Meeting:** ${meeting}`)
    }
    if (c.hasLeftoverSpots) lines.push('**Spots available**')
    lines.push('')

    if (c.description) lines.push('### Description', '', c.description, '')
    if (c.courseObjective) lines.push('### Objectives', '', c.courseObjective, '')
    if (c.prerequisites) lines.push('### Prerequisites', '', c.prerequisites, '')
    if (c.teachingMethod) lines.push('### Teaching Method', '', c.teachingMethod, '')
    if (c.registrationInfo) lines.push('### Registration', '', c.registrationInfo, '')

    const note = notes[c.tumonlineId]
    if (note) lines.push('### My Notes', '', note, '')

    lines.push(`[View on TUMonline](${c.tumonlineUrl})`, '')
  }

  return lines.join('\n')
}

export default function CourseList(_: Route.ComponentProps) {
  const loaderData = useLoaderData<typeof clientLoader>()
  const { revalidate } = useRevalidator()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scraping, setScraping] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount — forces clientLoader when dev SSR skips initial load (revalidate() won't run a loader that never ran)
  useEffect(() => {
    if (!loaderData) navigate(location, { replace: true })
  }, [])

  const courses = loaderData?.courses ?? []
  const lastRun = loaderData?.lastRun ?? null

  const search = searchParams.get('q') ?? ''
  const typesParam = searchParams.get('types') ?? ''
  const selectedTypes = typesParam ? typesParam.split(',') : []
  const leftoverOnly = searchParams.get('leftover') === 'true'
  const sortBy = (searchParams.get('sort') ?? 'title') as 'title' | 'date'
  const platformsParam = searchParams.get('platforms') ?? ''
  const selectedPlatforms = platformsParam ? platformsParam.split(',') : []

  function updateParams(updater: (p: URLSearchParams) => void) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        updater(next)
        return next
      },
      { replace: true },
    )
  }

  function setSearch(v: string) {
    updateParams((p) => (v ? p.set('q', v) : p.delete('q')))
  }

  function toggleType(t: string) {
    updateParams((p) => {
      const current = p.get('types')?.split(',').filter(Boolean) ?? []
      const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
      next.length ? p.set('types', next.join(',')) : p.delete('types')
    })
  }

  function setLeftoverOnly(v: boolean) {
    updateParams((p) => (v ? p.set('leftover', 'true') : p.delete('leftover')))
  }

  function setSortBy(s: 'title' | 'date') {
    updateParams((p) => (s === 'title' ? p.delete('sort') : p.set('sort', s)))
  }

  function togglePlatform(platform: string) {
    updateParams((p) => {
      const current = p.get('platforms')?.split(',').filter(Boolean) ?? []
      const next = current.includes(platform)
        ? current.filter((x) => x !== platform)
        : [...current, platform]
      next.length ? p.set('platforms', next.join(',')) : p.delete('platforms')
    })
  }

  async function handleRefresh() {
    setScraping(true)
    await api.api.scrape.$post()
    const poll = setInterval(async () => {
      const res = await api.api['scrape-runs'].$get()
      const runs = (await res.json()) as ScrapeRun[]
      if (runs[0]?.status === 'success' || runs[0]?.status === 'error') {
        clearInterval(poll)
        setScraping(false)
        revalidate()
      }
    }, 2000)
  }

  const [ranking, setRanking] = useState<string[]>(() => loadRanking())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = rankedFavList.map((c) => c.tumonlineId)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const next = arrayMove(ids, oldIndex, newIndex) as string[]
    saveRanking(next)
    setRanking(next)
  }

  function handleExportMarkdown() {
    const md = generateMarkdown(favList, notes)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tum-favorites-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleClear() {
    setClearing(true)
    await api.api.courses.$delete()
    setClearing(false)
    revalidate()
  }

  const busy = scraping || clearing
  const { theme, toggle: toggleTheme } = useTheme()

  const { favorites, dismissed, notes, toggleFavorite, toggleDismiss } = useCoursePreferences()
  const { applications, toggle: toggleExtApp } = useExternalApplications()
  const [showDismissed, setShowDismissed] = useState(false)

  const { favList, normalList, dismissedList } = useMemo(
    () => ({
      favList: courses.filter((c) => favorites.has(c.tumonlineId)),
      normalList: courses.filter(
        (c) => !favorites.has(c.tumonlineId) && !dismissed.has(c.tumonlineId),
      ),
      dismissedList: courses.filter((c) => dismissed.has(c.tumonlineId)),
    }),
    [courses, favorites, dismissed],
  )

  const rankedFavList = useMemo(() => applyRanking(favList, ranking), [favList, ranking])

  const lastScrapedLabel = lastRun?.finishedAt
    ? new Date(lastRun.finishedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never'

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">TUM Practical & Seminar Courses</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowBackup((v) => !v)}>
            Backup
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} disabled={busy}>
            {clearing ? 'Clearing…' : 'Clear'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={busy}>
            {scraping ? 'Scraping…' : 'Refresh'}
          </Button>
        </div>
      </div>
      {showBackup && <BackupPanel onClose={() => setShowBackup(false)} />}
      <MatchingTimeline />
      <FilterBar
        search={search}
        onSearch={setSearch}
        selectedTypes={selectedTypes}
        onTypeToggle={toggleType}
        leftoverOnly={leftoverOnly}
        onLeftoverToggle={() => setLeftoverOnly(!leftoverOnly)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedPlatforms={selectedPlatforms}
        onPlatformToggle={togglePlatform}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {favList.length + normalList.length + dismissedList.length} courses
          {dismissedList.length > 0 && ` (${dismissedList.length} hidden)`}
          {lastRun?.coursesUpserted != null && ` · ${lastRun.coursesUpserted} total`}
          {' · '}Last scraped: {lastScrapedLabel}
        </p>
        {favList.length > 0 && (
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Export {favList.length} favorite{favList.length !== 1 ? 's' : ''} as Markdown
          </button>
        )}
      </div>
      {(() => {
        const pendingCount = courses.filter((c) => applications[c.tumonlineId] === 'needed').length
        return pendingCount > 0 ? (
          <p className="text-xs text-amber-600 font-medium -mt-2">
            {pendingCount} external application{pendingCount !== 1 ? 's' : ''} still pending before
            Matching (Jul 10)
          </p>
        ) : null
      })()}
      {favList.length > 0 && <FavoritesMeetings favorites={favorites} courses={courses} />}
      <div className="flex flex-col gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={rankedFavList.map((c) => c.tumonlineId)}
            strategy={verticalListSortingStrategy}
          >
            {rankedFavList.map((c) => (
              <SortableCourseCard
                key={c.id}
                course={c}
                note={notes[c.tumonlineId]}
                extAppState={applications[c.tumonlineId]}
                onFavorite={toggleFavorite}
                onDismiss={toggleDismiss}
                onExtAppToggle={toggleExtApp}
              />
            ))}
          </SortableContext>
        </DndContext>
        {normalList.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            note={notes[c.tumonlineId]}
            extAppState={applications[c.tumonlineId]}
            onFavorite={toggleFavorite}
            onDismiss={toggleDismiss}
            onExtAppToggle={toggleExtApp}
          />
        ))}
      </div>
      {dismissedList.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowDismissed((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground text-left"
          >
            {showDismissed ? '▾' : '▸'} {dismissedList.length} hidden course
            {dismissedList.length !== 1 ? 's' : ''}
          </button>
          {showDismissed && (
            <div className="flex flex-col gap-3">
              {dismissedList.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  isDismissed
                  note={notes[c.tumonlineId]}
                  extAppState={applications[c.tumonlineId]}
                  onFavorite={toggleFavorite}
                  onDismiss={toggleDismiss}
                  onExtAppToggle={toggleExtApp}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
