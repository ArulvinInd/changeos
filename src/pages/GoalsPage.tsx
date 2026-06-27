import { useState, useEffect } from 'react'
import { Plus, Target, Edit2, Archive, ArchiveRestore } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHabitsStore } from '@/store/habitsStore'
import { useAuthStore } from '@/store/authStore'
import { toLocalDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Goal, GoalCategory, GoalStatus } from '@/types'

const CATEGORIES: GoalCategory[] = ['Health', 'Learning', 'Career', 'Mindfulness', 'Finance', 'Relationships', 'Custom']
const STATUS_LABELS: Record<GoalStatus, string> = { active: 'Active', paused: 'Paused', completed: 'Completed', archived: 'Archived' }
const STATUS_COLORS: Record<GoalStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  archived: 'bg-gray-100 text-gray-500',
}

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'Health' as GoalCategory,
  icon: '🎯',
  color: '#6366f1',
  start_date: toLocalDate(),
  target_date: '',
  status: 'active' as GoalStatus,
}

function GoalFormModal({
  open, onClose, initial, onSaved,
}: {
  open: boolean
  onClose: () => void
  initial?: Goal
  onSaved: (goal: Goal) => void
}) {
  const { user } = useAuthStore()
  const [form, setForm] = useState(initial ? {
    title: initial.title,
    description: initial.description ?? '',
    category: initial.category,
    icon: initial.icon,
    color: initial.color,
    start_date: initial.start_date,
    target_date: initial.target_date ?? '',
    status: initial.status,
  } : { ...DEFAULT_FORM })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !user) return
    setLoading(true)
    try {
      const payload = { ...form, user_id: user.id, description: form.description || null, target_date: form.target_date || null }
      let data: Goal
      if (initial) {
        const { data: d, error } = await supabase.from('goals').update(payload).eq('id', initial.id).select().single()
        if (error) throw error
        data = d as Goal
      } else {
        const { data: d, error } = await supabase.from('goals').insert(payload).select().single()
        if (error) throw error
        data = d as Goal
      }
      onSaved(data)
      onClose()
      toast(initial ? 'Goal updated' : 'Goal created', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not save goal', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onBlur={() => { if (!form.title.trim()) setErrors((e) => ({ ...e, title: 'Title is required' })) }}
          error={errors.title}
        />
        <div className="flex flex-col gap-1">
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] text-[var(--text-sm)] resize-none focus:outline-2 focus:outline-[var(--accent)] focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
                className="h-10 w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-10 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Icon</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              maxLength={2}
              className="w-16 h-10 text-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-xl focus:outline-2 focus:outline-[var(--accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="w-16 h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] cursor-pointer"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Input
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="flex-1"
          />
          <Input
            label="Target date (optional)"
            type="date"
            value={form.target_date}
            onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
            className="flex-1"
          />
        </div>
        {initial && (
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as GoalStatus }))}
                className="h-10 w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-10 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
              >
                {(Object.keys(STATUS_LABELS) as GoalStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function GoalsPage() {
  useDocumentTitle('Goals')
  const { user } = useAuthStore()
  const { goals, setGoals } = useHabitsStore()
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('goals')
      .select('id, user_id, title, description, category, icon, color, start_date, target_date, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) { toast(error.message, 'error') }
        else { setGoals((data ?? []) as Goal[]) }
        setLoading(false)
      })
  }, [user, setGoals])

  function handleSaved(goal: Goal) {
    setGoals(
      goals.some((g) => g.id === goal.id)
        ? goals.map((g) => (g.id === goal.id ? goal : g))
        : [goal, ...goals],
    )
  }

  async function archiveGoal(goal: Goal) {
    try {
      const { error } = await supabase.from('goals').update({ status: 'archived' }).eq('id', goal.id)
      if (error) throw error
      setGoals(goals.map((g) => g.id === goal.id ? { ...g, status: 'archived' as const } : g))
      toast('Goal archived', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not archive goal', 'error')
    }
  }

  async function restoreGoal(goal: Goal) {
    try {
      const { error } = await supabase.from('goals').update({ status: 'active' }).eq('id', goal.id)
      if (error) throw error
      setGoals(goals.map((g) => g.id === goal.id ? { ...g, status: 'active' as const } : g))
      toast('Goal restored', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not restore goal', 'error')
    }
  }

  const visibleGoals = showArchived
    ? goals.filter((g) => g.status === 'archived')
    : goals.filter((g) => g.status !== 'archived')

  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Goals</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
          >
            <Archive size={14} aria-hidden />
            {showArchived ? 'Hide archived' : 'Archived'}
          </Button>
          {!showArchived && (
            <Button onClick={() => { setEditing(undefined); setModalOpen(true) }} size="md">
              <Plus size={16} aria-hidden /> New Goal
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : visibleGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Target size={48} className="text-[var(--text-muted)]" aria-hidden />
          <p className="text-[var(--text-muted)]">
            {showArchived ? 'No archived goals.' : 'No goals yet — add your first one to get started.'}
          </p>
          {!showArchived && (
            <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
              <Plus size={16} aria-hidden /> Add Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGoals.map((goal) => (
            <article
              key={goal.id}
              className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-xl shrink-0"
                    style={{ backgroundColor: goal.color + '22' }}
                  >
                    {goal.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text)] truncate">{goal.title}</p>
                    <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{goal.category}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-[var(--text-xs)] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}>
                  {STATUS_LABELS[goal.status]}
                </span>
              </div>
              {goal.description && (
                <p className="text-[var(--text-sm)] text-[var(--text-muted)] line-clamp-2">{goal.description}</p>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-[var(--border)]">
                {goal.status === 'archived' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreGoal(goal)}
                    aria-label={`Restore ${goal.title}`}
                  >
                    <ArchiveRestore size={14} aria-hidden /> Restore
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditing(goal); setModalOpen(true) }}
                      aria-label={`Edit ${goal.title}`}
                    >
                      <Edit2 size={14} aria-hidden /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveGoal(goal)}
                      aria-label={`Archive ${goal.title}`}
                    >
                      <Archive size={14} aria-hidden /> Archive
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <GoalFormModal
        key={editing?.id ?? 'new'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={handleSaved}
      />
    </section>
  )
}
