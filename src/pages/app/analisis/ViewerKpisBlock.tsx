import { PageSummaryBar } from '@/components/ui'
import { TrendingUp } from '@/components/ui/icons'
import { formatMonto, formatMontoCorto, formatPorcentaje } from '@/utils/format'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import type { SummaryBarItem } from '@/components/ui/PageSummaryBar/PageSummaryBar'
import styles from './ViewerKpisBlock.module.css'
import { armarKpisVista } from './kpisVista'

interface ViewerKpisBlockProps {
  visorData: AnalisisResumenResponse
  monedaVis: 'ARS' | 'USD'
}

function renderSubValue(texto: string) {
  const match = texto.match(/(-?\d+(?:[.,]\d+)?%)/)
  if (!match) {
    return texto
  }
  const pct = match[1]
  const parts = texto.split(pct)
  return (
    <>
      {parts[0]}
      <strong>{pct}</strong>
      {parts.slice(1).join(pct)}
    </>
  )
}

export default function ViewerKpisBlock({ visorData, monedaVis }: ViewerKpisBlockProps) {
  const { kpis } = visorData
  const { soloGastos, textoPeso } = armarKpisVista(kpis, visorData.moneda_modo)

  const gastosTexto = `-${formatMonto(kpis.gastos_totales, monedaVis)}`
  const gastosCorto = `-${formatMontoCorto(Math.abs(kpis.gastos_totales), monedaVis)}`
  const balanceNeto = kpis.balance_neto ?? 0
  const esBalanceNegativo = balanceNeto < 0
  const balanceSigno = esBalanceNegativo ? '-' : '+'
  const balanceTexto = `${balanceSigno}${formatMonto(Math.abs(balanceNeto), monedaVis)}`
  const balanceCorto = `${balanceSigno}${formatMontoCorto(Math.abs(balanceNeto), monedaVis)}`

  const promedioMonto =
    kpis.promedio_gasto_ciclo !== null && kpis.promedio_gasto_ciclo !== undefined
      ? formatMonto(kpis.promedio_gasto_ciclo, monedaVis)
      : null
  const promedioMontoCorto =
    kpis.promedio_gasto_ciclo !== null && kpis.promedio_gasto_ciclo !== undefined
      ? formatMontoCorto(Math.abs(kpis.promedio_gasto_ciclo), monedaVis)
      : undefined

  const tasaAhorroTexto =
    kpis.tasa_ahorro_pct !== null && kpis.tasa_ahorro_pct !== undefined
      ? `${formatPorcentaje(kpis.tasa_ahorro_pct)} de lo que entró`
      : undefined

  const ingresosTexto =
    kpis.ingresos_totales !== null && kpis.ingresos_totales !== undefined
      ? `+${formatMonto(kpis.ingresos_totales, monedaVis)}`
      : '—'
  const ingresosCorto =
    kpis.ingresos_totales !== null && kpis.ingresos_totales !== undefined
      ? `+${formatMontoCorto(Math.abs(kpis.ingresos_totales), monedaVis)}`
      : undefined

  const avisoTexto = soloGastos ? textoPeso : tasaAhorroTexto

  const itemsSoloGastos: SummaryBarItem[] = [
    {
      label: 'Gastos',
      value: gastosTexto,
      valorCorto: gastosCorto,
      highlight: true,
      tone: 'negative',
      notice: avisoTexto
        ? {
            icon: <TrendingUp size={13} />,
            tooltip: avisoTexto,
            text: renderSubValue(avisoTexto),
          }
        : undefined,
    },
    ...(promedioMonto
      ? [
          {
            label: 'Promedio por ciclo',
            value: promedioMonto,
            valorCorto: promedioMontoCorto,
          } satisfies SummaryBarItem,
        ]
      : []),
  ]

  const itemsResumenDesktop: SummaryBarItem[] = [
    {
      label: 'Te quedó',
      value: balanceTexto,
      valorCorto: balanceCorto,
      highlight: true,
      tone: esBalanceNegativo ? 'negative' : 'default',
      notice: avisoTexto
        ? {
            icon: <TrendingUp size={13} />,
            tooltip: avisoTexto,
            text: renderSubValue(avisoTexto),
          }
        : undefined,
    },
    {
      label: 'Ingresos',
      value: ingresosTexto,
      valorCorto: ingresosCorto,
      tone: 'positive',
    },
    {
      label: 'Gastos',
      value: gastosTexto,
      valorCorto: gastosCorto,
      tone: 'negative',
    },
  ]

  const itemsResumenMobile: SummaryBarItem[] = [
    {
      label: 'Te quedó',
      value: balanceTexto,
      valorCorto: balanceCorto,
      tone: esBalanceNegativo ? 'negative' : 'positive',
    },
    {
      label: 'Ingresos',
      value: ingresosTexto,
      valorCorto: ingresosCorto,
      tone: 'positive',
    },
    {
      label: 'Gastos',
      value: gastosTexto,
      valorCorto: gastosCorto,
      tone: 'negative',
    },
  ]

  return (
    <div className={styles.summaryWrap}>
      {/* PageSummaryBar usa MontoFit para estos montos */}
      <PageSummaryBar
        mobileVariant="strip"
        items={soloGastos ? itemsSoloGastos : itemsResumenDesktop}
        mobileItems={soloGastos ? itemsSoloGastos : itemsResumenMobile}
        mobileNotice={
          avisoTexto
            ? {
                icon: <TrendingUp size={12} />,
                tooltip: avisoTexto,
                text: avisoTexto,
              }
            : undefined
        }
      />
    </div>
  )
}
