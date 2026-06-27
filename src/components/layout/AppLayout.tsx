import type { ReactNode } from 'react'
import { Sidebar, BottomNav } from './Nav'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[var(--bg)]">
      {/* Skip-to-main for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-[var(--radius)] focus:bg-[var(--accent)] focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="flex-1 min-w-0 pb-16 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
