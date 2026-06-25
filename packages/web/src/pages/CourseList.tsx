import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Course } from 'server/src/db/schema'
import { api } from '../api/client'
import { CourseCard } from '../components/CourseCard'
import { FilterBar } from '../components/FilterBar'
import { StatusBanner } from '../components/StatusBanner'

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [leftoverOnly, setLeftoverOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'ects'>('title')

  const loadCourses = useCallback(async () => {
    const query: Record<string, string> = {}
    if (selectedTypes.length) query.type = selectedTypes.join(',')
    if (leftoverOnly) query.leftoverOnly = 'true'
    const res = await api.api.courses.$get({ query })
    setCourses((await res.json()) as Course[])
  }, [selectedTypes, leftoverOnly])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  function toggleType(t: string) {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const filtered = useMemo(() => {
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
    return [...list].sort((a, b) =>
      sortBy === 'ects' ? (b.ects ?? 0) - (a.ects ?? 0) : a.title.localeCompare(b.title),
    )
  }, [courses, search, sortBy])

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
          onLeftoverToggle={() => setLeftoverOnly((v) => !v)}
          sortBy={sortBy}
          onSortChange={setSortBy}
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
