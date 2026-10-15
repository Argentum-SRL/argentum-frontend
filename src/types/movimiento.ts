import type { Transaccion } from './index'

export type MovimientoClase = 'transaccion' | 'transferencia' | 'rendimiento' | 'ajuste' | 'saldo_inicial'
export type MovimientoSentido = 'entra' | 'sale' | 'neutro'
export type CuentaComo = 'gasto' | 'ingreso' | 'nada'

export interface MovimientoItem {
  id: string
  clase: MovimientoClase
  fecha: string
  descripcion: string
  monto: number
  moneda: 'ARS' | 'USD'
  sentido: MovimientoSentido
  etiqueta: string
  cuenta_como: CuentaComo
  aclaracion: string | null
  cuenta_en_saldo: boolean
  saldo_despues: number | null
  cuota_texto: string | null
  grupo_cuotas_id: string | null
  billetera_id: string | null
  billetera_nombre: string | null
  billetera_destino_nombre: string | null
  monto_destino: number | null
  moneda_destino: string | null
  transaccion: Transaccion | null
}

export interface TotalesMoneda {
  gastos: number
  ingresos: number
  balance: number
}

export interface MovimientosResponse {
  items: MovimientoItem[]
  hay_mas: boolean
  total_items: number
  totales: Record<string, TotalesMoneda>
}

export interface FiltrosMovimientos {
  modo?: 'general' | 'billetera'
  billetera_id?: string
  billetera_ids?: string[]
  tipo?: 'ingreso' | 'egreso'
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  categoria_ids?: string[]
  subcategoria_id?: string
  moneda?: string
  estado_verificacion?: string
  busqueda?: string
  skip?: number
  limit?: number
}
