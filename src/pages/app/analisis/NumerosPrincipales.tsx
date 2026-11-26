import { PageSummaryBar } from '@/components/ui'
import { TrendingUp } from '@/components/ui/icons'
import type { SummaryBarItem } from '@/components/ui/PageSummaryBar/PageSummaryBar'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import { formatMonto, formatMontoCorto, formatPorcentaje } from '@/utils/format'
import styles from './AnalisisPage.module.css'
import { armarKpisVista } from './kpisVista'

interface NumerosPrincipalesProps {
  data: AnalisisResumenResponse | null
  loading: boolean
  monedaVisual: 'ARS' | 'USD'
}

function formatMontoKpi(
  monto: number | null | undefined,
  moneda: 'ARS' | 'USD',
  forzarCentavos: boolean,
  signo?: '+' | '-'
): string {
  if (monto === null || monto === undefined) {
    return '—'
  }
  const absVal = Math.abs(monto)
  let texto: string
  if (forzarCentavos) {
    const monedaNorm = moneda === 'USD' ? 'USD' : 'ARS'
    texto = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: monedaNorm,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absVal)
  } else {
    texto = formatMonto(absVal, moneda)
  }

  if (signo) {
    return `${signo}${texto}`
  }
  return texto
}

function formatMontoCortoKpi(
  monto: number | null | undefined,
  moneda: 'ARS' | 'USD',
  signo?: '+' | '-'
): string | undefined {
  if (monto === null || monto === undefined) {
    return undefined
  }
  const texto = formatMontoCorto(Math.abs(monto), moneda)
  return signo ? `${signo}${texto}` : texto
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

function formatearFraseMobile(frase: string): string {
  const sinPrefijo = frase
    .replace(/^Números de los ciclos terminados\.\s*/i, '')
    .replace(/^Números de lo que va del ciclo \([^)]+\)\.\s*/i, '')
  return (
    sinPrefijo.replace(/que en los mismos días del ciclo anterior/i, 'que el ciclo anterior').trim() ||
    frase
  )
}

export default function NumerosPrincipales({
  data,
  loading,
  monedaVisual,
}: NumerosPrincipalesProps) {
  if (loading && !data) {
    return null
  }

  if (!data) {
    return null
  }

  const { kpis } = data
  const { soloGastos, textoPeso } = armarKpisVista(kpis, data.moneda_modo)

  // B-2 ítem 4: Si alguno de los montos tiene centavos, los tres se muestran con centavos (",00")
  const tieneCentavos = [
    kpis.balance_neto,
    kpis.ingresos_totales,
    kpis.gastos_totales,
  ].some((v) => v !== null && v !== undefined && Math.abs(v) % 1 !== 0)

  const subValue =
    kpis.tasa_ahorro_pct !== null && kpis.tasa_ahorro_pct !== undefined
      ? `${formatPorcentaje(kpis.tasa_ahorro_pct)} de lo que entró`
      : kpis.alcance === 'en_curso'
        ? 'El % aparece cuando termine el ciclo'
        : undefined

  const esBalanceNegativo = (kpis.balance_neto ?? 0) < 0
  const balanceSigno: '+' | '-' = esBalanceNegativo ? '-' : '+'
  const balanceMonto = formatMontoKpi(
    kpis.balance_neto,
    monedaVisual,
    tieneCentavos,
    balanceSigno
  )
  const balanceMontoCorto = formatMontoCortoKpi(kpis.balance_neto, monedaVisual, balanceSigno)
  const ingresosMonto = formatMontoKpi(kpis.ingresos_totales, monedaVisual, tieneCentavos, '+')
  const ingresosMontoCorto = formatMontoCortoKpi(kpis.ingresos_totales, monedaVisual, '+')
  const egresosMonto = formatMontoKpi(kpis.gastos_totales, monedaVisual, tieneCentavos, '-')
  const egresosMontoCorto = formatMontoCortoKpi(kpis.gastos_totales, monedaVisual, '-')

  const promedioMonto =
    kpis.promedio_gasto_ciclo !== null && kpis.promedio_gasto_ciclo !== undefined
      ? formatMonto(kpis.promedio_gasto_ciclo, monedaVisual)
      : null
  const promedioMontoCorto = formatMontoCortoKpi(kpis.promedio_gasto_ciclo, monedaVisual)

  const itemsSoloGastos: SummaryBarItem[] = [
    {
      label: 'Egresos',
      value: egresosMonto,
      valorCorto: egresosMontoCorto,
      highlight: true,
      tone: 'negative',
      notice: textoPeso
        ? {
            icon: <TrendingUp size={13} />,
            tooltip: textoPeso,
            text: renderSubValue(textoPeso),
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
      value: balanceMonto,
      valorCorto: balanceMontoCorto,
      highlight: true,
      tone: esBalanceNegativo ? 'negative' : 'default',
      notice: subValue
        ? {
            icon: <TrendingUp size={13} />,
            tooltip: subValue,
            text: renderSubValue(subValue),
          }
        : undefined,
    },
    {
      label: 'Ingresos',
      value: ingresosMonto,
      valorCorto: ingresosMontoCorto,
      tone: 'positive',
    },
    {
      label: 'Egresos',
      value: egresosMonto,
      valorCorto: egresosMontoCorto,
      tone: 'negative',
    },
  ]

  const itemsResumenMobile: SummaryBarItem[] = [
    {
      label: 'Te quedó',
      value: balanceMonto,
      valorCorto: balanceMontoCorto,
      tone: esBalanceNegativo ? 'negative' : 'positive',
    },
    {
      label: 'Ingresos',
      value: ingresosMonto,
      valorCorto: ingresosMontoCorto,
      tone: 'positive',
    },
    {
      label: 'Egresos',
      value: egresosMonto,
      valorCorto: egresosMontoCorto,
      tone: 'negative',
    },
  ]

  return (
    <div className={styles.summarySection}>
      {/* PageSummaryBar usa MontoFit para estos montos */}
      <PageSummaryBar
        mobileVariant="strip"
        items={soloGastos ? itemsSoloGastos : itemsResumenDesktop}
        mobileItems={soloGastos ? itemsSoloGastos : itemsResumenMobile}
        mobileNotice={
          soloGastos
            ? textoPeso
              ? { icon: <TrendingUp size={12} />, tooltip: textoPeso, text: textoPeso }
              : undefined
            : subValue
              ? { icon: <TrendingUp size={12} />, tooltip: subValue, text: subValue }
              : undefined
        }
      />

      {kpis.frase_resumen && (
        <p className={styles.fraseResumen}>
          <span className={styles.fraseDesktop}>{kpis.frase_resumen}</span>
          <span className={styles.fraseMobile}>{formatearFraseMobile(kpis.frase_resumen)}</span>
        </p>
      )}
    </div>
  )
}
