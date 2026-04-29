import { Outlet } from 'react-router-dom'

interface Props {
  mode?: 'app' | 'onboarding' | 'auth-only'
}

export default function ProtectedRoute(_: Props) {
  return <Outlet />
}
