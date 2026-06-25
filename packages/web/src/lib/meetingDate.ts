export function parseMeetingDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:,\s*(\d{2}):(\d{2}))?/)
  if (!m) return null
  const [, dd, mm, yyyy, hh = '00', min = '00'] = m
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}`)
}

export function isMeetingOutdated(date: Date): boolean {
  return Date.now() - date.getTime() > 60 * 24 * 60 * 60 * 1000
}

export function relativeMeetingTime(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 0) {
    if (diffDays < 7) return `in ${diffDays}d`
    if (diffDays < 30) return `in ${Math.round(diffDays / 7)}w`
    return `in ${Math.round(diffDays / 30)}mo`
  }
  const abs = Math.abs(diffDays)
  if (abs < 7) return `${abs}d ago`
  if (abs < 30) return `${Math.round(abs / 7)}w ago`
  return `${Math.round(abs / 30)}mo ago`
}
