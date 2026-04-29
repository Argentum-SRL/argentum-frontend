import api from '../axios'
import { setRefreshToken, setToken } from '../auth'
import type { AuthResponse } from '../../types'

export type { AuthResponse }

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
}

export interface CompletarPerfilPayload {
  nombre: string
  apellido: string
  email: string
  password: string
}

function guardarTokensSiPresentes(data: AuthResponse): void {
  if (data.access_token) setToken(data.access_token)
  if (data.refresh_token) setRefreshToken(data.refresh_token)
}

export async function loginWithEmail(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
  })
  guardarTokensSiPresentes(data)
  return data
}

export async function registerWithEmail(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    nombre: payload.nombre.trim(),
    apellido: payload.apellido.trim(),
    email: payload.email.trim(),
    telefono: payload.telefono.trim(),
    password: payload.password,
  })
  guardarTokensSiPresentes(data)
  return data
}

export async function loginWithGoogle(token: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { token })
  guardarTokensSiPresentes(data)
  return data
}

// --- Teléfono ---

export async function enviarCodigoTelefono(telefono: string): Promise<void> {
  await api.post('/auth/telefono/enviar-codigo', { telefono })
}

export async function verificarCodigoTelefono(telefono: string, codigo: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/telefono/verificar', { telefono, codigo })
  guardarTokensSiPresentes(data)
  return data
}

// --- Email verification ---

export async function enviarCodigoEmail(email: string): Promise<void> {
  await api.post('/auth/email/enviar-codigo', { email })
}

export async function verificarCodigoEmail(email: string, codigo: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/email/verificar', { email, codigo })
  guardarTokensSiPresentes(data)
  return data
}

// --- Completar perfil (flujo teléfono) ---

export async function completarPerfil(payload: CompletarPerfilPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/completar-perfil', payload)
  guardarTokensSiPresentes(data)
  return data
}
