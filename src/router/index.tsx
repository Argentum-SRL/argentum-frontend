/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/router/RootLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppWrapper from '@/components/layout/AppWrapper/AppWrapper'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary/PageErrorBoundary'
import { RootErrorBoundary } from '@/components/ui/ErrorBoundary/RootErrorBoundary'

const LoginPage = lazy(() => import('@/pages/auth/login/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/register/RegisterPage'))
const PhoneLoginPage = lazy(() => import('@/pages/auth/phone-login/PhoneLoginPage'))
const VerificarEmail = lazy(() => import('@/pages/auth/verificar-email/VerificarEmail'))
const VerificarTelefono = lazy(() => import('@/pages/auth/verificar-telefono/VerificarTelefono'))
const CompletarPerfil = lazy(() => import('@/pages/auth/completar-perfil/CompletarPerfil'))
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))
const RecuperarPassword = lazy(() => import('@/pages/auth/recuperar-password/RecuperarPassword'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/app/dashboard/DashboardPage'))
const BilleterasPage = lazy(() => import('@/pages/app/billeteras/BilleterasPage'))
const BilleteraDetallePage = lazy(() => import('@/pages/app/billeteras/BilleteraDetallePage'))
const TransaccionesPage = lazy(() => import('@/pages/app/transacciones/TransaccionesPage'))
const PresupuestosPage = lazy(() => import('@/pages/app/presupuestos/PresupuestosPage'))
const MetasPage = lazy(() => import('@/pages/app/metas/MetasPage'))
const MetaDetallePage = lazy(() => import('@/pages/app/metas/MetaDetallePage'))
const SuscripcionesPage = lazy(() => import('@/pages/app/suscripciones/SuscripcionesPage'))
const PerfilPage = lazy(() => import('@/pages/app/perfil/PerfilPage'))
const ToolsPage = lazy(() => import('@/pages/app/tools/ToolsPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      // Rutas públicas
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/terminos', element: <TermsPage /> },
      { path: '/login/telefono', element: <PhoneLoginPage /> },
      { path: '/auth/verificar-email', element: <VerificarEmail /> },
      { path: '/auth/verificar-telefono', element: <VerificarTelefono /> },
      { path: '/auth/completar-perfil', element: <CompletarPerfil /> },
      { path: '/auth/recuperar-password', element: <RecuperarPassword /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },

      // Onboarding: requiere auth, redirige a dashboard si ya lo completó
      {
        element: <ProtectedRoute mode="onboarding" />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> },
        ],
      },

      // Admin Panel y rutas solo para admin (en testing)
      {
        element: <ProtectedRoute mode="admin" />,
        children: [
          {
            element: <AppWrapper />,
            errorElement: <PageErrorBoundary />,
            children: [
              { path: '/admin', element: <AdminPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/herramientas', element: <ToolsPage />, errorElement: <PageErrorBoundary /> },
            ],
          },
        ],
      },

      {
        element: <ProtectedRoute mode="app" />,
        children: [
          {
            element: <AppWrapper />,
            errorElement: <PageErrorBoundary />,
            children: [
              { index: true, element: <Navigate to="/app/dashboard" replace /> },
              { path: '/app/dashboard', element: <DashboardPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/billeteras', element: <BilleterasPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/billeteras/:id', element: <BilleteraDetallePage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/transacciones', element: <TransaccionesPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/transacciones/recurrentes', element: <Navigate to="/app/transacciones" replace /> },
              { path: '/app/presupuestos', element: <PresupuestosPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/metas', element: <MetasPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/metas/:id', element: <MetaDetallePage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/suscripciones', element: <SuscripcionesPage />, errorElement: <PageErrorBoundary /> },
              { path: '/app/perfil', element: <PerfilPage />, errorElement: <PageErrorBoundary /> },
              // Rutas legacy — redirigen a la página unificada de perfil
              { path: '/app/configuracion', element: <Navigate to="/app/perfil" replace /> },
              { path: '/app/notificaciones/configuracion', element: <Navigate to="/app/perfil?tab=notificaciones" replace /> },
              { path: '/app/*', element: <NotFoundPage /> },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
