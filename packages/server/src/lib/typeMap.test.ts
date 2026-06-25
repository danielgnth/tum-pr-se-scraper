import { describe, expect, test } from 'bun:test'
import { typeForCourseNumber } from './typeMap'

describe('typeForCourseNumber', () => {
  test('IN0012 → Praktikum', () => {
    expect(typeForCourseNumber('IN0012')).toBe('Praktikum')
  })

  test('IN0014 → Seminar', () => {
    expect(typeForCourseNumber('IN0014')).toBe('Seminar')
  })

  test('IN2106 → Master-Praktikum', () => {
    expect(typeForCourseNumber('IN2106')).toBe('Master-Praktikum')
  })

  test('IN2107 → Master-Seminar', () => {
    expect(typeForCourseNumber('IN2107')).toBe('Master-Seminar')
  })

  test('unknown course number passes through', () => {
    expect(typeForCourseNumber('IN9999')).toBe('IN9999')
  })
})
