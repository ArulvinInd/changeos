import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Dumbbell, Edit2, Archive, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHabitsStore } from '@/store/habitsStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Habit, HabitType, HabitFrequency, HabitDifficulty, HabitStatus, Goal } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DIFFICULTY_LABEL: Record<HabitDifficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFFICULTY_COLOR: Record<HabitDifficulty, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function HabitFormModal({
  open, onClose, initial, goals, onSaved,
}: {
  open: boolean
  onClose: () => void
  initial?: Habit
  goals: Goal[]
  onSaved: (habit: Habit) => void
}) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    goal_id: initial?.goal_id ?? (goals[0]?.id ?? ''),
    type: (initial?.type ?? 'binary') as HabitType,
    frequency: (initial?.frequency ?? 'daily') as HabitFrequency,
    specific_days: initial?.specific_days ?? [] as string[],
    x_per_week: initial?.x_per_week ?? 3,
    target_value: initial?.target_value ?? '',
    unit: initial?.unit ?? '',
    difficulty: (initial?.difficulty ?? 'medium') as HabitDifficulty,
    reminder_time: initial?.reminder_time ?? '',
    why: initial?.why ?? '',
    status: (initial?.status ?? 'active') as HabitStatus,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.goal_id) e.goal_id = 'Select a goal'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !user) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        user_id: user.id,
        target_value: form.target_value !== '' ? Number(form.target_value) : null,
        unit: form.unit || null,
        reminder_time: form.reminder_time || null,
        why: form.why || null,
        specific_days: form.frequency === 'specific_days' ? form.specific_days : null,
        x_per_week: form.frequency === 'x_per_week' ? form.x_per_week : null,
      }
      let data: Habit
      if (initial) {
        const { data: d, error } = await supabase.from('habits').update(payload).eq('id', initial.id).select().single()
        if (error) throw error
        data = d as Habit
      } else {
        const { data: d, error } = await supabase.from('habits').insert(payload).select().single()
        if (error) throw error
        data = d as Habit
      }
      onSaved(data)
      onClose()
      toast(initial ? 'Habit updated' : 'Habit created', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not save habit', 'error')
    } finally {
      setLoading(false)
    }
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      specific_days: f.specific_days.includes(day)
        ? f.specific_days.filter((d) => d !== day)
        : [...f.specific_days, day],
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={errors.title}
        />
        <div className="flex flex-col gap-1">
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Goal</label>
          {goals.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-yellow-300 bg-yellow-50 px-3 py-2 text-[var(--text-sm)] text-yellow-800">
              No active goals — <Link to="/goals" className="underline font-medium">create a goal</Link> first.
            </p>
          ) : (
            <select
              value={form.goal_id}
              onChange={(e) => setForm((f) => ({ ...f, goal_id: e.target.value }))}
              className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
            >
              {goals.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.title}</option>)}
            </select>
          )}
          {errors.goal_id && <p className="text-[var(--text-xs)] text-red-600">{errors.goal_id}</p>}
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HabitType }))}
              className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
            >
              <option value="binary">Binary (done/not done)</option>
              <option value="measurable">Measurable (numeric)</option>
              <option value="timed">Timed (minutes)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as HabitDifficulty }))}
              className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
            >
              {(Object.keys(DIFFICULTY_LABEL) as HabitDifficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
              ))}
            </select>
          </div>
        </div>

        {(form.type === 'measurable' || form.type === 'timed') && (
          <div className="flex gap-3">
            <Input
              label={form.type === 'timed' ? 'Target (minutes)' : 'Target value'}
              type="number"
              min="0"
              value={String(form.target_value)}
              onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
              className="flex-1"
            />
            {form.type === 'measurable' && (
              <Input
                label="Unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="flex-1"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as HabitFrequency }))}
            className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
          >
            <option value="daily">Daily</option>
            <option value="specific_days">Specific days</option>
            <option value="x_per_week">X times per week</option>
          </select>
        </div>

        {form.frequency === 'specific_days' && (
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`px-3 py-1 rounded-full text-[var(--text-sm)] border transition-colors ${
                  form.specific_days.includes(d)
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {form.frequency === 'x_per_week' && (
          <Input
            label="Times per week"
            type="number"
            min="1"
            max="7"
            value={String(form.x_per_week)}
            onChange={(e) => setForm((f) => ({ ...f, x_per_week: Number(e.target.value) }))}
          />
        )}

        <Input
          label="Reminder time (optional)"
          type="time"
          value={form.reminder_time}
          onChange={(e) => setForm((f) => ({ ...f, reminder_time: e.target.value }))}
        />

        <div className="flex flex-col gap-1">
          <label className="text-[var(--text-sm)] font-medium text-[var(--text)]">Why? (optional)</label>
          <textarea
            value={form.why}
            onChange={(e) => setForm((f) => ({ ...f, why: e.target.value }))}
            rows={2}
            placeholder="Your motivation…"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] text-[var(--text-sm)] resize-none focus:outline-2 focus:outline-[var(--accent)] focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function HabitsPage() {
  useDocumentTitle('Habits')
  const { user } = useAuthStore()
  const { goals, habits, setHabits } = useHabitsStore()
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | undefined>()
  const [showArchived, setShowArchived] = useState(false)
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('habits')
      .select('id, user_id, goal_id, title, type, frequency, specific_days, x_per_week, target_value, unit, difficulty, reminder_time, why, status, created_at')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) { toast(error.message, 'error') }
        else { setHabits((data ?? []) as Habit[]) }
        setLoading(false)
      })
  }, [user, setHabits])

  function handleSaved(habit: Habit) {
    setHabits(
      habits.some((h) => h.id === habit.id)
        ? habits.map((h) => (h.id === habit.id ? habit : h))
        : [habit, ...habits],
    )
  }

  async function archiveHabit(habit: Habit) {
    try {
      const { error } = await supabase.from('habits').update({ status: 'archived' }).eq('id', habit.id)
      if (error) throw error
      setHabits(habits.filter((h) => h.id !== habit.id))
      toast('Habit archived', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not archive habit', 'error')
    }
  }

  async function loadArchived() {
    if (!user) return
    setArchivedLoading(true)
    const { data, error } = await supabase
      .from('habits')
      .select('id, user_id, goal_id, title, type, frequency, specific_days, x_per_week, target_value, unit, difficulty, reminder_time, why, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) toast(error.message, 'error')
    else setArchivedHabits((data ?? []) as Habit[])
    setArchivedLoading(false)
  }

  async function restoreHabit(habit: Habit) {
    try {
      const { error } = await supabase.from('habits').update({ status: 'active' }).eq('id', habit.id)
      if (error) throw error
      setArchivedHabits(archivedHabits.filter((h) => h.id !== habit.id))
      setHabits([{ ...habit, status: 'active' as HabitStatus }, ...habits])
      toast('Habit restored', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not restore habit', 'error')
    }
  }

  const goalMap = new Map(goals.map((g) => [g.id, g]))

  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Habits</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (!showArchived) loadArchived()
              setShowArchived((v) => !v)
            }}
          >
            {showArchived ? 'Active' : 'Archived'}
          </Button>
          {!showArchived && (
            <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
              <Plus size={16} aria-hidden /> New Habit
            </Button>
          )}
        </div>
      </div>

      {showArchived ? (
        archivedLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : archivedHabits.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Archive size={48} className="text-[var(--text-muted)]" aria-hidden />
            <p className="text-[var(--text-muted)]">No archived habits.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {archivedHabits.map((habit) => {
              const goal = goalMap.get(habit.goal_id)
              return (
                <article
                  key={habit.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4 opacity-60"
                >
                  {goal && (
                    <span
                      className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-lg shrink-0"
                      style={{ backgroundColor: goal.color + '22' }}
                    >
                      {goal.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text)] truncate">{habit.title}</p>
                    <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
                      {goal?.title ?? 'No goal'} · {habit.type} · {habit.frequency.replace('_', ' ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreHabit(habit)}
                    aria-label={`Restore ${habit.title}`}
                  >
                    <RotateCcw size={14} aria-hidden />
                  </Button>
                </article>
              )
            })}
          </div>
        )
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Dumbbell size={48} className="text-[var(--text-muted)]" aria-hidden />
          <p className="text-[var(--text-muted)]">No habits yet — add your first habit to start tracking.</p>
          <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
            <Plus size={16} aria-hidden /> Add Habit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const goal = goalMap.get(habit.goal_id)
            return (
              <article
                key={habit.id}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4"
              >
                {goal && (
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-lg shrink-0"
                    style={{ backgroundColor: goal.color + '22' }}
                  >
                    {goal.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text)] truncate">{habit.title}</p>
                  <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
                    {goal?.title ?? 'No goal'} · {habit.type} · {habit.frequency.replace('_', ' ')}
                  </p>
                </div>
                <span className={`shrink-0 text-[var(--text-xs)] px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[habit.difficulty]}`}>
                  {DIFFICULTY_LABEL[habit.difficulty]}
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(habit); setModalOpen(true) }}
                    aria-label={`Edit ${habit.title}`}
                  >
                    <Edit2 size={14} aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => archiveHabit(habit)}
                    aria-label={`Archive ${habit.title}`}
                  >
                    <Archive size={14} aria-hidden />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <HabitFormModal
        key={editing?.id ?? 'new'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        goals={goals.filter((g) => g.status === 'active')}
        onSaved={handleSaved}
      />
    </section>
  )
}
