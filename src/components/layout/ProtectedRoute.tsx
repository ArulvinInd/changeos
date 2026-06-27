import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'

function AuthLoader() {
  return (
    <div className="flex min-h-dvh">
      {/* Sidebar stub */}
      <div className="hidden lg:flex w-56 shrink-0 border-r border-[var(--border)] h-dvh" />
      <div className="flex-1 p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { session, loading } = useAuthStore()

  if (loading) return <AuthLoader />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
