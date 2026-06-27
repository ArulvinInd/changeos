import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle, Circle, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHabitsStore } from '@/store/habitsStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { toLocalDate } from '@/lib/utils'
import { format, subDays } from 'date-fns'
import type { Habit, HabitLog, Streak, Goal } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365]

function isMilestone(n: number) {
  return STREAK_MILESTONES.includes(n)
}

function StreakBadge({ streak }: { streak: number }) {
  const milestone = isMilestone(streak)
  return (
    <span
      className={`inline-flex items-center gap-1 text-[var(--text-xs)] font-semibold px-2 py-0.5 rounded-full transition-colors ${
        streak > 0
          ? milestone
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
      }`}
    >
      <Flame size={11} aria-hidden className={streak > 0 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''} />
      {streak}
    </span>
  )
}

function HabitCheckCard({
  habit,
  log,
  streak,
  goal,
  onLog,
}: {
  habit: Habit
  log: HabitLog | undefined
  streak: Streak | undefined
  goal: Goal | undefined
  onLog: (habit: Habit, value: number | null) => Promise<void>
}) {
  const [inputVal, setInputVal] = useState<string>('')
  const [logging, setLogging] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const completed = log?.completed ?? false

  async function handleBinary() {
    setLogging(true)
    await onLog(habit, null)
    setLogging(false)
  }

  async function handleMeasurable() {
    if (!showInput) { setShowInput(true); return }
    if (!inputVal) return
    setLogging(true)
    await onLog(habit, Number(inputVal))
    setShowInput(false)
    setInputVal('')
    setLogging(false)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 flex items-center gap-4 transition-colors ${
        completed ? 'border-green-400/50' : 'border-[var(--border)]'
      }`}
    >
      {goal && (
        <span
          className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-lg shrink-0"
          style={{ backgroundColor: goal.color + '22' }}
          aria-hidden
        >
          {goal.icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
          {habit.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <StreakBadge streak={streak?.current_streak ?? 0} />
          {habit.type === 'measurable' && habit.target_value && (
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
              Target: {habit.target_value}{habit.unit ? ` ${habit.unit}` : ''}
            </span>
          )}
          {log?.value != null && (
            <span className="text-[var(--text-xs)] text-green-600">
              ✓ {log.value}{habit.unit ? ` ${habit.unit}` : ''}
            </span>
          )}
        </div>
        <AnimatePresence>
          {showInput && (
            <motion.div
              key="input"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 flex items-center gap-2"
            >
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Enter ${habit.unit || 'value'}`}
                autoFocus
                className="h-8 w-32 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--text)] text-[var(--text-sm)] focus:outline-2 focus:outline-[var(--accent)]"
                onKeyDown={(e) => { if (e.key === 'Enter') handleMeasurable() }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Check-in button — must be button or input[checkbox], never a div */}
      {habit.type === 'binary' ? (
        <button
          type="button"
          onClick={handleBinary}
          disabled={logging}
          aria-label={completed ? `Uncheck ${habit.title}` : `Complete ${habit.title}`}
          aria-pressed={completed}
          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform active:scale-90"
        >
          {completed ? (
            <CheckCircle size={28} className="text-green-500" aria-hidden />
          ) : (
            <Circle size={28} className="text-[var(--border)] hover:text-[var(--accent)] transition-colors" aria-hidden />
          )}
        </button>
      ) : (
        <Button
          variant={completed ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleMeasurable}
          disabled={logging}
          aria-label={`Log ${habit.title}`}
          className="shrink-0 min-h-[44px]"
        >
          {logging ? '…' : showInput ? 'Log' : completed ? 'Edit' : 'Log'}
        </Button>
      )}
    </motion.article>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuthStore()
  const { goals, habits, todayLogs, streaks, setGoals, setHabits, setTodayLogs, setStreaks, upsertLog } = useHabitsStore()
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(toLocalDate())
  const [weekOffset, setWeekOffset] = useState(0) // 0 = ends today, -7 = previous week, etc.
  const navigate = useNavigate()

  // Date range: 7-day window. weekOffset shifts the window back in steps of 7.
  const windowEnd = subDays(new Date(), -weekOffset) // weekOffset is 0 or negative
  const pastDates = Array.from({ length: 7 }, (_, i) => toLocalDate(subDays(windowEnd, 6 - i)))

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [goalsRes, habitsRes, logsRes, streaksRes] = await Promise.all([
        supabase
          .from('goals')
          .select('id, user_id, title, icon, color, status, category, description, start_date, target_date, created_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(50),
        supabase
          .from('habits')
          .select('id, user_id, goal_id, title, type, frequency, specific_days, x_per_week, target_value, unit, difficulty, reminder_time, why, status, created_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(100),
        supabase
          .from('habit_logs')
          .select('id, user_id, habit_id, log_date, completed, value, notes, logged_at')
          .eq('user_id', user.id)
          .eq('log_date', date)
          .limit(100),
        supabase
          .from('streaks')
          .select('id, user_id, habit_id, current_streak, longest_streak, last_completed_date, grace_used, updated_at')
          .eq('user_id', user.id)
          .limit(100),
      ])
      if (goalsRes.error) throw goalsRes.error
      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error
      if (streaksRes.error) throw streaksRes.error
      setGoals((goalsRes.data ?? []) as Goal[])
      setHabits((habitsRes.data ?? []) as Habit[])
      setTodayLogs((logsRes.data ?? []) as HabitLog[])
      setStreaks((streaksRes.data ?? []) as Streak[])
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, date, setGoals, setHabits, setTodayLogs, setStreaks])

  useEffect(() => { loadData() }, [loadData])

  async function handleLog(habit: Habit, value: number | null) {
    if (!user) return
    const existing = todayLogs.find((l) => l.habit_id === habit.id && l.log_date === date)
    const toggled = existing ? !existing.completed : true

    try {
      const payload = {
        user_id: user.id,
        habit_id: habit.id,
        log_date: date,
        completed: toggled,
        value: value ?? existing?.value ?? null,
        logged_at: new Date().toISOString(),
      }

      if (existing) {
        const { data, error } = await supabase
          .from('habit_logs')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        upsertLog(data as HabitLog)
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .insert(payload)
          .select()
          .single()
        if (error) {
          // Unique constraint = already logged today
          if (String(error.code) === '23505') {
            toast('Already logged for today', 'info')
            return
          }
          throw error
        }
        upsertLog(data as HabitLog)
      }

      // Refetch updated streak
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .select('id, user_id, habit_id, current_streak, longest_streak, last_completed_date, grace_used, updated_at')
        .eq('habit_id', habit.id)
        .eq('user_id', user.id)
        .single()
      if (updatedStreak) {
        setStreaks(
          streaks.some((s) => s.habit_id === habit.id)
            ? streaks.map((s) => (s.habit_id === habit.id ? (updatedStreak as Streak) : s))
            : [...streaks, updatedStreak as Streak],
        )
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not log habit', 'error')
    }
  }

  const goalMap = new Map(goals.map((g) => [g.id, g]))
  const streakMap = new Map(streaks.map((s) => [s.habit_id, s]))
  const logMap = new Map(todayLogs.map((l) => [l.habit_id, l]))

  const todayHabits = habits.filter((h) => {
    if (h.frequency === 'daily') return true
    if (h.frequency === 'specific_days') {
      const dayName = format(new Date(date + 'T12:00:00'), 'EEE') // e.g. "Mon"
      return h.specific_days?.includes(dayName) ?? false
    }
    return true // x_per_week: show all
  })

  const completedCount = todayHabits.filter((h) => logMap.get(h.id)?.completed).length
  const completionPct = todayHabits.length > 0 ? Math.round((completedCount / todayHabits.length) * 100) : 0

  return (
    <section className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">
          {format(new Date(date + 'T12:00:00'), 'EEEE, MMM d')}
        </h1>
        <p className="text-[var(--text-muted)] text-[var(--text-sm)] mt-0.5">
          {completedCount} of {todayHabits.length} habits done
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100} aria-label="Today's completion">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Date picker — 7-day window with prev/next navigation */}
      <div className="flex items-center gap-1 mb-6" role="group" aria-label="Select date">
        <button
          type="button"
          onClick={() => {
            const newOffset = weekOffset - 7
            setWeekOffset(newOffset)
            // auto-select the last day of the new window so something is always highlighted
            setDate(toLocalDate(subDays(new Date(), -newOffset)))
          }}
          aria-label="Previous week"
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] transition-colors"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
          {pastDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-[var(--radius)] text-[var(--text-xs)] transition-colors min-w-[44px] ${
                d === date
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--border)]'
              }`}
              aria-pressed={d === date}
            >
              <span>{format(new Date(d + 'T12:00:00'), 'EEE')}</span>
              <span className="font-semibold">{format(new Date(d + 'T12:00:00'), 'd')}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const newOffset = Math.min(0, weekOffset + 7)
            setWeekOffset(newOffset)
            setDate(toLocalDate(subDays(new Date(), -newOffset)))
          }}
          disabled={weekOffset >= 0}
          aria-label="Next week"
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      {/* Habit list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : todayHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <CheckCircle size={48} className="text-[var(--text-muted)]" aria-hidden />
          <p className="text-[var(--text-muted)]">No habits scheduled for today.</p>
          <Button onClick={() => navigate('/habits')}>
            <Plus size={16} aria-hidden /> Add Habit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todayHabits.map((habit) => (
            <HabitCheckCard
              key={habit.id}
              habit={habit}
              log={logMap.get(habit.id)}
              streak={streakMap.get(habit.id)}
              goal={goalMap.get(habit.goal_id)}
              onLog={handleLog}
            />
          ))}
        </div>
      )}

      {/* Active streaks summary */}
      {streaks.filter((s) => s.current_streak > 0).length > 0 && (
        <div className="mt-8">
          <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)] mb-3">Active Streaks</h2>
          <div className="flex flex-wrap gap-2">
            {streaks
              .filter((s) => s.current_streak > 0)
              .sort((a, b) => b.current_streak - a.current_streak)
              .slice(0, 10)
              .map((s) => {
                const habit = habits.find((h) => h.id === s.habit_id)
                if (!habit) return null
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-sm)]"
                  >
                    <Flame size={14} className="text-orange-500" aria-hidden />
                    <span className="font-medium text-[var(--text)]">{habit.title}</span>
                    <StreakBadge streak={s.current_streak} />
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </section>
  )
}
