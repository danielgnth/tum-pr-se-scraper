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

const detailParser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true })

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
  // Detail response: codata:resources > resource > content > cpCourseDetailDto
  const dto =
    parsed?.resources?.resource?.content?.cpCourseDetailDto ??
    parsed?.cpCourseDetailDto ??
    parsed?.cpCourseOverviewDto ??
    {}

  const descDto = dto.cpCourseDescriptionDto ?? {}
  const courseDto = dto.cpCourseDto ?? {}

  const languageDtos: Array<{ languageDto?: { key?: string }; mainLanguage?: boolean }> =
    Array.isArray(courseDto.courseLanguageDtos)
      ? courseDto.courseLanguageDtos
      : courseDto.courseLanguageDtos
        ? [courseDto.courseLanguageDtos]
        : []
  const mainLang = languageDtos.find((l) => l.mainLanguage === true)
  const language = mainLang?.languageDto?.key ?? languageDtos[0]?.languageDto?.key ?? null

  return {
    language,
    description: descDto.courseContent?.value ?? null,
    prerequisites: descDto.previousKnowledge?.value ?? null,
  }
}
