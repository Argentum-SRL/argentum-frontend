import { useState, useEffect } from 'react'
import {
  ArrowLeft, Check, LayoutDashboard, TrendingUp, ChartPie, Transfer, CreditCard, type LucideIcon,
} from '@/components/ui/icons'
import { Button, SelectInput } from '@/components/ui'
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import analisisService, {
  type BloqueInformeConfig, type ConfiguracionInforme, type InformePersonalizadoItem,
  type MonedaModoAnalisis, type NaturalezaGastoFiltro, type TipoBloqueInforme,
} from '@/services/analisis.service'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './MisInformesTab.module.css'

export { type TipoBloqueInforme }

export interface BloqueCatalogoItem {
  tipo: TipoBloqueInforme
  titulo: string
  descripcion: string
  icon: LucideIcon
}

const CATALOGO_BLOQUES: BloqueCatalogoItem[] = [
  { tipo: 'kpis', titulo: 'Números principales', descripcion: 'Balance, ingresos y egresos consolidados', icon: LayoutDashboard },
  { tipo: 'evolucion_ciclos', titulo: 'Evolución Ciclo a Ciclo', descripcion: 'Histórico ciclo a ciclo comparativo', icon: TrendingUp },
  { tipo: 'desglose_categorias', titulo: 'Desglose por Categorías', descripcion: 'Distribución por rubros y categorías', icon: ChartPie },
  { tipo: 'comparativa_ciclos', titulo: 'Comparar dos ciclos', descripcion: 'Variaciones rubro por rubro', icon: Transfer },
  { tipo: 'proyeccion_cuotas', titulo: 'Proyección de Tarjetas y Cuotas', descripcion: 'Compromisos futuros y vencimientos', icon: CreditCard },
]

const OPCIONES_MONEDA: Array<{ value: MonedaModoAnalisis; label: string }> = [
  { value: 'solo_ars', label: 'Pesos' },
  { value: 'solo_usd', label: 'Dólares' },
  { value: 'consolidado_ars', label: 'Todo en pesos' },
  { value: 'consolidado_usd', label: 'Todo en dólares' },
]

const OPCIONES_CICLOS_DESKTOP: SegmentedControlOption<string>[] = [
  { value: '1', label: 'Ciclo actual' },
  { value: '3', label: '3 ciclos' },
  { value: '6', label: '6 ciclos' },
  { value: '12', label: '12 ciclos' },
]

const OPCIONES_CICLOS_MOBILE: SegmentedControlOption<string>[] = [
  { value: '1', label: 'Actual' },
  { value: '3', label: '3C' },
  { value: '6', label: '6C' },
  { value: '12', label: '12C' },
]

const OPCIONES_NATURALEZA: Array<{ value: NaturalezaGastoFiltro; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'variables', label: 'Día a día' },
  { value: 'fijos', label: 'Fijos' },
  { value: 'cuotas', label: 'Cuotas' },
]

interface InformeEditorProps {
  initialInforme?: InformePersonalizadoItem | null
  onCancelar: () => void
  onGuardarExito: (guardado: InformePersonalizadoItem) => void
}

export default function InformeEditor({
  initialInforme,
  onCancelar,
  onGuardarExito,
}: InformeEditorProps) {
  const editingId = initialInforme?.id ?? null
  const cfg = initialInforme?.configuracion

  const [formNombre, setFormNombre] = useState<string>(initialInforme?.nombre ?? 'Informe Personalizado')
  const [formDesc, setFormDesc] = useState<string>(initialInforme?.descripcion ?? '')
  const [formMoneda, setFormMoneda] = useState<MonedaModoAnalisis>(cfg?.moneda_modo ?? 'solo_ars')
  const [formCiclos, setFormCiclos] = useState<number>(cfg?.ciclos ?? 6)
  const [formNaturaleza, setFormNaturaleza] = useState<NaturalezaGastoFiltro>(cfg?.naturaleza ?? 'todos')
  const [formBloques, setFormBloques] = useState<TipoBloqueInforme[]>(
    cfg?.bloques?.map((b) => b.tipo) ?? ['kpis', 'evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos']
  )
  const [saving, setSaving] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth <= 767
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleToggleBloque = (tipo: TipoBloqueInforme) => {
    setFormBloques((prev) => {
      if (prev.includes(tipo)) {
        if (prev.length <= 1) {
          sileo.info({ title: 'El informe debe incluir al menos 1 bloque.' })
          return prev
        }
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
    if (formBloques.length === 0) {
      sileo.error({ title: 'Seleccioná al menos un bloque para el informe.' })
      return
    }
    setSaving(true)
    const bloquesConfig: BloqueInformeConfig[] = formBloques.map((t, idx) => {
      const meta = CATALOGO_BLOQUES.find((c) => c.tipo === t)
      return { id: `bloque-${idx}-${t}`, tipo: t, titulo: meta?.titulo ?? t }
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
        sileo.success({ title: 'Informe actualizado.' })
        onGuardarExito(actualizado)
      } else {
        const creado = await analisisService.createInforme({
          nombre: formNombre.trim(),
          descripcion: formDesc.trim() || null,
          icono: 'pie-chart',
          configuracion,
        })
        sileo.success({ title: 'Informe guardado en tu cuenta.' })
        onGuardarExito(creado)
      }
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos guardar el informe.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.builderCard} aria-label="Constructor de informe personalizado">
      <header className={styles.builderHeader}>
        <div className={styles.builderHeaderLeft}>
          <button type="button" className={styles.backBtn} onClick={onCancelar} aria-label="Volver a Mis Informes">
            <ArrowLeft size={15} />
            <span>{isMobile ? 'Volver' : 'Volver a Mis Informes'}</span>
          </button>
          <div className={styles.titleWithBadge}>
            <h2 className={styles.builderTitle}>
              {editingId ? 'Editar Informe' : 'Crear Informe'}
            </h2>
            {!isMobile && (
              <span className={styles.statusBadge}>
                {formBloques.length} {formBloques.length === 1 ? 'bloque' : 'bloques'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.builderHeaderActions}>
          {!isMobile && (
            <Button variant="secondary" className={styles.headerBtnSecondary} onClick={onCancelar} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button className={styles.headerBtnPrimary} onClick={() => void handleGuardarInforme()} disabled={saving} loading={saving}>
            <Check size={15} />
            <span>{isMobile ? 'Guardar' : 'Guardar y Abrir'}</span>
          </Button>
        </div>
      </header>

      <div className={styles.builderLayout}>
        <div className={styles.builderParamsCol}>
          <div className={styles.sectionPanel}>
            <h3 className={styles.sectionHeaderTitle}>Detalles del informe</h3>
            <div className={styles.compactInputsRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="inf-nombre" className={styles.fieldLabel}>Nombre</label>
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
                  Descripción <span className={styles.labelSub}>(opcional)</span>
                </label>
                <input
                  id="inf-desc"
                  type="text"
                  className={styles.textInput}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ej: Seguimiento de gastos y tarjetas"
                  maxLength={300}
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionPanel}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTexts}>
                <h3 className={styles.sectionHeaderTitle}>Filtros iniciales</h3>
                <span className={styles.sectionHint}>Se aplican al abrir este informe</span>
              </div>
            </div>

            <div className={styles.filterControlsList}>
              {isMobile ? (
                <>
                  <div className={styles.mobileFilterRow}>
                    <SelectInput
                      id="inf-moneda-select"
                      label="Moneda"
                      size="sm"
                      value={formMoneda}
                      onChange={(v) => setFormMoneda(v as MonedaModoAnalisis)}
                      options={OPCIONES_MONEDA}
                    />

                    <SelectInput
                      id="inf-naturaleza-select"
                      label="Tipo de gasto"
                      size="sm"
                      value={formNaturaleza}
                      onChange={(v) => setFormNaturaleza(v as NaturalezaGastoFiltro)}
                      options={OPCIONES_NATURALEZA}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Período a mostrar</span>
                    <SegmentedControl
                      options={OPCIONES_CICLOS_MOBILE}
                      value={String(formCiclos)}
                      onChange={(v: string) => setFormCiclos(Number(v))}
                      ariaLabel="Período a mostrar"
                      fullWidth
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Moneda por defecto</span>
                    <SegmentedControl
                      options={OPCIONES_MONEDA}
                      value={formMoneda}
                      onChange={(v: string) => setFormMoneda(v as MonedaModoAnalisis)}
                      ariaLabel="Moneda del informe"
                      fullWidth
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Período a mostrar</span>
                    <SegmentedControl
                      options={OPCIONES_CICLOS_DESKTOP}
                      value={String(formCiclos)}
                      onChange={(v: string) => setFormCiclos(Number(v))}
                      ariaLabel="Cuántos ciclos ver en el informe"
                      fullWidth
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Tipo de gasto</span>
                    <SegmentedControl
                      options={OPCIONES_NATURALEZA}
                      value={formNaturaleza}
                      onChange={(v: string) => setFormNaturaleza(v as NaturalezaGastoFiltro)}
                      ariaLabel="Tipo de gasto del informe"
                      fullWidth
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.builderBlocksCol}>
          <div className={styles.sectionPanel}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTexts}>
                <h3 className={styles.sectionHeaderTitle}>Módulos incluidos</h3>
                <span className={styles.sectionHint}>Elegí qué bloques querés que aparezcan en tu informe</span>
              </div>
              <span className={styles.blocksCounterBadge}>
                {formBloques.length} de {CATALOGO_BLOQUES.length}
              </span>
            </div>

            <div className={styles.blocksList}>
              {CATALOGO_BLOQUES.map((b) => {
                const active = formBloques.includes(b.tipo)
                const Icon = b.icon
                return (
                  <button
                    key={b.tipo}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    className={`${styles.blockRow} ${active ? styles.blockRowActive : ''}`}
                    onClick={() => handleToggleBloque(b.tipo)}
                  >
                    <div className={`${styles.blockIconWrap} ${active ? styles.blockIconActive : ''}`}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.blockTexts}>
                      <span className={styles.blockTitle}>{b.titulo}</span>
                      <span className={styles.blockDesc}>{b.descripcion}</span>
                    </div>
                    <div className={`${styles.blockCheckCircle} ${active ? styles.blockCheckActive : ''}`}>
                      {active && <Check size={12} strokeWidth={2.5} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
