import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { FinancialProvider } from '@/context/FinancialProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FinancialProvider>
            <Outlet />
          </FinancialProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
