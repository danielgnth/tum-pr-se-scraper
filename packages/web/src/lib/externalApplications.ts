import { useCallback, useState } from 'react'

export type ExtAppState = 'needed' | 'done'

const KEY = 'course-ext-applications'

function load(): Record<string, ExtAppState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function useExternalApplications() {
  const [applications, setApplications] = useState<Record<string, ExtAppState>>(load)

  const toggle = useCallback((tumonlineId: string) => {
    setApplications((prev) => {
      const next = { ...prev }
      const current = next[tumonlineId]
      if (!current) next[tumonlineId] = 'needed'
      else if (current === 'needed') next[tumonlineId] = 'done'
      else delete next[tumonlineId]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { applications, toggle }
}
