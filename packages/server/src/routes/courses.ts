import { arrayOverlaps, eq, ilike, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { courses, scrapeRuns } from '../db/schema'

export const coursesRoute = new Hono()
  .get('/', async (c) => {
    const { search, type, language, leftoverOnly } = c.req.query()

    let query = db.select().from(courses).$dynamic()

    if (type) {
      const types = type.split(',')

      query = query.where(arrayOverlaps(courses.types, types))
    }
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
