import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { coursesRoute } from './courses'

const app = new Hono().route('/api/courses', coursesRoute)

describe('GET /api/courses', () => {
  test('returns 200 with an array', async () => {
    const res = await app.request('/api/courses')
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})

describe('GET /api/courses/:id', () => {
  test('returns 404 for non-existent id', async () => {
    const res = await app.request('/api/courses/999999')
    expect(res.status).toBe(404)
  })
})
