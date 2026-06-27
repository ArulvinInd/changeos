import { Users } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function FriendsPage() {
  useDocumentTitle('Friends')
  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Users size={48} className="text-[var(--text-muted)]" aria-hidden />
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Friends</h1>
      <p className="text-[var(--text-muted)] max-w-sm">
        Accountability buddies, emoji reactions, and streak sharing — coming in Phase 4.
      </p>
    </section>
  )
}
