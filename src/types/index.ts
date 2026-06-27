// Database types mirroring the Supabase schema

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  timezone: string
  created_at: string
}

export type GoalCategory =
  | 'Health'
  | 'Learning'
  | 'Career'
  | 'Mindfulness'
  | 'Finance'
  | 'Relationships'
  | 'Custom'

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: GoalCategory
  icon: string
  color: string
  start_date: string
  target_date: string | null
  status: GoalStatus
  created_at: string
}

export type HabitType = 'binary' | 'measurable' | 'timed'
export type HabitFrequency = 'daily' | 'specific_days' | 'x_per_week'
export type HabitDifficulty = 'easy' | 'medium' | 'hard'
export type HabitStatus = 'active' | 'paused' | 'archived'

export interface Habit {
  id: string
  user_id: string
  goal_id: string
  title: string
  type: HabitType
  frequency: HabitFrequency
  specific_days: string[] | null
  x_per_week: number | null
  target_value: number | null
  unit: string | null
  difficulty: HabitDifficulty
  reminder_time: string | null
  why: string | null
  status: HabitStatus
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string
  completed: boolean
  value: number | null
  notes: string | null
  logged_at: string
}

export type RoutineTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'custom'

export interface Routine {
  id: string
  user_id: string
  title: string
  time_of_day: RoutineTimeOfDay
  scheduled_time: string | null
  days: string[]
  color: string
  icon: string
  created_at: string
}

export interface RoutineHabit {
  id: string
  routine_id: string
  habit_id: string
  order: number
  estimated_minutes: number | null
}

export interface Streak {
  id: string
  user_id: string
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  grace_used: boolean
  updated_at: string
}

export type InsightType = 'weekly_review' | 'pattern' | 'suggestion' | 'nudge'

export interface AiInsight {
  id: string
  user_id: string
  type: InsightType
  content: string
  dismissed: boolean
  generated_at: string
}

// UI-only helpers
export interface HabitWithStreak extends Habit {
  streak?: Streak
  todayLog?: HabitLog
  goal?: Pick<Goal, 'title' | 'icon' | 'color'>
}
