import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Download,
  Sparkles,
  Check,
  ArrowLeft,
  PieChart,
} from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Button } from '@/components/ui'
import analisisService, {
  type AnalisisResumenResponse,
  type BloqueInformeConfig,
  type ConfiguracionInforme,
  type InformePersonalizadoItem,
  type MonedaModoAnalisis,
  type NaturalezaGastoFiltro,
  type TipoBloqueInforme,
} from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import EvolucionCiclosCard from './EvolucionCiclosCard'
import DesgloseCategoriasCard from './DesgloseCategoriasCard'
import ComparativaCiclosCard from './ComparativaCiclosCard'
import ProyeccionCuotasCard from './ProyeccionCuotasCard'
import { exportarAnalisisPdf } from './exportarAnalisisPdf'
import styles from './MisInformesTab.module.css'

const CATALOGO_BLOQUES: Array<{
  tipo: TipoBloqueInforme
  titulo: string
  descripcion: string
}> = [
  {
    tipo: 'kpis',
    titulo: 'Indicadores Clave (KPIs)',
    descripcion: 'Tarjetas con Gastos, Ingresos, Balance Neto y Tasa de Ahorro del período.',
  },
  {
    tipo: 'evolucion_ciclos',
    titulo: 'Evolución Ciclo a Ciclo',
    descripcion: 'Gráfico combinado de ingresos, gastos, balance y línea de promedio histórico.',
  },
  {
    tipo: 'desglose_categorias',
    titulo: 'Desglose por Categorías y Subcategorías',
    descripcion: 'Distribución porcentual con drill-down hasta los movimientos individuales.',
  },
  {
    tipo: 'comparativa_ciclos',
    titulo: 'Comparador Mano a Mano de Ciclos',
    descripcion: 'Tabla de variaciones y espejo entre dos ciclos para detectar ahorros o desvíos.',
  },
  {
    tipo: 'proyeccion_cuotas',
    titulo: 'Proyección de Tarjetas y Cuotas',
    descripcion: 'Curva futura de cuotas pendientes, suscripciones y mes de mayor alivio.',
  },
]

const PLANTILLAS_RAPIDAS: Array<{
  id: string
  nombre: string
  descripcion: string
  configuracion: ConfiguracionInforme
}> = [
  {
    id: 'tpl-cierre-ciclo',
    nombre: 'Cierre Ejecutivo de Ciclo',
    descripcion:
      'Resumen integral del último semestre con evolución, ranking de categorías y comparativa contra el ciclo anterior.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 6,
      naturaleza: 'todos',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'Indicadores Clave' },
        { id: 'b-evol', tipo: 'evolucion_ciclos', titulo: 'Evolución por Ciclos' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Desglose por Categorías' },
        { id: 'b-comp', tipo: 'comparativa_ciclos', titulo: 'Comparador Ciclo a Ciclo' },
      ],
    },
  },
  {
    id: 'tpl-variables-hormiga',
    nombre: 'Auditoría de Gastos Variables',
    descripcion:
      'Filtra exclusivamente consumos variables de los últimos 3 ciclos para detectar desvíos cotidianos.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 3,
      naturaleza: 'variables',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'KPIs de Gastos Variables' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Categorías Variables' },
        { id: 'b-comp', tipo: 'comparativa_ciclos', titulo: 'Variación vs. Ciclo Anterior' },
      ],
    },
  },
  {
    id: 'tpl-tarjetas-cuotas',
    nombre: ' Compromisos de Tarjetas y Cuotas',
    descripcion:
      'Enfocado en compras financiadas y proyección futura de liberación de límite y flujo mensual.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 6,
      naturaleza: 'cuotas',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'Resumen de Cuotas' },
        { id: 'b-proy', tipo: 'proyeccion_cuotas', titulo: 'Proyección de Cuotas y Suscripciones' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Rubros Financiados' },
      ],
    },
  },
]

export default function MisInformesTab() {
  const [informes, setInformes] = useState<InformePersonalizadoItem[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(true)

  // Vista activa: 'galeria' | 'constructor' | 'visor'
  const [modoVista, setModoVista] = useState<'galeria' | 'constructor' | 'visor'>('galeria')
  const [activeInforme, setActiveInforme] = useState<InformePersonalizadoItem | null>(null)

  // Estado del formulario constructor
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState<string>('Mi Informe Financiero')
  const [formDesc, setFormDesc] = useState<string>('')
  const [formMoneda, setFormMoneda] = useState<MonedaModoAnalisis>('solo_ars')
  const [formCiclos, setFormCiclos] = useState<number>(6)
  const [formNaturaleza, setFormNaturaleza] = useState<NaturalezaGastoFiltro>('todos')
  const [formBloques, setFormBloques] = useState<TipoBloqueInforme[]>([
    'kpis',
    'evolucion_ciclos',
    'desglose_categorias',
  ])
  const [saving, setSaving] = useState<boolean>(false)

  // Datos cargados para el visor del informe activo
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
    setEditingId(null)
    setFormNombre('Informe Personalizado')
    setFormDesc('Análisis a medida de mis ciclos y categorías')
    setFormMoneda('solo_ars')
    setFormCiclos(6)
    setFormNaturaleza('todos')
    setFormBloques(['kpis', 'evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos'])
    setModoVista('constructor')
  }

  const handleEditarInforme = (inf: InformePersonalizadoItem) => {
    setEditingId(inf.id)
    setFormNombre(inf.nombre)
    setFormDesc(inf.descripcion ?? '')
    setFormMoneda(inf.configuracion.moneda_modo ?? 'solo_ars')
    setFormCiclos(inf.configuracion.ciclos ?? 6)
    setFormNaturaleza(inf.configuracion.naturaleza ?? 'todos')
    setFormBloques(
      inf.configuracion.bloques?.map((b) => b.tipo) ?? [
        'kpis',
        'evolucion_ciclos',
        'desglose_categorias',
      ]
    )
    setModoVista('constructor')
  }

  const handleToggleBloque = (tipo: TipoBloqueInforme) => {
    setFormBloques((prev) => {
      if (prev.includes(tipo)) {
        if (prev.length <= 1) return prev
        return prev.filter((t) => t !== tipo)
      }
      return [...prev, tipo]
    })
  }

  const handleGuardarInforme = async () => {
    if (!formNombre.trim()) {
      sileo.error({ title: 'Ingresá un nombre para el informe.' })
      return
    }
    setSaving(true)
    const bloquesConfig: BloqueInformeConfig[] = formBloques.map((t, idx) => {
      const meta = CATALOGO_BLOQUES.find((c) => c.tipo === t)
      return {
        id: `bloque-${idx}-${t}`,
        tipo: t,
        titulo: meta?.titulo ?? t,
      }
    })
    const configuracion: ConfiguracionInforme = {
      moneda_modo: formMoneda,
      ciclos: formCiclos,
      naturaleza: formNaturaleza,
      bloques: bloquesConfig,
    }

    try {
      if (editingId) {
        const actualizado = await analisisService.updateInforme(editingId, {
          nombre: formNombre.trim(),
          descripcion: formDesc.trim() || null,
          configuracion,
        })
        setInformes((prev) => prev.map((item) => (item.id === editingId ? actualizado : item)))
        setActiveInforme(actualizado)
        sileo.success({ title: 'Informe actualizado.' })
      } else {
        const creado = await analisisService.createInforme({
          nombre: formNombre.trim(),
          descripcion: formDesc.trim() || null,
          icono: 'pie-chart',
          configuracion,
        })
        setInformes((prev) => [creado, ...prev])
        setActiveInforme(creado)
        sileo.success({ title: 'Informe guardado en tu cuenta.' })
      }
      setModoVista('visor')
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos guardar el informe.') })
    } finally {
      setSaving(false)
    }
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

  const handleAbrirPlantilla = (tpl: (typeof PLANTILLAS_RAPIDAS)[number]) => {
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

  const handleGuardarCopiaPlantilla = async (tpl: (typeof PLANTILLAS_RAPIDAS)[number]) => {
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
      <section className={styles.builderCard} aria-label="Constructor de informe personalizado">
        <header className={styles.builderHeader}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setModoVista('galeria')}
          >
            <ArrowLeft size={16} />
            <span>Volver a Mis Informes</span>
          </button>

          <h2 className={styles.builderTitle}>
            {editingId ? 'Editar Informe Personalizado' : 'Crear Nuevo Informe por Bloques'}
          </h2>
        </header>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="inf-nombre" className={styles.fieldLabel}>
              Nombre del informe
            </label>
            <input
              id="inf-nombre"
              type="text"
              className={styles.textInput}
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej: Cierre mensual familiar"
              maxLength={120}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="inf-desc" className={styles.fieldLabel}>
              Descripción (opcional)
            </label>
            <input
              id="inf-desc"
              type="text"
              className={styles.textInput}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Ej: Seguimiento de gastos variables y tarjetas"
              maxLength={300}
            />
          </div>
        </div>

        <div className={styles.configRow}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Moneda por defecto</span>
            <SegmentedControl
              options={[
                { value: 'solo_ars', label: 'Solo ARS' },
                { value: 'solo_usd', label: 'Solo USD' },
                { value: 'consolidado_ars', label: 'Todo en ARS' },
                { value: 'consolidado_usd', label: 'Todo en USD' },
              ]}
              value={formMoneda}
              onChange={(v: string) => setFormMoneda(v as MonedaModoAnalisis)}
              ariaLabel="Moneda del informe"
              layout="wrap"
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Ventana de ciclos</span>
            <SegmentedControl
              options={[
                { value: '1', label: 'Ciclo actual' },
                { value: '3', label: '3 ciclos' },
                { value: '6', label: '6 ciclos' },
                { value: '12', label: '12 ciclos' },
              ]}
              value={String(formCiclos)}
              onChange={(v: string) => setFormCiclos(Number(v))}
              ariaLabel="Ventana de ciclos del informe"
              layout="inline"
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Naturaleza de gastos</span>
            <SegmentedControl
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'variables', label: 'Variables' },
                { value: 'fijos', label: 'Fijos y Suscr.' },
                { value: 'cuotas', label: 'Cuotas' },
              ]}
              value={formNaturaleza}
              onChange={(v: string) => setFormNaturaleza(v as NaturalezaGastoFiltro)}
              ariaLabel="Naturaleza de gasto del informe"
              layout="wrap"
            />
          </div>
        </div>

        <div className={styles.blocksPicker}>
          <span className={styles.fieldLabel}>
            Elegí qué bloques analíticos incluir en este informe ({formBloques.length}{' '}
            seleccionados)
          </span>

          <div className={styles.blocksGrid}>
            {CATALOGO_BLOQUES.map((b) => {
              const active = formBloques.includes(b.tipo)
              return (
                <button
                  key={b.tipo}
                  type="button"
                  className={`${styles.blockOption} ${active ? styles.blockOptionActive : ''}`}
                  onClick={() => handleToggleBloque(b.tipo)}
                >
                  <div className={styles.blockCheck}>
                    {active && <Check size={14} />}
                  </div>
                  <div className={styles.blockTexts}>
                    <span className={styles.blockTitle}>{b.titulo}</span>
                    <span className={styles.blockDesc}>{b.descripcion}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <footer className={styles.builderFooter}>
          <Button variant="secondary" onClick={() => setModoVista('galeria')}>
            Cancelar
          </Button>
          <Button onClick={() => void handleGuardarInforme()} disabled={saving}>
            <Check size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar y Abrir Informe'}</span>
          </Button>
        </footer>
      </section>
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
                    {formatMonto(visorData.kpis.ingresos_totales, monedaVis)}
                  </strong>
                </div>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Balance neto</span>
                  <strong className={styles.kpiMiniVal}>
                    {formatMonto(visorData.kpis.balance_neto, monedaVis)}
                  </strong>
                </div>
                <div className={styles.kpiMiniCard}>
                  <span className={styles.kpiMiniLabel}>Tasa de ahorro</span>
                  <strong className={styles.kpiMiniVal}>{visorData.kpis.tasa_ahorro_pct}%</strong>
                </div>
              </section>
            )}

            {tiposActivos.includes('evolucion_ciclos') && visorData && (
              <EvolucionCiclosCard
                serie={visorData.serie_ciclos}
                monedaVisual={monedaVis}
                promedioHistoricoGastos={visorData.kpis.promedio_gasto_ciclo}
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
            <article key={inf.id} className={styles.reportCard}>
              <div className={styles.reportCardTop}>
                <div className={styles.reportIconBox}>
                  <FileSpreadsheet size={18} />
                </div>
                <div className={styles.reportCardActions}>
                  <button
                    type="button"
                    className={styles.iconActionBtn}
                    onClick={() => handleEditarInforme(inf)}
                    aria-label="Editar informe"
                    title="Editar bloques"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconActionBtnDanger}
                    onClick={() => void handleEliminarInforme(inf.id)}
                    aria-label="Eliminar informe"
                    title="Eliminar informe"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 className={styles.reportName}>{inf.nombre}</h3>
              <p className={styles.reportDesc}>
                {inf.descripcion || 'Informe personalizado por bloques'}
              </p>

              <div className={styles.badgesRow}>
                <span className={styles.metaBadge}>
                  {inf.configuracion.ciclos ?? 6} ciclos
                </span>
                <span className={styles.metaBadge}>
                  {(inf.configuracion.moneda_modo ?? 'solo_ars').toUpperCase().replace('_', ' ')}
                </span>
                <span className={styles.metaBadge}>
                  {inf.configuracion.bloques?.length ?? 0} bloques
                </span>
              </div>

              <Button
                onClick={() => {
                  setActiveInforme(inf)
                  setModoVista('visor')
                }}
              >
                Abrir Informe
              </Button>
            </article>
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
            <article key={tpl.id} className={styles.templateCard}>
              <h4 className={styles.reportName}>{tpl.nombre}</h4>
              <p className={styles.reportDesc}>{tpl.descripcion}</p>

              <div className={styles.badgesRow}>
                <span className={styles.metaBadge}>{tpl.configuracion.ciclos} ciclos</span>
                <span className={styles.metaBadge}>
                  {tpl.configuracion.bloques.length} bloques incluidos
                </span>
              </div>

              <div className={styles.templateBtns}>
                <Button variant="secondary" onClick={() => handleAbrirPlantilla(tpl)}>
                  Ver ahora
                </Button>
                <Button onClick={() => void handleGuardarCopiaPlantilla(tpl)}>
                  Guardar en mi cuenta
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

