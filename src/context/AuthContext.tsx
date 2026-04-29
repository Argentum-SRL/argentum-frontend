import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { clearTokens, getToken, setToken, setRefreshToken } from '../lib/auth'
import type { Usuario, AuthResponse } from '../types/index'

export interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (respuesta: AuthResponse) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUsuario: (nuevo: Usuario) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

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

  const updateUsuario = useCallback((nuevo: Usuario) => {
    setUsuario(nuevo)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const { data } = await api.get<{ usuario: Usuario }>('/auth/me')
      setUsuario(data.usuario)
    } catch {
      // Ignorar
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    let mounted = true
    api
      .get<{ usuario: Usuario }>('/auth/me')
      .then(({ data }) => {
        if (mounted) setUsuario(data.usuario)
      })
      .catch(() => {
        if (mounted) {
          clearTokens()
          setUsuario(null)
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
