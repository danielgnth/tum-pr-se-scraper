import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL ?? 'postgresql://tum:tum@localhost:5432/courses', {
  max: 1,
})
const db = drizzle(sql)

await migrate(db, { migrationsFolder: `${import.meta.dirname}/migrations` })
await sql.end()
console.log('Migrations applied.')
