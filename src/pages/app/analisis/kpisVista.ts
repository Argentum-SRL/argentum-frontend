import { formatMonto, formatPorcentaje } from '@/utils/format'
import type { AnalisisKpis } from '@/services/analisis.service'

export interface KpisVistaResultado {
  soloGastos: boolean
  textoPeso: string | null
}

export function armarKpisVista(
  kpis: AnalisisKpis | null | undefined,
  monedaModo: string = 'solo_ars'
): KpisVistaResultado {
  if (!kpis) {
    return { soloGastos: false, textoPeso: null }
  }
  const soloGastos = kpis.solo_gastos === true || kpis.ingresos_totales === null
  if (!soloGastos) {
    return { soloGastos: false, textoPeso: null }
  }

  let textoPeso: string | null = null
  if (
    kpis.peso_sobre_gasto_total_pct !== null &&
    kpis.peso_sobre_gasto_total_pct !== undefined
  ) {
    const pctStr = formatPorcentaje(kpis.peso_sobre_gasto_total_pct)
    const refMonto = kpis.gasto_total_referencia ?? 0
    const monedaVisual = monedaModo.toLowerCase().includes('usd') ? 'USD' : 'ARS'
    const refStr = formatMonto(refMonto, monedaVisual)
    textoPeso = `Es el ${pctStr} de todo lo que gastaste (${refStr})`
  }

  return { soloGastos, textoPeso }
}
