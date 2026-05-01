import { useState, useEffect, useCallback, type ReactNode, useRef } from 'react'
import billeteraService from '../services/billetera.service'
import { mockDashboard } from '../lib/mock/dashboard.mock'
import type { DashboardData } from '../lib/mock/dashboard.mock'
import type { Billetera, MetaFinanciera, Presupuesto } from '../types/financial'
import { FinancialContext } from './FinancialContext'

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [metas, setMetas] = useState<MetaFinanciera[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const initialized = useRef(false)

  const refreshAll = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (initialized.current && !hasLoaded) return
    
    if (!hasLoaded) setIsLoading(true)
    
    try {
      // Fetch everything in parallel
      const [billeterasRes] = await Promise.all([
        billeteraService.list(),
        Promise.resolve(mockDashboard),
        Promise.resolve([]),
        Promise.resolve([]),
      ])

      if (Array.isArray(billeterasRes)) {
        setBilleteras(billeterasRes.map((d: Billetera) => ({
          ...d,
          saldo_actual: Number(d.saldo_actual),
          saldo_inicial: Number(d.saldo_inicial)
        })))
      }

      setDashboard(mockDashboard)
      setMetas([])
      setPresupuestos([])
      
      setHasLoaded(true)
    } catch (err) {
      console.error('Error fetching global financial data:', err)
    } finally {
      setIsLoading(false)
      initialized.current = true
    }
  }, [hasLoaded])

  const refreshBilleteras = useCallback(async () => {
    try {
      const data = await billeteraService.list()
      if (Array.isArray(data)) {
        setBilleteras(data.map((d: Billetera) => ({
          ...d,
          saldo_actual: Number(d.saldo_actual),
          saldo_inicial: Number(d.saldo_inicial)
        })))
      }
    } catch (err) {
      console.error('Error refreshing wallets:', err)
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      refreshAll()
    }
  }, [refreshAll])

  return (
    <FinancialContext.Provider value={{ 
      billeteras, 
      dashboard, 
      metas, 
      presupuestos, 
      isLoading, 
      hasLoaded,
      refreshAll,
      refreshBilleteras, 
      setBilleteras,
      setDashboard
    }}>
      {children}
    </FinancialContext.Provider>
  )
}
