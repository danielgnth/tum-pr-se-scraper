import { Button } from '@/components/ui/button'
import { useCoursePreferences } from '@/lib/coursePreferences'
import { parseMeetingDate } from '@/lib/meetingDate'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'
import { CourseCard } from '../components/CourseCard'
import { FilterBar } from '../components/FilterBar'
import { MatchingTimeline } from '../components/MatchingTimeline'

interface ScrapeRun {
  finishedAt: string | null
  coursesUpserted: number | null
  status: string
}

export default function CourseList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [lastRun, setLastRun] = useState<ScrapeRun | null>(null)
  const [scraping, setScraping] = useState(false)
  const [clearing, setClearing] = useState(false)

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

  const loadCourses = useCallback(async () => {
    const query: Record<string, string> = {}
    if (typesParam) query.type = typesParam
    if (leftoverOnly) query.leftoverOnly = 'true'
    const res = await api.api.courses.$get({ query })
    setCourses((await res.json()) as Course[])
  }, [typesParam, leftoverOnly])

  const loadLatestRun = useCallback(async () => {
    const res = await api.api['scrape-runs'].$get()
    const runs = (await res.json()) as ScrapeRun[]
    setLastRun(runs[0] ?? null)
  }, [])

  useEffect(() => {
    loadCourses()
    loadLatestRun()
  }, [loadCourses, loadLatestRun])

  async function handleRefresh() {
    setScraping(true)
    await api.api.scrape.$post()
    const poll = setInterval(async () => {
      const res = await api.api['scrape-runs'].$get()
      const runs = (await res.json()) as ScrapeRun[]
      if (runs[0]?.status === 'success' || runs[0]?.status === 'error') {
        clearInterval(poll)
        setScraping(false)
        setLastRun(runs[0])
        loadCourses()
      }
    }, 2000)
  }

  async function handleClear() {
    setClearing(true)
    await api.api.courses.$delete()
    setLastRun(null)
    setCourses([])
    setClearing(false)
  }

  const busy = scraping || clearing

  const { favorites, dismissed, toggleFavorite, toggleDismiss } = useCoursePreferences()
  const [showDismissed, setShowDismissed] = useState(false)

  const { favList, normalList, dismissedList } = useMemo(() => {
    let list = courses

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.courseNumber.toLowerCase().includes(q) ||
          (c.instructors as string[]).some((i) => i.toLowerCase().includes(q)),
      )
    }

    if (selectedPlatforms.length > 0) {
      list = list.filter((c) =>
        c.preliminaryMeetingPlatform
          ? selectedPlatforms.includes(c.preliminaryMeetingPlatform)
          : false,
      )
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'date') {
        const diff =
          (parseMeetingDate(a.preliminaryMeetingDate)?.getTime() ?? Number.POSITIVE_INFINITY) -
          (parseMeetingDate(b.preliminaryMeetingDate)?.getTime() ?? Number.POSITIVE_INFINITY)
        if (diff !== 0) return diff
      }
      return a.title.localeCompare(b.title)
    })

    return {
      favList: sorted.filter((c) => favorites.has(String(c.id))),
      normalList: sorted.filter(
        (c) => !favorites.has(String(c.id)) && !dismissed.has(String(c.id)),
      ),
      dismissedList: sorted.filter((c) => dismissed.has(String(c.id))),
    }
  }, [courses, search, selectedPlatforms, sortBy, favorites, dismissed])

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
          <Button size="sm" variant="ghost" onClick={handleClear} disabled={busy}>
            {clearing ? 'Clearing…' : 'Clear'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={busy}>
            {scraping ? 'Scraping…' : 'Refresh'}
          </Button>
        </div>
      </div>
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
      <p className="text-xs text-muted-foreground">
        {favList.length + normalList.length} courses
        {lastRun?.coursesUpserted != null && ` · ${lastRun.coursesUpserted} total`}
        {' · '}Last scraped: {lastScrapedLabel}
      </p>
      <div className="flex flex-col gap-3">
        {favList.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            isFavorite
            onFavorite={toggleFavorite}
            onDismiss={toggleDismiss}
          />
        ))}
        {normalList.map((c) => (
          <CourseCard key={c.id} course={c} onFavorite={toggleFavorite} onDismiss={toggleDismiss} />
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
                  onFavorite={toggleFavorite}
                  onDismiss={toggleDismiss}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
