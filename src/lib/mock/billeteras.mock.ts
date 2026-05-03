// ─── Mock de billeteras — datos tipados listos para conectar al backend ───────

export interface Billetera {
  id: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_actual: number
  saldo_inicial: number
  es_principal: boolean
  es_efectivo: boolean
  estado: 'activa' | 'archivada'
  /** null = billetera personalizada sin banco definido */
  bank_id: string | null
  fecha_creacion: string
}

export const MOCK_BILLETERAS: Billetera[] = [
  {
    id: '1',
    nombre: 'Santander',
    moneda: 'ARS',
    saldo_actual: 892500,
    saldo_inicial: 500000,
    es_principal: true,
    es_efectivo: false,
    estado: 'activa',
    bank_id: 'santander',
    fecha_creacion: '2025-04-01',
  },
  {
    id: '2',
    nombre: 'Mercado Pago',
    moneda: 'ARS',
    saldo_actual: 145000,
    saldo_inicial: 0,
    es_principal: false,
    es_efectivo: false,
    estado: 'activa',
    bank_id: 'mercadopago',
    fecha_creacion: '2025-04-01',
  },
  {
    id: '3',
    nombre: 'Efectivo ARS',
    moneda: 'ARS',
    saldo_actual: 35000,
    saldo_inicial: 0,
    es_principal: false,
    es_efectivo: true,
    estado: 'activa',
    bank_id: null,
    fecha_creacion: '2025-04-01',
  },
  {
    id: '4',
    nombre: 'Efectivo USD',
    moneda: 'USD',
    saldo_actual: 2100,
    saldo_inicial: 0,
    es_principal: false,
    es_efectivo: true,
    estado: 'activa',
    bank_id: null,
    fecha_creacion: '2025-04-01',
  },
]

/** Cotización hardcodeada para el mock — reemplazar con DolarAPI cuando haya backend */
export const MOCK_COTIZACION_USD = {
  tipo: 'Blue',
  valor: 1028,
}
