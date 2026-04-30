import { createContext } from 'react'
import type { Usuario, AuthResponse } from '../types/index'

export interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (respuesta: AuthResponse) => void
  logout: (options?: { state?: unknown }) => Promise<void>
  refreshUser: () => Promise<void>
  updateUsuario: (nuevo: Usuario) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
