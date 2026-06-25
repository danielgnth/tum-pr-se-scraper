import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const sql = postgres(process.env.DATABASE_URL ?? 'postgresql://tum:tum@localhost:5432/courses')
export const db = drizzle(sql, { schema })
