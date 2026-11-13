import { useState, useEffect, useCallback, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import {
  PieChart as PieChartIcon,
  ArrowLeft,
  ChevronRight,
} from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { MovimientoAvatar } from '@/components/ui/MovimientoAvatar'
import analisisService, {
  type AnalisisCategoriaItem,
  type AnalisisMovimientoDrilldown,
  type AnalisisQueryParams,
} from '@/services/analisis.service'
import { formatMonto, formatFecha } from '@/utils/format'
import { useTheme } from '@/hooks/useTheme'
import ChartLoadingState from './ChartLoadingState'
import styles from './DesgloseCategoriasCard.module.css'

const CHART_COLORS_LIGHT = [
  '#0D2045',
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0284C7',
  '#EA580C',
  '#64748B',
]

const CHART_COLORS_DARK = [
  '#60A5FA',
  '#38BDF8',
  '#34D399',
  '#FBBF24',
  '#A78BFA',
  '#F472B6',
  '#2DD4BF',
  '#FB923C',
  '#94A3B8',
]

interface DesgloseCategoriasCardProps {
  categorias: AnalisisCategoriaItem[]
  monedaVisual: 'ARS' | 'USD'
  gastoTotal: number
  queryParams: AnalisisQueryParams
  vistaModoExterno?: 'barras' | 'dona' | 'ranking'
  onVistaModoChange?: (modo: 'barras' | 'dona' | 'ranking') => void
  loading?: boolean
}

export default function DesgloseCategoriasCard({
  categorias,
  monedaVisual,
  gastoTotal,
  queryParams,
  vistaModoExterno,
  onVistaModoChange,
  loading = false,
}: DesgloseCategoriasCardProps) {
  const { theme } = useTheme()
  const CHART_COLORS = theme === 'dark' ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
  const [vistaModoInterno, setVistaModoInterno] = useState<'barras' | 'dona' | 'ranking'>('barras')
  const vistaModo = vistaModoExterno ?? vistaModoInterno
  const handleCambiarVista = (nuevo: 'barras' | 'dona' | 'ranking') => {
    setVistaModoInterno(nuevo)
    onVistaModoChange?.(nuevo)
  }
  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<AnalisisMovimientoDrilldown[]>([])
  const [loadingMovs, setLoadingMovs] = useState(false)

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

  const selectedCat = useMemo(() => {
    if (!selectedCatKey) return null
    return (
      categorias.find((c) => (c.categoria_id ?? 'sin-categoria') === selectedCatKey) ?? null
    )
  }, [categorias, selectedCatKey])

  const animKey = useMemo(
    () =>
      `${queryParams.ciclos ?? 6}-${queryParams.moneda_modo ?? 'solo_ars'}-${
        queryParams.billetera_id ?? 'all'
      }-${queryParams.tarjeta_id ?? 'all'}-${vistaModo}-${gastoTotal}`,
    [queryParams, vistaModo, gastoTotal]
  )

  const fetchDrilldown = useCallback(
    async (catKey: string, subId: string | null, signal?: AbortSignal) => {
      setLoadingMovs(true)
      try {
        const items = await analisisService.getDrilldownMovimientos(
          {
            ...queryParams,
            categoria_id: catKey,
            subcategoria_id: subId ?? undefined,
            limit: 30,
          },
          signal
        )
        if (!signal?.aborted) {
          setMovimientos(items)
        }
      } catch {
        if (!signal?.aborted) {
          setMovimientos([])
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingMovs(false)
        }
      }
    },
    [queryParams]
  )

  useEffect(() => {
    if (!selectedCat) return
    const catKey = selectedCat.categoria_id ?? 'sin-categoria'
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchDrilldown(catKey, selectedSubId, controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [selectedCat, selectedSubId, fetchDrilldown])

  const handleSelectCategoria = (cat: AnalisisCategoriaItem) => {
    setSelectedCatKey(cat.categoria_id ?? 'sin-categoria')
    setSelectedSubId(null)
  }

  const handleBack = () => {
    setSelectedCatKey(null)
    setSelectedSubId(null)
    setMovimientos([])
  }

  return (
    <section className={styles.card} aria-label="Desglose por categorías y subcategorías">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          {selectedCat ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
              aria-label="Volver a todas las categorías"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className={styles.iconWrap}>
              <PieChartIcon size={18} />
            </div>
          )}

          <div>
            <h2 className={styles.title}>
              {selectedCat ? selectedCat.categoria_nombre : 'Desglose por Categorías'}
            </h2>
            <p className={styles.subtitle}>
              {selectedCat
                ? `${formatMonto(selectedCat.monto, monedaVisual)} (${selectedCat.porcentaje_del_total}% del total) · Tocá una subcategoría para filtrar movimientos`
                : 'Tocá cualquier categoría para explorar sus subcategorías y movimientos'}
            </p>
          </div>
        </div>

        {!selectedCat && (
          <SegmentedControl
            options={[
              { value: 'barras', label: 'Barras' },
              { value: 'dona', label: 'Dona' },
              { value: 'ranking', label: 'Ranking' },
            ]}
            value={vistaModo}
            onChange={(v: string) => handleCambiarVista(v as typeof vistaModo)}
            ariaLabel="Modo de visualización de categorías"
            layout="inline"
          />
        )}
      </header>

      {categorias.length === 0 && loading ? (
        <ChartLoadingState
          label="Cargando categorías"
          sublabel="Agrupando gastos del período..."
        />
      ) : categorias.length === 0 ? (
        <div className={styles.emptyWrap}>
          <PieChartIcon size={28} />
          <p className={styles.emptyText}>Sin gastos registrados en el período seleccionado.</p>
        </div>
      ) : (
        <div className={styles.bodyContentWrap}>
          {loading && (
            <ChartLoadingState
              overlay
              label="Actualizando categorías"
              sublabel="Recalculando pesos del período..."
            />
          )}
          {selectedCat ? (
        /* ── Nivel 2: Detalle de Subcategorías + Movimientos ── */
        <div className={styles.drilldownLayout}>
          <div className={styles.subcatsSection}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>Subcategorías</span>
              {selectedSubId && (
                <button
                  type="button"
                  className={styles.clearSubBtn}
                  onClick={() => setSelectedSubId(null)}
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className={styles.subcatList}>
              {selectedCat.subcategorias.map((sub) => {
                const isSelected = selectedSubId === sub.subcategoria_id
                return (
                  <button
                    key={sub.subcategoria_id}
                    type="button"
                    className={`${styles.subcatRow} ${isSelected ? styles.subcatRowActive : ''}`}
                    onClick={() =>
                      setSelectedSubId((prev) =>
                        prev === sub.subcategoria_id ? null : sub.subcategoria_id
                      )
                    }
                  >
                    <div className={styles.subcatLeft}>
                      <SubcategoriaIcon
                        nombre={sub.subcategoria_nombre}
                        parentCategory={selectedCat.categoria_nombre}
                        size={28}
                      />
                      <div className={styles.subcatMeta}>
                        <span className={styles.subcatName}>{sub.subcategoria_nombre}</span>
                        <span className={styles.subcatCount}>
                          {sub.cantidad_movimientos}{' '}
                          {sub.cantidad_movimientos === 1 ? 'movimiento' : 'movimientos'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.subcatRight}>
                      <span className={styles.subcatAmount}>
                        {formatMonto(sub.monto, monedaVisual)}
                      </span>
                      <span className={styles.subcatPct}>{sub.porcentaje_categoria}%</span>
                    </div>

                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${sub.ancho_barra_pct}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.movsSection}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>Movimientos que componen este gasto</span>
              <span className={styles.movsCountBadge}>{movimientos.length}</span>
            </div>

            {loadingMovs ? (
              <p className={styles.loadingText}>Cargando movimientos...</p>
            ) : movimientos.length === 0 ? (
              <p className={styles.loadingText}>No se encontraron movimientos para este filtro.</p>
            ) : (
              <div className={styles.movsList}>
                {movimientos.map((mov) => (
                  <div key={mov.id} className={styles.movRow}>
                    <div className={styles.movAvatarWrap}>
                      <MovimientoAvatar
                        movimiento={{
                          descripcion: mov.descripcion,
                          categoria_nombre: mov.categoria_nombre,
                          subcategoria_nombre: mov.subcategoria_nombre,
                          tipo: mov.tipo,
                        }}
                        size={28}
                      />
                    </div>
                    <div className={styles.movInfo}>
                      <span className={styles.movDesc}>{mov.descripcion}</span>
                      <span className={styles.movSub}>
                        {formatFecha(mov.fecha)} · {mov.billetera_nombre}
                        {mov.tarjeta_nombre ? ` (${mov.tarjeta_nombre})` : ''}
                        {mov.cuota_texto ? ` · ${mov.cuota_texto}` : ''}
                      </span>
                    </div>
                    <span className={styles.movAmount}>
                      {formatMonto(mov.monto, mov.moneda)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : vistaModo === 'dona' ? (
        /* ── Nivel 1 (Modo Dona + Leyenda interactiva) ── */
        <div className={styles.donutLayout}>
          <div className={styles.donutChartBox}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart key={animKey}>
                <Pie
                  data={categorias}
                  dataKey="monto"
                  nameKey="categoria_nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={2}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={480}
                  animationEasing="ease-out"
                  onClick={(_, index) => {
                    const target = categorias[index]
                    if (target) handleSelectCategoria(target)
                  }}
                >
                  {categorias.map((entry, idx) => (
                    <Cell
                      key={entry.categoria_id ?? entry.categoria_nombre}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const item = payload[0].payload as AnalisisCategoriaItem
                    return (
                      <div className={styles.donutTooltip}>
                        <span className={styles.donutTooltipTitle}>{item.categoria_nombre}</span>
                        <span className={styles.donutTooltipVal}>
                          {formatMonto(item.monto, monedaVisual)} ({item.porcentaje_del_total}%)
                        </span>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenterLabel}>
              <span className={styles.donutCenterCaption}>Total</span>
              <span className={styles.donutCenterValue}>
                {formatMonto(gastoTotal, monedaVisual)}
              </span>
            </div>
          </div>

          <div className={styles.donutLegendList}>
            {categorias.map((cat, idx) => (
              <button
                key={cat.categoria_id ?? cat.categoria_nombre}
                type="button"
                className={styles.donutLegendItem}
                onClick={() => handleSelectCategoria(cat)}
              >
                <span
                  className={styles.colorSwatch}
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className={styles.donutLegendName}>{cat.categoria_nombre}</span>
                <span className={styles.donutLegendPct}>{cat.porcentaje_del_total}%</span>
                <span className={styles.donutLegendVal}>
                  {formatMonto(cat.monto, monedaVisual)}
                </span>
                <ChevronRight size={14} className={styles.chevronIcon} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Nivel 1 (Modo Barras Horizontales / Ranking) ── */
        <div className={styles.catList}>
          {categorias.map((cat, idx) => (
            <button
              key={cat.categoria_id ?? cat.categoria_nombre}
              type="button"
              className={styles.catRow}
              onClick={() => handleSelectCategoria(cat)}
            >
              <div className={styles.catTopRow}>
                <div className={styles.catIdentity}>
                  {vistaModo === 'ranking' && (
                    <span className={styles.rankBadge}>#{idx + 1}</span>
                  )}
                  <CategoriaIcon nombre={cat.categoria_nombre} size={30} />
                  <div className={styles.catTextGroup}>
                    <span className={styles.catName}>{cat.categoria_nombre}</span>
                    <span className={styles.catSubInfo}>
                      {cat.subcategorias.length}{' '}
                      {cat.subcategorias.length === 1 ? 'subcategoría' : 'subcategorías'} ·{' '}
                      {cat.cantidad_movimientos} mov.
                    </span>
                  </div>
                </div>

                <div className={styles.catNumbers}>
                  <span className={styles.catAmount}>
                    {formatMonto(cat.monto, monedaVisual)}
                  </span>
                  <span className={styles.catPctBadge}>{cat.porcentaje_del_total}%</span>
                  <ChevronRight size={15} className={styles.chevronIcon} />
                </div>
              </div>

              {vistaModo === 'barras' && (
                <div className={styles.barTrack}>
                  <div
                    key={`${animKey}-${cat.categoria_id ?? cat.categoria_nombre}`}
                    className={styles.barFill}
                    style={{
                      width: `${cat.ancho_barra_pct}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
          )}
        </div>
      )}
    </section>
  )
}

