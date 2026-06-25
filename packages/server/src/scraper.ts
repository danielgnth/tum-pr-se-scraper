import { runScrape } from './scraper/index'

console.log('Starting scrape...')
const result = await runScrape()
console.log(`Done. Run #${result.scrapeRunId}: ${result.coursesUpserted} courses stored.`)
