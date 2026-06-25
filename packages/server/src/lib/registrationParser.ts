const EN_MONTHS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
}
const DE_MONTHS: Record<string, string> = {
  januar: '01',
  februar: '02',
  märz: '03',
  april: '04',
  mai: '05',
  juni: '06',
  juli: '07',
  august: '08',
  september: '09',
  oktober: '10',
  november: '11',
  dezember: '12',
}
const ALL_MONTHS = { ...EN_MONTHS, ...DE_MONTHS }

// Regex matching any English or German month name
const MONTH_NAMES =
  'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember'

// Sections of text that likely precede a meeting date
const MEETING_KW_RE =
  /(?:preliminary\s+(?:meeting|lecture|session)|pre-?(?:meeting|course[\s-](?:meeting|session))|vorbesprechung|kick-?off(?:\s+meeting)?|info(?:rmation)?\s+(?:meeting|event|session)|planning\s+meeting|preparatory\s+(?:session|meeting)|info\s+meeting|first\s+(?:meeting|session)|pre-?registration\s+meeting)/i

// Words that signal a date is a deadline, not a meeting
const DEADLINE_KW_RE =
  /\b(?:until|deadline|de-?registr|dropout\s+date|last\s+(?:day|date|chance)|register(?:ation)?\s+(?:by|opens|closes)|apply\s+by|application\s+(?:deadline|by|until)|submit\s+by|withdraw\s+by|from\s+\w+\s+\d+\s+to)\b/i

function normalizeTime(raw: string): string {
  // HH:MM or HH.MM optionally followed by am/pm (with or without dots, e.g. "p.m.")
  let m = raw.match(/(\d{1,2})[.:](\d{2})\s*([aApP]\.?[mM]\.?)?/)
  if (m) {
    let h = Number.parseInt(m[1])
    const min = m[2]
    const ampm = m[3]?.toLowerCase().replace(/\./g, '')
    if (ampm === 'pm' && h < 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}`
  }
  // Hour-only with am/pm: "2 PM", "11 a.m.", "3pm"
  m = raw.match(/(\d{1,2})\s*([aApP]\.?[mM]\.?)/)
  if (m) {
    let h = Number.parseInt(m[1])
    const ampm = m[2]?.toLowerCase().replace(/\./g, '')
    if (ampm === 'pm' && h < 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:00`
  }
  return raw.trim()
}

function extractTime(after: string): string | null {
  // Allow leading separator chars (comma, space, dash, @, "at", "um")
  // Then match HH:MM, HH.MM, H am/pm, H a.m., or plain HH:MM h/Uhr
  const m = after.match(
    /^[,\s–\-@]*(?:from|at|um|@)?\s*(\d{1,2}[.:]\d{2}(?:\s*[aApP]\.?[mM]\.?)?(?:\s*(?:Uhr|h\b))?|\d{1,2}\s*[aApP]\.?[mM]\.?)/,
  )
  return m ? normalizeTime(m[1]) : null
}

/**
 * Try all date patterns on a text segment. Returns "DD.MM.YYYY" or "DD.MM.YYYY, HH:MM".
 * Named-month patterns run first so "July 6th" beats a later numeric date in the same section.
 */
function tryExtractDate(text: string): string | null {
  // P4 first: "DD[th] [of] Month [YYYY]": "3 July", "7th of July 2026", "26th of June"
  // (?!\d) prevents "20" matching as a prefix of "2026"
  const p4 = text.match(
    new RegExp(
      `\\b(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)\\s+(?:of\\s+)?(${MONTH_NAMES})(?:\\s+(\\d{4}))?(.{0,50})?`,
      'i',
    ),
  )
  if (p4) {
    const mm = ALL_MONTHS[p4[2].toLowerCase()] ?? '??'
    const dd = p4[1].padStart(2, '0')
    const yyyy = p4[3] ?? String(new Date().getFullYear())
    const date = `${dd}.${mm}.${yyyy}`
    const time = p4[4] ? extractTime(p4[4]) : null
    return time ? `${date}, ${time}` : date
  }

  // P3: English "Month[,] DD[th] [YYYY]": "July 6th, 2026", "July, 23 2026"
  // (?!\d) prevents day=20 matching as a prefix of year=2026
  const p3 = text.match(
    new RegExp(
      `\\b(${MONTH_NAMES}),?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)(?:\\s*[,.(]?\\s*(\\d{4})[)]?)?(.{0,50})?`,
      'i',
    ),
  )
  if (p3) {
    const mm = ALL_MONTHS[p3[1].toLowerCase()] ?? '??'
    const dd = p3[2].padStart(2, '0')
    const yyyy = p3[3] ?? String(new Date().getFullYear())
    const date = `${dd}.${mm}.${yyyy}`
    const time = p3[4] ? extractTime(p3[4]) : null
    return time ? `${date}, ${time}` : date
  }

  // P1: German DD.MM.YYYY or DD.MM.YY — only 4 or 2 digit year (avoids 3-digit room suffixes)
  const p1 = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})\b(.{0,50})?/)
  if (p1 && Number.parseInt(p1[2]) >= 1 && Number.parseInt(p1[2]) <= 12) {
    let year = p1[3]
    if (year.length === 2) year = `20${year}`
    const date = `${p1[1].padStart(2, '0')}.${p1[2].padStart(2, '0')}.${year}`
    const time = p1[4] ? extractTime(p1[4]) : null
    return time ? `${date}, ${time}` : date
  }

  // P2: German month name: "27. Januar 2026"
  const p2 = text.match(
    /\b(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})(.{0,50})?/i,
  )
  if (p2) {
    const mm = DE_MONTHS[p2[2].toLowerCase()] ?? '??'
    const date = `${p2[1].padStart(2, '0')}.${mm}.${p2[3]}`
    const time = p2[4] ? extractTime(p2[4]) : null
    return time ? `${date}, ${time}` : date
  }

  // P5: US MM/DD/YYYY
  const p5 = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b(.{0,50})?/)
  if (p5) {
    const date = `${p5[2].padStart(2, '0')}.${p5[1].padStart(2, '0')}.${p5[3]}`
    const time = p5[4] ? extractTime(p5[4]) : null
    return time ? `${date}, ${time}` : date
  }

  // P6: DD.MM without year followed by a time: "07.07 - 18:00", "07.07 14:30"
  const p6 = text.match(
    /\b(\d{1,2})\.(\d{1,2})\s*[-–@]?\s*(\d{1,2}[.:]\d{2}(?:\s*[aApP]\.?[mM]\.?)?)/,
  )
  if (p6 && Number.parseInt(p6[2]) >= 1 && Number.parseInt(p6[2]) <= 12) {
    const year = String(new Date().getFullYear())
    const date = `${p6[1].padStart(2, '0')}.${p6[2].padStart(2, '0')}.${year}`
    const time = normalizeTime(p6[3])
    return `${date}, ${time}`
  }

  return null
}

export function extractPreliminaryMeetingDate(text: string): string | null {
  if (!text) return null

  // --- Strategy 1: extract from sections anchored to meeting keywords (highest confidence) ---
  const kwRe = new RegExp(MEETING_KW_RE.source, 'gi')
  for (let m = kwRe.exec(text); m !== null; m = kwRe.exec(text)) {
    const section = text.slice(m.index, Math.min(m.index + 300, text.length))
    const result = tryExtractDate(section)
    if (result) return result
  }

  // --- Strategy 2: line-by-line fallback, skipping deadline lines ---
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // Skip lines that look like deadlines (and don't also contain meeting keywords)
    if (DEADLINE_KW_RE.test(trimmed) && !MEETING_KW_RE.test(trimmed)) continue
    // Skip lines where the only date is preceded by a deadline indicator within 20 chars
    const result = tryExtractDate(trimmed)
    if (result) {
      // Double-check the date isn't immediately after a deadline word in this line
      const dateIdx = trimmed.search(
        /\d{1,2}[./]\d{1,2}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
      )
      const before = trimmed.slice(Math.max(0, dateIdx - 25), dateIdx)
      if (/\b(?:until|by|from)\b/i.test(before)) continue
      return result
    }
  }

  return null
}

export function extractPreliminaryMeetingPlatform(
  text: string,
): 'Zoom' | 'Teams' | 'BBB' | 'In person' | 'Hybrid' | null {
  if (!text) return null
  const t = text.toLowerCase()
  const hasZoom = /zoom-x\.de|tum-conf\.zoom|zoom\.us|join zoom|via zoom\b|on zoom\b|\bzoom\b/.test(
    t,
  )
  const hasTeams =
    /teams\.microsoft\.com|microsoft teams|via teams\b|through teams\b|on teams\b/.test(t)
  const hasBbb = /\bbbb\b|bigbluebutton|bbb\.(cit\.)?tum\.de/.test(t)
  const hasInPerson =
    /\bin[- ]person\b|lecture hall|seminar room|seminarraum|hörsaal|nav\.tum\.de|\bfmi\b.*\broom\b|\bin room\b/.test(
      t,
    )
  const isHybrid = /\bhybrid\b/.test(t)

  const online = [hasZoom && 'Zoom', hasTeams && 'Teams', hasBbb && 'BBB'].filter(
    Boolean,
  ) as string[]

  if (isHybrid || (online.length > 0 && hasInPerson)) return 'Hybrid'
  if (online.length > 1) return 'Hybrid'
  if (online.length === 1) return online[0] as 'Zoom' | 'Teams' | 'BBB'
  if (hasInPerson) return 'In person'
  return null
}

export function extractPreliminaryMeetingLink(text: string): string | null {
  if (!text) return null

  // Teams meeting link
  const teams = text.match(/https?:\/\/teams\.microsoft\.com\/[^\s<>"')]+/)
  if (teams) return teams[0].replace(/[.,;]+$/, '')

  // Zoom (zoom-x.de, tum-conf.zoom-x.de, zoom.us, tum-conf.zoom.us, etc.)
  // Also matches URLs without https:// prefix
  const zoomRe = /(?:https?:\/\/)?[^\s<>"')]*zoom(?:-x)?\.(?:de|us)\/[^\s<>"')]*/
  const zoom = text.match(zoomRe)
  if (zoom) {
    const url = zoom[0].replace(/[.,;]+$/, '')
    return url.startsWith('http') ? url : `https://${url}`
  }

  // BigBlueButton
  const bbb = text.match(/https?:\/\/[^\s<>"')]*bbb[^\s<>"')]*/)
  if (bbb) return bbb[0].replace(/[.,;]+$/, '')

  return null
}
