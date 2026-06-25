import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { courses, scrapeRuns } from '../db/schema'
import { scrapeCit } from './cit'
import { scrapeTumonline } from './tumonline'

export async function runScrape(): Promise<{ scrapeRunId: number; coursesUpserted: number }> {
  const [run] = await db.insert(scrapeRuns).values({ status: 'running' }).returning()

  try {
    const termId = process.env.TUMONLINE_TERM_ID ?? '206'
    const [scraped, leftoverNumbers] = await Promise.all([scrapeTumonline(termId), scrapeCit()])

    const seen = new Set<string>()
    const rows = scraped
      .filter((c) => {
        if (seen.has(c.tumonlineId)) return false
        seen.add(c.tumonlineId)
        return true
      })
      .map((c) => ({
        ...c,
        scrapeRunId: run.id,
        hasLeftoverSpots: leftoverNumbers.has(c.courseNumber),
      }))

    if (rows.length > 0) {
      await db.insert(courses).values(rows)
    }

    await db
      .update(scrapeRuns)
      .set({ status: 'success', finishedAt: new Date(), coursesUpserted: rows.length })
      .where(eq(scrapeRuns.id, run.id))

    return { scrapeRunId: run.id, coursesUpserted: rows.length }
  } catch (err) {
    await db
      .update(scrapeRuns)
      .set({ status: 'error', finishedAt: new Date(), errorMessage: String(err) })
      .where(eq(scrapeRuns.id, run.id))
    throw err
  }
}
