import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { clearTokens, getToken, setToken, setRefreshToken } from '../lib/auth'
import type { Usuario, AuthResponse } from '../types'

interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (respuesta: AuthResponse) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('argentum_refresh_token')
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Silencioso: igual limpiamos localmente
    } finally {
      clearTokens()
      setUsuario(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const login = useCallback((respuesta: AuthResponse) => {
    if (respuesta.access_token) setToken(respuesta.access_token)
    if (respuesta.refresh_token) setRefreshToken(respuesta.refresh_token)
    if (respuesta.usuario) setUsuario(respuesta.usuario)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    api
      .get<{ usuario: Usuario }>('/auth/me')
      .then(({ data }) => {
        setUsuario(data.usuario)
      })
      .catch(() => {
        clearTokens()
        setUsuario(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
