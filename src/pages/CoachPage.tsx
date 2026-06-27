import { Sparkles } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function CoachPage() {
  useDocumentTitle('AI Coach')
  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Sparkles size={48} className="text-[var(--text-muted)]" aria-hidden />
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">AI Coach</h1>
      <p className="text-[var(--text-muted)] max-w-sm">
        Weekly reviews, pattern detection, and habit suggestions powered by AI — coming in Phase 3.
      </p>
    </section>
  )
}
