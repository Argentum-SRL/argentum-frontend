import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Activity } from '@/components/ui/icons'
import type {
  AnalisisCicloPunto,
  SerieEvolucionPersonalizada,
} from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import { useTheme } from '@/hooks/useTheme'
import styles from './EvolucionCiclosCard.module.css'

interface EvolucionCiclosCardProps {
  serie: AnalisisCicloPunto[]
  monedaVisual: 'ARS' | 'USD'
  promedioHistoricoGastos: number
  modoGrafico?: 'combinado' | 'barras' | 'lineas'
  seriesPersonalizadas?: SerieEvolucionPersonalizada[]
}

function abbreviateAxisValue(val: number, moneda: 'ARS' | 'USD'): string {
  const prefix = moneda === 'USD' ? 'US$' : '$'
  const absVal = Math.abs(val)
  if (absVal >= 1_000_000) {
    return `${prefix}${(val / 1_000_000).toFixed(1)}M`
  }
  if (absVal >= 1_000) {
    return `${prefix}${(val / 1_000).toFixed(0)}k`
  }
  return `${prefix}${val.toFixed(0)}`
}

export default function EvolucionCiclosCard({
  serie,
  monedaVisual,
  promedioHistoricoGastos,
  modoGrafico = 'combinado',
  seriesPersonalizadas = [],
}: EvolucionCiclosCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const esModoPersonalizado = seriesPersonalizadas.length > 0

  const chartData = useMemo(() => {
    if (!esModoPersonalizado) return serie
    return serie.map((punto) => {
      const extra: Record<string, number> = {}
      for (const s of seriesPersonalizadas) {
        if (s.tipo === 'categoria') {
          extra[s.key] = punto.por_categoria?.[s.id] ?? 0
        } else if (s.tipo === 'subcategoria') {
          extra[s.key] = punto.por_subcategoria?.[s.id] ?? 0
        }
      }
      return { ...punto, ...extra }
    })
  }, [serie, esModoPersonalizado, seriesPersonalizadas])

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

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(13, 32, 69, 0.07)'
  const axisColor = isDark ? '#94A3B8' : '#64748B'
  const incomeColor = isDark ? '#34D399' : '#059669'
  const expenseColor = isDark ? '#60A5FA' : '#0D2045'
  const balanceLineColor = isDark ? '#FBBF24' : '#D97706'
  const avgLineColor = isDark ? '#CBD5E1' : '#475569'

  return (
    <section className={styles.card} aria-label="Evolución por ciclos">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className={styles.title}>
              {esModoPersonalizado
                ? `Evolución Personalizada (${seriesPersonalizadas.length} ${seriesPersonalizadas.length === 1 ? 'serie' : 'series'})`
                : 'Evolución por Ciclos'}
            </h2>
            <p className={styles.subtitle}>
              {esModoPersonalizado
                ? 'Comparación de categorías y subcategorías seleccionadas ciclo a ciclo'
                : `Ingresos vs. Gastos y línea de promedio histórico (${formatMonto(promedioHistoricoGastos, monedaVisual)})`}
            </p>
          </div>
        </div>

        <div className={styles.legend}>
          {esModoPersonalizado ? (
            seriesPersonalizadas.map((s) => (
              <span key={s.key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: s.color }} />
                {s.categoriaPadreNombre ? `${s.categoriaPadreNombre} · ${s.nombre}` : s.nombre}
              </span>
            ))
          ) : (
            <>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: incomeColor }} />
                Ingresos
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: expenseColor }} />
                Gastos
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: balanceLineColor }} />
                Balance
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDash} style={{ borderColor: avgLineColor }} />
                Promedio gastos
              </span>
            </>
          )}
        </div>
      </header>

      {serie.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Activity size={28} />
          <p className={styles.emptyText}>No hay datos registrados para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="etiqueta"
                  tick={{ fill: axisColor, fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val: number) => abbreviateAxisValue(val, monedaVisual)}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(13, 32, 69, 0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const row = payload[0].payload as AnalisisCicloPunto & Record<string, number>
                    return (
                      <div className={styles.tooltipCard}>
                        <div className={styles.tooltipHeader}>
                          <span className={styles.tooltipTitle}>{row.etiqueta}</span>
                          <span className={styles.tooltipRange}>{row.rango_texto}</span>
                        </div>
                        {esModoPersonalizado ? (
                          <>
                            {seriesPersonalizadas.map((s) => {
                              const val = Number(row[s.key] ?? 0)
                              return (
                                <div key={s.key} className={styles.tooltipRow}>
                                  <span className={styles.tooltipLabel}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: 99,
                                        backgroundColor: s.color,
                                        marginRight: 6,
                                      }}
                                    />
                                    {s.categoriaPadreNombre
                                      ? `${s.categoriaPadreNombre} › ${s.nombre}`
                                      : s.nombre}
                                  </span>
                                  <span className={styles.tooltipVal}>
                                    {formatMonto(val, monedaVisual)}
                                  </span>
                                </div>
                              )
                            })}
                            <div className={styles.tooltipDivider} />
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLabel}>Total selección</span>
                              <span className={styles.tooltipVal}>
                                {formatMonto(
                                  seriesPersonalizadas.reduce(
                                    (acc, s) => acc + Number(row[s.key] ?? 0),
                                    0
                                  ),
                                  monedaVisual
                                )}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLabel}>Ingresos</span>
                              <span className={styles.tooltipValPositive}>
                                {formatMonto(row.ingresos, monedaVisual)}
                              </span>
                            </div>
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLabel}>Gastos</span>
                              <span className={styles.tooltipVal}>
                                {formatMonto(row.gastos, monedaVisual)}
                              </span>
                            </div>
                            <div className={styles.tooltipDivider} />
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLabel}>Balance neto</span>
                              <span
                                className={
                                  row.balance >= 0 ? styles.tooltipValPositive : styles.tooltipValNegative
                                }
                              >
                                {formatMonto(row.balance, monedaVisual)}
                              </span>
                            </div>
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLabel}>Tasa de ahorro</span>
                              <span className={styles.tooltipBadge}>{row.tasa_ahorro_pct}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  }}
                />
                {!esModoPersonalizado && promedioHistoricoGastos > 0 && (
                  <ReferenceLine
                    y={promedioHistoricoGastos}
                    stroke={avgLineColor}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                )}
                {esModoPersonalizado ? (
                  modoGrafico === 'lineas' ? (
                    seriesPersonalizadas.map((s) => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.nombre}
                        stroke={s.color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                        isAnimationActive={!prefersReducedMotion}
                      />
                    ))
                  ) : (
                    seriesPersonalizadas.map((s) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.nombre}
                        fill={s.color}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                        isAnimationActive={!prefersReducedMotion}
                      />
                    ))
                  )
                ) : modoGrafico !== 'lineas' ? (
                  <>
                    <Bar
                      dataKey="ingresos"
                      name="Ingresos"
                      fill={incomeColor}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                      isAnimationActive={!prefersReducedMotion}
                    />
                    <Bar
                      dataKey="gastos"
                      name="Gastos"
                      fill={expenseColor}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      name="Ingresos"
                      stroke={incomeColor}
                      strokeWidth={2.4}
                      dot={{ r: 4, fill: incomeColor, strokeWidth: 0 }}
                      isAnimationActive={!prefersReducedMotion}
                    />
                    <Line
                      type="monotone"
                      dataKey="gastos"
                      name="Gastos"
                      stroke={expenseColor}
                      strokeWidth={2.4}
                      dot={{ r: 4, fill: expenseColor, strokeWidth: 0 }}
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </>
                )}
                {!esModoPersonalizado && modoGrafico !== 'barras' && (
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke={balanceLineColor}
                    strokeWidth={2.4}
                    dot={{ r: 4, fill: balanceLineColor, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={!prefersReducedMotion}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
      )}
    </section>
  )
}

