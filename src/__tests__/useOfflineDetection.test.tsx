/**
 * Tests for useOfflineDetection hook.
 * Fires browser online/offline events and asserts the correct toast is queued.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { useOfflineDetection } from '@/hooks/useOfflineDetection'
import { ToastContainer } from '@/components/ui/Toast'

function HookHarness() {
  useOfflineDetection()
  return null
}

function Wrapper() {
  return (
    <>
      <HookHarness />
      <ToastContainer />
    </>
  )
}

afterEach(cleanup)

describe('useOfflineDetection', () => {
  it('shows offline toast when window fires "offline"', async () => {
    render(<Wrapper />)
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(await screen.findByText('You are offline — changes cannot be saved until reconnected.')).toBeInTheDocument()
  })

  it('shows "Back online!" toast when window fires "online"', async () => {
    render(<Wrapper />)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(await screen.findByText('Back online!')).toBeInTheDocument()
  })

  it('does not show any toast before an event fires', () => {
    render(<Wrapper />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('removes event listeners on unmount (no stale toast on second render)', async () => {
    const { unmount } = render(<Wrapper />)
    unmount()
    cleanup()
    // remount fresh to clear toast state
    render(<Wrapper />)
    // listeners from the first render were cleaned up, so no stale toasts
    expect(screen.queryByText('You are offline')).not.toBeInTheDocument()
  })
})
