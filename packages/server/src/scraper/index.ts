import { eq, ne, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { courses, scrapeRuns } from '../db/schema'
import { cleanTitle } from '../lib/titleCleaner'
import { normalizeTitleCore, scrapeCit } from './cit'
import { scrapeTumonline } from './tumonline'

export async function runScrape(): Promise<{ scrapeRunId: number; coursesUpserted: number }> {
  const [run] = await db.insert(scrapeRuns).values({ status: 'running' }).returning()

  try {
    const termId = process.env.TUMONLINE_TERM_ID ?? '207'
    const [scraped, leftoverCores] = await Promise.all([scrapeTumonline(termId), scrapeCit()])

    // Group by tumonlineId, merging types for courses listed under multiple IN numbers
    const byId = new Map<string, (typeof scraped)[0]>()
    for (const c of scraped) {
      const existing = byId.get(c.tumonlineId)
      if (existing) {
        existing.types = [...new Set([...(existing.types ?? []), ...(c.types ?? [])])]
      } else {
        byId.set(c.tumonlineId, { ...c })
      }
    }

    const rows = [...byId.values()].map((c) => ({
      ...c,
      scrapeRunId: run.id,
      hasLeftoverSpots: leftoverCores.has(normalizeTitleCore(c.title)),
      title: cleanTitle(c.title),
    }))

    if (rows.length > 0) {
      await db
        .insert(courses)
        .values(rows)
        .onConflictDoUpdate({
          target: courses.tumonlineId,
          set: {
            scrapeRunId: sql`excluded.scrape_run_id`,
            courseNumber: sql`excluded.course_number`,
            title: sql`excluded.title`,
            types: sql`excluded.types`,
            termId: sql`excluded.term_id`,
            language: sql`excluded.language`,
            description: sql`excluded.description`,
            courseObjective: sql`excluded.course_objective`,
            prerequisites: sql`excluded.prerequisites`,
            teachingMethod: sql`excluded.teaching_method`,
            registrationInfo: sql`excluded.registration_info`,
            onlineMode: sql`excluded.online_mode`,
            preliminaryMeetingDate: sql`excluded.preliminary_meeting_date`,
            preliminaryMeetingPlatform: sql`excluded.preliminary_meeting_platform`,
            preliminaryMeetingLink: sql`excluded.preliminary_meeting_link`,
            instructors: sql`excluded.instructors`,
            tumonlineUrl: sql`excluded.tumonline_url`,
            hasLeftoverSpots: sql`excluded.has_leftover_spots`,
          },
        })

      // Remove courses that no longer appear in TUMonline
      await db.delete(courses).where(ne(courses.scrapeRunId, run.id))
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
