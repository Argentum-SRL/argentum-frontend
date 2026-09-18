import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { clearTokens, getToken, setToken } from '../services/api'
import type { Usuario, AuthResponse } from '../types/index'
import { AuthContext } from './AuthContext'
import { setNavigate, setLogoutFn } from '../utils/browserHistory'
import { limpiarSesionCompleta } from '@/utils/sessionCleanup'

function checkHasSessionMarker(): boolean {
  return (
    (typeof document !== 'undefined' && document.cookie.includes('argentum_has_session=true')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('argentum_has_session') === 'true') ||
    (typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/app') ||
      window.location.pathname.startsWith('/onboarding')
    ))
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // Si hay señal de sesión previa o ruta autenticada, iniciamos en loading=true; de lo contrario false
  const [isLoading, setIsLoading] = useState(checkHasSessionMarker)
  const navigate = useNavigate()

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  const logout = useCallback(async (options?: { state?: unknown }) => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Silencioso: igual limpiamos localmente
    } finally {
      try {
        localStorage.removeItem('argentum_has_session')
      } catch {
        // ignore
      }
      limpiarSesionCompleta()
      clearTokens()
      setUsuario(null)
      navigate('/login', { replace: true, state: options?.state })
    }
  }, [navigate])

  useEffect(() => {
    setLogoutFn(logout)
  }, [logout])

  const login = useCallback((respuesta: AuthResponse) => {
    limpiarSesionCompleta()
    if (respuesta.access_token) {
      setToken(respuesta.access_token)
      try {
        localStorage.setItem('argentum_has_session', 'true')
      } catch {
        // ignore
      }
    }
    if (respuesta.usuario) setUsuario(respuesta.usuario)
  }, [])

  const updateUsuario = useCallback((nuevo: Usuario) => {
    setUsuario(nuevo)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const { data } = await api.get<Usuario>('/usuarios/me')
    setUsuario(data)
  }, [])

  useEffect(() => {
    // Si no hay señal de sesión activa, no hacemos refresh
    if (!checkHasSessionMarker()) {
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    let mounted = true

    api
      .post('/auth/refresh', null, { signal: controller.signal })
      .then(async (refreshRes) => {
        if (!mounted) return
        limpiarSesionCompleta()
        setToken(refreshRes.data.access_token)
        try {
          localStorage.setItem('argentum_has_session', 'true')
        } catch {
          // ignore
        }
        
        try {
          const userRes = await api.get<Usuario>('/usuarios/me', { signal: controller.signal })
          if (mounted) {
            setUsuario(userRes.data)
          }
        } catch (userErr: unknown) {
          const status = (userErr as { response?: { status?: number } })?.response?.status
          if (mounted && status === 401) {
            limpiarSesionCompleta()
            clearTokens()
            try {
              localStorage.removeItem('argentum_has_session')
            } catch {
              // ignore
            }
            setUsuario(null)
          }
        }
      })
      .catch((err) => {
        if (err && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          // timeout / aborted
          return
        }
        const status = (err as { response?: { status?: number } })?.response?.status
        if (mounted && status === 401) {
          limpiarSesionCompleta()
          clearTokens()
          try {
            localStorage.removeItem('argentum_has_session')
          } catch {
            // ignore
          }
          setUsuario(null)
        }
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
