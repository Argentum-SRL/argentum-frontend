import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { clearTokens, getRefreshToken } from '../../lib/auth'

export default function DashboardPage() {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Si falla igual limpiamos local
    } finally {
      clearTokens()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  )
}
