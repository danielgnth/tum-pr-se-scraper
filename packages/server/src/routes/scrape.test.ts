import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { scrapeRoutes } from './scrape'

const app = new Hono().route('/api', scrapeRoutes)

describe('GET /api/scrape-runs', () => {
  test('returns 200 with an array', async () => {
    const res = await app.request('/api/scrape-runs')
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})
