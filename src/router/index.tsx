import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import OnboardingPage from '../pages/OnboardingPage'
import DashboardPage from '../pages/app/DashboardPage'
import BilleterasPage from '../pages/app/BilleterasPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'billeteras', element: <BilleterasPage /> },
    ],
  },
  { path: '*', element: <LoginPage /> },
])

export default router
