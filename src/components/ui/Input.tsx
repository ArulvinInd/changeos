import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export function Input({ label, error, hint, icon, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[var(--text-sm)] font-medium text-[var(--text)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          className={cn(
            'w-full h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]',
            'px-3 text-[var(--text)] text-[var(--text-base)] placeholder:text-[var(--text-muted)]',
            'transition-colors focus:outline-2 focus:outline-[var(--accent)] focus:border-transparent',
            'disabled:opacity-50',
            icon && 'pl-9',
            error && 'border-red-500',
            className,
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-[var(--text-xs)] text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-[var(--text-xs)] text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
