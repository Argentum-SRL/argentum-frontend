export interface TransaccionMock {
  id: string
  descripcion: string
  categoria: string
  monto: number
  tipo: 'gasto' | 'ingreso'
  fecha: string
  billetera: string
}

export interface ProximoPagoMock {
  id: string
  descripcion: string
  monto: number
  fechaVencimiento: string
  urgente: boolean
}

export interface CategoriaMock {
  nombre: string
  monto: number
  porcentaje: number
  color: string
}

export interface DashboardData {
  balance: number
  balanceCambio: number
  balanceCambioPct: number
  disponibleReal: number
  proyeccion: number
  gastoDiarioPromedio: number
  transacciones: TransaccionMock[]
  proximosPagos: ProximoPagoMock[]
  categorias: CategoriaMock[]
}

export const mockDashboard: DashboardData = {
  balance: 1247350.8,
  balanceCambio: 84200,
  balanceCambioPct: 7.2,
  disponibleReal: 892500,
  proyeccion: 1180000,
  gastoDiarioPromedio: 41200,
  transacciones: [
    { id: '1', descripcion: 'Carrefour',     categoria: 'supermercado',  monto: -12400,  tipo: 'gasto',   fecha: '2026-04-29', billetera: 'Galicia' },
    { id: '2', descripcion: 'Sueldo',        categoria: 'ingreso',       monto: 850000,  tipo: 'ingreso', fecha: '2026-04-28', billetera: 'Galicia' },
    { id: '3', descripcion: 'SUBE',          categoria: 'transporte',    monto: -780,    tipo: 'gasto',   fecha: '2026-04-28', billetera: 'Mercado Pago' },
    { id: '4', descripcion: 'Café Martínez', categoria: 'salidas',       monto: -3200,   tipo: 'gasto',   fecha: '2026-04-27', billetera: 'Mercado Pago' },
    { id: '5', descripcion: 'Expensas',      categoria: 'vivienda',      monto: -48000,  tipo: 'gasto',   fecha: '2026-04-25', billetera: 'Galicia' },
    { id: '6', descripcion: 'Spotify',       categoria: 'suscripciones', monto: -4900,   tipo: 'gasto',   fecha: '2026-04-24', billetera: 'Mercado Pago' },
  ],
  proximosPagos: [
    { id: '1', descripcion: 'Netflix',   monto: 3890,  fechaVencimiento: '2026-05-02', urgente: true  },
    { id: '2', descripcion: 'Gym',       monto: 18000, fechaVencimiento: '2026-05-05', urgente: false },
    { id: '3', descripcion: 'Internet',  monto: 12400, fechaVencimiento: '2026-05-10', urgente: false },
  ],
  categorias: [
    { nombre: 'Vivienda',      monto: 48000, porcentaje: 45, color: '#A8905A' },
    { nombre: 'Supermercado',  monto: 25600, porcentaje: 24, color: '#3B6D11' },
    { nombre: 'Salidas',       monto: 14300, porcentaje: 13, color: '#993C1D' },
    { nombre: 'Transporte',    monto: 9800,  porcentaje:  9, color: '#185FA5' },
    { nombre: 'Suscripciones', monto: 8790,  porcentaje:  9, color: '#6B2E8A' },
  ],
}
