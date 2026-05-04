import type { Billetera, DashboardResumen } from './index'

export type { Billetera }

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
  dashboard: DashboardResumen | null
  metas: MetaFinanciera[]
  presupuestos: Presupuesto[]

  // Status
  isLoading: boolean
  hasLoaded: boolean

  // Actions
  refreshAll: () => Promise<void>
  refreshBilleteras: () => Promise<void>
  setBilleteras: React.Dispatch<React.SetStateAction<Billetera[]>>
  setDashboard: React.Dispatch<React.SetStateAction<DashboardResumen | null>>
}
