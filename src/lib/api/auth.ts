import api from '../axios'
import { setToken } from '../auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
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
    email: payload.email.trim(),
    password: payload.password,
  })
  setToken(data.access_token as string)
}

export function loginWithGoogle(): void {
  window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/google`
}
