import { create } from 'zustand'
import type { Goal, Habit, HabitLog, Streak } from '@/types'

interface HabitsState {
  goals: Goal[]
  habits: Habit[]
  todayLogs: HabitLog[]
  streaks: Streak[]
  setGoals: (goals: Goal[]) => void
  setHabits: (habits: Habit[]) => void
  setTodayLogs: (logs: HabitLog[]) => void
  setStreaks: (streaks: Streak[]) => void
  upsertLog: (log: HabitLog) => void
}

export const useHabitsStore = create<HabitsState>((set) => ({
  goals: [],
  habits: [],
  todayLogs: [],
  streaks: [],
  setGoals: (goals) => set({ goals }),
  setHabits: (habits) => set({ habits }),
  setTodayLogs: (logs) => set({ todayLogs: logs }),
  setStreaks: (streaks) => set({ streaks }),
  upsertLog: (log) =>
    set((s) => {
      const idx = s.todayLogs.findIndex(
        (l) => l.habit_id === log.habit_id && l.log_date === log.log_date,
      )
      const todayLogs =
        idx >= 0
          ? s.todayLogs.map((l, i) => (i === idx ? log : l))
          : [...s.todayLogs, log]
      return { todayLogs }
    }),
}))
