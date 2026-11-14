import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, SlidersHorizontal, FileSpreadsheet } from '@/components/ui/icons'
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import NumerosPrincipales from './NumerosPrincipales'
import FiltrosAnalisis from './FiltrosAnalisis.tsx'
import DescargarAnalisisModal from './DescargarAnalisisModal'
import EvolucionCiclosCard from './EvolucionCiclosCard'
import DesgloseCategoriasCard from './DesgloseCategoriasCard'
import ComparativaCiclosCard from './ComparativaCiclosCard'
import ProyeccionCuotasCard from './ProyeccionCuotasCard'
import MisInformesTab from './MisInformesTab'
import EditorSeriesEvolucionModal from './EditorSeriesEvolucionModal'
import analisisService, {
  type AnalisisResumenResponse,
  type MonedaModoAnalisis,
  type AnalisisQueryParams,
  type SerieEvolucionPersonalizada,
} from '@/services/analisis.service'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import type { VistaActivaAnalisis } from './filtrosAnalisis'
import styles from './AnalisisPage.module.css'

const OPCIONES_TABS_MOBILE: SegmentedControlOption<'analisis' | 'informes'>[] = [
  { value: 'analisis', label: 'Análisis' },
  { value: 'informes', label: 'Informes' },
]

export default function AnalisisPage() {
  const [vistaActiva, setVistaActiva] = useState<VistaActivaAnalisis>('evolucion')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  )

  // Filtros de datos
  const [monedaModo, setMonedaModo] = useState<MonedaModoAnalisis>('solo_ars')
  const [ciclosCount, setCiclosCount] = useState<number>(6)
  const [billeteraId, setBilleteraId] = useState<string>('todos')
  const [tarjetaId, setTarjetaId] = useState<string>('todos')
  const [categoriaId] = useState<string | undefined>(undefined)

  // Estado de vistas y tarjetas
  const [modoEvolucion, setModoEvolucion] = useState<'combinado' | 'barras' | 'lineas'>('combinado')
  const [seriesPersonalizadas, setSeriesPersonalizadas] = useState<SerieEvolucionPersonalizada[]>([])
  const [modoCategorias, setModoCategorias] = useState<'barras' | 'dona' | 'ranking'>('barras')
  const [modoComparativa, setModoComparativa] = useState<'diferencias' | 'grafico'>('diferencias')
  const [horizonteProyeccion, setHorizonteProyeccion] = useState<'6' | '12'>('6')

  // Modales
  const [descargarModalOpen, setDescargarModalOpen] = useState(false)
  const [editorSeriesOpen, setEditorSeriesOpen] = useState(false)

  // Datos
  const [data, setData] = useState<AnalisisResumenResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const { lastDataUpdate } = useNotificaciones()

  const queryParams = useMemo<AnalisisQueryParams>(
    () => ({
      moneda_modo: monedaModo,
      ciclos: ciclosCount,
      naturaleza: 'todos',
      billetera_id: billeteraId !== 'todos' ? billeteraId : undefined,
      tarjeta_id: tarjetaId !== 'todos' ? tarjetaId : undefined,
      categoria_id: categoriaId,
    }),
    [monedaModo, ciclosCount, billeteraId, tarjetaId, categoriaId]
  )

  const fetchResumen = useCallback(
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
          analisisService.getResumen(queryParams, signal),
          minLoaderDelay,
        ])
        if (!signal?.aborted) {
          setData(res)
        }
      } catch {
        // Silencioso en cancelación
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
    if (
      lastDataUpdate?.entidad === 'transacciones' ||
      lastDataUpdate?.entidad === 'billeteras'
    ) {
      const controller = new AbortController()
      const timer = setTimeout(() => {
        void fetchResumen(controller.signal)
      }, 300)
      return () => {
        clearTimeout(timer)
        controller.abort()
      }
    }
  }, [lastDataUpdate, fetchResumen])

  const monedaVisual = data?.moneda_visual ?? (monedaModo.includes('usd') ? 'USD' : 'ARS')
  const billeteras = data?.filtros_disponibles.billeteras ?? []
  const tarjetas = data?.filtros_disponibles.tarjetas ?? []

  const esInformes = vistaActiva === 'informes'
  const subtituloDesktop = `${data?.periodo_seleccionado.etiqueta ?? 'Cargando...'} · ${data?.kpis.cantidad_operaciones ?? 0} movimientos`
  const rangoMobile = data?.periodo_seleccionado.etiqueta.match(/\(([^)]+)\)/)?.[1]
  const subtituloMobile = `${rangoMobile ?? data?.periodo_seleccionado.etiqueta ?? 'Cargando...'} · ${data?.kpis.cantidad_operaciones ?? 0} movimientos`
  const mostrarSidebar = sidebarOpen && !esInformes

  return (
    <div className={styles.page}>
      {/* 1. Encabezado */}
      <header className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>{esInformes ? 'Mis Informes Personalizados' : 'Análisis'}</h1>
          <p className={styles.subtitle}>
            <span className={styles.subtitleDesktop}>
              {esInformes
                ? 'Reportes a medida exportables a Excel o PDF'
                : subtituloDesktop}
            </span>
            {!esInformes && (
              <span className={styles.subtitleMobile}>
                {subtituloMobile}
              </span>
            )}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btnGhost} ${mostrarSidebar ? styles.btnGhostActive : ''}`}
            onClick={() => {
              if (vistaActiva === 'informes') {
                setVistaActiva('evolucion')
                setSidebarOpen(true)
              } else {
                setSidebarOpen((prev) => !prev)
              }
            }}
            aria-label={mostrarSidebar ? 'Ocultar filtros' : 'Filtros'}
            title={mostrarSidebar ? 'Ocultar filtros' : 'Filtros'}
          >
            <SlidersHorizontal size={16} className={styles.btnIcon} />
            <span className={styles.btnText}>
              {mostrarSidebar ? 'Ocultar filtros' : 'Filtros'}
            </span>
          </button>

          <button
            type="button"
            className={`${styles.btnGhost} ${vistaActiva === 'informes' ? styles.btnGhostActive : ''}`}
            onClick={() => setVistaActiva((prev) => (prev === 'informes' ? 'evolucion' : 'informes'))}
            aria-label="Mis informes"
            title="Mis informes"
          >
            <FileSpreadsheet size={16} className={styles.btnIcon} />
            <span className={styles.btnText}>Mis informes</span>
          </button>

          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => setDescargarModalOpen(true)}
            aria-label="Descargar"
            title="Descargar análisis"
          >
            <Download size={16} className={styles.btnIcon} />
            <span className={styles.btnText}>Descargar</span>
          </button>
        </div>
      </header>

      {/* 2. Grilla con Escenario y Panel Lateral Colapsable */}
      <div
        className={`${styles.layoutGrid} ${
          mostrarSidebar ? styles.layoutGridWithSidebar : styles.layoutGridFull
        }`}
      >
        <main className={styles.stageColumn}>
          {/* Selector de pestañas oficial solo para mobile (idéntico a Transacciones) */}
          <SegmentedControl<'analisis' | 'informes'>
            options={OPCIONES_TABS_MOBILE}
            value={vistaActiva === 'informes' ? 'informes' : 'analisis'}
            onChange={(val) => setVistaActiva(val === 'informes' ? 'informes' : 'evolucion')}
            fullWidth
            ariaLabel="Secciones de análisis"
            className={styles.tabsMobileOnly}
          />

          {/* Números de arriba (solo en Evolución y Categorías cuando no está en informes) */}
          {vistaActiva !== 'informes' && (vistaActiva === 'evolucion' || vistaActiva === 'categorias') && (
            <NumerosPrincipales
              data={data}
              loading={loading}
              monedaVisual={monedaVisual}
              hayFiltroCategoriaOTarjeta={Boolean(
                categoriaId || (tarjetaId && tarjetaId !== 'todos')
              )}
            />
          )}

          {/* Barra de Controles Mobile (Filtros + Descargar, como en Transacciones) */}
          {vistaActiva !== 'informes' && (
            <div className={styles.mobileControlsBar}>
              <div className={styles.mobileLeftActions}>
                <button
                  type="button"
                  className={styles.mobileFilterBtn}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir filtros"
                >
                  <SlidersHorizontal size={15} />
                  <span>Filtros</span>
                </button>
              </div>
              <button
                type="button"
                className={styles.mobileActionBtn}
                onClick={() => setDescargarModalOpen(true)}
                aria-label="Descargar análisis"
                title="Descargar"
              >
                <Download size={16} />
              </button>
            </div>
          )}

          {/* Tarjeta de visualización activa */}
          <div className={styles.cardSection}>
            {vistaActiva === 'evolucion' && (
              <EvolucionCiclosCard
                serie={data?.serie_ciclos ?? []}
                monedaVisual={monedaVisual}
                promedioHistoricoGastos={data?.kpis.promedio_gasto_ciclo ?? null}
                modoGrafico={modoEvolucion}
                onModoGraficoChange={setModoEvolucion}
                seriesPersonalizadas={seriesPersonalizadas}
                loading={loading}
                onOpenEditorSeries={() => setEditorSeriesOpen(true)}
                onResetSeries={() => setSeriesPersonalizadas([])}
                ocultarControlesHeader={mostrarSidebar}
                collapsible={false}
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
                loading={loading}
                collapsible={false}
              />
            )}

            {vistaActiva === 'comparativa' && (
              <ComparativaCiclosCard
                queryParams={queryParams}
                monedaVisual={monedaVisual}
                vistaModoExterno={modoComparativa}
                onVistaModoChange={setModoComparativa}
                collapsible={false}
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
                collapsible={false}
              />
            )}

            {vistaActiva === 'informes' && <MisInformesTab />}
          </div>
        </main>

        {/* 3. Panel Lateral de Filtros */}
        <FiltrosAnalisis
          vista={vistaActiva}
          onVistaChange={setVistaActiva}
          ciclos={ciclosCount}
          onCiclosChange={setCiclosCount}
          monedaModo={monedaModo}
          onMonedaModoChange={setMonedaModo}
          billeteraId={billeteraId}
          onBilleteraIdChange={setBilleteraId}
          tarjetaId={tarjetaId}
          onTarjetaIdChange={setTarjetaId}
          billeteras={billeteras}
          tarjetas={tarjetas}
          avisoCotizacion={data?.aviso_cotizacion}
          textoCotizacionRef={data?.cotizacion_referencia?.texto}
          isOpen={mostrarSidebar}
          onClose={() => setSidebarOpen(false)}
          modoEvolucion={modoEvolucion}
          onModoEvolucionChange={setModoEvolucion}
          onOpenEditorSeries={() => setEditorSeriesOpen(true)}
          esModoPersonalizado={seriesPersonalizadas.length > 0}
          onResetSeries={() => setSeriesPersonalizadas([])}
        />
      </div>

      {/* Modales */}
      <DescargarAnalisisModal
        isOpen={descargarModalOpen}
        onClose={() => setDescargarModalOpen(false)}
        queryParams={queryParams}
        data={data}
      />

      <EditorSeriesEvolucionModal
        isOpen={editorSeriesOpen}
        onClose={() => setEditorSeriesOpen(false)}
        categorias={data?.desglose_categorias ?? []}
        monedaVisual={monedaVisual}
        seriesActivas={seriesPersonalizadas}
        onChangeSeries={setSeriesPersonalizadas}
      />
    </div>
  )
}
