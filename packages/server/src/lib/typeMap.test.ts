import { describe, expect, test } from 'bun:test'
import { normalizeType } from './typeMap'

describe('normalizeType', () => {
  test('SE + non-master title → Seminar', () => {
    expect(normalizeType('SE', 'Seminar - Advanced Topics')).toBe('Seminar')
  })

  test('SE + master title → Master-Seminar', () => {
    expect(normalizeType('SE', 'Master Seminar - Hot Topics')).toBe('Master-Seminar')
  })

  test('PR + non-master title → Praktikum', () => {
    expect(normalizeType('PR', 'Praktikum - Systems')).toBe('Praktikum')
  })

  test('PR + master title → Master-Praktikum', () => {
    expect(normalizeType('PR', 'Master-Praktikum - Cloud')).toBe('Master-Praktikum')
  })

  test('unknown key passes through', () => {
    expect(normalizeType('XX', 'Some Course')).toBe('XX')
  })
})
