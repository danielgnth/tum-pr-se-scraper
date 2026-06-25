import { api } from '../api/client'

export const listCoursesTool = {
  name: 'list_courses',
  description:
    'List TUM practical and seminar courses from the latest scrape. Filter by type (Praktikum, Master-Praktikum, Seminar, Master-Seminar), language (EN/DE), leftover spots, or free-text search.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: 'Search in title, course number, and instructor names',
      },
      type: {
        type: 'string',
        description: 'Comma-separated type filter, e.g. "Seminar,Master-Seminar"',
      },
      language: { type: 'string', description: 'Language code: EN or DE' },
      leftoverOnly: { type: 'boolean', description: 'Only courses with leftover spots' },
    },
  },
  async handler(
    args: { search?: string; type?: string; language?: string; leftoverOnly?: boolean } & Record<
      string,
      unknown
    >,
  ) {
    const query: Record<string, string> = {}
    if (args.search) query.search = args.search
    if (args.type) query.type = args.type
    if (args.language) query.language = args.language
    if (args.leftoverOnly) query.leftoverOnly = 'true'
    const res = await api.api.courses.$get({ query })
    return { content: [{ type: 'text' as const, text: JSON.stringify(await res.json(), null, 2) }] }
  },
}
