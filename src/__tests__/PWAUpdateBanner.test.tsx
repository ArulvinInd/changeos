/**
 * Tests for PWAUpdateBanner.
 * Verifies the banner is hidden when no update is pending,
 * shown when one is, and that clicking Reload calls updateServiceWorker.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PWAUpdateBanner } from '@/components/ui/PWAUpdateBanner'
import * as pwaRegister from 'virtual:pwa-register/react'

afterEach(cleanup)

function mockNeedRefresh(value: boolean) {
  vi.spyOn(pwaRegister, 'useRegisterSW').mockReturnValue({
    needRefresh: [value, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  } as ReturnType<typeof pwaRegister.useRegisterSW>)
}

describe('PWAUpdateBanner', () => {
  it('renders nothing when no update is available', () => {
    mockNeedRefresh(false)
    const { container } = render(<PWAUpdateBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the banner when an update is waiting', () => {
    mockNeedRefresh(true)
    render(<PWAUpdateBanner />)
    expect(screen.getByText(/new version/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('calls updateServiceWorker(true) when Reload is clicked', async () => {
    const updateServiceWorker = vi.fn()
    vi.spyOn(pwaRegister, 'useRegisterSW').mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    } as ReturnType<typeof pwaRegister.useRegisterSW>)

    const user = userEvent.setup()
    render(<PWAUpdateBanner />)
    await user.click(screen.getByRole('button', { name: /reload/i }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
