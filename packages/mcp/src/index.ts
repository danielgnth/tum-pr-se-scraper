import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { getCourseTool } from './tools/getCourse'
import { listCoursesTool } from './tools/listCourses'
import { listScrapeRunsTool } from './tools/listScrapeRuns'

const tools = [listCoursesTool, getCourseTool, listScrapeRunsTool]

const server = new Server(
  { name: 'tum-courses', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.name === req.params.name)
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`)
  return tool.handler(req.params.arguments as Record<string, unknown>)
})

await server.connect(new StdioServerTransport())
