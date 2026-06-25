const BASE: Record<string, string> = {
  SE: 'Seminar',
  PR: 'Praktikum',
}

export function normalizeType(key: string, title: string): string {
  const base = BASE[key]
  if (!base) return key
  const isMaster = /^master/i.test(title.trim())
  return isMaster ? `Master-${base}` : base
}
