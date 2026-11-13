import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ArrowLeftRight, TrendingDown, TrendingUp } from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import analisisService, {
  type AnalisisQueryParams,
  type ComparativaCiclosResponse,
} from '@/services/analisis.service'
import { formatMonto, formatAxisCompact } from '@/utils/format'
import ChartLoadingState from './ChartLoadingState'
import styles from './ComparativaCiclosCard.module.css'

interface ComparativaCiclosCardProps {
  queryParams: AnalisisQueryParams
  monedaVisual: 'ARS' | 'USD'
  vistaModoExterno?: 'diferencias' | 'grafico'
  onVistaModoChange?: (modo: 'diferencias' | 'grafico') => void
}

export default function ComparativaCiclosCard({
  queryParams,
  monedaVisual,
  vistaModoExterno,
  onVistaModoChange,
}: ComparativaCiclosCardProps) {
  const primaryBarColor = '#FF8A65'
  const [vistaModoInterno, setVistaModoInterno] = useState<'diferencias' | 'grafico'>('diferencias')
  const vistaModo = vistaModoExterno ?? vistaModoInterno
  const handleCambiarVista = (nuevo: 'diferencias' | 'grafico') => {
    setVistaModoInterno(nuevo)
    onVistaModoChange?.(nuevo)
  }
  const [cicloAKey, setCicloAKey] = useState<string>('')
  const [cicloBKey, setCicloBKey] = useState<string>('')
  const [data, setData] = useState<ComparativaCiclosResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const fetchComparativa = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      const minLoaderDelay = new Promise<void>((resolve) => {
        const t = setTimeout(resolve, 260)
        signal?.addEventListener('abort', () => {
          clearTimeout(t)
          resolve()
        })
      })
      try {
        const [res] = await Promise.all([
          analisisService.getComparativaCiclos(
            {
              ...queryParams,
              ciclo_a: cicloAKey || undefined,
              ciclo_b: cicloBKey || undefined,
            },
            signal
          ),
          minLoaderDelay,
        ])
        if (!signal?.aborted) {
          setData(res)
          if (!cicloAKey && res.ciclo_a?.clave) setCicloAKey(res.ciclo_a.clave)
          if (!cicloBKey && res.ciclo_b?.clave) setCicloBKey(res.ciclo_b.clave)
        }
      } catch {
        // Silencioso en cancelación o error de red puntual
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [queryParams, cicloAKey, cicloBKey]
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchComparativa(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchComparativa])

  const etiquetaA = data?.ciclo_a.etiqueta ?? 'Ciclo A'
  const etiquetaB = data?.ciclo_b.etiqueta ?? 'Ciclo B'

  return (
    <section className={styles.card} aria-label="Comparar dos ciclos">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <ArrowLeftRight size={18} />
          </div>
          <div>
            <h2 className={styles.title}>Comparar dos ciclos</h2>
            <p className={styles.subtitle}>
              Qué cambió entre dos ciclos, rubro por rubro.
            </p>
          </div>
        </div>

        <SegmentedControl
          options={[
            { value: 'diferencias', label: 'Diferencias' },
            { value: 'grafico', label: 'Barras' },
          ]}
          value={vistaModo}
          onChange={(v: string) => handleCambiarVista(v as typeof vistaModo)}
          ariaLabel="Modo de vista comparativa"
          layout="inline"
        />
      </header>

      {/* Selectores de Ciclo A vs Ciclo B */}
      {data && data.ciclos_disponibles.length > 0 && (
        <div className={styles.selectorBar}>
          <div className={styles.selectBox}>
            <label htmlFor="comp-ciclo-a" className={styles.selectLabel}>
              Ciclo evaluado (A)
            </label>
            <select
              id="comp-ciclo-a"
              className={styles.selectInput}
              value={cicloAKey || data.ciclo_a.clave}
              onChange={(e) => setCicloAKey(e.target.value)}
            >
              {data.ciclos_disponibles.map((c) => (
                <option key={c.clave} value={c.clave}>
                  {c.etiqueta} ({c.rango_texto})
                  {c.es_actual
                    ? ` (en curso: ${c.dias_transcurridos ?? ''} de ${c.dias_totales ?? ''} días)`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <span className={styles.vsBadge}>VS</span>

          <div className={styles.selectBox}>
            <label htmlFor="comp-ciclo-b" className={styles.selectLabel}>
              Ciclo de referencia (B)
            </label>
            <select
              id="comp-ciclo-b"
              className={styles.selectInput}
              value={cicloBKey || data.ciclo_b.clave}
              onChange={(e) => setCicloBKey(e.target.value)}
            >
              {data.ciclos_disponibles.map((c) => (
                <option key={c.clave} value={c.clave}>
                  {c.etiqueta} ({c.rango_texto})
                  {c.es_actual
                    ? ` (en curso: ${c.dias_transcurridos ?? ''} de ${c.dias_totales ?? ''} días)`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Resumen global del duelo */}
      {data && (
        <div className={styles.summaryStrip}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryCaption}>Gastos en {etiquetaA}</span>
            <span className={styles.summaryVal}>
              {formatMonto(data.resumen.gasto_a, monedaVisual)}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryCaption}>Gastos en {etiquetaB}</span>
            <span className={styles.summaryValMuted}>
              {formatMonto(data.resumen.gasto_b, monedaVisual)}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryCaption}>Diferencia</span>
            <span
              className={
                data.resumen.diferencia_gasto_monto <= 0
                  ? styles.deltaGood
                  : styles.deltaBad
              }
            >
              {data.resumen.diferencia_gasto_monto > 0 ? '+' : ''}
              {formatMonto(data.resumen.diferencia_gasto_monto, monedaVisual)}
              {data.resumen.diferencia_gasto_pct !== null
                ? ` (${data.resumen.diferencia_gasto_pct > 0 ? '+' : ''}${data.resumen.diferencia_gasto_pct}%)`
                : ''}
            </span>
          </div>

          {data.resumen.mayor_ahorro && (
            <div className={styles.highlightBoxGood}>
              <TrendingDown size={14} />
              <span>
                Mayor baja en <strong>{data.resumen.mayor_ahorro.categoria_nombre}</strong> (
                -{formatMonto(data.resumen.mayor_ahorro.diferencia_monto, monedaVisual)})
              </span>
            </div>
          )}

          {data.resumen.mayor_aumento && (
            <div className={styles.highlightBoxBad}>
              <TrendingUp size={14} />
              <span>
                Mayor suba en <strong>{data.resumen.mayor_aumento.categoria_nombre}</strong> (
                +{formatMonto(data.resumen.mayor_aumento.diferencia_monto, monedaVisual)})
              </span>
            </div>
          )}
        </div>
      )}

      {!data && loading ? (
        <ChartLoadingState
          label="Comparando ciclos"
          sublabel="Calculando diferencias por categoría..."
        />
      ) : !data || data.categorias.length === 0 ? (
        <div className={styles.emptyWrap}>
          <ArrowLeftRight size={28} />
          <p className={styles.emptyText}>
            No hay gastos registrados en estos ciclos para comparar.
          </p>
        </div>
      ) : (
        <div className={styles.bodyContentWrap}>
          {loading && (
            <ChartLoadingState
              overlay
              label="Comparando ciclos"
              sublabel="Actualizando variaciones..."
            />
          )}
          {vistaModo === 'grafico' ? (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              key={`${data.ciclo_a.clave}-${data.ciclo_b.clave}-${monedaVisual}`}
              data={data.categorias.slice(0, 8)}
              margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="categoria_nombre"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-2)', fontSize: 11 }}
                tickFormatter={(val: number) => formatAxisCompact(val)}
                width={56}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const row = payload[0].payload
                  return (
                    <div className={styles.tooltipCard}>
                      <p className={styles.tooltipTitle}>{row.categoria_nombre}</p>
                      <div className={styles.tooltipRow}>
                        <span>{etiquetaA}:</span>
                        <strong>{formatMonto(row.monto_a, monedaVisual)}</strong>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>{etiquetaB}:</span>
                        <strong>{formatMonto(row.monto_b, monedaVisual)}</strong>
                      </div>
                      <div className={styles.tooltipDivider} />
                      <div className={styles.tooltipRow}>
                        <span>Diferencia:</span>
                        <strong>
                          {row.diferencia_monto > 0 ? '+' : ''}
                          {formatMonto(row.diferencia_monto, monedaVisual)}
                        </strong>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="monto_a"
                name={etiquetaA}
                fill={primaryBarColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!prefersReducedMotion}
              />
              <Bar
                dataKey="monto_b"
                name={etiquetaB}
                fill="#94A3B8"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!prefersReducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.deltaList}>
          {data.categorias.map((item) => (
            <div key={item.categoria_id ?? item.categoria_nombre} className={styles.deltaRow}>
              <div className={styles.deltaCatInfo}>
                <CategoriaIcon nombre={item.categoria_nombre} size={28} />
                <div className={styles.deltaCatTexts}>
                  <span className={styles.deltaCatName}>{item.categoria_nombre}</span>
                  <div className={styles.dualBars}>
                    <div className={styles.barLine}>
                      <span className={styles.barTag}>{etiquetaA}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFillA}
                          style={{ width: `${item.ancho_a_pct}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.barLine}>
                      <span className={styles.barTag}>{etiquetaB}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFillB}
                          style={{ width: `${item.ancho_b_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.deltaRight}>
                <div className={styles.amountsPair}>
                  <span className={styles.amountPrimary}>
                    {formatMonto(item.monto_a, monedaVisual)}
                  </span>
                  <span className={styles.amountSecondary}>
                    vs. {formatMonto(item.monto_b, monedaVisual)}
                  </span>
                </div>

                <span
                  className={
                    item.tendencia === 'bajo'
                      ? styles.badgeGood
                      : item.tendencia === 'subio'
                        ? styles.badgeBad
                        : styles.badgeNeutral
                  }
                >
                  {item.diferencia_monto > 0 ? '+' : ''}
                  {formatMonto(item.diferencia_monto, monedaVisual)}
                  {item.diferencia_pct !== null
                    ? ` (${item.diferencia_pct > 0 ? '+' : ''}${item.diferencia_pct}%)`
                    : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
          )}
        </div>
      )}
    </section>
  )
}
