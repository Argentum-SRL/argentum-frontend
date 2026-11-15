import { PageSummaryBar } from '@/components/ui'
import { TrendingUp } from '@/components/ui/icons'
import { formatMonto, formatPorcentaje } from '@/utils/format'
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
      <strong className={styles.metasNoticeHighlight}>{pct}</strong>
      {parts.slice(1).join(pct)}
    </>
  )
}

export default function ViewerKpisBlock({ visorData, monedaVis }: ViewerKpisBlockProps) {
  const { kpis } = visorData
  const { soloGastos, textoPeso } = armarKpisVista(kpis, visorData.moneda_modo)

  const gastosTexto = `-${formatMonto(kpis.gastos_totales, monedaVis)}`
  const balanceNeto = kpis.balance_neto ?? 0
  const esBalanceNegativo = balanceNeto < 0
  const balanceSigno = esBalanceNegativo ? '-' : '+'
  const balanceTexto = `${balanceSigno}${formatMonto(Math.abs(balanceNeto), monedaVis)}`

  const promedioMonto =
    kpis.promedio_gasto_ciclo !== null && kpis.promedio_gasto_ciclo !== undefined
      ? formatMonto(kpis.promedio_gasto_ciclo, monedaVis)
      : null

  const tasaAhorroTexto =
    kpis.tasa_ahorro_pct !== null && kpis.tasa_ahorro_pct !== undefined
      ? `${formatPorcentaje(kpis.tasa_ahorro_pct)} de lo que entró`
      : undefined

  const ingresosTexto =
    kpis.ingresos_totales !== null && kpis.ingresos_totales !== undefined
      ? `+${formatMonto(kpis.ingresos_totales, monedaVis)}`
      : '—'

  const heroLabel = soloGastos ? 'Gastos' : 'Te quedó'
  const heroValor = soloGastos ? gastosTexto : balanceTexto
  const heroColor = soloGastos
    ? styles.balanceNegative
    : esBalanceNegativo
      ? styles.balanceNegative
      : styles.balancePositive

  const avisoTexto = soloGastos ? textoPeso : tasaAhorroTexto

  const items: SummaryBarItem[] = soloGastos
    ? promedioMonto
      ? [
          {
            label: 'Promedio por ciclo',
            value: promedioMonto,
          },
        ]
      : []
    : [
        {
          label: 'Ingresos',
          value: ingresosTexto,
          valueColor: '#4CAF7D',
        },
        {
          label: 'Gastos',
          value: gastosTexto,
          valueColor: '#FF8A65',
        },
      ]

  return (
    <div className={styles.summaryWrap}>
      {/* ── Mobile Split Strip Resumen ── */}
      <div className={styles.mobileSplitStrip}>
        <div className={styles.mobileSplitGrid}>
          {soloGastos ? (
            <>
              <div className={styles.splitItem}>
                <span className={styles.splitLabel}>Gastos</span>
                <span className={`${styles.splitValue} ${styles.colorRed}`}>
                  {gastosTexto}
                </span>
              </div>
              {promedioMonto && (
                <>
                  <div className={styles.splitDivider} />
                  <div className={styles.splitItem}>
                    <span className={styles.splitLabel}>Promedio por ciclo</span>
                    <span className={styles.splitValue}>{promedioMonto}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className={styles.splitItem}>
                <span className={styles.splitLabel}>Te quedó</span>
                <span
                  className={`${styles.splitValue} ${
                    esBalanceNegativo ? styles.colorRed : styles.colorGreen
                  }`}
                >
                  {balanceTexto}
                </span>
              </div>
              <div className={styles.splitDivider} />
              <div className={styles.splitItem}>
                <span className={styles.splitLabel}>Ingresos</span>
                <span className={`${styles.splitValue} ${styles.colorGreen}`}>
                  {ingresosTexto}
                </span>
              </div>
              <div className={styles.splitDivider} />
              <div className={styles.splitItem}>
                <span className={styles.splitLabel}>Gastos</span>
                <span className={`${styles.splitValue} ${styles.colorRed}`}>
                  {gastosTexto}
                </span>
              </div>
            </>
          )}
        </div>
        {avisoTexto && (
          <div className={styles.mobileMetasRow} title={avisoTexto}>
            <TrendingUp size={12} className={styles.mobileMetasIcon} />
            <span>{avisoTexto}</span>
          </div>
        )}
      </div>

      {/* ── Desktop Resumen ── */}
      <PageSummaryBar
        className={styles.desktopSummaryBar}
        leftSlot={
          <div className={styles.balanceCicloSlot}>
            <div className={styles.balanceMainGroup}>
              <span className={styles.balanceCicloLabel}>{heroLabel}</span>
              <span className={`${styles.balanceCicloValue} ${heroColor}`}>
                {heroValor}
              </span>
            </div>
            {avisoTexto && (
              <div className={styles.metasNotice} title={avisoTexto}>
                <TrendingUp size={13} className={styles.metasNoticeIcon} aria-hidden="true" />
                <p className={styles.metasNoticeText}>
                  {renderSubValue(avisoTexto)}
                </p>
              </div>
            )}
          </div>
        }
        items={items}
      />
    </div>
  )
}
