import { Navigate, Outlet } from 'react-router-dom'
import { sessaoValida } from '@/lib/auth'

export function ProtectedRoute() {
  if (!sessaoValida()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
