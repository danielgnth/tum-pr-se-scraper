export function loadRanking(): string[] {
  try {
    return JSON.parse(localStorage.getItem('course-ranking') ?? '[]')
  } catch {
    return []
  }
}

export function saveRanking(ids: string[]) {
  localStorage.setItem('course-ranking', JSON.stringify(ids))
}

export function applyRanking<T extends { tumonlineId: string }>(
  courses: T[],
  ranking: string[],
): T[] {
  const pos = new Map(ranking.map((id, i) => [id, i]))
  return [...courses].sort(
    (a, b) =>
      (pos.get(a.tumonlineId) ?? Number.MAX_SAFE_INTEGER) -
      (pos.get(b.tumonlineId) ?? Number.MAX_SAFE_INTEGER),
  )
}
