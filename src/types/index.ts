export interface Usuario {
  id: string
  nombre: string | null
  apellido: string | null
  email: string | null
  telefono: string | null
  foto_url: string | null
  rol: 'usuario' | 'admin'
  estado: string
  moneda_principal: 'ARS' | 'USD' | null
  moneda_secundaria_activa: boolean
  tipo_dolar: string
  ciclo_tipo: string | null
  ciclo_valor: string | null
  onboarding_completo: boolean
  email_verificado: boolean
  telefono_verificado: boolean
  auth_provider?: string
  fecha_registro?: string
}

export interface AuthResponse {
  access_token: string | null
  refresh_token: string | null
  token_type: string
  usuario: Usuario | null
  requiere_telefono: boolean
  requiere_datos: boolean
  requiere_verificacion_email: boolean
  requiere_verificacion_telefono: boolean
  requiere_onboarding: boolean
}

export interface MeResponse {
  usuario: Usuario
}

export interface EstadoOnboarding {
  onboarding_completo: boolean
  pasos_pendientes: string[]
  datos_actuales: {
    nombre: string | null
    apellido: string | null
    moneda_principal: string | null
    ciclo_tipo: string | null
    ciclo_valor: string | null
  }
}

export interface CotizacionDolar {
  tipo: 'oficial' | 'blue' | 'tarjeta' | 'mep'
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number | null
  moneda: string
  fecha_actualizacion: string | null
}

export interface CotizacionesDolarResponse {
  fuente: string
  actualizado_en: string
  cotizaciones: Record<'oficial' | 'blue' | 'tarjeta' | 'mep', CotizacionDolar>
}
