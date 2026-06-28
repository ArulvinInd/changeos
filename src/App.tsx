import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastContainer } from '@/components/ui/Toast'
import { PWAUpdateBanner } from '@/components/ui/PWAUpdateBanner'
import { useOfflineDetection } from '@/hooks/useOfflineDetection'
import { Skeleton } from '@/components/ui/Skeleton'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const HabitsPage = lazy(() => import('@/pages/HabitsPage'))
const RoutinesPage = lazy(() => import('@/pages/RoutinesPage'))
const ProgressPage = lazy(() => import('@/pages/ProgressPage'))
const CoachPage = lazy(() => import('@/pages/CoachPage'))
const FriendsPage = lazy(() => import('@/pages/FriendsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-32" />
    </div>
  )
}

export default function App() {
  useOfflineDetection()
  const { setSession, setLoading } = useAuthStore()
  const { theme, accent } = useThemeStore()

  useEffect(() => {
    if (theme !== 'system') document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--accent', accent)
  }, [theme, accent])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setLoading(false)
      // SIGNED_OUT fires on both manual sign-out and token refresh failure.
      // Keep this handler side-effect free to avoid false expiry toasts on explicit sign-out.
      if (event === 'SIGNED_OUT' && !session) {
        // intentional no-op; ProtectedRoute handles redirect automatically
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  return (
    // BASE_URL is set by Vite's `base` config option.
    // On GitHub Pages it will be e.g. "/changeos/"; locally it's "/".
    // Stripping trailing slash because BrowserRouter basename must not end with /.
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></AppLayout>} />
            <Route path="/goals" element={<AppLayout><Suspense fallback={<PageLoader />}><GoalsPage /></Suspense></AppLayout>} />
            <Route path="/habits" element={<AppLayout><Suspense fallback={<PageLoader />}><HabitsPage /></Suspense></AppLayout>} />
            <Route path="/routines" element={<AppLayout><Suspense fallback={<PageLoader />}><RoutinesPage /></Suspense></AppLayout>} />
            <Route path="/progress" element={<AppLayout><Suspense fallback={<PageLoader />}><ProgressPage /></Suspense></AppLayout>} />
            <Route path="/coach" element={<AppLayout><Suspense fallback={<PageLoader />}><CoachPage /></Suspense></AppLayout>} />
            <Route path="/friends" element={<AppLayout><Suspense fallback={<PageLoader />}><FriendsPage /></Suspense></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></AppLayout>} />
          </Route>
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Routes>
      </Suspense>
      <ToastContainer />
      <PWAUpdateBanner />
    </BrowserRouter>
  )
}
