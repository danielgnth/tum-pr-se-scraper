import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface ScrapeRunRecord {
  finishedAt: string | null
  coursesUpserted: number | null
  status: string
}

interface Props {
  onRefreshComplete: () => void
}

export function StatusBanner({ onRefreshComplete }: Props) {
  const [lastRun, setLastRun] = useState<{
    finishedAt: string | null
    coursesUpserted: number | null
  } | null>(null)
  const [scraping, setScraping] = useState(false)

  const loadLatestRun = useCallback(async () => {
    const res = await api.api['scrape-runs'].$get()
    const runs = (await res.json()) as ScrapeRunRecord[]
    if (runs.length > 0) setLastRun(runs[0])
  }, [])

  useEffect(() => {
    loadLatestRun()
  }, [loadLatestRun])

  async function handleRefresh() {
    setScraping(true)
    await api.api.scrape.$post()
    const poll = setInterval(async () => {
      const res = await api.api['scrape-runs'].$get()
      const runs = (await res.json()) as ScrapeRunRecord[]
      if (runs[0]?.status === 'success' || runs[0]?.status === 'error') {
        clearInterval(poll)
        setScraping(false)
        setLastRun(runs[0])
        onRefreshComplete()
      }
    }, 2000)
  }

  return (
    <footer className="border-t px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Last scraped:{' '}
        {lastRun?.finishedAt ? new Date(lastRun.finishedAt).toLocaleString() : 'Never'}
        {lastRun?.coursesUpserted != null && ` · ${lastRun.coursesUpserted} courses`}
      </span>
      <Button size="sm" variant="outline" onClick={handleRefresh} disabled={scraping}>
        {scraping ? 'Scraping…' : 'Refresh'}
      </Button>
    </footer>
  )
}
