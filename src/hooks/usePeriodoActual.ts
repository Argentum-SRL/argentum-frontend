import { useState, useEffect } from 'react'
import { dashboardService } from '@/services/dashboard.service'
import { useAuth } from '@/hooks/useAuth'

export interface PeriodoFechas {
  fecha_inicio: string
  fecha_fin: string
  label: string
  ciclo_anterior_inicio: string
  ciclo_anterior_fin: string
  ciclo_anterior_label: string
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatLabel(inicioStr: string, finStr: string): string {
  const [y1, m1, d1] = inicioStr.split('-').map(Number)
  const [y2, m2, d2] = finStr.split('-').map(Number)
  const dInicio = new Date(y1, m1 - 1, d1)
  const dFin = new Date(y2, m2 - 1, d2)
  return `${dInicio.getDate()} ${MESES[dInicio.getMonth()]} — ${dFin.getDate()} ${MESES[dFin.getMonth()]}`
}

export function usePeriodoActual() {
  const { usuario } = useAuth()
  const [periodo, setPeriodo] = useState<PeriodoFechas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    dashboardService.getPeriodoActual(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPeriodo({
            ...data,
            label: formatLabel(data.fecha_inicio, data.fecha_fin),
            ciclo_anterior_label: formatLabel(data.ciclo_anterior_inicio, data.ciclo_anterior_fin),
          })
          setLoading(false)
        }
      })
      .catch((err) => {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error('Error fetching periodo actual:', err)
        console.warn('[usePeriodoActual] Fallback a mes calendario activado por error al consultar el ciclo real.')
        if (!controller.signal.aborted) {
          const hoy = new Date()
          const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
          const inicioIso = inicio.toISOString().split('T')[0]
          const finIso = fin.toISOString().split('T')[0]

          const antInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
          const antFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
          const antInicioIso = antInicio.toISOString().split('T')[0]
          const antFinIso = antFin.toISOString().split('T')[0]

          setPeriodo({
            fecha_inicio: inicioIso,
            fecha_fin: finIso,
            label: formatLabel(inicioIso, finIso),
            ciclo_anterior_inicio: antInicioIso,
            ciclo_anterior_fin: antFinIso,
            ciclo_anterior_label: formatLabel(antInicioIso, antFinIso),
          })
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [usuario?.id, usuario?.ciclo_tipo, usuario?.ciclo_valor, usuario?.ciclo_ajuste_direccion])

  return {
    periodo,
    cicloAnterior: periodo ? {
      fecha_inicio: periodo.ciclo_anterior_inicio,
      fecha_fin: periodo.ciclo_anterior_fin,
      label: periodo.ciclo_anterior_label,
    } : null,
    loading
  }
}
