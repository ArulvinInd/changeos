import { useState, useEffect, useMemo, memo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useHabitsStore } from '@/store/habitsStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { toLocalDate } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { HabitLog, Habit, Streak } from '@/types'
import { useThemeStore } from '@/store/themeStore'

const HeatmapCalendar = memo(function HeatmapCalendar({ logs }: { logs: HabitLog[] }) {
  const today = new Date()
  const start = subDays(today, 90)
  const days = eachDayOfInterval({ start, end: today })

  const logCountByDate = new Map<string, number>()
  for (const log of logs) {
    if (log.completed) {
      logCountByDate.set(log.log_date, (logCountByDate.get(log.log_date) ?? 0) + 1)
    }
  }
  const maxCount = Math.max(...Array.from(logCountByDate.values()), 1)

  function intensityClass(count: number) {
    if (!count) return 'bg-[var(--border)]'
    const pct = count / maxCount
    if (pct > 0.75) return 'bg-[var(--accent)]'
    if (pct > 0.5) return 'bg-[var(--accent)]/70'
    if (pct > 0.25) return 'bg-[var(--accent)]/40'
    return 'bg-[var(--accent)]/20'
  }

  return (
    <div>
      <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)] mb-3">90-Day Heatmap</h2>
      <div className="flex flex-wrap gap-1" aria-label="Habit completion heatmap">
        {days.map((day) => {
          const key = toLocalDate(day)
          const count = logCountByDate.get(key) ?? 0
          return (
            <div
              key={key}
              role="img"
              aria-label={`${key}: ${count} habit${count !== 1 ? 's' : ''} completed`}
              title={`${key}: ${count} completed`}
              className={`w-3 h-3 rounded-sm transition-colors ${intensityClass(count)}`}
            />
          )
        })}
      </div>
    </div>
  )
})

export default function ProgressPage() {
  useDocumentTitle('Progress')
  const { user } = useAuthStore()
  const { habits, streaks, setHabits, setStreaks } = useHabitsStore()
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch habits/streaks if not populated (when navigating directly to /progress without visiting Dashboard)
  useEffect(() => {
    if (!user || habits.length > 0) return
    supabase
      .from('habits')
      .select('id, user_id, goal_id, title, type, frequency, specific_days, x_per_week, target_value, unit, difficulty, reminder_time, why, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(100)
      .then(({ data }) => { if (data) setHabits(data as Habit[]) })
  }, [user, habits.length, setHabits])

  useEffect(() => {
    if (!user || streaks.length > 0) return
    supabase
      .from('streaks')
      .select('id, user_id, habit_id, current_streak, longest_streak, last_completed_date, grace_used, updated_at')
      .eq('user_id', user.id)
      .limit(100)
      .then(({ data }) => { if (data) setStreaks(data as Streak[]) })
  }, [user, streaks.length, setStreaks])

  useEffect(() => {
    if (!user) return
    supabase
      .from('habit_logs')
      .select('id, user_id, habit_id, log_date, completed, value, notes, logged_at')
      .eq('user_id', user.id)
      .gte('log_date', toLocalDate(subDays(new Date(), 90)))
      .order('log_date', { ascending: true })
      .limit(5000)
      .then(({ data, error }) => {
        if (error) { toast(error.message, 'error') }
        else { setLogs((data ?? []) as HabitLog[]) }
        setLoading(false)
      })
  }, [user])

  // Build a date-keyed lookup once per logs change — avoids O(n) filter per chart day
  const logIndex = useMemo(() => {
    const m = new Map<string, { total: number; completed: number }>()
    for (const log of logs) {
      const entry = m.get(log.log_date) ?? { total: 0, completed: 0 }
      entry.total++
      if (log.completed) entry.completed++
      m.set(log.log_date, entry)
    }
    return m
  }, [logs])

  // Weekly bar chart data — completions per day last 7 days
  const weeklyData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i)
      const key = toLocalDate(day)
      return { day: format(day, 'EEE'), completed: logIndex.get(key)?.completed ?? 0 }
    }), [logIndex])

  // Monthly trend — daily completion % over last 30 days
  const monthlyData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const day = subDays(new Date(), 29 - i)
      const key = toLocalDate(day)
      const entry = logIndex.get(key)
      const pct = entry && entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0
      return { date: format(day, 'MMM d'), pct }
    }), [logIndex])

  // Summary stats — single pass through the index
  const { totalCompleted, thisWeekDone, lastWeekDone } = useMemo(() => {
    let total = 0
    let thisWeek = 0
    let lastWeek = 0
    for (const entry of logIndex.values()) total += entry.completed
    for (let i = 0; i < 7; i++) thisWeek += logIndex.get(toLocalDate(subDays(new Date(), i)))?.completed ?? 0
    for (let i = 7; i < 14; i++) lastWeek += logIndex.get(toLocalDate(subDays(new Date(), i)))?.completed ?? 0
    return { totalCompleted: total, thisWeekDone: thisWeek, lastWeekDone: lastWeek }
  }, [logIndex])

  const { activeStreaks, bestStreak } = useMemo(() => ({
    activeStreaks: streaks.filter((s) => s.current_streak > 0).length,
    bestStreak: streaks.reduce((m, s) => Math.max(m, s.longest_streak), 0),
  }), [streaks])

  // Read accent from store — avoids a synchronous getComputedStyle forced reflow on every render
  const { accent } = useThemeStore()

  return (
    <section className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Progress</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total completions', value: totalCompleted },
          { label: 'Active streaks', value: activeStreaks },
          { label: 'Best streak', value: `${bestStreak} days` },
          {
            label: 'This week vs last',
            value: `${thisWeekDone} vs ${lastWeekDone}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{label}</p>
            <p className="text-[var(--text-xl)] font-bold text-[var(--text)] mt-1">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-8">
          <>
              {/* Weekly bar chart */}
              <div>
                <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)] mb-3">This Week</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                    <Bar dataKey="completed" fill={accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly trend */}
              <div>
                <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)] mb-3">30-Day Completion %</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: 'var(--text)' }}
                      formatter={(v) => [`${v}%`, 'Completion']}
                    />
                    <Line type="monotone" dataKey="pct" stroke={accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Heatmap */}
              <HeatmapCalendar logs={logs} />

              {/* Streak leaderboard */}
              {streaks.length > 0 && (
                <div>
                  <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)] mb-3">Streak Leaderboard</h2>
                  <div className="flex flex-col gap-2">
                    {[...streaks]
                      .sort((a, b) => b.current_streak - a.current_streak)
                      .slice(0, 10)
                      .map((s) => {
                        const habit = habits.find((h) => h.id === s.habit_id)
                        if (!habit) return null
                        return (
                          <div key={s.id} className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] px-4 py-2">
                            <span className="flex-1 text-[var(--text-sm)] font-medium text-[var(--text)]">{habit.title}</span>
                            <span className="text-[var(--text-sm)] text-[var(--text-muted)]">best: {s.longest_streak}</span>
                            <span className="text-[var(--text-sm)] font-bold text-orange-500">🔥 {s.current_streak}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </>
        </div>
      )}
    </section>
  )
}
