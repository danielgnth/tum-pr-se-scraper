import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { backupRoute } from './routes/backup'
import { configRoute } from './routes/config'
import { coursesRoute } from './routes/courses'
import { scrapeRoutes } from './routes/scrape'

const app = new Hono()
  .use('*', cors())
  .route('/api/courses', coursesRoute)
  .route('/api/backup', backupRoute)
  .route('/api/config', configRoute)
  .route('/api', scrapeRoutes)

export type AppType = typeof app

const staticDir = process.env.STATIC_DIR
if (staticDir) {
  app.use('/*', serveStatic({ root: staticDir }))
  app.use('/*', serveStatic({ root: staticDir, path: 'index.html' }))
}

const port = Number(process.env.PORT ?? 3000)
export default { port, fetch: app.fetch }
