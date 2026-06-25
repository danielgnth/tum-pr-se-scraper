import { useCallback, useState } from 'react'

function loadSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('course-notes') ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function useCoursePreferences() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadSet('course-favorites'))
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadSet('course-dismissed'))
  const [notes, setNotesState] = useState<Record<string, string>>(loadNotes)

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveSet('course-favorites', next)
      return next
    })
    // favoriting un-dismisses
    setDismissed((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      saveSet('course-dismissed', next)
      return next
    })
  }, [])

  const toggleDismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveSet('course-dismissed', next)
      return next
    })
    // dismissing un-favorites
    setFavorites((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      saveSet('course-favorites', next)
      return next
    })
  }, [])

  const setNote = useCallback((id: string, text: string) => {
    setNotesState((prev) => {
      const next = { ...prev }
      if (text.trim()) next[id] = text
      else delete next[id]
      localStorage.setItem('course-notes', JSON.stringify(next))
      return next
    })
  }, [])

  return { favorites, dismissed, toggleFavorite, toggleDismiss, notes, setNote }
}
