import { PageSummaryBar } from '@/components/ui'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import styles from './AnalisisPage.module.css'

interface NumerosPrincipalesProps {
  data: AnalisisResumenResponse | null
  loading: boolean
  monedaVisual: 'ARS' | 'USD'
  hayFiltroCategoriaOTarjeta?: boolean
}

export default function NumerosPrincipales({
  data,
  loading,
  monedaVisual,
  hayFiltroCategoriaOTarjeta,
}: NumerosPrincipalesProps) {
  return (
    <>
      <PageSummaryBar
        className={styles.summaryBar}
        items={[
          {
            label: 'Te quedó',
            value:
              loading && !data
                ? '...'
                : data?.kpis.balance_neto !== null && data?.kpis.balance_neto !== undefined
                  ? `${(data.kpis.balance_neto) < 0 ? '-' : '+'}${formatMonto(
                      Math.abs(data.kpis.balance_neto),
                      monedaVisual
                    )}`
                  : '—',
            highlight: true,
            valueColor:
              data?.kpis.balance_neto !== null && (data?.kpis.balance_neto ?? 0) < 0
                ? '#FF8A65'
                : undefined,
          },
          {
            label: 'Ingresos',
            value:
              loading && !data
                ? '...'
                : data?.kpis.ingresos_totales !== null && data?.kpis.ingresos_totales !== undefined
                  ? `+${formatMonto(data.kpis.ingresos_totales, monedaVisual)}`
                  : '—',
            valueColor: '#4CAF7D',
          },
          {
            label: 'Egresos',
            value:
              loading && !data
                ? '...'
                : `-${formatMonto(data?.kpis.gastos_totales ?? 0, monedaVisual)}`,
            valueColor: '#FF8A65',
          },
          {
            label: 'Te quedó (%)',
            value:
              loading && !data
                ? '...'
                : data?.kpis.tasa_ahorro_pct !== null && data?.kpis.tasa_ahorro_pct !== undefined
                  ? `${data.kpis.tasa_ahorro_pct}%`
                  : '—',
            valueColor:
              data?.kpis.tasa_ahorro_pct !== null && (data?.kpis.tasa_ahorro_pct ?? 0) >= 20
                ? '#4CAF7D'
                : data?.kpis.tasa_ahorro_pct !== null && (data?.kpis.tasa_ahorro_pct ?? 0) < 0
                  ? '#FF8A65'
                  : undefined,
          },
        ]}
      />
      {Boolean(hayFiltroCategoriaOTarjeta) && (
        <p className={styles.subtitle} style={{ margin: '4px 0 0', textAlign: 'right' }}>
          Con este filtro solo se ven gastos.
        </p>
      )}
      {data?.kpis.tasa_ahorro_texto && (
        <p className={styles.subtitle} style={{ margin: '4px 0 0', textAlign: 'right' }}>
          {data.kpis.tasa_ahorro_texto}
        </p>
      )}
      {data?.kpis.variacion_texto && (
        <p className={styles.subtitle} style={{ margin: '4px 0 0', textAlign: 'right' }}>
          {data.kpis.variacion_texto}
        </p>
      )}
    </>
  )
}
