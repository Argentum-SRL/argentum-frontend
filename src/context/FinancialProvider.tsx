import { useState, useEffect, useCallback, type ReactNode, useRef } from 'react'
import billeteraService from '../services/billetera.service'
import { dashboardService } from '../services/dashboard.service'
import type { DashboardResumen } from '../types'
import type { Billetera, MetaFinanciera, Presupuesto } from '../types/financial'
import { FinancialContext } from './FinancialContext'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
}

export function FinancialProvider({ children }: Props) {
  const { usuario, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // Usamos el ID del usuario como key para forzar un reset completo del estado
  // cuando el usuario cambia o se desloguea.
  const key = isAuthenticated ? (usuario?.id ?? 'authenticated') : 'guest'

  return (
    <FinancialDataInternal key={key} authLoading={authLoading} isAuthenticated={isAuthenticated}>
      {children}
    </FinancialDataInternal>
  )
}

function FinancialDataInternal({ 
  children, 
  authLoading, 
  isAuthenticated 
}: { 
  children: ReactNode, 
  authLoading: boolean, 
  isAuthenticated: boolean 
}) {
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [dashboard, setDashboard] = useState<DashboardResumen | null>(null)
  const [metas, setMetas] = useState<MetaFinanciera[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [cotizacion, setCotizacion] = useState<import('../types').CotizacionDolar | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const initialized = useRef(false)

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || authLoading) return
    if (initialized.current && !hasLoaded) return
    
    if (!hasLoaded) setIsLoading(true)
    
    try {
      const [billeterasRes, dashboardRes, cotizacionRes] = await Promise.all([
        billeteraService.list(),
        dashboardService.getResumen().catch(() => null),
        dashboardService.getCotizacion().catch(() => null),
      ])

      if (Array.isArray(billeterasRes)) {
        setBilleteras(billeterasRes.map((d: Billetera) => ({
          ...d,
          saldo_actual: Number(d.saldo_actual),
          saldo_inicial: Number(d.saldo_inicial)
        })))
      }

      setDashboard(dashboardRes)
      setCotizacion(cotizacionRes)
      setMetas([])
      setPresupuestos([])
      
      setHasLoaded(true)
    } catch (err) {
      console.error('Error fetching global financial data:', err)
    } finally {
      setIsLoading(false)
      initialized.current = true
    }
  }, [hasLoaded, isAuthenticated, authLoading])

  const refreshBilleteras = useCallback(async () => {
    if (!isAuthenticated || authLoading) return
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
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    if (isAuthenticated && !authLoading && !initialized.current) {
      refreshAll()
    }
  }, [isAuthenticated, authLoading, refreshAll])

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
      setDashboard,
      cotizacion
    }}>
      {children}
    </FinancialContext.Provider>
  )
}
