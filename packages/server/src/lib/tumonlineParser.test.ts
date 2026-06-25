import { describe, expect, test } from 'bun:test'
import { parseDetailResponse, parseListResponse } from './tumonlineParser'

const LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<cpCourseOverviewDto>
  <courses>
    <id>950883276</id>
    <courseTitle>
      <value>Master Seminar - Hot Topics (IN2107, IN2396)</value>
    </courseTitle>
    <courseTypeDto>
      <key>SE</key>
    </courseTypeDto>
    <lectureships>
      <identityLibDto>
        <firstName>Ingo</firstName>
        <lastName>Weber</lastName>
      </identityLibDto>
    </lectureships>
    <lectureships>
      <identityLibDto>
        <firstName>Fabian</firstName>
        <lastName>Stiehle</lastName>
      </identityLibDto>
    </lectureships>
  </courses>
  <totalCount>1</totalCount>
</cpCourseOverviewDto>`

const DETAIL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<cpCourseDetailDto>
  <id>950883276</id>
  <language>
    <key>EN</key>
  </language>
  <courseContent>
    <value>Based on literature research and hands-on implementation...</value>
  </courseContent>
  <prerequisites>
    <value>Master-level background in information systems or computer science.</value>
  </prerequisites>
</cpCourseDetailDto>`

describe('parseListResponse', () => {
  test('extracts id, title, typeKey, instructors, courseNumber, termId', () => {
    const result = parseListResponse(LIST_XML, 'IN2396', '206')
    expect(result).toHaveLength(1)
    const c = result[0]
    expect(c.tumonlineId).toBe('950883276')
    expect(c.title).toBe('Master Seminar - Hot Topics (IN2107, IN2396)')
    expect(c.typeKey).toBe('SE')
    expect(c.instructors).toEqual(['Ingo Weber', 'Fabian Stiehle'])
    expect(c.courseNumber).toBe('IN2396')
    expect(c.termId).toBe('206')
  })
})

describe('parseDetailResponse', () => {
  test('extracts language, description, prerequisites', () => {
    const detail = parseDetailResponse(DETAIL_XML)
    expect(detail.language).toBe('EN')
    expect(detail.description).toContain('literature research')
    expect(detail.prerequisites).toContain('Master-level')
  })

  test('returns nulls when fields are absent', () => {
    const detail = parseDetailResponse('<cpCourseDetailDto><id>1</id></cpCourseDetailDto>')
    expect(detail.language).toBeNull()
    expect(detail.description).toBeNull()
    expect(detail.prerequisites).toBeNull()
  })
})
