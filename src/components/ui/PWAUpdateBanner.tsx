import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Renders a sticky banner at the top of the viewport when a new service worker
 * is waiting to activate. Clicking "Reload" triggers the SW to skip waiting and
 * reloads the page so the new version takes effect immediately.
 */
export function PWAUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-4 px-4 py-2 bg-[var(--accent)] text-white text-[var(--text-sm)] shadow-[var(--shadow-lg)]"
    >
      <span>A new version of ChangeOS is available.</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
      >
        Reload
      </button>
    </div>
  )
}
