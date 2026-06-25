import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'
import { CourseCard } from '../components/CourseCard'
import { FilterBar } from '../components/FilterBar'
import { StatusBanner } from '../components/StatusBanner'

export default function CourseList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])

  // All filter state lives in the URL so it survives back-navigation
  const search = searchParams.get('q') ?? ''
  const typesParam = searchParams.get('types') ?? ''
  const selectedTypes = typesParam ? typesParam.split(',') : []
  const leftoverOnly = searchParams.get('leftover') === 'true'

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

  // Only refetch when API-side filters change
  const loadCourses = useCallback(async () => {
    const query: Record<string, string> = {}
    if (typesParam) query.type = typesParam
    if (leftoverOnly) query.leftoverOnly = 'true'
    const res = await api.api.courses.$get({ query })
    setCourses((await res.json()) as Course[])
  }, [typesParam, leftoverOnly])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const filtered = useMemo(() => {
    if (!search) return [...courses].sort((a, b) => a.title.localeCompare(b.title))
    const q = search.toLowerCase()
    return courses
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.courseNumber.toLowerCase().includes(q) ||
          (c.instructors as string[]).some((i) => i.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [courses, search])

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">TUM Practical & Seminar Courses</h1>
        <FilterBar
          search={search}
          onSearch={setSearch}
          selectedTypes={selectedTypes}
          onTypeToggle={toggleType}
          leftoverOnly={leftoverOnly}
          onLeftoverToggle={() => setLeftoverOnly(!leftoverOnly)}
        />
        <p className="text-sm text-muted-foreground">{filtered.length} courses</p>
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </main>
      <StatusBanner onRefreshComplete={loadCourses} />
    </div>
  )
}
