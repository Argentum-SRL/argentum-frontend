import { PageSummaryBar } from '@/components/ui'
import { TrendingUp } from '@/components/ui/icons'
import { formatMonto, formatPorcentaje } from '@/utils/format'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import styles from './ViewerKpisBlock.module.css'

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
  const balanceNeto = visorData.kpis.balance_neto ?? 0
  const esBalanceNegativo = balanceNeto < 0
  const balanceSigno = esBalanceNegativo ? '-' : '+'
  const balanceTexto = `${balanceSigno}${formatMonto(Math.abs(balanceNeto), monedaVis)}`

  const tasaAhorroTexto =
    visorData.kpis.tasa_ahorro_pct !== null && visorData.kpis.tasa_ahorro_pct !== undefined
      ? `${formatPorcentaje(visorData.kpis.tasa_ahorro_pct)} de lo que entró`
      : undefined

  const ingresosTexto =
    visorData.kpis.ingresos_totales !== null && visorData.kpis.ingresos_totales !== undefined
      ? `+${formatMonto(visorData.kpis.ingresos_totales, monedaVis)}`
      : '—'

  const gastosTexto = `-${formatMonto(visorData.kpis.gastos_totales, monedaVis)}`

  return (
    <div className={styles.summaryWrap}>
      {/* ── Mobile Split Strip Resumen (Columnas simétricas + Fila de tasa inferior) ── */}
      <div className={styles.mobileSplitStrip}>
        <div className={styles.mobileSplitGrid}>
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
        </div>
        {tasaAhorroTexto && (
          <div className={styles.mobileMetasRow} title={tasaAhorroTexto}>
            <TrendingUp size={12} className={styles.mobileMetasIcon} />
            <span>{tasaAhorroTexto}</span>
          </div>
        )}
      </div>

      {/* ── Desktop Resumen (>= 768px): Hero con leftSlot alineado y aviso contra divisor ── */}
      <PageSummaryBar
        className={styles.desktopSummaryBar}
        leftSlot={
          <div className={styles.balanceCicloSlot}>
            <div className={styles.balanceMainGroup}>
              <span className={styles.balanceCicloLabel}>Te quedó</span>
              <span
                className={`${styles.balanceCicloValue} ${
                  esBalanceNegativo ? styles.balanceNegative : styles.balancePositive
                }`}
              >
                {balanceTexto}
              </span>
            </div>
            {tasaAhorroTexto && (
              <div className={styles.metasNotice} title={tasaAhorroTexto}>
                <TrendingUp size={13} className={styles.metasNoticeIcon} aria-hidden="true" />
                <p className={styles.metasNoticeText}>
                  {renderSubValue(tasaAhorroTexto)}
                </p>
              </div>
            )}
          </div>
        }
        items={[
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
        ]}
      />
    </div>
  )
}
