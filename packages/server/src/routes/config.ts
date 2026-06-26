import { Hono } from 'hono'

export const configRoute = new Hono().get('/', (c) => {
  return c.json({
    timelineBrowseStart: process.env.TIMELINE_BROWSE_START ?? '2026-06-22',
    timelineMeetingsStart: process.env.TIMELINE_MEETINGS_START ?? '2026-06-25',
    timelineMeetingsEnd: process.env.TIMELINE_MEETINGS_END ?? '2026-07-09',
    timelineMatchingStart: process.env.TIMELINE_MATCHING_START ?? '2026-07-10',
    timelineMatchingEnd: process.env.TIMELINE_MATCHING_END ?? '2026-07-15',
    timelineResultsDate: process.env.TIMELINE_RESULTS_DATE ?? '2026-07-27',
  })
})
