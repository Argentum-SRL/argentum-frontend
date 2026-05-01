import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { FinancialProvider } from '@/context/FinancialProvider'

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <Outlet />
      </FinancialProvider>
    </AuthProvider>
  )
}
