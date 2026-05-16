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
  fecha_nacimiento: string | null
  sexo: 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir' | null
}

// Historial de precios de una suscripción
export interface HistorialSuscripcion {
  id: string
  suscripcion_id: string
  monto: number
  moneda: 'ARS' | 'USD'
  vigente_desde: string
  fecha_creacion: string
}

export interface Suscripcion {
  id: string
  usuario_id: string
  nombre: string
  categoria_id: string | null
  frecuencia: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  proximo_cobro: string
  estado: 'activa' | 'pausada' | 'cancelada'
  billetera_id: string | null
  tarjeta_id: string | null
  fecha_creacion: string
  precio_actual: HistorialSuscripcion | null
  historial_precios: HistorialSuscripcion[]
  costo_mensual_equivalente: number | null
}

export interface TotalMensualSuscripciones {
  total_ars: number
  total_usd: number
}

export interface SuscripcionCreate {
  nombre: string
  categoria_id?: string
  frecuencia: string
  proximo_cobro: string
  monto: number
  moneda: string
  vigente_desde?: string
  billetera_id?: string
  tarjeta_id?: string
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
  fecha_nacimiento?: string | null
  sexo?: string | null
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

export interface Billetera {
  id: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_actual: number
  saldo_inicial: number
  es_principal: boolean
  es_efectivo: boolean
  estado: 'activa' | 'archivada'
  fecha_creacion: string
  bank_id?: string | null
  tiene_transacciones: boolean
}

export interface Categoria {
  id: string
  nombre: string
  tipo: 'ingreso' | 'egreso'
  icono: string | null
  color: string | null
  es_global: boolean
  creador_id: string | null
  estado: 'activa' | 'archivada'
}

export interface Subcategoria {
  id: string
  categoria_id: string
  nombre: string
  es_global: boolean
  creador_id: string | null
  estado: 'activa' | 'archivada'
}

export interface Transaccion {
  id: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  moneda: 'ARS' | 'USD'
  fecha: string
  descripcion: string
  categoria_id: string | null
  subcategoria_id: string | null
  metodo_pago: 'efectivo' | 'debito' | 'transferencia' | 'credito'
  billetera_id: string
  tarjeta_id: string | null
  es_recurrente: boolean
  es_cuota_hija: boolean
  es_padre_cuotas: boolean
  grupo_cuotas_id: string | null
  origen: 'manual' | 'ia_wpp' | 'ia_chat' | 'ia_pdf' | 'recurrente'
  estado_verificacion: 'confirmada' | 'pendiente' | null
  fecha_creacion: string
  subcategoria?: Subcategoria
}

export interface TransferenciaInterna {
  id: string
  billetera_origen_id: string
  billetera_destino_id: string
  monto: number
  moneda: 'ARS' | 'USD'
  fecha: string
  notas: string | null
  fecha_creacion: string
}

export interface TransaccionRecurrente {
  id: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  moneda: 'ARS' | 'USD'
  descripcion: string
  categoria_id: string | null
  billetera_id: string
  frecuencia: 'semanal' | 'quincenal' | 'mensual'
  dia_registro: number
  estado: 'activa' | 'pausada'
  fecha_creacion: string
}

export interface DashboardResumen {
  periodo: { fecha_inicio: string; fecha_fin: string; primera_transaccion?: string }
  balance: {
    ingresos: number
    egresos: number
    balance: number
    variacion_vs_ciclo_anterior: number | null
  }
  disponible_real: {
    total_billeteras: number
    cuotas_comprometidas_proximo_ciclo: number
    disponible: number
  }
  ultimos_movimientos: MovimientoDashboard[]
  proximos_pagos: PagoDashboard[]
}

export interface MovimientoDashboard {
  id: string
  descripcion: string
  fecha: string
  monto: number
  tipo: 'ingreso' | 'egreso'
  moneda: 'ARS' | 'USD'
  billetera_nombre: string
  categoria_nombre: string | null
  subcategoria_nombre: string | null
  estado_verificacion: 'confirmada' | 'pendiente' | null
}

export interface PagoDashboard {
  id: string
  nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  fecha_cobro: string
  dias_restantes: number
  tipo: 'suscripcion' | 'cuota' | 'resumen_tarjeta'
  tarjeta_id?: string
  color?: string
  red?: string
  billetera_nombre?: string
  billetera_id?: string
}

export interface Proyeccion {
  periodo: {
    fecha_inicio: string
    fecha_fin: string
    dias_transcurridos: number
    dias_restantes: number
    dias_totales: number
  }
  gasto_proyectado_total: number
  balance_proyectado: number
  ingresos_proyectados: number
  certezas: {
    cuotas_restantes: number
    suscripciones_restantes: number
    total: number
  }
  desglose_por_categoria: ProyeccionCategoria[]
  nivel_confianza: 'alto' | 'medio' | 'bajo'
  ciclos_analizados: number
  pesos: { historial: number; ciclo_actual: number }
  advertencias: string[]
}

export interface ProyeccionCategoria {
  categoria_id: string
  categoria_nombre: string
  gasto_actual_ciclo: number
  promedio_historico: number
  proyectado: number
  fuera_de_patron: boolean
}

export interface CuotaResumen {
  id: string
  descripcion: string
  subcategoria_nombre?: string | null
  numero_cuota: number
  total_cuotas: number
  monto: number
  moneda: 'ARS' | 'USD'
  fecha_vencimiento: string
}

export interface ResumenFuturo {
  mes: string
  mes_fecha: string
  total: number
  moneda: 'ARS' | 'USD'
  cantidad_cuotas: number
}

export interface ResumenTarjeta {
  fecha_cierre_proximo: string
  fecha_vencimiento_proximo: string
  total_comprometido_resumen_actual: number
  total_comprometido_resumen_siguiente: number
  cuotas_resumen_actual: CuotaResumen[]
  cuotas_resumen_siguiente: CuotaResumen[]
  resumenes_futuros: ResumenFuturo[]
}

export interface TarjetaCredito {
  id: string
  usuario_id: string
  billetera_id: string
  nombre: string
  red: 'visa' | 'mastercard' | 'amex' | 'naranja' | 'cabal' | 'otro'
  dia_cierre: number
  dia_vencimiento: number
  limite_credito: number | null
  moneda: 'ARS' | 'USD'
  estado: 'activa' | 'archivada'
  color: string | null
  fecha_creacion: string
  resumen_actual?: ResumenTarjeta
}

export interface TarjetaCreditoCreate {
  billetera_id: string
  nombre: string
  red: string
  dia_cierre: number
  dia_vencimiento: number
  limite_credito?: number
  moneda: string
  color?: string
}

export interface PresupuestoCategoriaResponse {
  categoria_id: string | null
  subcategoria_id: string | null
  nombre: string
  es_subcategoria: boolean
}

export interface PeriodoPresupuesto {
  id: string
  presupuesto_id: string
  fecha_inicio: string
  fecha_fin: string
  monto_limite: number
  monto_usado: number
  superado: boolean
  porcentaje_usado: number
  dias_restantes: number
}

export interface Presupuesto {
  id: string
  usuario_id: string
  nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  periodo: 'semanal' | 'quincenal' | 'mensual'
  renovacion: 'automatica' | 'manual'
  estado: 'activo' | 'pausado' | 'finalizado'
  fecha_creacion: string
  categorias: PresupuestoCategoriaResponse[]
  periodo_actual: PeriodoPresupuesto | null
  proxima_renovacion: string | null
}

export interface PresupuestoCategoriaInput {
  categoria_id: string | null
  subcategoria_id: string | null
}

export interface PresupuestoCreate {
  nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  periodo: 'semanal' | 'quincenal' | 'mensual'
  renovacion: 'automatica' | 'manual'
  categorias: PresupuestoCategoriaInput[]
}

export interface PresupuestoUpdate {
  nombre?: string
  monto?: number
  moneda?: string
  renovacion?: string
  categorias?: PresupuestoCategoriaInput[]
}

export * from './goals'
