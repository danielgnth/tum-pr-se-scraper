import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { coursesRoute } from './routes/courses'
import { scrapeRoutes } from './routes/scrape'

const app = new Hono()
  .use('*', cors())
  .route('/api/courses', coursesRoute)
  .route('/api', scrapeRoutes)

export type AppType = typeof app

const port = Number(process.env.PORT ?? 3000)
export default { port, fetch: app.fetch }
