import { describe, it, expect, beforeEach } from 'vitest'
import { useHabitsStore } from '@/store/habitsStore'
import type { HabitLog } from '@/types'

function makeLog(habit_id: string, log_date: string, overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id: `log-${habit_id}-${log_date}`,
    user_id: 'user-1',
    habit_id,
    log_date,
    completed: true,
    value: null,
    notes: null,
    logged_at: '2024-06-15T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  useHabitsStore.setState({ todayLogs: [] })
})

describe('upsertLog', () => {
  it('appends a new log when the store is empty', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    expect(useHabitsStore.getState().todayLogs).toHaveLength(1)
  })

  it('replaces an existing log with matching habit_id and log_date', () => {
    const first = makeLog('h1', '2024-06-15', { completed: false })
    const second = makeLog('h1', '2024-06-15', { id: 'updated', completed: true })
    useHabitsStore.getState().upsertLog(first)
    useHabitsStore.getState().upsertLog(second)
    const logs = useHabitsStore.getState().todayLogs
    expect(logs).toHaveLength(1)
    expect(logs[0].completed).toBe(true)
    expect(logs[0].id).toBe('updated')
  })

  it('preserves unrelated logs when upserting a specific habit', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    useHabitsStore.getState().upsertLog(makeLog('h2', '2024-06-15'))
    expect(useHabitsStore.getState().todayLogs).toHaveLength(2)
  })

  it('treats same habit_id on different dates as separate entries', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-14'))
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    expect(useHabitsStore.getState().todayLogs).toHaveLength(2)
  })

  it('treats same date with different habit_ids as separate entries', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    useHabitsStore.getState().upsertLog(makeLog('h2', '2024-06-15'))
    expect(useHabitsStore.getState().todayLogs).toHaveLength(2)
  })

  it('preserves the value field when replacing a log', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15', { value: 10 }))
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15', { id: 'v2', value: 20 }))
    expect(useHabitsStore.getState().todayLogs[0].value).toBe(20)
  })
})

describe('setTodayLogs', () => {
  it('replaces all existing logs', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    const fresh = [makeLog('h2', '2024-06-16')]
    useHabitsStore.getState().setTodayLogs(fresh)
    expect(useHabitsStore.getState().todayLogs).toEqual(fresh)
  })

  it('accepts an empty array (clears all logs)', () => {
    useHabitsStore.getState().upsertLog(makeLog('h1', '2024-06-15'))
    useHabitsStore.getState().setTodayLogs([])
    expect(useHabitsStore.getState().todayLogs).toHaveLength(0)
  })
})
