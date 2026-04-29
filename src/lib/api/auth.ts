import api from '../axios'
import { setToken } from '../auth'

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
}

export async function loginWithGoogle(token: string): Promise<any> {
  const { data } = await api.post('/auth/google', { token })
  setToken(data.access_token as string)
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token)
  }
  return data
}
