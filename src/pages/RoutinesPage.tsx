import { Repeat2 } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function RoutinesPage() {
  useDocumentTitle('Routines')
  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Repeat2 size={48} className="text-[var(--text-muted)]" aria-hidden />
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Routines</h1>
      <p className="text-[var(--text-muted)] max-w-sm">
        Build structured daily routines with drag-and-drop habit ordering — coming in Phase 2.
      </p>
    </section>
  )
}
