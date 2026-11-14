import { PageSummaryBar } from '@/components/ui'
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

  let items: SummaryBarItem[]
  if (soloEgresos) {
    items = [
      {
        label: 'Egresos',
        value: egresosMonto,
        valueColor: '#FF8A65',
      },
    ]
  } else {
    items = [
      {
        label: 'Te quedó',
        value: balanceMonto,
        subValue,
        highlight: true,
        valueColor: esBalanceNegativo ? '#FF8A65' : undefined,
      },
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
  }

  return (
    <div className={styles.summarySection}>
      {/* Desktop Summary Bar (>= 768px) */}
      <div className={styles.desktopSummaryBar}>
        <PageSummaryBar items={items} />
      </div>

      {/* Mobile Card Resumen (< 768px) */}
      {soloEgresos ? (
        <div className={styles.mobileSummaryCard}>
          <div className={styles.mobileHeroMetric}>
            <div className={styles.mobileHeroLeft}>
              <span className={styles.mobileMetricLabel}>Egresos</span>
              <span className={`${styles.mobileHeroValue} ${styles.colorRed}`}>
                {egresosMonto}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.mobileSummaryCard}>
          {/* Fila Principal: Te quedó + % de ahorro */}
          <div className={styles.mobileHeroMetric}>
            <div className={styles.mobileHeroLeft}>
              <span className={styles.mobileMetricLabel}>Te quedó</span>
              <span
                className={`${styles.mobileHeroValue} ${
                  esBalanceNegativo ? styles.colorRed : styles.colorGreen
                }`}
              >
                {balanceMonto}
              </span>
            </div>
            {subValue && (
              <span className={styles.mobilePillBadge}>{subValue}</span>
            )}
          </div>

          <div className={styles.mobileMetricDivider} />

          {/* Fila Secundaria: Ingresos y Egresos (2 columnas con espacio amplio) */}
          <div className={styles.mobileSubMetricsGrid}>
            <div className={styles.mobileSubItem}>
              <span className={styles.mobileMetricLabel}>Ingresos</span>
              <span className={`${styles.mobileSubValue} ${styles.colorGreen}`}>
                {ingresosMonto}
              </span>
            </div>

            <div className={styles.mobileSubDivider} />

            <div className={styles.mobileSubItem}>
              <span className={styles.mobileMetricLabel}>Egresos</span>
              <span className={`${styles.mobileSubValue} ${styles.colorRed}`}>
                {egresosMonto}
              </span>
            </div>
          </div>
        </div>
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
