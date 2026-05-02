import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { FinancialProvider } from '@/context/FinancialProvider'
import { ThemeProvider } from '@/context/ThemeProvider'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinancialProvider>
          <Outlet />
        </FinancialProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
