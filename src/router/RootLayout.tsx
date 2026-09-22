import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProvider } from '@/context/ThemeProvider'
import { NotificacionProvider } from '@/context/NotificacionContext'
import { ModalPortal } from '@/components/ui/ModalPortal/ModalPortal'
import { AtmosphericLoading, SileoToaster } from '@/components/ui'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificacionProvider>
          <Suspense fallback={<AtmosphericLoading text="Cargando Argentum..." />}>
            <Outlet />
          </Suspense>
          <ModalPortal />
          <SileoToaster />
        </NotificacionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
