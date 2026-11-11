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
import { TrendingUp, Activity, Sparkles } from '@/components/ui/icons'
import type {
  AnalisisCicloPunto,
  SerieEvolucionPersonalizada,
} from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import { useTheme } from '@/hooks/useTheme'
import ChartLoadingState from './ChartLoadingState'
import styles from './EvolucionCiclosCard.module.css'

interface EvolucionCiclosCardProps {
  serie: AnalisisCicloPunto[]
  monedaVisual: 'ARS' | 'USD'
  promedioHistoricoGastos: number
  modoGrafico?: 'combinado' | 'barras' | 'lineas'
  seriesPersonalizadas?: SerieEvolucionPersonalizada[]
  loading?: boolean
  onOpenEditorSeries?: () => void
  onResetSeries?: () => void
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
  loading = false,
  onOpenEditorSeries,
  onResetSeries,
}: EvolucionCiclosCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const esModoPersonalizado = seriesPersonalizadas.length > 0

  // Estado interactivo de la leyenda y modo de agrupación de barras
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([])
  const [modoBarrasCustom, setModoBarrasCustom] = useState<'separadas' | 'apiladas'>('separadas')

  // Serie visible filtrada por los chips activos en la leyenda
  const visibleSeries = useMemo(() => {
    const filtered = seriesPersonalizadas.filter((s) => !hiddenKeys.includes(s.key))
    return filtered.length > 0 ? filtered : seriesPersonalizadas
  }, [seriesPersonalizadas, hiddenKeys])

  // Detectar si todas las subcategorías comparten una misma categoría padre (ej. "Vivienda")
  const sharedParentName = useMemo(() => {
    if (seriesPersonalizadas.length < 2) return null
    const firstParent = seriesPersonalizadas[0]?.categoriaPadreNombre
    if (!firstParent) return null
    const allSame = seriesPersonalizadas.every((s) => s.categoriaPadreNombre === firstParent)
    return allSame ? firstParent : null
  }, [seriesPersonalizadas])

  const toggleSerieVisibility = (key: string) => {
    setHiddenKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key)
      }
      // Impedir ocultar la última serie visible
      if (seriesPersonalizadas.length - prev.length <= 1) {
        return prev
      }
      return [...prev, key]
    })
  }

  const chartData = useMemo(() => {
    if (!esModoPersonalizado) return serie.map((p) => ({ ...p, __sum_serie: 0 }))
    return serie.map((punto, idx) => {
      const prevPunto = idx > 0 ? serie[idx - 1] : null
      const extra: Record<string, number> = {}
      let sumVisible = 0

      for (const s of seriesPersonalizadas) {
        const currVal =
          s.tipo === 'categoria'
            ? (punto.por_categoria?.[s.id] ?? 0)
            : (punto.por_subcategoria?.[s.id] ?? 0)
        const prevVal = prevPunto
          ? s.tipo === 'categoria'
            ? (prevPunto.por_categoria?.[s.id] ?? 0)
            : (prevPunto.por_subcategoria?.[s.id] ?? 0)
          : 0

        extra[s.key] = currVal
        extra[`__prev_${s.key}`] = prevVal

        if (!hiddenKeys.includes(s.key)) {
          sumVisible += currVal
        }
      }

      return { ...punto, ...extra, __sum_serie: sumVisible }
    })
  }, [serie, esModoPersonalizado, seriesPersonalizadas, hiddenKeys])

  // Promedio por ciclo de la selección personalizada activa
  const avgCustomSeries = useMemo(() => {
    if (!esModoPersonalizado || chartData.length === 0) return 0
    let acc = 0
    for (const row of chartData) {
      const val = Number(row.__sum_serie ?? 0)
      acc += val
    }
    return acc / chartData.length
  }, [esModoPersonalizado, chartData])

  const chartAnimationKey = useMemo(() => {
    const firstKey = serie[0]?.clave ?? 'empty'
    const lastKey = serie[serie.length - 1]?.clave ?? 'empty'
    const customKeys = visibleSeries.map((s) => s.key).join('|')
    return `${serie.length}-${firstKey}-${lastKey}-${monedaVisual}-${modoGrafico}-${modoBarrasCustom}-${customKeys}`
  }, [serie, monedaVisual, modoGrafico, modoBarrasCustom, visibleSeries])

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
  const incomeColor = '#4CAF7D'
  const expenseColor = '#FF8A65'
  const balanceLineColor = isDark ? '#60A5FA' : '#0D2045'
  const avgLineColor = isDark ? '#CBD5E1' : '#475569'

  return (
    <section className={styles.card} aria-label="Evolución por ciclos">
      <header className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrap}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div className={styles.titleLine}>
                <h2 className={styles.title}>
                  {esModoPersonalizado
                    ? `Evolución Personalizada (${visibleSeries.length} de ${seriesPersonalizadas.length})`
                    : 'Evolución por Ciclos'}
                </h2>
                {sharedParentName && (
                  <span className={styles.parentCategoryBadge}>{sharedParentName}</span>
                )}
              </div>
              <p className={styles.subtitle}>
                {esModoPersonalizado
                  ? `Promedio selección: ${formatMonto(avgCustomSeries, monedaVisual)}/ciclo · Tocá una serie para encenderla o apagarla`
                  : `Ingresos vs. Gastos y línea de promedio histórico (${formatMonto(promedioHistoricoGastos, monedaVisual)})`}
              </p>
            </div>
          </div>

          <div className={styles.headerControls}>
            {esModoPersonalizado && modoGrafico !== 'lineas' && seriesPersonalizadas.length > 1 && (
              <div className={styles.stackToggleGroup} role="group" aria-label="Disposición de barras">
                <button
                  type="button"
                  className={`${styles.stackToggleBtn} ${
                    modoBarrasCustom === 'separadas' ? styles.stackToggleBtnActive : ''
                  }`}
                  onClick={() => setModoBarrasCustom('separadas')}
                >
                  Separadas
                </button>
                <button
                  type="button"
                  className={`${styles.stackToggleBtn} ${
                    modoBarrasCustom === 'apiladas' ? styles.stackToggleBtnActive : ''
                  }`}
                  onClick={() => setModoBarrasCustom('apiladas')}
                >
                  Apiladas
                </button>
              </div>
            )}

            {onOpenEditorSeries && (
              <button
                type="button"
                className={styles.editSeriesQuickBtn}
                onClick={onOpenEditorSeries}
              >
                <Sparkles size={13} />
                <span>{esModoPersonalizado ? 'Editar series' : 'Elegir categorías'}</span>
              </button>
            )}

            {esModoPersonalizado && onResetSeries && (
              <button
                type="button"
                className={styles.resetSeriesQuickBtn}
                onClick={() => {
                  setHiddenKeys([])
                  onResetSeries()
                }}
              >
                Ver general
              </button>
            )}
          </div>
        </div>
      </header>

      {serie.length === 0 && loading ? (
        <ChartLoadingState
          label="Cargando evolución"
          sublabel="Procesando ciclos y movimientos..."
        />
      ) : serie.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Activity size={28} />
          <p className={styles.emptyText}>No hay datos registrados para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className={styles.chartContainer}>
          {loading && (
            <ChartLoadingState
              overlay
              label="Actualizando evolución"
              sublabel="Recalculando ciclos del período..."
            />
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={chartAnimationKey}
              data={chartData}
              margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
              barGap={modoBarrasCustom === 'apiladas' ? 0 : 4}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="etiqueta"
                tick={{ fill: axisColor, fontSize: 12, fontWeight: 600 }}
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
                cursor={{
                  fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(13, 32, 69, 0.04)',
                  radius: 8,
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const row = payload[0].payload as AnalisisCicloPunto & Record<string, number>
                  const cycleSum = Number(row.__sum_serie ?? 0)

                  return (
                    <div className={styles.tooltipCard}>
                      <div className={styles.tooltipHeader}>
                        <span className={styles.tooltipTitle}>{row.etiqueta}</span>
                        <span className={styles.tooltipRange}>{row.rango_texto}</span>
                      </div>
                      {esModoPersonalizado ? (
                        <>
                          {visibleSeries.map((s) => {
                            const currVal = Number(row[s.key] ?? 0)
                            const prevVal = Number(row[`__prev_${s.key}`] ?? 0)
                            const sharePct =
                              cycleSum > 0 ? Math.trunc((currVal * 1000) / cycleSum) / 10 : 0
                            const hasDelta = prevVal > 0 && currVal > 0
                            const deltaPct = hasDelta
                              ? Math.trunc(((currVal - prevVal) * 1000) / prevVal) / 10
                              : null

                            return (
                              <div key={s.key} className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                  <span
                                    className={styles.tooltipColorDot}
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {sharedParentName
                                    ? s.nombre
                                    : s.categoriaPadreNombre
                                      ? `${s.categoriaPadreNombre} › ${s.nombre}`
                                      : s.nombre}
                                </span>
                                <div className={styles.tooltipRightGroup}>
                                  <span className={styles.tooltipVal}>
                                    {formatMonto(currVal, monedaVisual)}
                                  </span>
                                  {currVal > 0 && visibleSeries.length > 1 && (
                                    <span className={styles.tooltipShareBadge}>{sharePct}%</span>
                                  )}
                                  {deltaPct !== null && deltaPct !== 0 && (
                                    <span
                                      className={
                                        deltaPct <= 0
                                          ? styles.tooltipDeltaGood
                                          : styles.tooltipDeltaBad
                                      }
                                    >
                                      {deltaPct > 0 ? '+' : ''}
                                      {deltaPct}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          <div className={styles.tooltipDivider} />
                          <div className={styles.tooltipRow}>
                            <span className={styles.tooltipLabelStrong}>Total selección</span>
                            <span className={styles.tooltipValStrong}>
                              {formatMonto(cycleSum, monedaVisual)}
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
                                row.balance >= 0
                                  ? styles.tooltipValPositive
                                  : styles.tooltipValNegative
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

              {/* Línea de referencia de promedio */}
              {!esModoPersonalizado && promedioHistoricoGastos > 0 && (
                <ReferenceLine
                  y={promedioHistoricoGastos}
                  stroke={avgLineColor}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
              )}

              {esModoPersonalizado && avgCustomSeries > 0 && (
                <ReferenceLine
                  y={avgCustomSeries}
                  stroke={avgLineColor}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
              )}

              {esModoPersonalizado ? (
                modoGrafico === 'lineas' ? (
                  visibleSeries.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.nombre}
                      stroke={s.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={500}
                      animationEasing="ease-out"
                    />
                  ))
                ) : (
                  <>
                    {visibleSeries.map((s, idx) => {
                      const isTopOfStack =
                        modoBarrasCustom === 'apiladas' && idx === visibleSeries.length - 1
                      const barRadius: [number, number, number, number] =
                        modoBarrasCustom === 'apiladas'
                          ? isTopOfStack
                            ? [6, 6, 0, 0]
                            : [0, 0, 0, 0]
                          : [6, 6, 0, 0]

                      return (
                        <Bar
                          key={s.key}
                          dataKey={s.key}
                          name={s.nombre}
                          stackId={modoBarrasCustom === 'apiladas' ? 'custom-stack' : undefined}
                          fill={s.color}
                          radius={barRadius}
                          maxBarSize={modoBarrasCustom === 'apiladas' ? 46 : 34}
                          minPointSize={modoBarrasCustom === 'separadas' ? 3 : 0}
                          isAnimationActive={!prefersReducedMotion}
                          animationDuration={500}
                          animationEasing="ease-out"
                        />
                      )
                    })}

                    {modoGrafico === 'combinado' &&
                      modoBarrasCustom === 'separadas' &&
                      visibleSeries.length > 1 && (
                        <Line
                          type="monotone"
                          dataKey="__sum_serie"
                          name="Suma selección"
                          stroke={balanceLineColor}
                          strokeWidth={2.2}
                          dot={{ r: 3.5, fill: balanceLineColor, strokeWidth: 0 }}
                          activeDot={{ r: 5.5 }}
                          isAnimationActive={!prefersReducedMotion}
                          animationDuration={500}
                          animationEasing="ease-out"
                        />
                      )}
                  </>
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
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill={expenseColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={500}
                    animationEasing="ease-out"
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
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    name="Gastos"
                    stroke={expenseColor}
                    strokeWidth={2.4}
                    dot={{ r: 4, fill: expenseColor, strokeWidth: 0 }}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={500}
                    animationEasing="ease-out"
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
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Leyenda centrada al pie del gráfico */}
      <div className={styles.legend}>
        {esModoPersonalizado ? (
          <>
            {seriesPersonalizadas.map((s) => {
              const isHidden = hiddenKeys.includes(s.key)
              const shortLabel = sharedParentName
                ? s.nombre
                : s.categoriaPadreNombre
                  ? `${s.categoriaPadreNombre} · ${s.nombre}`
                  : s.nombre

              return (
                <button
                  key={s.key}
                  type="button"
                  className={`${styles.legendChip} ${isHidden ? styles.legendChipMuted : ''}`}
                  onClick={() => toggleSerieVisibility(s.key)}
                  title={
                    isHidden
                      ? `Mostrar ${shortLabel} en el gráfico`
                      : `Ocultar ${shortLabel} para reescalar el eje`
                  }
                >
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: isHidden ? 'var(--text-3)' : s.color }}
                  />
                  <span>{shortLabel}</span>
                </button>
              )
            })}

            {modoGrafico === 'combinado' &&
              modoBarrasCustom === 'separadas' &&
              visibleSeries.length > 1 && (
                <span className={styles.legendItemStatic}>
                  <span className={styles.legendDot} style={{ backgroundColor: balanceLineColor }} />
                  Suma selección
                </span>
              )}

            {avgCustomSeries > 0 && (
              <span className={styles.legendItemStatic}>
                <span className={styles.legendDash} style={{ borderColor: avgLineColor }} />
                Promedio
              </span>
            )}
          </>
        ) : (
          <>
            <span className={styles.legendItemStatic}>
              <span className={styles.legendDot} style={{ backgroundColor: incomeColor }} />
              Ingresos
            </span>
            <span className={styles.legendItemStatic}>
              <span className={styles.legendDot} style={{ backgroundColor: expenseColor }} />
              Gastos
            </span>
            <span className={styles.legendItemStatic}>
              <span className={styles.legendDot} style={{ backgroundColor: balanceLineColor }} />
              Balance
            </span>
            <span className={styles.legendItemStatic}>
              <span className={styles.legendDash} style={{ borderColor: avgLineColor }} />
              Promedio gastos
            </span>
          </>
        )}
      </div>
    </section>
  )
}
