import type { DashboardData } from '../lib/mock/dashboard.mock'

export interface Billetera {
  id: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_actual: number
  saldo_inicial: number
  es_principal: boolean
  es_efectivo: boolean
  estado?: 'activa' | 'archivada'
}

export interface MetaFinanciera {
  id: string
  nombre: string
  monto_objetivo: number
  monto_actual: number
  fecha_limite?: string
  color?: string
}

export interface Presupuesto {
  id: string
  categoria: string
  monto_maximo: number
  monto_gastado: number
  periodo: string
}

export interface FinancialContextType {
  // Data
  billeteras: Billetera[]
  dashboard: DashboardData | null
  metas: MetaFinanciera[]
  presupuestos: Presupuesto[]
  
  // Status
  isLoading: boolean
  hasLoaded: boolean
  
  // Actions
  refreshAll: () => Promise<void>
  refreshBilleteras: () => Promise<void>
  setBilleteras: React.Dispatch<React.SetStateAction<Billetera[]>>
  setDashboard: React.Dispatch<React.SetStateAction<DashboardData | null>>
}
