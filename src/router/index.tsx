import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/router/RootLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import LoginPage from '@/pages/auth/login/LoginPage'
import RegisterPage from '@/pages/auth/register/RegisterPage'
import PhoneLoginPage from '@/pages/auth/phone-login/PhoneLoginPage'
import VerificarEmail from '@/pages/auth/verificar-email/VerificarEmail'
import VerificarTelefono from '@/pages/auth/verificar-telefono/VerificarTelefono'
import CompletarPerfil from '@/pages/auth/completar-perfil/CompletarPerfil'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import DashboardPage from '@/pages/app/dashboard/DashboardPage'
import BilleterasPage from '@/pages/app/billeteras/BilleterasPage'
import TransaccionesPage from '@/pages/app/transacciones/TransaccionesPage'
import RecurrentesPage from '@/pages/app/transacciones/RecurrentesPage'
import PresupuestosPage from '@/pages/app/presupuestos/PresupuestosPage'
import MetasPage from '@/pages/app/metas/MetasPage'
import SuscripcionesPage from '@/pages/app/suscripciones/SuscripcionesPage'
import PerfilPage from '@/pages/app/perfil/PerfilPage'
import AppWrapper from '@/components/layout/AppWrapper/AppWrapper'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Rutas públicas
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login/telefono', element: <PhoneLoginPage /> },
      { path: '/auth/verificar-email', element: <VerificarEmail /> },
      { path: '/auth/verificar-telefono', element: <VerificarTelefono /> },
      { path: '/auth/completar-perfil', element: <CompletarPerfil /> },

      // Onboarding: requiere auth, redirige a dashboard si ya lo completó
      {
        element: <ProtectedRoute mode="onboarding" />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> },
        ],
      },

      {
        element: <ProtectedRoute mode="app" />,
        children: [
          {
            element: <AppWrapper />,
            children: [
              { index: true, element: <Navigate to="/app/dashboard" replace /> },
              { path: '/app/dashboard', element: <DashboardPage /> },
              { path: '/app/billeteras', element: <BilleterasPage /> },
              { path: '/app/transacciones', element: <TransaccionesPage /> },
              { path: '/app/transacciones/recurrentes', element: <RecurrentesPage /> },
              { path: '/app/presupuestos', element: <PresupuestosPage /> },
              { path: '/app/metas', element: <MetasPage /> },
              { path: '/app/suscripciones', element: <SuscripcionesPage /> },
              { path: '/app/perfil', element: <PerfilPage /> },
            ],
          },
        ],
      },

      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
])

export default router
