import { HttpCrawler, RequestQueue } from 'crawlee'
import type { NewCourse } from '../db/schema'
import { parseDetailResponse, parseListResponse } from '../lib/tumonlineParser'
import { normalizeType } from '../lib/typeMap'

const COURSE_NUMBERS = [
  'IN0012',
  'IN0014',
  'IN2106',
  'IN2107',
  'IN2128',
  'IN2129',
  'IN2130',
  'IN2131',
  'IN2396',
  'IN2397',
]

const LIST_BASE = 'https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses'
const DETAIL_BASE = 'https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses'
const UI_BASE = 'https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses'

export type ScrapedCourse = Omit<NewCourse, 'scrapeRunId'>

export async function scrapeTumonline(termId: string): Promise<ScrapedCourse[]> {
  const results: ScrapedCourse[] = []
  const detailMap = new Map<
    string,
    {
      language: string | null
      description: string | null
      prerequisites: string | null
    }
  >()

  const queue = await RequestQueue.open(`tumonline-${Date.now()}`)

  for (const courseNumber of COURSE_NUMBERS) {
    const url = `${LIST_BASE}?$filter=courseNormKey-eq=LVEAB;filterTerm-like=${courseNumber};orgId-eq=1;termId-eq=${termId}&$orderBy=title=ascnf&$skip=0&$top=100`
    await queue.addRequest({ url, label: 'list', userData: { courseNumber } })
  }

  const crawler = new HttpCrawler({
    requestQueue: queue,
    maxConcurrency: 2,
    preNavigationHooks: [
      async (_ctx, gotOptions) => {
        gotOptions.http2 = false
      },
    ],
    requestHandler: async ({ request, body }) => {
      const xml = body.toString()

      if (request.label === 'list') {
        const { courseNumber } = request.userData as { courseNumber: string }
        const parsed = parseListResponse(xml, courseNumber, termId)

        for (const course of parsed) {
          results.push({
            tumonlineId: course.tumonlineId,
            courseNumber: course.courseNumber,
            termId: course.termId,
            title: course.title,
            type: normalizeType(course.typeKey, course.title),
            ects: null,
            language: null,
            description: null,
            prerequisites: null,
            maxParticipants: null,
            instructors: course.instructors,
            tumonlineUrl: `${UI_BASE}/${course.tumonlineId}?$ctx=lang=DE&$scrollTo=toc_overview`,
            hasLeftoverSpots: false,
          })

          await queue.addRequest({
            url: `${DETAIL_BASE}/${course.tumonlineId}`,
            label: 'detail',
            userData: { tumonlineId: course.tumonlineId },
          })
        }
      } else if (request.label === 'detail') {
        const { tumonlineId } = request.userData as { tumonlineId: string }
        detailMap.set(tumonlineId, parseDetailResponse(xml))
      }
    },
  })

  await crawler.run()

  return results.map((course) => {
    const detail = course.tumonlineId ? detailMap.get(course.tumonlineId) : undefined
    return detail ? { ...course, ...detail } : course
  })
}
