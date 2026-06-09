import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { ModalPortal } from '@/components/ui/ModalPortal/ModalPortal'
import { Loader2 } from 'lucide-react'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen w-screen">
              <Loader2 className="animate-spin" size={32} />
            </div>
          }>
            <Outlet />
          </Suspense>
          <ModalPortal />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
