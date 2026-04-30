import { Outlet } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout/AppLayout'

export default function AppWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
