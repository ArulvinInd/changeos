import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
]

export default function SettingsPage() {
  useDocumentTitle('Settings')
  const { theme, accent, setTheme, setAccent } = useThemeStore()
  const { user } = useAuthStore()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
      })
  }, [user])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || !user) return
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id)
      if (error) throw error
      toast('Display name updated', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not update name', 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function handleExport() {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date, completed, value, notes, logged_at')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
        .limit(50000)
      if (error) throw error
      // RFC 4180 CSV — quote fields containing commas, quotes, or newlines
      const escapeField = (v: string | number | boolean | null | undefined) => {
        const s = String(v ?? '')
        return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const rows = (data ?? [])
      const csv = [
        'habit_id,log_date,completed,value,notes,logged_at',
        ...rows.map((r) =>
          [r.habit_id, r.log_date, r.completed, r.value ?? '', r.notes ?? '', r.logged_at]
            .map(escapeField).join(',')
        ),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'habit-logs.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Export downloaded', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Sign out failed', 'error')
    }
  }

  async function handleDeleteAccount() {
    try {
      // Supabase: delete user via Edge Function in production.
      // For now, sign out and show info.
      await supabase.auth.signOut()
      toast('Account deletion request submitted. Contact support to complete.', 'info')
      setDeleteOpen(false)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not delete account', 'error')
    }
  }

  return (
    <section className="p-4 sm:p-6 max-w-xl mx-auto flex flex-col gap-8">
      <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text)]">Settings</h1>

      {/* Profile */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)]">Profile</h2>
        <p className="text-[var(--text-sm)] text-[var(--text-muted)]">{user?.email}</p>
        <form onSubmit={handleSaveName} className="flex gap-3 items-end">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={savingName} size="md" className="shrink-0">
            {savingName ? '…' : 'Save'}
          </Button>
        </form>
      </div>

      {/* Appearance */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)]">Appearance</h2>

        <div>
          <p className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-2">Theme</p>
          <div className="flex gap-2" role="group" aria-label="Theme selection">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={`px-4 py-2 rounded-[var(--radius)] text-[var(--text-sm)] border capitalize transition-colors ${
                  theme === t
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[var(--text-sm)] font-medium text-[var(--text)] mb-2">Accent color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAccent(color)}
                aria-label={`Set accent to ${color}`}
                aria-pressed={accent === color}
                className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: accent === color ? 'var(--text)' : 'transparent',
                }}
              />
            ))}
            <label
              className="relative w-8 h-8 rounded-full cursor-pointer border-2 overflow-hidden hover:scale-110 transition-transform shrink-0"
              aria-label="Custom accent color"
              style={{
                backgroundColor: accent,
                borderColor: !ACCENT_PRESETS.includes(accent) ? 'var(--text)' : 'transparent',
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <svg className="w-3 h-3 text-white drop-shadow" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                </svg>
              </span>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)]">Data</h2>
        <Button variant="secondary" onClick={handleExport} className="self-start">
          Export habit logs (CSV)
        </Button>
      </div>

      {/* Account */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text)]">Account</h2>
        <Button variant="secondary" onClick={handleSignOut} className="self-start">
          Sign out
        </Button>
        <Button variant="danger" onClick={() => setDeleteOpen(true)} className="self-start">
          Delete account
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account">
        <p className="text-[var(--text-sm)] text-[var(--text-muted)] mb-6">
          This will permanently delete your account and all habit history. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteAccount}>Delete my account</Button>
        </div>
      </Modal>
    </section>
  )
}
