export interface Usuario {
  id: string
  nombre: string | null
  apellido: string | null
  email: string | null
  telefono: string | null
  foto_url: string | null
  rol: 'usuario' | 'admin'
  is_admin: boolean
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
  subcategoria_id: string | null
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
  subcategoria_id?: string
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
  password_actual?: string
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
    ars: {
      ingresos: number
      egresos: number
      balance: number
      variacion_vs_ciclo_anterior: number | null
    }
    usd: {
      ingresos: number
      egresos: number
      balance: number
      variacion_vs_ciclo_anterior: number | null
    }
  }
  disponible_real: {
    ars: {
      saldo_billeteras: number
      cuotas_proximo_ciclo: number
      disponible: number
    }
    usd: {
      saldo_billeteras: number
      cuotas_proximo_ciclo: number
      disponible: number
    }
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
  datos_suficientes: boolean
}

export interface ProyeccionesResponse {
  ars: Proyeccion
  usd: Proyeccion
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
  pagada: boolean
}

export interface ResumenAnterior {
  mes: string
  fecha_vencimiento: string
  fecha_cierre: string
  total: number
  moneda: string
  pagado: boolean
  cuotas: CuotaResumen[]
}

export interface ResumenFuturo {
  mes: string
  mes_fecha: string
  total: number
  moneda: 'ARS' | 'USD'
  cantidad_cuotas: number
  cuotas?: CuotaResumen[]
}

export interface ResumenTarjeta {
  fecha_cierre_proximo: string
  fecha_vencimiento_proximo: string
  total_comprometido_resumen_actual: number
  total_comprometido_resumen_siguiente: number
  cuotas_resumen_actual: CuotaResumen[]
  cuotas_resumen_siguiente: CuotaResumen[]
  resumenes_futuros: ResumenFuturo[]
  resumenes_anteriores?: ResumenAnterior[]
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
  moneda?: 'ARS' | 'USD'
  periodo?: 'semanal' | 'quincenal' | 'mensual'
  renovacion?: 'automatica' | 'manual'
  categorias?: PresupuestoCategoriaInput[]
}

export * from './goals'

export type NivelNotificacion = 'CRITICA' | 'FINANCIERA_IMPORTANTE' | 'FINANCIERA_INFORMATIVA' | 'SOFT'

export type TipoNotificacion =
  | 'CAMBIO_CONTRASENA'
  | 'NUEVO_DISPOSITIVO'
  | 'CAMBIO_EMAIL'
  | 'INTENTOS_LOGIN_FALLIDOS'
  | 'WHATSAPP_NUEVO_VINCULADO'
  | 'CUOTA_VENCE'
  | 'PRESUPUESTO_AGOTADO'
  | 'SALDO_CERO'
  | 'SUSCRIPCION_HOY'
  | 'PRESUPUESTO_LIMITE'
  | 'SUSCRIPCION_PROXIMA'
  | 'RESUMEN_SEMANAL'
  | 'META_ALCANZADA'
  | 'GASTO_INUSUAL'
  | 'INACTIVIDAD'

export interface Notificacion {
  id: string
  usuario_id: string
  tipo: TipoNotificacion
  nivel: NivelNotificacion
  mensaje: string
  leida: boolean
  canal_web: boolean
  canal_whatsapp: boolean
  canal_email: boolean
  enviada_whatsapp: boolean
  enviada_email: boolean
  grupo_agrupacion?: string | null
  entidad_tipo?: string | null
  entidad_id?: string | null
  deep_link?: string | null
  silenciada_hasta?: string | null
  created_at: string
}

export interface ConfiguracionNotificacion {
  id: string
  usuario_id: string
  cuota_vence_anticipacion_dias: number
  cuota_vence_web: boolean
  cuota_vence_whatsapp: boolean
  presupuesto_umbral_1: number
  presupuesto_umbral_1_activo: boolean
  presupuesto_umbral_1_web: boolean
  presupuesto_umbral_1_whatsapp: boolean
  presupuesto_umbral_2_web: boolean
  presupuesto_umbral_2_whatsapp: boolean
  suscripcion_hoy_web: boolean
  suscripcion_hoy_whatsapp: boolean
  suscripcion_recordatorio_activo: boolean
  suscripcion_recordatorio_dias: number
  suscripcion_recordatorio_web: boolean
  suscripcion_recordatorio_whatsapp: boolean
  meta_alcanzada_activo: boolean
  meta_alcanzada_web: boolean
  meta_alcanzada_whatsapp: boolean
  saldo_cero_web: boolean
  saldo_cero_whatsapp: boolean
  gasto_inusual_activo: boolean
  gasto_inusual_web: boolean
  gasto_inusual_whatsapp: boolean
  resumen_semanal_activo: boolean
  resumen_semanal_web: boolean
  resumen_semanal_whatsapp: boolean
  inactividad_activo: boolean
  inactividad_dias: number
  inactividad_web: boolean
  inactividad_whatsapp: boolean
  whatsapp_hora_envio: number
  whatsapp_minuto_envio: number
  updated_at?: string | null
}


// ===== PRESIÓN FINANCIERA FUTURA =====

export interface DetalleTarjetaMes {
  tarjeta_id: string;
  tarjeta_nombre: string;
  total: number;
  moneda: 'ARS' | 'USD';
}

export interface MesPresionFutura {
  anio: number;
  mes: number;
  mes_label: string;
  total: {
    ars: number;
    usd: number;
  };
  tarjetas: DetalleTarjetaMes[];
}

export interface PresionFuturaData {
  meses: MesPresionFutura[];
  total_comprometido: {
    ars: number;
    usd: number;
  };
}

export interface GrupoCuotasResumen {
  id: string
  descripcion: string
  monto_total: number
  total_financiado: number
  cantidad_cuotas: number
  cantidad_pagadas: number
  cantidad_pendientes: number
  monto_cuota: number
  proximo_vencimiento: string | null
  total_pagado: number
  total_pendiente: number
  moneda: 'ARS' | 'USD'
  tarjeta_nombre: string | null
  fecha_compra: string
  transaccion_padre_id: string
  tiene_interes: boolean
  tasa_interes: number | null
  estado: 'activo' | 'cancelado' | 'completado'
}


// ===== PERFIL FINANCIERO =====

export interface PerfilFinanciero {
  id: string;
  usuario_id: string;
  tasa_ahorro_ars: number | null;
  tasa_ahorro_usd: number | null;
  score_impulsividad_ars: number | null;
  score_impulsividad_usd: number | null;
  ratio_cuotas_ars: number | null;
  ratio_cuotas_usd: number | null;
  cumplimiento_presupuesto: number | null;
  consistencia_registro: number | null;
  porcentaje_suscripciones_ars: number | null;
  porcentaje_suscripciones_usd: number | null;
  ultima_actualizacion: string | null;
  fecha_creacion: string;
}

export type NivelIndicador = 'excelente' | 'bien' | 'moderado' | 'bajo' | 'critico' | 'sin_datos';

export interface InterpretacionIndicador {
  label: string;
  nivel: NivelIndicador;
}

export interface PerfilFinancieroConInterpretaciones extends PerfilFinanciero {
  interpretaciones: {
    tasa_ahorro_ars: InterpretacionIndicador;
    tasa_ahorro_usd: InterpretacionIndicador;
    score_impulsividad_ars: InterpretacionIndicador;
    score_impulsividad_usd: InterpretacionIndicador;
    ratio_cuotas_ars: InterpretacionIndicador;
    ratio_cuotas_usd: InterpretacionIndicador;
    cumplimiento_presupuesto: InterpretacionIndicador;
    consistencia_registro: InterpretacionIndicador;
    porcentaje_suscripciones_ars: InterpretacionIndicador;
    porcentaje_suscripciones_usd: InterpretacionIndicador;
  };
}

export interface SubcategoriaGasto {
  subcategoria_id: string
  subcategoria_nombre: string
  gasto_actual_ciclo: {
    ars: number
    usd: number
  }
}

export * from './importacion'
