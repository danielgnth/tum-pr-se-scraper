import { XMLParser } from 'fast-xml-parser'

export interface ParsedCourse {
  tumonlineId: string
  courseNumber: string
  termId: string
  title: string
  typeKey: string
  instructors: string[]
}

export interface ParsedCourseDetail {
  language: string | null
  description: string | null
  prerequisites: string | null
}

const listParser = new XMLParser({
  isArray: (name) => ['courses', 'lectureships'].includes(name),
})

const detailParser = new XMLParser()

export function parseListResponse(
  xml: string,
  courseNumber: string,
  termId: string,
): ParsedCourse[] {
  const parsed = listParser.parse(xml)
  const rawCourses = (parsed?.cpCourseOverviewDto?.courses ?? []) as Array<{
    id: string | number
    courseTitle?: { value: string }
    courseTypeDto?: { key: string }
    lectureships?: Array<{ identityLibDto?: { firstName?: string; lastName?: string } }>
  }>

  return rawCourses.map((c) => ({
    tumonlineId: String(c.id),
    courseNumber,
    termId,
    title: c.courseTitle?.value ?? '',
    typeKey: c.courseTypeDto?.key ?? '',
    instructors: (c.lectureships ?? []).map((l) =>
      `${l.identityLibDto?.firstName ?? ''} ${l.identityLibDto?.lastName ?? ''}`.trim(),
    ),
  }))
}

export function parseDetailResponse(xml: string): ParsedCourseDetail {
  const parsed = detailParser.parse(xml)
  // TUMonline detail root element — confirmed as cpCourseDetailDto; adjust if API differs
  const root = parsed?.cpCourseDetailDto ?? parsed?.cpCourseOverviewDto ?? {}

  return {
    language: root.language?.key ?? null,
    description: root.courseContent?.value ?? null,
    prerequisites: root.prerequisites?.value ?? null,
  }
}
