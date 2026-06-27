import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-4 text-center">
      <span className="text-6xl" aria-hidden>🔍</span>
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Page not found</h1>
      <p className="text-[var(--text-muted)] max-w-xs">
        The page you were looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center h-12 px-6 rounded-[var(--radius-lg)] bg-[var(--accent)] text-white font-medium text-[var(--text-lg)] transition-colors hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
