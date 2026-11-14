import { PageSummaryBar } from '@/components/ui'
import { TrendingUp } from '@/components/ui/icons'
import type { SummaryBarItem } from '@/components/ui/PageSummaryBar/PageSummaryBar'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import { formatMonto, formatPorcentaje } from '@/utils/format'
import styles from './AnalisisPage.module.css'

interface NumerosPrincipalesProps {
  data: AnalisisResumenResponse | null
  loading: boolean
  monedaVisual: 'ARS' | 'USD'
  hayFiltroCategoriaOTarjeta?: boolean
}

function formatMontoKpi(
  monto: number | null | undefined,
  moneda: 'ARS' | 'USD',
  forzarCentavos: boolean,
  signo?: '+' | '-'
): string {
  if (monto === null || monto === undefined) return '—'
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
  hayFiltroCategoriaOTarjeta,
}: NumerosPrincipalesProps) {
  if (loading && !data) {
    return null
  }

  if (!data) {
    return null
  }

  const { kpis } = data
  const soloEgresos =
    Boolean(hayFiltroCategoriaOTarjeta) || kpis.ingresos_totales === null

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

  const balanceMonto = formatMontoKpi(
    kpis.balance_neto,
    monedaVisual,
    tieneCentavos,
    (kpis.balance_neto ?? 0) < 0 ? '-' : '+'
  )
  const ingresosMonto = formatMontoKpi(kpis.ingresos_totales, monedaVisual, tieneCentavos, '+')
  const egresosMonto = formatMontoKpi(kpis.gastos_totales, monedaVisual, tieneCentavos, '-')
  const esBalanceNegativo = (kpis.balance_neto ?? 0) < 0

  const itemsSoloEgresos: SummaryBarItem[] = [
    {
      label: 'Egresos',
      value: egresosMonto,
      valueColor: '#FF8A65',
    },
  ]

  const itemsResumen: SummaryBarItem[] = [
    {
      label: 'Ingresos',
      value: ingresosMonto,
      valueColor: '#4CAF7D',
    },
    {
      label: 'Egresos',
      value: egresosMonto,
      valueColor: '#FF8A65',
    },
  ]

  return (
    <div className={styles.summarySection}>
      {/* ── Mobile Split Strip Resumen (Columnas simétricas + Fila de tasa inferior) ── */}
      {soloEgresos ? (
        <div className={styles.mobileSplitStrip}>
          <div className={styles.mobileSplitGrid}>
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Egresos</span>
              <span className={`${styles.splitValue} ${styles.colorRed}`}>
                {egresosMonto}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.mobileSplitStrip}>
          <div className={styles.mobileSplitGrid}>
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Te quedó</span>
              <span
                className={`${styles.splitValue} ${
                  esBalanceNegativo ? styles.colorRed : styles.colorGreen
                }`}
              >
                {balanceMonto}
              </span>
            </div>
            <div className={styles.splitDivider} />
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Ingresos</span>
              <span className={`${styles.splitValue} ${styles.colorGreen}`}>
                {ingresosMonto}
              </span>
            </div>
            <div className={styles.splitDivider} />
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Egresos</span>
              <span className={`${styles.splitValue} ${styles.colorRed}`}>
                {egresosMonto}
              </span>
            </div>
          </div>
          {subValue && (
            <div className={styles.mobileMetasRow} title={subValue}>
              <TrendingUp size={12} className={styles.mobileMetasIcon} />
              <span>{subValue}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Hero Resumen (Desktop: Balance + Aviso contra el divisor) ── */}
      {soloEgresos ? (
        <PageSummaryBar
          className={styles.desktopSummaryBar}
          items={itemsSoloEgresos}
        />
      ) : (
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
                  {balanceMonto}
                </span>
              </div>
              {subValue && (
                <div className={styles.metasNotice} title={subValue}>
                  <TrendingUp size={13} className={styles.metasNoticeIcon} aria-hidden="true" />
                  <p className={styles.metasNoticeText}>
                    {renderSubValue(subValue)}
                  </p>
                </div>
              )}
            </div>
          }
          items={itemsResumen}
        />
      )}

      {kpis.frase_resumen && (
        <p className={styles.fraseResumen}>
          <span className={styles.fraseDesktop}>{kpis.frase_resumen}</span>
          <span className={styles.fraseMobile}>{formatearFraseMobile(kpis.frase_resumen)}</span>
        </p>
      )}
    </div>
  )
}
