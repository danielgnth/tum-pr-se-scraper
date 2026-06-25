// Type-prefix strings to strip from course titles, will be matched case-insensitively.
// Sorted longest-first so e.g. "Advanced Practical Course" wins over "Practical Course".
const PREFIXES = [
  'Advanced Practical Course',
  'Advanced Seminar Course',
  'Bachelor Seminar Course',
  'Bachelor Practical Course',
  'Master Seminar Course',
  'Master Practical Course',
  'Master practical course',
  'Master-Practical Course',
  'Master Lab Course',
  'Master Praktikum',
  'Master-Praktikum',
  'Masterpraktikum',
  'Master Seminar',
  'Master-Seminar',
  'Masterseminar',
  'Bachelor-Praktikum',
  'Bachelor Seminar',
  'Bachelor-Seminar',
  'Advanced Seminar',
  'M.Sc. Praktikum',
  'M.Sc. Seminar',
  'B.Sc. Seminar',
  'Seminar Course',
  'Practical Course',
  'Praktikum',
  'Seminar',
].sort((a, b) => b.length - a.length)

export function cleanTitle(raw: string): string {
  let t = raw.trim()

  // Strip leading "(IN...) " course-code group
  t = t.replace(/^\([^)]+\)\s*/, '')

  // Strip leading "IN\d{4-6}" course-code prefix (e.g. "IN2106 Cybathlon Challenge")
  t = t.replace(/^IN\d{4,6}[:\s]+/i, '')

  // Strip known type prefixes (case-insensitive)
  const lower = t.toLowerCase()
  for (const prefix of PREFIXES) {
    if (lower.startsWith(prefix.toLowerCase())) {
      t = t.slice(prefix.length)
      break
    }
  }

  // Strip any separator chars left at the start (space, dash, em-dash, colon)
  t = t.replace(/^[\s\-–—:]+/, '')

  // Strip grammatical "on " connector (e.g. "Seminar on Automata Theory" → "Automata Theory")
  t = t.replace(/^on\s+/i, '')

  // Strip trailing " (IN..., IN...) " course-code group
  t = t.replace(/\s*\([^)]*\)\s*$/, '')

  // Collapse any stray extra whitespace
  return t.replace(/\s+/g, ' ').trim()
}
