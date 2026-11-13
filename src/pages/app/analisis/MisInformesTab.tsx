import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Download,
  Sparkles,
  ArrowLeft,
  PieChart,
} from '@/components/ui/icons'
import { Button } from '@/components/ui'
import analisisService, {
  type AnalisisResumenResponse,
  type InformePersonalizadoItem,
} from '@/services/analisis.service'
import {
  PLANTILLAS_RAPIDAS,
  type PlantillaRapidaItem,
} from './plantillasInforme'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import EvolucionCiclosCard from './EvolucionCiclosCard'
import DesgloseCategoriasCard from './DesgloseCategoriasCard'
import ComparativaCiclosCard from './ComparativaCiclosCard'
import ProyeccionCuotasCard from './ProyeccionCuotasCard'
import { exportarAnalisisPdf } from './exportarAnalisisPdf'
import InformeEditor from './InformeEditor'
import InformeTarjeta, { PlantillaTarjeta } from './InformeTarjeta'
import styles from './MisInformesTab.module.css'

export default function MisInformesTab() {
  const [informes, setInformes] = useState<InformePersonalizadoItem[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(true)
  const [modoVista, setModoVista] = useState<'galeria' | 'constructor' | 'visor'>('galeria')
  const [activeInforme, setActiveInforme] = useState<InformePersonalizadoItem | null>(null)
  const [visorData, setVisorData] = useState<AnalisisResumenResponse | null>(null)
  const [loadingVisor, setLoadingVisor] = useState<boolean>(false)
  const [exportingExcel, setExportingExcel] = useState<boolean>(false)

  const fetchInformes = useCallback(async (signal?: AbortSignal) => {
    setLoadingList(true)
    try {
      const items = await analisisService.getInformes(signal)
      if (!signal?.aborted) {
        setInformes(items)
      }
    } catch {
      // Silencioso en carga inicial
    } finally {
      if (!signal?.aborted) {
        setLoadingList(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchInformes(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchInformes])

  const visorQueryParams = useMemo(() => {
    if (!activeInforme) return null
    const cfg = activeInforme.configuracion
    return {
      moneda_modo: cfg.moneda_modo ?? 'solo_ars',
      ciclos: cfg.ciclos ?? 6,
      naturaleza: cfg.naturaleza ?? 'todos',
      billetera_id: cfg.billetera_id,
      tarjeta_id: cfg.tarjeta_id,
    }
  }, [activeInforme])

  useEffect(() => {
    if (modoVista !== 'visor' || !visorQueryParams) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoadingVisor(true)
      analisisService
        .getResumen(visorQueryParams, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            setVisorData(res)
          }
        })
        .catch(() => {
          // Silencioso
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingVisor(false)
          }
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [modoVista, visorQueryParams])

  const handleIniciarNuevo = () => {
    setActiveInforme(null)
    setModoVista('constructor')
  }

  const handleEditarInforme = (inf: InformePersonalizadoItem) => {
    setActiveInforme(inf)
    setModoVista('constructor')
  }

  const handleEliminarInforme = async (id: string) => {
    try {
      await analisisService.deleteInforme(id)
      setInformes((prev) => prev.filter((i) => i.id !== id))
      sileo.success({ title: 'Informe eliminado.' })
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo eliminar el informe.') })
    }
  }

  const handleAbrirPlantilla = (tpl: PlantillaRapidaItem) => {
    const virtualInforme: InformePersonalizadoItem = {
      id: tpl.id,
      nombre: tpl.nombre,
      descripcion: tpl.descripcion,
      icono: 'sparkles',
      es_favorito: false,
      configuracion: tpl.configuracion,
      fecha_creacion: null,
      fecha_actualizacion: null,
    }
    setActiveInforme(virtualInforme)
    setModoVista('visor')
  }

  const handleGuardarCopiaPlantilla = async (tpl: PlantillaRapidaItem) => {
    try {
      const creado = await analisisService.createInforme({
        nombre: tpl.nombre.trim(),
        descripcion: tpl.descripcion,
        icono: 'pie-chart',
        configuracion: tpl.configuracion,
      })
      setInformes((prev) => [creado, ...prev])
      setActiveInforme(creado)
      setModoVista('visor')
      sileo.success({ title: 'Plantilla guardada en Mis Informes.' })
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo guardar la plantilla.') })
    }
  }

  const handleDescargarExcel = async () => {
    if (!visorQueryParams || !activeInforme) return
    setExportingExcel(true)
    try {
      const blob = await analisisService.exportarExcel({
        ...visorQueryParams,
        titulo: activeInforme.nombre,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const slug = activeInforme.nombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
      a.download = `${slug || 'informe_argentum'}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      sileo.success({ title: 'Excel descargado.' })
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'Error al exportar a Excel.') })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleDescargarPdf = () => {
    if (!visorData || !activeInforme) return
    exportarAnalisisPdf(visorData, activeInforme.nombre)
    sileo.success({ title: 'PDF generado.' })
  }

  if (modoVista === 'constructor') {
    return (
      <InformeEditor
        initialInforme={activeInforme}
        onCancelar={() => setModoVista('galeria')}
        onGuardarExito={(guardado) => {
          setInformes((prev) => {
            const idx = prev.findIndex((i) => i.id === guardado.id)
            if (idx >= 0) {
              const copy = [...prev]
              copy[idx] = guardado
              return copy
            }
            return [guardado, ...prev]
          })
          setActiveInforme(guardado)
          setModoVista('visor')
        }}
      />
    )
  }

  if (modoVista === 'visor' && activeInforme && visorQueryParams) {
    const monedaVis = visorData?.moneda_visual ?? (visorQueryParams.moneda_modo.includes('usd') ? 'USD' : 'ARS')
    const tiposActivos = activeInforme.configuracion.bloques.map((b) => b.tipo)

    return (
      <div className={styles.viewerWrap}>
        <header className={styles.viewerHeader}>
          <div className={styles.viewerTitleGroup}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setModoVista('galeria')}
            >
              <ArrowLeft size={16} />
              <span>Mis Informes</span>
            </button>
            <div>
              <h2 className={styles.viewerTitle}>{activeInforme.nombre}</h2>
              {activeInforme.descripcion && (
                <p className={styles.viewerSub}>{activeInforme.descripcion}</p>
              )}
            </div>
          </div>

          <div className={styles.exportActions}>
            <Button
              variant="secondary"
              onClick={() => void handleDescargarExcel()}
              disabled={exportingExcel || loadingVisor}
            >
              <FileSpreadsheet size={15} />
              <span>{exportingExcel ? 'Generando...' : 'Exportar Excel (.xlsx)'}</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleDescargarPdf}
              disabled={!visorData || loadingVisor}
            >
              <Download size={15} />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </header>

        {loadingVisor && !visorData ? (
          <div className={styles.loadingCard}>Cargando bloques del informe...</div>
        ) : (
          <div className={styles.viewerBlocks}>
            {tiposActivos.includes('kpis') && visorData && (
              <section className={styles.kpiMiniGrid}>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Gastos del período</span>
                  <strong className={styles.kpiMiniVal}>
                    {formatMonto(visorData.kpis.gastos_totales, monedaVis)}
                  </strong>
                </div>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Ingresos del período</span>
                  <strong className={styles.kpiMiniVal}>
                    {visorData.kpis.ingresos_totales !== null && visorData.kpis.ingresos_totales !== undefined
                      ? formatMonto(visorData.kpis.ingresos_totales, monedaVis)
                      : '—'}
                  </strong>
                </div>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Te quedó</span>
                  <strong className={styles.kpiMiniVal}>
                    {visorData.kpis.balance_neto !== null && visorData.kpis.balance_neto !== undefined
                      ? formatMonto(visorData.kpis.balance_neto, monedaVis)
                      : '—'}
                  </strong>
                </div>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Te quedó (%)</span>
                  <strong className={styles.kpiMiniVal}>
                    {visorData.kpis.tasa_ahorro_pct !== null && visorData.kpis.tasa_ahorro_pct !== undefined
                      ? `${visorData.kpis.tasa_ahorro_pct}%`
                      : '—'}
                  </strong>
                </div>
              </section>
            )}

            {tiposActivos.includes('evolucion_ciclos') && visorData && (
              <EvolucionCiclosCard
                serie={visorData.serie_ciclos}
                monedaVisual={monedaVis}
                promedioHistoricoGastos={visorData.kpis.promedio_gasto_ciclo ?? null}
              />
            )}

            {tiposActivos.includes('desglose_categorias') && visorData && (
              <DesgloseCategoriasCard
                categorias={visorData.desglose_categorias}
                monedaVisual={monedaVis}
                gastoTotal={visorData.kpis.gastos_totales}
                queryParams={visorQueryParams}
              />
            )}

            {tiposActivos.includes('comparativa_ciclos') && (
              <ComparativaCiclosCard
                queryParams={visorQueryParams}
                monedaVisual={monedaVis}
              />
            )}

            {tiposActivos.includes('proyeccion_cuotas') && (
              <ProyeccionCuotasCard
                monedaModo={visorQueryParams.moneda_modo}
                monedaVisual={monedaVis}
                billeteraId={visorQueryParams.billetera_id}
                tarjetaId={visorQueryParams.tarjeta_id}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.galleryContainer}>
      {/* Cabecera de Mis Informes */}
      <div className={styles.sectionTopBar}>
        <div>
          <h2 className={styles.sectionHeading}>Mis Informes Personalizados</h2>
          <p className={styles.sectionSub}>
            Armá reportes a medida combinando bloques y exportalos a Excel o PDF cuando quieras
          </p>
        </div>

        <Button onClick={handleIniciarNuevo}>
          <Plus size={16} />
          <span>Nuevo Informe</span>
        </Button>
      </div>

      {/* Lista de informes guardados por el usuario */}
      {loadingList ? (
        <div className={styles.loadingCard}>Cargando tus informes...</div>
      ) : informes.length === 0 ? (
        <div className={styles.emptySavedCard}>
          <div className={styles.emptyIconCircle}>
            <PieChart size={24} />
          </div>
          <div className={styles.emptySavedTexts}>
            <h3 className={styles.emptySavedTitle}>Todavía no guardaste informes propios</h3>
            <p className={styles.emptySavedDesc}>
              Podés crear uno desde cero eligiendo tus bloques o guardar cualquiera de las
              plantillas recomendadas de abajo en un clic.
            </p>
          </div>
          <Button onClick={handleIniciarNuevo}>
            <Plus size={16} />
            <span>Crear mi primer informe</span>
          </Button>
        </div>
      ) : (
        <div className={styles.reportsGrid}>
          {informes.map((inf) => (
            <InformeTarjeta
              key={inf.id}
              informe={inf}
              onEditar={handleEditarInforme}
              onEliminar={(id) => void handleEliminarInforme(id)}
              onAbrir={(inf) => {
                setActiveInforme(inf)
                setModoVista('visor')
              }}
            />
          ))}
        </div>
      )}

      {/* Plantillas Rápidas en 1 clic */}
      <div className={styles.templatesSection}>
        <div className={styles.templatesHeader}>
          <Sparkles size={16} />
          <h3 className={styles.templatesTitle}>Plantillas listas en 1 clic</h3>
        </div>

        <div className={styles.reportsGrid}>
          {PLANTILLAS_RAPIDAS.map((tpl) => (
            <PlantillaTarjeta
              key={tpl.id}
              plantilla={tpl}
              onVerAhora={handleAbrirPlantilla}
              onGuardarCopia={(t) => void handleGuardarCopiaPlantilla(t)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
