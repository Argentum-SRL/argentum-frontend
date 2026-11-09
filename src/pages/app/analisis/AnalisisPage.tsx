import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  PieChart,
  ArrowLeftRight,
  Calendar,
  Activity,
  Sparkles,
} from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import analisisService, {
  type AnalisisResumenResponse,
  type MonedaModoAnalisis,
  type AnalisisQueryParams,
  type SerieEvolucionPersonalizada,
} from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { sileo } from 'sileo'
import EvolucionCiclosCard from './EvolucionCiclosCard'
import DesgloseCategoriasCard from './DesgloseCategoriasCard'
import ComparativaCiclosCard from './ComparativaCiclosCard'
import ProyeccionCuotasCard from './ProyeccionCuotasCard'
import MisInformesTab from './MisInformesTab'
import EditorSeriesEvolucionModal from './EditorSeriesEvolucionModal'
import { exportarAnalisisPdf } from './exportarAnalisisPdf'
import styles from './AnalisisPage.module.css'

type VistaActivaAnalisis =
  | 'evolucion'
  | 'categorias'
  | 'comparativa'
  | 'proyeccion'
  | 'informes'

const VISTAS_PRINCIPALES: Array<{
  id: VistaActivaAnalisis
  titulo: string
  icon: typeof TrendingUp
}> = [
  { id: 'evolucion', titulo: 'Evolución', icon: TrendingUp },
  { id: 'categorias', titulo: 'Categorías', icon: PieChart },
  { id: 'comparativa', titulo: 'Comparador', icon: ArrowLeftRight },
  { id: 'proyeccion', titulo: 'Proyección', icon: Calendar },
]

export default function AnalisisPage() {
  const { lastDataUpdate } = useNotificaciones()

  const [vistaActiva, setVistaActiva] = useState<VistaActivaAnalisis>('evolucion')

  // Sub-modos controlados desde el Panel de Control derecho
  const [modoEvolucion, setModoEvolucion] = useState<'combinado' | 'barras' | 'lineas'>('combinado')
  const [modoCategorias, setModoCategorias] = useState<'barras' | 'dona' | 'ranking'>('barras')
  const [modoComparativa, setModoComparativa] = useState<'espejo' | 'grafico'>('espejo')
  const [horizonteProyeccion, setHorizonteProyeccion] = useState<'6' | '12'>('6')
  const [vistaProyeccion, setVistaProyeccion] = useState<'grafico' | 'planes'>('grafico')

  // Filtros de datos
  const [monedaModo, setMonedaModo] = useState<MonedaModoAnalisis>('solo_ars')
  const [ciclosCount, setCiclosCount] = useState<number>(6)
  const [billeteraId, setBilleteraId] = useState<string>('todos')
  const [tarjetaId, setTarjetaId] = useState<string>('todos')

  // Series personalizadas para el Gráfico de Evolución
  const [seriesPersonalizadas, setSeriesPersonalizadas] = useState<SerieEvolucionPersonalizada[]>([])
  const [isEditorSeriesOpen, setIsEditorSeriesOpen] = useState<boolean>(false)

  const [data, setData] = useState<AnalisisResumenResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [exportingExcel, setExportingExcel] = useState<boolean>(false)

  const queryParams = useMemo<AnalisisQueryParams>(
    () => ({
      moneda_modo: monedaModo,
      ciclos: ciclosCount,
      naturaleza: 'todos',
      billetera_id: billeteraId !== 'todos' ? billeteraId : undefined,
      tarjeta_id: tarjetaId !== 'todos' ? tarjetaId : undefined,
    }),
    [monedaModo, ciclosCount, billeteraId, tarjetaId]
  )

  const fetchResumen = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      try {
        const res = await analisisService.getResumen(queryParams, signal)
        if (!signal?.aborted) {
          setData(res)
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        sileo.error({
          title: getErrorMessage(err, 'No pudimos cargar los datos de análisis.'),
        })
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [queryParams]
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchResumen(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchResumen])

  useEffect(() => {
    if (lastDataUpdate?.entidad === 'transacciones' || lastDataUpdate?.entidad === 'billeteras') {
      const controller = new AbortController()
      const timer = setTimeout(() => {
        void fetchResumen(controller.signal)
      }, 0)
      return () => {
        clearTimeout(timer)
        controller.abort()
      }
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchResumen])

  const monedaVisual = data?.moneda_visual ?? (monedaModo.includes('usd') ? 'USD' : 'ARS')
  const esConsolidado = monedaModo === 'consolidado_ars' || monedaModo === 'consolidado_usd'

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const blob = await analisisService.exportarExcel(queryParams)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `argentum_analisis_${ciclosCount}ciclos_${monedaVisual.toLowerCase()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      sileo.success({ title: 'Libro Excel (.xlsx) descargado.' })
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos exportar el Excel.') })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPdf = () => {
    if (!data) return
    exportarAnalisisPdf(data, 'Argentum — Informe de Análisis Financiero')
    sileo.success({ title: 'Informe PDF descargado.' })
  }

  return (
    <div className={styles.page}>
      <div className={styles.studioLayout}>
        {/* ══════════════════════════════════════════════════════════════════
            IZQUIERDA: CONTENEDOR DE GRÁFICO (ENTRA 100% EN PANTALLA)
           ══════════════════════════════════════════════════════════════════ */}
        <main className={styles.leftStage} aria-label="Contenedor principal de gráficos">
          {/* Cinta superior ultracompacta con título y KPIs en una sola línea */}
          <header className={styles.stageTopBar}>
            <div className={styles.stageTitleBlock}>
              <h1 className={styles.stageMainTitle}>Análisis</h1>
              <span className={styles.stagePeriodBadge}>
                {data?.periodo_seleccionado.etiqueta ?? 'Cargando...'}
              </span>
            </div>

            <div className={styles.inlineKpis}>
              <div className={styles.kpiPill}>
                <span className={styles.kpiPillLabel}>Gastos</span>
                <strong className={styles.kpiPillVal}>
                  {loading && !data
                    ? '...'
                    : formatMonto(data?.kpis.gastos_totales ?? 0, monedaVisual)}
                </strong>
                {data?.kpis.variacion_gasto_vs_anterior_pct !== null &&
                  data?.kpis.variacion_gasto_vs_anterior_pct !== undefined && (
                    <span
                      className={
                        data.kpis.variacion_gasto_vs_anterior_pct <= 0
                          ? styles.deltaGood
                          : styles.deltaBad
                      }
                    >
                      {data.kpis.variacion_gasto_vs_anterior_pct > 0 ? '+' : ''}
                      {data.kpis.variacion_gasto_vs_anterior_pct}%
                    </span>
                  )}
              </div>

              <div className={styles.kpiPill}>
                <span className={styles.kpiPillLabel}>Ingresos</span>
                <strong className={styles.kpiPillVal}>
                  {loading && !data
                    ? '...'
                    : formatMonto(data?.kpis.ingresos_totales ?? 0, monedaVisual)}
                </strong>
              </div>

              <div className={styles.kpiPill}>
                <span className={styles.kpiPillLabel}>Balance</span>
                <strong
                  className={
                    (data?.kpis.balance_neto ?? 0) >= 0
                      ? styles.kpiPillPositive
                      : styles.kpiPillNegative
                  }
                >
                  {loading && !data
                    ? '...'
                    : formatMonto(data?.kpis.balance_neto ?? 0, monedaVisual)}
                </strong>
              </div>

              <div className={styles.kpiPill}>
                <span className={styles.kpiPillLabel}>Ahorro</span>
                <strong className={styles.kpiPillVal}>
                  {loading && !data ? '...' : `${data?.kpis.tasa_ahorro_pct ?? 0}%`}
                </strong>
              </div>
            </div>
          </header>

          {/* Cuadro del Gráfico Protagonista */}
          <div className={styles.stageViewport}>
            {vistaActiva === 'evolucion' && (
              <EvolucionCiclosCard
                serie={data?.serie_ciclos ?? []}
                monedaVisual={monedaVisual}
                promedioHistoricoGastos={data?.kpis.promedio_gasto_ciclo ?? 0}
                modoGrafico={modoEvolucion}
                seriesPersonalizadas={seriesPersonalizadas}
              />
            )}

            {vistaActiva === 'categorias' && (
              <DesgloseCategoriasCard
                categorias={data?.desglose_categorias ?? []}
                monedaVisual={monedaVisual}
                gastoTotal={data?.kpis.gastos_totales ?? 0}
                queryParams={queryParams}
                vistaModoExterno={modoCategorias}
                onVistaModoChange={setModoCategorias}
              />
            )}

            {vistaActiva === 'comparativa' && (
              <ComparativaCiclosCard
                queryParams={queryParams}
                monedaVisual={monedaVisual}
                vistaModoExterno={modoComparativa}
                onVistaModoChange={setModoComparativa}
              />
            )}

            {vistaActiva === 'proyeccion' && (
              <ProyeccionCuotasCard
                monedaModo={monedaModo}
                monedaVisual={monedaVisual}
                billeteraId={queryParams.billetera_id}
                tarjetaId={queryParams.tarjeta_id}
                horizonteExterno={horizonteProyeccion}
                onHorizonteChange={setHorizonteProyeccion}
                vistaInternaExterna={vistaProyeccion}
                onVistaInternaChange={setVistaProyeccion}
              />
            )}

            {vistaActiva === 'informes' && <MisInformesTab />}
          </div>
        </main>

        {/* ══════════════════════════════════════════════════════════════════
            DERECHA: PANEL DE CONTROL COMPACTO (SIN SCROLL)
           ══════════════════════════════════════════════════════════════════ */}
        <aside className={styles.controlPanel} aria-label="Panel de control de análisis">
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderLeft}>
              <div className={styles.panelIconBox}>
                <Activity size={15} />
              </div>
              <h2 className={styles.panelTitle}>Panel de Control</h2>
            </div>

            <button
              type="button"
              className={`${styles.reportsChipBtn} ${
                vistaActiva === 'informes' ? styles.reportsChipBtnActive : ''
              }`}
              onClick={() => setVistaActiva('informes')}
            >
              <FileSpreadsheet size={13} />
              <span>Mis Informes</span>
            </button>
          </div>

          {/* 1. Selector de Gráfico en Grilla 2x2 */}
          <div className={styles.panelSection}>
            <span className={styles.sectionLabel}>Gráfico en pantalla</span>
            <div className={styles.viewGrid}>
              {VISTAS_PRINCIPALES.map((v) => {
                const IconComp = v.icon
                const isSelected = vistaActiva === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`${styles.viewGridBtn} ${
                      isSelected ? styles.viewGridBtnActive : ''
                    }`}
                    onClick={() => setVistaActiva(v.id)}
                  >
                    <IconComp size={15} />
                    <span>{v.titulo}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Formato contextual del gráfico activo */}
          {vistaActiva === 'evolucion' && (
            <div className={styles.panelSection}>
              <span className={styles.sectionLabel}>Formato de gráfico</span>
              <div className={styles.controlTrack}>
                <SegmentedControl
                  options={[
                    { value: 'combinado', label: 'Combinado' },
                    { value: 'barras', label: 'Barras' },
                    { value: 'lineas', label: 'Líneas' },
                  ]}
                  value={modoEvolucion}
                  onChange={(v: string) => setModoEvolucion(v as typeof modoEvolucion)}
                  ariaLabel="Formato de evolución"
                  fullWidth
                />
              </div>
            </div>
          )}

          {vistaActiva === 'categorias' && (
            <div className={styles.panelSection}>
              <span className={styles.sectionLabel}>Formato de gráfico</span>
              <div className={styles.controlTrack}>
                <SegmentedControl
                  options={[
                    { value: 'barras', label: 'Barras' },
                    { value: 'dona', label: 'Dona' },
                    { value: 'ranking', label: 'Ranking' },
                  ]}
                  value={modoCategorias}
                  onChange={(v: string) => setModoCategorias(v as typeof modoCategorias)}
                  ariaLabel="Formato de categorías"
                  fullWidth
                />
              </div>
            </div>
          )}

          {vistaActiva === 'comparativa' && (
            <div className={styles.panelSection}>
              <span className={styles.sectionLabel}>Formato de comparativa</span>
              <div className={styles.controlTrack}>
                <SegmentedControl
                  options={[
                    { value: 'espejo', label: 'Tabla Deltas' },
                    { value: 'grafico', label: 'Barras' },
                  ]}
                  value={modoComparativa}
                  onChange={(v: string) => setModoComparativa(v as typeof modoComparativa)}
                  ariaLabel="Formato de comparativa"
                  fullWidth
                />
              </div>
            </div>
          )}

          {vistaActiva === 'proyeccion' && (
            <div className={styles.panelSection}>
              <span className={styles.sectionLabel}>Horizonte y vista</span>
              <div className={styles.twoColRow}>
                <div className={styles.controlTrackHalf}>
                  <SegmentedControl
                    options={[
                      { value: '6', label: '6M' },
                      { value: '12', label: '12M' },
                    ]}
                    value={horizonteProyeccion}
                    onChange={(v: string) => setHorizonteProyeccion(v as '6' | '12')}
                    ariaLabel="Horizonte"
                    fullWidth
                  />
                </div>
                <div className={styles.controlTrackHalf}>
                  <SegmentedControl
                    options={[
                      { value: 'grafico', label: 'Curva' },
                      { value: 'planes', label: 'Planes' },
                    ]}
                    value={vistaProyeccion}
                    onChange={(v: string) => setVistaProyeccion(v as 'grafico' | 'planes')}
                    ariaLabel="Vista"
                    fullWidth
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Moneda (1 sola línea) */}
          <div className={styles.panelSection}>
            <div className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Moneda</span>
              {esConsolidado && data?.cotizacion_referencia && (
                <span className={styles.tcInlineBadge}>
                  TC {data.cotizacion_referencia.nombre}:{' '}
                  <strong>{formatMonto(data.cotizacion_referencia.valor, 'ARS')}</strong>
                </span>
              )}
            </div>
            <div className={styles.controlTrack}>
              <SegmentedControl
                options={[
                  { value: 'solo_ars', label: 'ARS' },
                  { value: 'solo_usd', label: 'USD' },
                  { value: 'consolidado_ars', label: 'Todo $' },
                  { value: 'consolidado_usd', label: 'Todo US$' },
                ]}
                value={monedaModo}
                onChange={(v: string) => setMonedaModo(v as MonedaModoAnalisis)}
                ariaLabel="Modo de moneda"
                fullWidth
              />
            </div>
          </div>

          {/* 4. Ventana de Ciclos (1 sola línea) */}
          <div className={styles.panelSection}>
            <span className={styles.sectionLabel}>Período (ciclos)</span>
            <div className={styles.controlTrack}>
              <SegmentedControl
                options={[
                  { value: '1', label: 'Actual' },
                  { value: '3', label: '3C' },
                  { value: '6', label: '6C' },
                  { value: '12', label: '12C' },
                ]}
                value={String(ciclosCount)}
                onChange={(v: string) => setCiclosCount(Number(v))}
                ariaLabel="Ventana de ciclos"
                fullWidth
              />
            </div>
          </div>

          {/* 5. Qué ver en el gráfico (reemplaza Tipo de gasto) */}
          <div className={styles.panelSection}>
            <div className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Qué ver en el gráfico</span>
              {seriesPersonalizadas.length > 0 && (
                <button
                  type="button"
                  className={styles.resetSeriesLink}
                  onClick={() => setSeriesPersonalizadas([])}
                >
                  Restablecer
                </button>
              )}
            </div>
            <div className={styles.chartEditorRow}>
              <button
                type="button"
                className={`${styles.chartModeBtn} ${
                  seriesPersonalizadas.length === 0 ? styles.chartModeBtnActive : ''
                }`}
                onClick={() => {
                  setSeriesPersonalizadas([])
                  if (vistaActiva !== 'evolucion') setVistaActiva('evolucion')
                }}
              >
                Ingresos y Egresos
              </button>
              <button
                type="button"
                className={`${styles.chartEditorTriggerBtn} ${
                  seriesPersonalizadas.length > 0 ? styles.chartModeBtnActive : ''
                }`}
                onClick={() => {
                  if (vistaActiva !== 'evolucion') setVistaActiva('evolucion')
                  setIsEditorSeriesOpen(true)
                }}
              >
                <Sparkles size={13} />
                <span>
                  {seriesPersonalizadas.length > 0
                    ? `Categorías (${seriesPersonalizadas.length})`
                    : 'Elegir Categorías'}
                </span>
              </button>
            </div>
          </div>

          {/* 6. Billetera y Tarjeta lado a lado */}
          <div className={styles.selectsGrid}>
            <div className={styles.panelSection}>
              <label htmlFor="analisis-billetera" className={styles.sectionLabel}>
                Billetera
              </label>
              <select
                id="analisis-billetera"
                className={styles.filterSelect}
                value={billeteraId}
                onChange={(e) => setBilleteraId(e.target.value)}
              >
                <option value="todos">Todas</option>
                {data?.filtros_disponibles.billeteras.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.moneda})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.panelSection}>
              <label htmlFor="analisis-tarjeta" className={styles.sectionLabel}>
                Tarjeta
              </label>
              <select
                id="analisis-tarjeta"
                className={styles.filterSelect}
                value={tarjetaId}
                onChange={(e) => setTarjetaId(e.target.value)}
              >
                <option value="todos">Todas</option>
                {data?.filtros_disponibles.tarjetas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 7. Exportación */}
          <div className={styles.panelExportSection}>
            <div className={styles.exportBtnsGrid}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={() => void handleExportExcel()}
                disabled={exportingExcel || loading}
              >
                <FileSpreadsheet size={14} />
                <span>{exportingExcel ? 'Exportando...' : 'Excel (.xlsx)'}</span>
              </button>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportPdf}
                disabled={!data || loading}
              >
                <Download size={14} />
                <span>Informe PDF</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <EditorSeriesEvolucionModal
        isOpen={isEditorSeriesOpen}
        onClose={() => setIsEditorSeriesOpen(false)}
        categorias={data?.desglose_categorias ?? []}
        monedaVisual={monedaVisual}
        seriesActivas={seriesPersonalizadas}
        onChangeSeries={(nuevasSeries: SerieEvolucionPersonalizada[]) => {
          setSeriesPersonalizadas(nuevasSeries)
          if (vistaActiva !== 'evolucion') {
            setVistaActiva('evolucion')
          }
        }}
      />
    </div>
  )
}
