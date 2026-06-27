import { useEffect, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'offline'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
type Listener = (toast: Toast) => void
const listeners = new Set<Listener>()

export function toast(message: string, type: ToastType = 'info') {
  const t: Toast = { id: ++toastId, message, type }
  listeners.forEach((fn) => fn(t))
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  offline: WifiOff,
}

const typeClass: Record<ToastType, string> = {
  success: 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  error: 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  info: 'border-[var(--accent)] bg-[var(--bg-subtle)] text-[var(--text)]',
  offline: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000)
  }, [])

  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  useEffect(() => {
    listeners.add(add)
    return () => { listeners.delete(add) }
  }, [add])

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-[var(--radius-lg)] border p-3 shadow-[var(--shadow-lg)]',
              'pointer-events-auto transition-all',
              typeClass[t.type],
            )}
          >
            <Icon size={18} aria-hidden className="shrink-0 mt-0.5" />
            <span className="flex-1 text-[var(--text-sm)]">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
