import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const scrapeRuns = pgTable('scrape_runs', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  finishedAt: timestamp('finished_at'),
  status: text('status').notNull(),
  coursesUpserted: integer('courses_upserted'),
  errorMessage: text('error_message'),
})

export const courses = pgTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    tumonlineId: text('tumonline_id').notNull(),
    scrapeRunId: integer('scrape_run_id')
      .notNull()
      .references(() => scrapeRuns.id),
    courseNumber: text('course_number').notNull(),
    title: text('title').notNull(),
    type: text('type').notNull(),
    termId: text('term_id').notNull(),
    language: text('language'),
    description: text('description'),
    courseObjective: text('course_objective'),
    prerequisites: text('prerequisites'),
    teachingMethod: text('teaching_method'),
    registrationInfo: text('registration_info'),
    onlineMode: text('online_mode'),
    instructors: jsonb('instructors').$type<string[]>().notNull().default([]),
    tumonlineUrl: text('tumonline_url').notNull(),
    hasLeftoverSpots: boolean('has_leftover_spots').notNull().default(false),
  },
  (table) => [unique().on(table.tumonlineId, table.scrapeRunId)],
)

export type ScrapeRun = typeof scrapeRuns.$inferSelect
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
