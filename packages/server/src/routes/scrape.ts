import { desc } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { scrapeRuns } from '../db/schema'
import { runScrape } from '../scraper/index'

export const scrapeRoutes = new Hono()
  .get('/scrape-runs', async (c) => {
    return c.json(await db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.id)))
  })
  .post('/scrape', async (c) => {
    runScrape().catch((err) => console.error('Scrape failed:', err))
    return c.json({ message: 'Scrape started' }, 202)
  })
