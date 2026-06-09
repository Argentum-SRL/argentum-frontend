/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/router/RootLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppWrapper from '@/components/layout/AppWrapper/AppWrapper'

const LoginPage = lazy(() => import('@/pages/auth/login/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/register/RegisterPage'))
const PhoneLoginPage = lazy(() => import('@/pages/auth/phone-login/PhoneLoginPage'))
const VerificarEmail = lazy(() => import('@/pages/auth/verificar-email/VerificarEmail'))
const VerificarTelefono = lazy(() => import('@/pages/auth/verificar-telefono/VerificarTelefono'))
const CompletarPerfil = lazy(() => import('@/pages/auth/completar-perfil/CompletarPerfil'))
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/app/dashboard/DashboardPage'))
const BilleterasPage = lazy(() => import('@/pages/app/billeteras/BilleterasPage'))
const BilleteraDetallePage = lazy(() => import('@/pages/app/billeteras/BilleteraDetallePage'))
const TransaccionesPage = lazy(() => import('@/pages/app/transacciones/TransaccionesPage'))
const PresupuestosPage = lazy(() => import('@/pages/app/presupuestos/PresupuestosPage'))
const MetasPage = lazy(() => import('@/pages/app/metas/MetasPage'))
const MetaDetallePage = lazy(() => import('@/pages/app/metas/MetaDetallePage'))
const SuscripcionesPage = lazy(() => import('@/pages/app/suscripciones/SuscripcionesPage'))
const PerfilPage = lazy(() => import('@/pages/app/perfil/PerfilPage'))

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
              { path: '/app/billeteras/:id', element: <BilleteraDetallePage /> },
              { path: '/app/transacciones', element: <TransaccionesPage /> },
              { path: '/app/transacciones/recurrentes', element: <Navigate to="/app/transacciones" replace /> },
              { path: '/app/presupuestos', element: <PresupuestosPage /> },
              { path: '/app/metas', element: <MetasPage /> },
              { path: '/app/metas/:id', element: <MetaDetallePage /> },
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
