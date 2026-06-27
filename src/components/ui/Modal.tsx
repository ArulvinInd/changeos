import { useEffect, useRef, useId, type ReactNode } from 'react'
// ponytail: focus-trap-react has a default export — use direct import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error CJS/ESM interop — FocusTrap is the default export
import FocusTrap from 'focus-trap-react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const triggerRef = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
    } else {
      // Return focus to trigger on close
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <FocusTrap>
        <div
          className={cn(
            'relative z-10 w-full sm:max-w-lg',
            'bg-[var(--surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]',
            'shadow-[var(--shadow-lg)] p-6',
            'max-h-[90dvh] overflow-y-auto',
            className,
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-[var(--text-xl)] font-semibold text-[var(--text)]">
              {title}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
              <X size={18} aria-hidden />
            </Button>
          </div>
          {children}
        </div>
      </FocusTrap>
    </div>
  )
}
