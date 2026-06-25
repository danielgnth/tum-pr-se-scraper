import { CheerioCrawler, RequestQueue } from 'crawlee'

const CIT_URL =
  'https://www.cit.tum.de/cit/studium/studierende/pruefungsangelegenheiten-module/informatik/praktika-seminare/'

const COURSE_NUMBER_RE = /\bIN\d{4,5}\b/g

export async function scrapeCit(): Promise<Set<string>> {
  const found = new Set<string>()
  const queue = await RequestQueue.open()
  await queue.addRequest({ url: CIT_URL })

  const crawler = new CheerioCrawler({
    requestQueue: queue,
    requestHandler: async ({ $ }) => {
      // The leftover-spots sections are accordion items whose button text contains
      // "Restplätze" / "Remaining spots". The button's aria-controls attribute holds
      // the id of the collapsible body div.  We collect text from all such bodies.
      $('button[aria-controls]').each((_i, el) => {
        const btn = $(el)
        if (!btn.text().includes('Restpl')) return

        const sectionId = btn.attr('aria-controls')
        if (!sectionId) return

        const sectionText = $(`#${sectionId}`).text()
        const matches = sectionText.match(COURSE_NUMBER_RE) ?? []
        for (const m of matches) found.add(m)
      })
    },
  })

  await crawler.run()
  return found
}
