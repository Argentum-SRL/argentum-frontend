import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { FinancialProvider } from '@/context/FinancialProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { ModalPortal } from '@/components/ui/ModalPortal/ModalPortal'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FinancialProvider>
            <Outlet />
            <ModalPortal />
          </FinancialProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
