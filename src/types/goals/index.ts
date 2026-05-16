export const EstadoMeta = {
  ACTIVA: 'activa',
  COMPLETADA: 'completada',
  PAUSADA: 'pausada',
} as const

export type EstadoMeta = typeof EstadoMeta[keyof typeof EstadoMeta]

export const TipoMovimientoMeta = {
  APORTE: 'aporte',
  RETIRO: 'retiro',
} as const

export type TipoMovimientoMeta = typeof TipoMovimientoMeta[keyof typeof TipoMovimientoMeta]

export interface Goal {
  id: string
  usuario_id: string
  nombre: string
  monto_objetivo: number
  moneda: string
  monto_actual: number
  fecha_limite: string | null
  color: string | null
  nota: string | null
  estado: EstadoMeta
  fecha_creacion: string
  movimientos?: GoalMovement[]
}

export interface GoalMovement {
  id: string
  meta_id: string
  tipo: TipoMovimientoMeta
  monto: number
  moneda_movimiento: string
  cotizacion_usada: number | null
  tipo_dolar_usado: string | null
  billetera_id: string
  fecha: string
  fecha_creacion: string
  billetera?: import('@/types').Billetera
}

export interface GoalAnalytics {
  chart_data: { mes: string; monto: number }[]
  velocidad_mensual: number
  meses_restantes: number | null
  fecha_estimada_finalizacion: string | null
  porcentaje_progreso: number
  monto_faltante: number
}

export interface GoalSummary {
  total_metas: number
  completadas: number
  proximo_vencimiento: string | null
}
