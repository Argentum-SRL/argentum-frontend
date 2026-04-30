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
  password_configurada: boolean
  auth_provider?: string
  fecha_registro?: string
  password_hash?: string | null
  fecha_nacimiento: string
  sexo: 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir'
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
    fecha_nacimiento: string | null
    sexo: string | null
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

export interface EditarDatosPersonalesRequest {
  nombre: string
  apellido: string
}

export interface EditarEmailRequest {
  email_nuevo: string
  password_actual: string
}

export interface EditarPasswordRequest {
  password_actual?: string
  password_nueva: string
  password_nueva_confirmacion: string
}

export interface EditarTelefonoRequest {
  telefono_nuevo: string
  password_actual?: string
}

export interface EditarCicloFinancieroRequest {
  ciclo_tipo: 'dia_fijo' | 'regla'
  ciclo_valor: string
}

export interface EditarMonedaRequest {
  moneda_principal: 'ARS' | 'USD'
  moneda_secundaria_activa: boolean
  tipo_dolar?: string
}

export interface MetodosLogin {
  email_password: boolean
  telefono: boolean
  google: boolean
  puede_agregar_password: boolean
  puede_agregar_email: boolean
  puede_agregar_telefono: boolean
}
