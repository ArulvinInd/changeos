import { describe, it, expect, vi, afterEach } from 'vitest'
import { toLocalDate, cn } from '@/lib/utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('toLocalDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toLocalDate(new Date(2024, 0, 15))).toBe('2024-01-15')
  })

  it('pads single-digit month and day with zeros', () => {
    expect(toLocalDate(new Date(2024, 1, 5))).toBe('2024-02-05')
  })

  it('defaults to today when no argument is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 5, 15))
    expect(toLocalDate()).toBe('2024-06-15')
  })

  it('handles December 31st correctly', () => {
    expect(toLocalDate(new Date(2024, 11, 31))).toBe('2024-12-31')
  })

  it('handles January 1st correctly (year boundary)', () => {
    expect(toLocalDate(new Date(2025, 0, 1))).toBe('2025-01-01')
  })

  it('uses local time, not UTC (avoids the midnight UTC-shift bug)', () => {
    // A date that is Dec 31 locally but Jan 1 in UTC would fail if UTC was used.
    // We construct a local date directly to guarantee local interpretation.
    const localDec31 = new Date(2024, 11, 31) // always local Dec 31 regardless of timezone
    expect(toLocalDate(localDec31)).toBe('2024-12-31')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('removes falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge: p-2 overrides p-4 when p-4 comes first
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
