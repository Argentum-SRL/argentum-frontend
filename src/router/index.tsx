import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from './RootLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import PhoneLoginPage from '../pages/auth/PhoneLoginPage'
import VerificarEmail from '../pages/auth/VerificarEmail'
import VerificarTelefono from '../pages/auth/VerificarTelefono'
import CompletarPerfil from '../pages/auth/CompletarPerfil'
import OnboardingPage from '../pages/onboarding/OnboardingPage'
import DashboardPage from '../pages/app/DashboardPage'
import BilleterasPage from '../pages/app/BilleterasPage'
import PerfilPage from '../pages/app/PerfilPage'
import AppWrapper from '../components/layout/AppWrapper'

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
