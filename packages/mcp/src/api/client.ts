import { hc } from 'hono/client'
import type { AppType } from 'server'

export const api = hc<AppType>(process.env.SERVER_URL ?? 'http://localhost:3000')
