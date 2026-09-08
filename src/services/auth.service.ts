import api, { setToken } from './api'
import type { AuthResponse } from '@/types'

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

export interface OkResponse {
  ok: boolean
}

function guardarTokensSiPresentes(data: AuthResponse): void {
  if (data.access_token) setToken(data.access_token)
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
  if (import.meta.env.DEV) {
    console.log('[Auth][Google] Enviando token al backend', {
      tokenPresent: Boolean(token),
      tokenLength: token?.length ?? 0,
      tokenPrefix: token ? `${token.slice(0, 12)}...` : null,
    })
  }

  try {
    const { data } = await api.post<AuthResponse>('/auth/google', { token })

    if (import.meta.env.DEV) {
      console.log('[Auth][Google] Respuesta backend recibida', {
        hasAccessToken: Boolean(data.access_token),
        hasRefreshToken: Boolean(data.refresh_token),
        requiereTelefono: data.requiere_telefono,
        requiereOnboarding: data.requiere_onboarding,
        usuarioEmail: data.usuario?.email,
      })
    }

    guardarTokensSiPresentes(data)
    return data
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      const err = error as {
        message?: string
        response?: { status?: number; data?: unknown }
        config?: { baseURL?: string; url?: string }
      }
      console.error('[Auth][Google] Error al hacer POST /auth/google', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        baseURL: err.config?.baseURL,
        url: err.config?.url,
      })
    }
    throw error
  }
}

export interface CodigoVinculacionResponse {
  codigo: string
  link_whatsapp: string
  mensaje_precargado: string
  expiracion: string
  expira_en_segundos: number
  telefono_bot: string
}

export async function solicitarCodigoVinculacion(): Promise<CodigoVinculacionResponse> {
  const { data } = await api.post<CodigoVinculacionResponse>('/auth/telefono/solicitar-vinculacion')
  return data
}

/** @deprecated Flujo reemplazado por vinculación iniciada por el usuario vía WhatsApp */
export async function enviarCodigoTelefono(_telefono?: string): Promise<void> {
  void _telefono
  throw new Error('Flujo obsoleto. Usar solicitarCodigoVinculacion()')
}

/** @deprecated Flujo reemplazado por vinculación iniciada por el usuario vía WhatsApp */
export async function verificarCodigoTelefono(_telefono?: string, _codigo?: string): Promise<AuthResponse> {
  void _telefono
  void _codigo
  throw new Error('Flujo obsoleto. La verificación se realiza automáticamente en el webhook')
}

export async function enviarCodigoEmail(email: string): Promise<unknown> {
  const { data } = await api.post('/auth/email/enviar-codigo', { email })
  return data
}

export async function verificarCodigoEmail(email: string, codigo: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/email/verificar', { email, codigo })
  guardarTokensSiPresentes(data)
  return data
}

export async function completarPerfil(payload: CompletarPerfilPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/completar-perfil', payload)
  guardarTokensSiPresentes(data)
  return data
}

export interface VerificarRecuperacionPayload {
  email: string
  codigo: string
  nueva_password: string
}

export async function recuperarPassword(email: string): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>('/auth/recuperar-password', { email })
  return data
}

export async function verificarRecuperacion(payload: VerificarRecuperacionPayload): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>('/auth/recuperar-password/verificar', {
    email: payload.email,
    codigo: payload.codigo,
    nueva_password: payload.nueva_password,
  })
  return data
}

export async function validarResetToken(token: string): Promise<{ success: boolean; data: { nombre: string } }> {
  const { data } = await api.get<{ success: boolean; data: { nombre: string } }>('/auth/reset-password/validar', {
    params: { token },
  })
  return data
}

export async function confirmarResetPassword(
  token: string,
  nuevaPassword: string
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>('/auth/reset-password/confirmar', {
    token,
    nueva_password: nuevaPassword,
  })
  return data
}

