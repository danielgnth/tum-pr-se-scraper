import { api } from '../api/client'

export const listScrapeRunsTool = {
  name: 'list_scrape_runs',
  description: 'List all scrape runs with timestamps and status. Shows when data was last updated.',
  inputSchema: { type: 'object' as const, properties: {} },
  async handler() {
    const res = await api.api['scrape-runs'].$get()
    return { content: [{ type: 'text' as const, text: JSON.stringify(await res.json(), null, 2) }] }
  },
}
