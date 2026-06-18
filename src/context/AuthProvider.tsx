import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { clearTokens, getToken, setToken, setRefreshToken } from '../services/api'
import type { Usuario, AuthResponse } from '../types/index'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // Siempre arrancamos en loading=true si hay token para verificar, de lo contrario false
  const [isLoading, setIsLoading] = useState(() => {
    return !!getToken()
  })
  const navigate = useNavigate()

  const logout = useCallback(async (options?: { state?: unknown }) => {
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
      navigate('/login', { replace: true, state: options?.state })
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
      // Sin token: no hay sesión, no hace falta hacer fetch
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    let mounted = true

    api
      .get<{ usuario: Usuario }>('/auth/me', { signal: controller.signal })
      .then((res) => {
        const { data } = res
        if (mounted) setUsuario(data.usuario)
      })
      .catch((err) => {
        if (err && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          // timeout / aborted
        } else {
          clearTokens()
        }
        if (mounted) setUsuario(null)
      })
      .finally(() => {
        clearTimeout(timeoutId)
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  const is_admin = useMemo(() => {
    if (usuario?.is_admin) return true
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return !!payload.is_admin
      } catch {
        return false
      }
    }
    return false
  }, [usuario])

  const contextValue = useMemo(
    () => ({
      usuario,
      isAuthenticated: !!usuario,
      isLoading,
      is_admin,
      login,
      logout,
      refreshUser,
      updateUsuario,
    }),
    [usuario, isLoading, is_admin, login, logout, refreshUser, updateUsuario]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
