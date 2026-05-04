import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { ModalPortal } from '@/components/ui/ModalPortal/ModalPortal'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Outlet />
          <ModalPortal />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
