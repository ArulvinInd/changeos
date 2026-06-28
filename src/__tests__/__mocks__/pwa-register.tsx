import { vi } from 'vitest'

// Stub for virtual:pwa-register/react — returns "no update available" by default.
// Individual tests can override needRefresh via vi.mocked().
export function useRegisterSW() {
  return {
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  } as const
}
