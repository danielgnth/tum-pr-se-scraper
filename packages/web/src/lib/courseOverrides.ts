import type { Course } from 'server/src/db/schema'

export type CourseOverride = Partial<
  Pick<Course, 'preliminaryMeetingDate' | 'preliminaryMeetingPlatform' | 'preliminaryMeetingLink'>
> & { room?: string }

export function loadOverrides(): Record<string, CourseOverride> {
  try {
    return JSON.parse(localStorage.getItem('course-overrides') ?? '{}')
  } catch {
    return {}
  }
}

export function saveOverride(tumonlineId: string, override: CourseOverride) {
  const all = loadOverrides()
  all[tumonlineId] = override
  localStorage.setItem('course-overrides', JSON.stringify(all))
}

export function clearOverride(tumonlineId: string) {
  const all = loadOverrides()
  delete all[tumonlineId]
  localStorage.setItem('course-overrides', JSON.stringify(all))
}

export function applyOverride<T extends { tumonlineId: string }>(
  course: T,
  override: CourseOverride,
): T {
  if (Object.keys(override).length === 0) return course
  const { room, ...courseFields } = override
  const merged = { ...course, ...courseFields }
  if (room) {
    Object.assign(merged, {
      preliminaryMeetingLink: `https://nav.tum.de/room/${encodeURIComponent(room)}`,
    })
  }
  return merged as T
}

export function applyOverrides<T extends { tumonlineId: string }>(
  courses: T[],
  overrides: Record<string, CourseOverride>,
): T[] {
  return courses.map((c) => {
    const override = overrides[c.tumonlineId]
    return override ? applyOverride(c, override) : c
  })
}
