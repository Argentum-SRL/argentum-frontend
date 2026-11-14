import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts'
import { TrendingUp, Activity, Sparkles } from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { CollapseToggle } from '@/components/ui'
import type { AnalisisCicloPunto, SerieEvolucionPersonalizada } from '@/services/analisis.service'
import { formatMonto, formatPorcentaje, formatMontoCorto } from '@/utils/format'
import { useTheme } from '@/hooks/useTheme'
import ChartLoadingState from './ChartLoadingState'
import styles from './EvolucionCiclosCard.module.css'

interface EvolucionChartItem extends AnalisisCicloPunto {
  __sum_serie: number | null
  [key: string]: unknown
}

interface EvolucionCiclosCardProps {
  serie: AnalisisCicloPunto[]
  monedaVisual: 'ARS' | 'USD'
  promedioHistoricoGastos: number | null
  modoGrafico?: 'combinado' | 'barras' | 'lineas'
  onModoGraficoChange?: (m: 'combinado' | 'barras' | 'lineas') => void
  seriesPersonalizadas?: SerieEvolucionPersonalizada[]
  loading?: boolean
  onOpenEditorSeries?: () => void
  onResetSeries?: () => void
  ocultarControlesHeader?: boolean
  collapsible?: boolean
}

/**
 * C-4: Eje Y: si hay valores negativos, el piso es el valor más bajo redondeado hacia
 * abajo a una marca redonda que no pase de 1,5 veces ese valor.
 */
function calcularPisoNegativo(minVal: number): number {
  if (minVal >= 0) return 0
  const abs = Math.abs(minVal)
  const step = Math.pow(10, Math.floor(Math.log10(abs)))
  const subStep = abs / (step / 2) <= 10 ? step / 2 : step
  const rounded = Math.ceil(abs / subStep) * subStep
  return rounded <= 1.5 * abs ? -rounded : -abs
}

export default function EvolucionCiclosCard({
  serie,
  monedaVisual,
  promedioHistoricoGastos,
  modoGrafico = 'combinado',
  onModoGraficoChange,
  seriesPersonalizadas = [],
  loading = false,
  onOpenEditorSeries,
  onResetSeries,
  ocultarControlesHeader = false,
  collapsible = false,
}: EvolucionCiclosCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const esModoPersonalizado = seriesPersonalizadas.length > 0

  const [hiddenKeys, setHiddenKeys] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [modoBarrasCustom, setModoBarrasCustom] = useState<'separadas' | 'apiladas'>('separadas')

  const visibleSeries = useMemo(() => {
    const filtered = seriesPersonalizadas.filter((s) => !hiddenKeys.includes(s.key))
    return filtered.length > 0 ? filtered : seriesPersonalizadas
  }, [seriesPersonalizadas, hiddenKeys])

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
      if (seriesPersonalizadas.length - prev.length <= 1) {
        return prev
      }
      return [...prev, key]
    })
  }

  // C-5: Puntos sin datos tienen valores null para no unir líneas ni dibujar barras
  const chartData = useMemo<EvolucionChartItem[]>(() => {
    if (!esModoPersonalizado) {
      return serie.map((p): EvolucionChartItem => {
        if (p.sin_datos) {
          return { ...p, ingresos: null, gastos: 0, balance: null, __sum_serie: null }
        }
        return { ...p, __sum_serie: 0 }
      })
    }
    return serie.map((punto, idx): EvolucionChartItem => {
      if (punto.sin_datos) {
        const extraNull: Record<string, number | null> = {}
        for (const s of seriesPersonalizadas) {
          extraNull[s.key] = null
          extraNull[`__prev_${s.key}`] = 0
        }
        return {
          ...punto,
          ...extraNull,
          __sum_serie: null,
          ingresos: null,
          gastos: 0,
          balance: null,
        }
      }
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

  // C-5: El promedio de las series elegidas usa solo ciclos terminados con datos
  const avgCustomSeries = useMemo(() => {
    if (!esModoPersonalizado || chartData.length === 0) return 0
    const terminadosConDatos = chartData.filter((row) => !row.sin_datos && !row.es_actual)
    if (terminadosConDatos.length === 0) return 0
    let acc = 0
    for (const row of terminadosConDatos) {
      acc += Number(row.__sum_serie ?? 0)
    }
    return acc / terminadosConDatos.length
  }, [esModoPersonalizado, chartData])

  // C-4: Dominio Y con piso redondeado para valores negativos
  const { minY } = useMemo(() => {
    let min = 0
    for (const row of chartData) {
      if (row.sin_datos) continue
      if (esModoPersonalizado) {
        const sum = Number(row.__sum_serie ?? 0)
        if (sum < min) min = sum
        for (const s of visibleSeries) {
          const v = Number(row[s.key] ?? 0)
          if (v < min) min = v
        }
      } else {
        const bal = Number(row.balance ?? 0)
        if (bal < min) min = bal
      }
    }
    return { minY: min < 0 ? calcularPisoNegativo(min) : 0 }
  }, [chartData, esModoPersonalizado, visibleSeries])

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
                  ? `Promedio selección: ${formatMonto(avgCustomSeries, monedaVisual)}/ciclo`
                  : promedioHistoricoGastos !== null
                    ? `Promedio de gastos: ${formatMonto(promedioHistoricoGastos, monedaVisual)}`
                    : null}
              </p>
            </div>
          </div>

          {(!ocultarControlesHeader || collapsible) && (
            <div className={styles.headerControls}>
              {!ocultarControlesHeader && (
                <>
                  {!esModoPersonalizado && onModoGraficoChange && (
                    <SegmentedControl<'combinado' | 'barras' | 'lineas'>
                      options={[{ value: 'combinado', label: 'Combinado' }, { value: 'barras', label: 'Barras' }, { value: 'lineas', label: 'Líneas' }]}
                      value={modoGrafico}
                      onChange={onModoGraficoChange}
                      ariaLabel="Tipo de gráfico de evolución"
                    />
                  )}

                  {esModoPersonalizado && modoGrafico !== 'lineas' && seriesPersonalizadas.length > 1 && (
                    <SegmentedControl<'separadas' | 'apiladas'>
                      options={[{ value: 'separadas', label: 'Separadas' }, { value: 'apiladas', label: 'Apiladas' }]}
                      value={modoBarrasCustom}
                      onChange={setModoBarrasCustom}
                      ariaLabel="Disposición de barras"
                    />
                  )}

                  {onOpenEditorSeries && (
                    <button type="button" className={styles.editSeriesQuickBtn} onClick={onOpenEditorSeries}>
                      <Sparkles size={14} />
                      <span>{esModoPersonalizado ? 'Editar series' : 'Elegir categorías'}</span>
                    </button>
                  )}

                  {esModoPersonalizado && onResetSeries && (
                    <button type="button" className={styles.resetSeriesQuickBtn} onClick={() => { setHiddenKeys([]); onResetSeries() }}>
                      Ver general
                    </button>
                  )}
                </>
              )}

              {collapsible && (
                <CollapseToggle
                  expanded={isExpanded}
                  onToggle={() => setIsExpanded((prev) => !prev)}
                  ariaLabel={isExpanded ? 'Ocultar evolución por ciclos' : 'Mostrar evolución por ciclos'}
                />
              )}
            </div>
          )}
        </div>
      </header>

      {isExpanded && (
        <>
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
              margin={{ top: 8, right: 8, left: -4, bottom: 4 }}
              barGap={modoBarrasCustom === 'apiladas' ? 0 : 4}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="etiqueta"
                height={38}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
                tick={({ x, y, payload }: { x?: string | number; y?: string | number; payload?: { value?: string | number } }) => {
                  const pto = chartData.find(
                    (p) => p.etiqueta === payload?.value || p.clave === payload?.value
                  )
                  return (
                    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
                      <text x={0} y={0} dy={14} textAnchor="middle" fill={axisColor} fontSize={11} fontWeight={600}>
                        {pto?.etiqueta ?? (payload?.value ? String(payload.value) : '')}
                      </text>
                      {(pto?.sin_datos || pto?.es_actual) && (
                        <text x={0} y={0} dy={26} textAnchor="middle" fill="var(--text-3)" fontSize={11}>
                          {pto?.sin_datos ? 'Sin datos' : 'En curso'}
                        </text>
                      )}
                    </g>
                  )
                }}
              />
              <YAxis
                domain={[minY, 'auto']}
                tickCount={5}
                tickFormatter={(val: number) => formatMontoCorto(val, monedaVisual)}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(13, 32, 69, 0.04)',
                  radius: 8,
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const row = payload[0].payload as AnalisisCicloPunto & Record<string, number>

                  if (row.sin_datos) {
                    return (
                      <div className={styles.tooltipCard}>
                        <div className={styles.tooltipHeader}>
                          <span className={styles.tooltipTitle}>{row.etiqueta}</span>
                          <span className={styles.tooltipRange}>{row.rango_texto}</span>
                        </div>
                        <p className={styles.tooltipSinDatos}>No hay movimientos en este ciclo.</p>
                      </div>
                    )
                  }

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
                                    <span className={styles.tooltipShareBadge}>
                                      {formatPorcentaje(sharePct)}
                                    </span>
                                  )}
                                  {deltaPct !== null && deltaPct !== 0 && (
                                    <span
                                      className={
                                        deltaPct <= 0
                                          ? styles.tooltipDeltaGood
                                          : styles.tooltipDeltaBad
                                      }
                                    >
                                      {formatPorcentaje(deltaPct, { signo: true })}
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
                              {row.ingresos !== null && row.ingresos !== undefined
                                ? formatMonto(row.ingresos, monedaVisual)
                                : '—'}
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
                            <span className={styles.tooltipLabel}>Te quedó</span>
                            <span
                              className={
                                row.balance === null || row.balance === undefined
                                  ? undefined
                                  : row.balance >= 0
                                    ? styles.tooltipValPositive
                                    : styles.tooltipValNegative
                              }
                            >
                              {row.balance !== null && row.balance !== undefined
                                ? formatMonto(row.balance, monedaVisual)
                                : '—'}
                            </span>
                          </div>
                          <div className={styles.tooltipRow}>
                            <span className={styles.tooltipLabel}>Te quedó (%)</span>
                            <span className={styles.tooltipBadge}>
                              {row.tasa_ahorro_pct !== null && row.tasa_ahorro_pct !== undefined
                                ? formatPorcentaje(row.tasa_ahorro_pct)
                                : '—'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                }}
              />

              {!esModoPersonalizado && promedioHistoricoGastos !== null && promedioHistoricoGastos > 0 && (
                <ReferenceLine y={promedioHistoricoGastos} stroke={avgLineColor} strokeDasharray="5 5" strokeWidth={1.5} />
              )}
              {esModoPersonalizado && avgCustomSeries > 0 && (
                <ReferenceLine y={avgCustomSeries} stroke={avgLineColor} strokeDasharray="5 5" strokeWidth={1.5} />
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
                      connectNulls={false}
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
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-custom-${s.key}-${index}`}
                              fill={s.color}
                              opacity={entry.es_actual ? 0.55 : 1}
                            />
                          ))}
                        </Bar>
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
                          connectNulls={false}
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
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-ing-${index}`}
                        fill={incomeColor}
                        opacity={entry.es_actual ? 0.55 : 1}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill={expenseColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-gas-${index}`}
                        fill={expenseColor}
                        opacity={entry.es_actual ? 0.55 : 1}
                      />
                    ))}
                  </Bar>
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke={incomeColor}
                    strokeWidth={2.4}
                    connectNulls={false}
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
                    connectNulls={false}
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
                  connectNulls={false}
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
                      ? `Mostrar serie ${shortLabel}`
                      : `Ocultar serie ${shortLabel}`
                  }
                >
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{shortLabel}</span>
                </button>
              )
            })}
          </>
        ) : (
          <>
            <div className={styles.legendItemStatic}>
              <span className={styles.legendDot} style={{ backgroundColor: incomeColor }} />
              <span>Ingresos</span>
            </div>
            <div className={styles.legendItemStatic}>
              <span className={styles.legendDot} style={{ backgroundColor: expenseColor }} />
              <span>Gastos</span>
            </div>
            {modoGrafico !== 'barras' && (
              <div className={styles.legendItemStatic}>
                <span className={styles.legendDot} style={{ backgroundColor: balanceLineColor }} />
                <span>Te quedó</span>
              </div>
            )}
            {promedioHistoricoGastos !== null && promedioHistoricoGastos > 0 && (
              <div className={styles.legendItemStatic}>
                <span className={styles.legendDash} style={{ color: avgLineColor }} />
                <span>Promedio gastos</span>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}
    </section>
  )
}
