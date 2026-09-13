import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { NotificacionProvider } from '@/context/NotificacionContext'
import { ModalPortal } from '@/components/ui/ModalPortal/ModalPortal'
import { AtmosphericLoading } from '@/components/ui'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificacionProvider>
            <Suspense fallback={<AtmosphericLoading text="Cargando Argentum..." />}>
              <Outlet />
            </Suspense>
            <ModalPortal />
          </NotificacionProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
