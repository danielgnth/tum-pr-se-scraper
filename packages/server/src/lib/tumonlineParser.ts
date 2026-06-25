import { XMLParser } from 'fast-xml-parser'

export interface ParsedCourse {
  tumonlineId: string
  courseNumber: string
  termId: string
  title: string
  instructors: string[]
}

export interface ParsedCourseDetail {
  language: string | null
  description: string | null
  courseObjective: string | null
  prerequisites: string | null
  teachingMethod: string | null
  registrationInfo: string | null
  onlineMode: 'online' | 'in-person' | null
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
    lectureships?: Array<{ identityLibDto?: { firstName?: string; lastName?: string } }>
  }>

  return rawCourses.map((c) => ({
    tumonlineId: String(c.id),
    courseNumber,
    termId,
    title: c.courseTitle?.value ?? '',
    instructors: (c.lectureships ?? []).map((l) =>
      `${l.identityLibDto?.firstName ?? ''} ${l.identityLibDto?.lastName ?? ''}`.trim(),
    ),
  }))
}

function textVal(node: unknown): string | null {
  if (!node) return null
  if (typeof node === 'string') return node || null
  const v = (node as { value?: string })?.value
  return v ?? null
}

function detectOnlineMode(texts: (string | null)[]): 'online' | 'in-person' | null {
  const combined = texts.filter(Boolean).join(' ')
  const onlineRe =
    /zoom\.us|zoom\.com|teams\.microsoft\.com|bigbluebutton|bbb\.|meet\.jit\.si|webex\.com/i
  const inPersonRe = /\bin.?person\b|\bin raum\b|h[oö]rsaal|seminarraum|pr[aä]senz/i
  const isOnline = onlineRe.test(combined)
  const isInPerson = inPersonRe.test(combined)
  if (isOnline && !isInPerson) return 'online'
  if (isInPerson && !isOnline) return 'in-person'
  return null
}

export function parseDetailResponse(xml: string): ParsedCourseDetail {
  const parsed = detailParser.parse(xml)
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

  const description = textVal(descDto.courseContent)
  const courseObjective = textVal(descDto.courseObjective)
  const prerequisites = textVal(descDto.previousKnowledge)
  const teachingMethod = textVal(descDto.teachingMethod)
  const registrationInfo = textVal(descDto.courseRegistrationInfo)

  const onlineMode = detectOnlineMode([registrationInfo, description, teachingMethod])

  return {
    language,
    description,
    courseObjective,
    prerequisites,
    teachingMethod,
    registrationInfo,
    onlineMode,
  }
}
