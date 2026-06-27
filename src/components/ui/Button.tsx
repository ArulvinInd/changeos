import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantClass = {
  primary: 'bg-[var(--accent)] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
  secondary: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-subtle)]',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeClass = {
  sm: 'h-8 min-h-[44px] px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 min-h-[44px] px-4 text-base rounded-[var(--radius)]',
  lg: 'h-12 px-6 text-lg rounded-[var(--radius-lg)] min-w-[44px] min-h-[44px]',
}

export function Button({ variant = 'primary', size = 'md', className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        // ensure 44px touch target on mobile
        'touch-manipulation',
        className,
      )}
    >
      {children}
    </button>
  )
}
