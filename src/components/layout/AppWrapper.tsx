import { Outlet } from 'react-router-dom'
import AppLayout from './AppLayout'

export default function AppWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
