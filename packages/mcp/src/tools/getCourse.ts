import { api } from '../api/client'

export const getCourseTool = {
  name: 'get_course',
  description: 'Get full details for a single course by its numeric id.',
  inputSchema: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Course numeric id (from list_courses results)' },
    },
  },
  async handler(args: { id: string } & Record<string, unknown>) {
    const res = await api.api.courses[':id'].$get({ param: { id: args.id } })
    if (!res.ok) return { content: [{ type: 'text' as const, text: 'Course not found' }] }
    return { content: [{ type: 'text' as const, text: JSON.stringify(await res.json(), null, 2) }] }
  },
}
