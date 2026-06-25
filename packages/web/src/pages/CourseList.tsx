import { Button } from '@/components/ui/button'
import { useCoursePreferences } from '@/lib/coursePreferences'
import { parseMeetingDate } from '@/lib/meetingDate'
import { useTheme } from '@/lib/useTheme'
import { Moon, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLoaderData, useRevalidator, useSearchParams } from 'react-router'
import type { ShouldRevalidateFunctionArgs } from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'
import { CourseCard } from '../components/CourseCard'
import { FavoritesMeetings } from '../components/FavoritesMeetings'
import { FilterBar } from '../components/FilterBar'
import { MatchingTimeline } from '../components/MatchingTimeline'

interface ScrapeRun {
  finishedAt: string | null
  coursesUpserted: number | null
  status: string
}

export async function clientLoader({ request }: { request: Request }) {
  const url = new URL(request.url)
  const typesParam = url.searchParams.get('types') ?? ''
  const leftoverOnly = url.searchParams.get('leftover') === 'true'
  const query: Record<string, string> = {}
  if (typesParam) query.type = typesParam
  if (leftoverOnly) query.leftoverOnly = 'true'
  const [coursesRes, runsRes] = await Promise.all([
    api.api.courses.$get({ query }),
    api.api['scrape-runs'].$get(),
  ])
  return {
    courses: (await coursesRes.json()) as Course[],
    lastRun: ((await runsRes.json()) as ScrapeRun[])[0] ?? null,
  }
}
clientLoader.hydrate = true as const

// Only re-run the loader when filter params that affect the API query change
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (
    currentUrl.searchParams.get('types') !== nextUrl.searchParams.get('types') ||
    currentUrl.searchParams.get('leftover') !== nextUrl.searchParams.get('leftover')
  ) {
    return true
  }
  return defaultShouldRevalidate
}

export default function CourseList() {
  const loaderData = useLoaderData<typeof clientLoader>()
  const courses = loaderData?.courses ?? []
  const lastRun = loaderData?.lastRun ?? null
  const { revalidate } = useRevalidator()
  const [searchParams, setSearchParams] = useSearchParams()
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

  async function handleClear() {
    setClearing(true)
    await api.api.courses.$delete()
    setClearing(false)
    revalidate()
  }

  const busy = scraping || clearing
  const { theme, toggle: toggleTheme } = useTheme()

  const { favorites, dismissed, notes, toggleFavorite, toggleDismiss } = useCoursePreferences()
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
      favList: sorted.filter((c) => favorites.has(c.tumonlineId)),
      normalList: sorted.filter(
        (c) => !favorites.has(c.tumonlineId) && !dismissed.has(c.tumonlineId),
      ),
      dismissedList: sorted.filter((c) => dismissed.has(c.tumonlineId)),
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
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
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
      {favList.length > 0 && <FavoritesMeetings favorites={favorites} courses={courses} />}
      <div className="flex flex-col gap-3">
        {favList.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            isFavorite
            note={notes[c.tumonlineId]}
            onFavorite={toggleFavorite}
            onDismiss={toggleDismiss}
          />
        ))}
        {normalList.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            note={notes[c.tumonlineId]}
            onFavorite={toggleFavorite}
            onDismiss={toggleDismiss}
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
