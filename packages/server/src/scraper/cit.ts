import { CheerioCrawler, RequestQueue } from 'crawlee'

const CIT_URL =
  'https://www.cit.tum.de/cit/studium/studierende/pruefungsangelegenheiten-module/informatik/praktika-seminare/'

// Strips the type prefix and IN-code suffix, leaving a normalized title core
// e.g. "Master-Seminar - Collaborative Robotics (IN2107)" → "collaborative robotics"
export function normalizeTitleCore(raw: string): string {
  const text = raw.replace(/ /g, ' ').trim()
  // Remove trailing (IN...) course code suffix
  const withoutCodes = text.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (!withoutCodes) return ''
  // Take everything after the first "- " or ": " separator to skip the type prefix
  const m = withoutCodes.match(/^.+?(?::\s+|\s[-–—]\s)(.+)$/)
  const core = m ? m[1] : withoutCodes
  return core.toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function scrapeCit(): Promise<Set<string>> {
  const found = new Set<string>()
  const queue = await RequestQueue.open(`cit-${Date.now()}`)
  await queue.addRequest({ url: CIT_URL, uniqueKey: CIT_URL })

  const crawler = new CheerioCrawler({
    requestQueue: queue,
    requestHandler: async ({ $ }) => {
      $('button[aria-controls]').each((_i, el) => {
        const btn = $(el)
        if (!btn.text().includes('Restpl')) return

        const sectionId = btn.attr('aria-controls')
        if (!sectionId) return

        const section = $(`#${sectionId}`)
        // Replace <br> with newlines so each title becomes its own line
        section.find('br').replaceWith('\n')

        const lines = section
          .text()
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)

        for (const line of lines) {
          const core = normalizeTitleCore(line)
          if (core) found.add(core)
        }
      })
    },
  })

  await crawler.run()
  return found
}
