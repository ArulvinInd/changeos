/**
 * Tests for the module-level `toast()` imperative API and ToastContainer rendering.
 * These use jsdom because they touch DOM and React state.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast, ToastContainer } from '@/components/ui/Toast'

afterEach(cleanup)

function renderContainer() {
  return render(<ToastContainer />)
}

describe('toast / ToastContainer', () => {
  it('shows a success toast when toast() is called with type success', async () => {
    renderContainer()
    act(() => { toast('Habit saved', 'success') })
    expect(await screen.findByText('Habit saved')).toBeInTheDocument()
  })

  it('shows an error toast with error type', async () => {
    renderContainer()
    act(() => { toast('Something went wrong', 'error') })
    const el = await screen.findByText('Something went wrong')
    expect(el).toBeInTheDocument()
  })

  it('shows an offline toast with the corrected no-sync message', async () => {
    renderContainer()
    act(() => { toast('You are offline — changes cannot be saved until reconnected.', 'offline') })
    expect(await screen.findByText('You are offline — changes cannot be saved until reconnected.')).toBeInTheDocument()
  })

  it('renders a dismiss button per toast', async () => {
    renderContainer()
    act(() => { toast('Test', 'info') })
    expect(await screen.findByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('removes a toast when its dismiss button is clicked', async () => {
    const user = userEvent.setup()
    renderContainer()
    act(() => { toast('Removable', 'info') })
    const btn = await screen.findByRole('button', { name: 'Dismiss' })
    await user.click(btn)
    expect(screen.queryByText('Removable')).not.toBeInTheDocument()
  })

  it('stacks multiple toasts', async () => {
    renderContainer()
    act(() => {
      toast('First', 'success')
      toast('Second', 'error')
    })
    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(await screen.findByText('Second')).toBeInTheDocument()
  })

  it('auto-dismisses after 4 seconds', async () => {
    vi.useFakeTimers()
    renderContainer()
    act(() => { toast('Auto gone', 'info') })
    expect(screen.getByText('Auto gone')).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('Auto gone')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
