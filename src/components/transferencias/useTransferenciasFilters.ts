import { useState, useMemo, useCallback } from 'react'
import type { TransferenciaInterna, Billetera } from '@/types'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import type { TipoOperacionFilter, PeriodoPresetFilter } from './TransferenciasFilterBar'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

export function getDayLabel(fechaStr: string): string {
  if (!fechaStr) return ''
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  if (fechaStr === todayStr) return 'Hoy'
  if (fechaStr === yesterdayStr) return 'Ayer'

  const [y, m, d] = fechaStr.split('-').map(Number)
  if (!y || !m || !d) return fechaStr

  return `${d} de ${MESES[m - 1]}`
}

interface UseTransferenciasFiltersProps {
  transferencias: TransferenciaInterna[]
  billeteras: Billetera[]
}

export function useTransferenciasFilters({
  transferencias,
  billeteras,
}: UseTransferenciasFiltersProps) {
  const { periodo: periodoActual } = usePeriodoActual()

  const [busqueda, setBusqueda] = useState('')
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacionFilter>('todas')
  const [billeteraId, setBilleteraId] = useState<string | undefined>(undefined)
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPresetFilter>('todos')

  // Rango de fechas para el preset temporal seleccionado
  const dateRange = useMemo(() => {
    if (periodoPreset === 'todos') return null
    const today = new Date()
    if (periodoPreset === 'ciclo') {
      if (periodoActual) {
        return { desde: periodoActual.fecha_inicio, hasta: periodoActual.fecha_fin }
      }
      const d1 = new Date(today.getFullYear(), today.getMonth(), 1)
      const d2 = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return {
        desde: d1.toISOString().split('T')[0],
        hasta: d2.toISOString().split('T')[0],
      }
    }
    if (periodoPreset === 'este_mes') {
      const d1 = new Date(today.getFullYear(), today.getMonth(), 1)
      const d2 = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return {
        desde: d1.toISOString().split('T')[0],
        hasta: d2.toISOString().split('T')[0],
      }
    }
    if (periodoPreset === 'mes_pasado') {
      const d1 = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const d2 = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        desde: d1.toISOString().split('T')[0],
        hasta: d2.toISOString().split('T')[0],
      }
    }
    return null
  }, [periodoPreset, periodoActual])

  // Filtrado temporal y por cuenta base
  const transferenciasBase = useMemo(() => {
    return transferencias.filter((tx) => {
      if (dateRange) {
        const txDate = tx.fecha.split('T')[0]
        if (txDate < dateRange.desde || txDate > dateRange.hasta) {
          return false
        }
      }
      if (billeteraId) {
        if (tx.billetera_origen_id !== billeteraId && tx.billetera_destino_id !== billeteraId) {
          return false
        }
      }
      return true
    })
  }, [transferencias, dateRange, billeteraId])

  // Conteos para los segmented tabs
  const transfCounts = useMemo(() => {
    let cuentas = 0
    let fx = 0
    transferenciasBase.forEach((tx) => {
      const orig = billeteras.find((b) => b.id === tx.billetera_origen_id)
      const dest = billeteras.find((b) => b.id === tx.billetera_destino_id)
      const mOrig = tx.moneda_origen || orig?.moneda || tx.moneda
      const mDest = tx.moneda_destino || dest?.moneda || tx.moneda
      if (mOrig === mDest) {
        cuentas++
      } else {
        fx++
      }
    })
    return {
      total: transferenciasBase.length,
      cuentas,
      fx,
    }
  }, [transferenciasBase, billeteras])

  // Transferencias finalmente filtradas (por tipo de operación y búsqueda de texto)
  const transferenciasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return transferenciasBase.filter((tx) => {
      const orig = billeteras.find((b) => b.id === tx.billetera_origen_id)
      const dest = billeteras.find((b) => b.id === tx.billetera_destino_id)
      const mOrig = tx.moneda_origen || orig?.moneda || tx.moneda
      const mDest = tx.moneda_destino || dest?.moneda || tx.moneda
      const esMismaMoneda = mOrig === mDest

      if (tipoOperacion === 'cuentas' && !esMismaMoneda) return false
      if (tipoOperacion === 'fx' && esMismaMoneda) return false

      if (q) {
        const nombreOrig = (orig?.nombre || '').toLowerCase()
        const nombreDest = (dest?.nombre || '').toLowerCase()
        const notas = (tx.notas || '').toLowerCase()
        const montoStr = String(tx.monto || '')
        const montoDestStr = String(tx.monto_destino || '')
        const match =
          nombreOrig.includes(q) ||
          nombreDest.includes(q) ||
          notas.includes(q) ||
          montoStr.includes(q) ||
          montoDestStr.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [transferenciasBase, tipoOperacion, busqueda, billeteras])

  // Totales de métricas consolidadas
  const { totalTransfARS, totalTransfUSD } = useMemo(() => {
    let ars = 0
    let usd = 0
    transferenciasFiltradas.forEach((tx) => {
      const orig = billeteras.find((b) => b.id === tx.billetera_origen_id)
      const mOrig = tx.moneda_origen || orig?.moneda || tx.moneda
      const monto = tx.monto_origen ?? tx.monto
      if (mOrig === 'ARS') {
        ars += monto
      } else if (mOrig === 'USD') {
        usd += monto
      }
    })
    return { totalTransfARS: ars, totalTransfUSD: usd }
  }, [transferenciasFiltradas, billeteras])

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(busqueda.trim()) ||
      tipoOperacion !== 'todas' ||
      billeteraId !== undefined ||
      periodoPreset !== 'todos'
    )
  }, [busqueda, tipoOperacion, billeteraId, periodoPreset])

  const handleClearFilters = useCallback(() => {
    setBusqueda('')
    setTipoOperacion('todas')
    setBilleteraId(undefined)
    setPeriodoPreset('todos')
  }, [])

  // Agrupamiento cronológico por fecha de las transferencias filtradas
  const gruposTransferencias = useMemo(() => {
    const gruposObj: Record<string, TransferenciaInterna[]> = {}
    transferenciasFiltradas.forEach((tx) => {
      const fecha = tx.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(tx)
    })
    return Object.entries(gruposObj).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transferenciasFiltradas])

  return {
    busqueda,
    setBusqueda,
    tipoOperacion,
    setTipoOperacion,
    billeteraId,
    setBilleteraId,
    periodoPreset,
    setPeriodoPreset,
    counts: transfCounts,
    hasActiveFilters,
    clearFilters: handleClearFilters,
    totalARS: totalTransfARS,
    totalUSD: totalTransfUSD,
    gruposTransferencias,
    totalFiltradas: transferenciasFiltradas.length,
    hasCicloConfigurado: Boolean(periodoActual),
  }
}

export default useTransferenciasFilters
