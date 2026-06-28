/**
 * Tests for themeStore localStorage safeguard (GAP-04).
 * Verifies the store does not throw when localStorage is blocked (Safari private mode).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.restoreAllMocks()
  // Reset store to defaults between tests
  vi.resetModules()
})

describe('themeStore localStorage safeguard', () => {
  it('does not throw when localStorage.setItem raises SecurityError', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

    // Dynamic import so the module re-initialises with mocked storage
    const { useThemeStore } = await import('@/store/themeStore')

    expect(() => {
      useThemeStore.getState().setTheme('dark')
    }).not.toThrow()
  })

  it('does not throw when localStorage.getItem raises SecurityError', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'SecurityError')
    })

    const { useThemeStore } = await import('@/store/themeStore')

    expect(() => {
      useThemeStore.getState().setTheme('light')
    }).not.toThrow()
  })

  it('still applies theme to document.documentElement even when storage fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

    const { useThemeStore } = await import('@/store/themeStore')
    useThemeStore.getState().setTheme('dark')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
