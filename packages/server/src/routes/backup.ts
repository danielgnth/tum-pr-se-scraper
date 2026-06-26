import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { backups } from '../db/schema'

export const backupRoute = new Hono()
  .post('/', async (c) => {
    const body = await c.req.json<{ code: string; data: unknown }>()
    if (!body.code || typeof body.code !== 'string') {
      return c.json({ error: 'code is required' }, 400)
    }
    await db
      .insert(backups)
      .values({ code: body.code, data: body.data })
      .onConflictDoUpdate({
        target: backups.code,
        set: { data: sql`excluded.data`, updatedAt: new Date() },
      })
    return c.json({ ok: true })
  })
  .get('/:code', async (c) => {
    const [backup] = await db
      .select()
      .from(backups)
      .where(eq(backups.code, c.req.param('code')))
      .limit(1)
    if (!backup) return c.json({ error: 'Not found' }, 404)
    return c.json(backup.data)
  })
