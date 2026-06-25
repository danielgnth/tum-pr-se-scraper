import { desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { courses, scrapeRuns } from '../db/schema'

export const coursesRoute = new Hono()
  .get('/', async (c) => {
    const { runId, search, type, language, leftoverOnly } = c.req.query()

    let scrapeRunId: number
    if (runId) {
      scrapeRunId = Number(runId)
    } else {
      const [latest] = await db
        .select({ id: scrapeRuns.id })
        .from(scrapeRuns)
        .where(eq(scrapeRuns.status, 'success'))
        .orderBy(desc(scrapeRuns.id))
        .limit(1)
      if (!latest) return c.json([])
      scrapeRunId = latest.id
    }

    let query = db.select().from(courses).where(eq(courses.scrapeRunId, scrapeRunId)).$dynamic()

    if (type) query = query.where(inArray(courses.type, type.split(',')))
    if (language) query = query.where(eq(courses.language, language))
    if (leftoverOnly === 'true') query = query.where(eq(courses.hasLeftoverSpots, true))
    if (search) {
      const searchCondition = or(
        ilike(courses.title, `%${search}%`),
        ilike(courses.courseNumber, `%${search}%`),
      )
      if (searchCondition) query = query.where(searchCondition)
    }

    return c.json(await query)
  })
  .get('/:id', async (c) => {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, Number(c.req.param('id'))))
      .limit(1)
    if (!course) return c.json({ error: 'Not found' }, 404)
    return c.json(course)
  })
  .delete('/', async (c) => {
    await db.delete(courses)
    await db.delete(scrapeRuns)
    return c.json({ message: 'Cleared' })
  })
