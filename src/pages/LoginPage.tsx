import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Mail, Lock } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const { session } = useAuthStore()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  function validate() {
    let ok = true
    setEmailError('')
    setPasswordError('')
    if (!email) { setEmailError('Email is required'); ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email'); ok = false }
    if (!password) { setPasswordError('Password is required'); ok = false }
    else if (mode === 'signup' && password.length < 8) { setPasswordError('At least 8 characters'); ok = false }
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast('Check your email to confirm your account.', 'success')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not sign in with Google'
      toast(msg, 'error')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-[var(--text-2xl)] font-bold text-[var(--accent)]">ChangeOS</span>
          <p className="text-[var(--text-muted)] text-[var(--text-sm)] mt-1">
            {mode === 'signin' ? 'Welcome back' : 'Start building better habits'}
          </p>
        </div>

        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 shadow-[var(--shadow)]">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => { if (!email) setEmailError('Email is required') }}
              error={emailError}
              icon={<Mail size={16} aria-hidden />}
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => { if (!password) setPasswordError('Password is required') }}
              error={passwordError}
              icon={<Lock size={16} aria-hidden />}
            />
            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2">
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <Button variant="secondary" size="lg" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <p className="text-center text-[var(--text-sm)] text-[var(--text-muted)] mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="text-[var(--accent)] font-medium underline-offset-2 hover:underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
