import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import PhoneLoginPage from '../pages/PhoneLoginPage'
import OnboardingPage from '../pages/OnboardingPage'
import DashboardPage from '../pages/app/DashboardPage'
import BilleterasPage from '../pages/app/BilleterasPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/login/telefono', element: <PhoneLoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      {
        path: 'app',
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'billeteras', element: <BilleterasPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default router
