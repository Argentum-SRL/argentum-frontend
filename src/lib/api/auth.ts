import api from '../axios'
import { setRefreshToken, setToken } from '../auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  apellido: string
  email: string
  telefono: string
  password: string
}

export async function loginWithEmail(payload: LoginPayload): Promise<void> {
  const { data } = await api.post('/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
  })
  setToken(data.access_token as string)
  setRefreshToken(data.refresh_token as string)
}

export async function registerWithEmail(payload: RegisterPayload): Promise<void> {
  const { data } = await api.post('/auth/register', {
    name: payload.name.trim(),
    apellido: payload.apellido.trim(),
    email: payload.email.trim(),
    telefono: payload.telefono.trim(),
    password: payload.password,
  })
  setToken(data.access_token as string)
  setRefreshToken(data.refresh_token as string)
}

export async function loginWithGoogle(token: string): Promise<any> {
  const { data } = await api.post('/auth/google', { token })
  setToken(data.access_token as string)
  setRefreshToken(data.refresh_token as string)
  return data
}

// --- Teléfono ---

export async function enviarCodigoTelefono(telefono: string): Promise<void> {
  await api.post('/auth/telefono/enviar-codigo', { telefono })
}

export async function verificarCodigoTelefono(telefono: string, codigo: string): Promise<any> {
  const { data } = await api.post('/auth/telefono/verificar', { telefono, codigo })
  setToken(data.access_token as string)
  setRefreshToken(data.refresh_token as string)
  return data
}
