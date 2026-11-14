import { useState, useEffect } from 'react'
import {
  TrendingUp, SlidersHorizontal, PieChart, ArrowLeftRight,
  Calendar, X, Sparkles,
} from '@/components/ui/icons'
import { SelectInput, type SelectOption } from '@/components/ui'
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import Modal from '@/components/ui/Modal/Modal'
import type { MonedaModoAnalisis } from '@/services/analisis.service'
import { filtrosVisibles, etiquetaBilletera, type VistaActivaAnalisis } from './filtrosAnalisis'
import styles from './FiltrosAnalisis.module.css'

export interface FiltrosAnalisisProps {
  vista: VistaActivaAnalisis
  onVistaChange: (v: VistaActivaAnalisis) => void
  ciclos: number
  onCiclosChange: (c: number) => void
  monedaModo: MonedaModoAnalisis
  onMonedaModoChange: (m: MonedaModoAnalisis) => void
  billeteraId: string
  onBilleteraIdChange: (b: string) => void
  tarjetaId: string
  onTarjetaIdChange: (t: string) => void
  billeteras: Array<{ id: string; nombre: string; moneda?: string }>
  tarjetas: Array<{ id: string; nombre: string }>
  avisoCotizacion?: string | null
  textoCotizacionRef?: string | null
  isOpen: boolean
  onClose: () => void
  modoEvolucion?: 'combinado' | 'barras' | 'lineas'
  onModoEvolucionChange?: (m: 'combinado' | 'barras' | 'lineas') => void
  onOpenEditorSeries?: () => void
  esModoPersonalizado?: boolean
  onResetSeries?: () => void
}

const OPCIONES_PERIODO: SegmentedControlOption<string>[] = [
  { value: '1', label: 'Actual' },
  { value: '3', label: '3C' },
  { value: '6', label: '6C' },
  { value: '12', label: '12C' },
]

const OPCIONES_MONEDA: SelectOption[] = [
  { value: 'solo_ars', label: 'Pesos' },
  { value: 'solo_usd', label: 'Dólares' },
  { value: 'consolidado_ars', label: 'Todo pasado a pesos' },
  { value: 'consolidado_usd', label: 'Todo pasado a dólares' },
]

const VISTAS_BOTONES: Array<{ id: VistaActivaAnalisis; label: string; icon: typeof TrendingUp }> = [
  { id: 'evolucion', label: 'Evolución', icon: TrendingUp },
  { id: 'categorias', label: 'Categorías', icon: PieChart },
  { id: 'comparativa', label: 'Comparar', icon: ArrowLeftRight },
  { id: 'proyeccion', label: 'Proyección', icon: Calendar },
]

export default function FiltrosAnalisis({
  vista, onVistaChange, ciclos, onCiclosChange,
  monedaModo, onMonedaModoChange, billeteraId, onBilleteraIdChange,
  tarjetaId, onTarjetaIdChange, billeteras, tarjetas,
  avisoCotizacion, textoCotizacionRef,
  isOpen, onClose,
  modoEvolucion, onModoEvolucionChange,
  onOpenEditorSeries, esModoPersonalizado = false, onResetSeries,
}: FiltrosAnalisisProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 767
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const visibles = filtrosVisibles(vista)
  const billeteraOptions: SelectOption[] = [
    { value: 'todos', label: 'Todas las billeteras' },
    ...billeteras.map((b) => ({ value: b.id, label: etiquetaBilletera(b) })),
  ]
  const tarjetaOptions: SelectOption[] = [
    { value: 'todos', label: 'Todas las tarjetas' },
    ...tarjetas.map((t) => ({ value: t.id, label: t.nombre })),
  ]
  const esConsolidado = monedaModo === 'consolidado_ars' || monedaModo === 'consolidado_usd'
  const textoCotiz = avisoCotizacion || textoCotizacionRef

  const hasActiveFilters =
    monedaModo !== 'solo_ars' ||
    ciclos !== 6 ||
    billeteraId !== 'todos' ||
    tarjetaId !== 'todos'

  const handleClear = () => {
    onMonedaModoChange('solo_ars')
    onCiclosChange(6)
    onBilleteraIdChange('todos')
    onTarjetaIdChange('todos')
  }

  const renderFilterBlocks = () => (
    <>
      <div className={styles.sideBlock}>
        <span className={styles.sideBlockTitle}>Gráfico en pantalla</span>
        <div className={styles.tilesMatrix}>
          {VISTAS_BOTONES.map((v) => {
            const IconComponent = v.icon
            return (
              <button
                key={v.id}
                type="button"
                className={`${styles.viewTileBtn} ${vista === v.id ? styles.viewTileBtnActive : ''}`}
                onClick={() => onVistaChange(v.id)}
              >
                <IconComponent size={14} />
                <span>{v.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {vista === 'evolucion' && onModoEvolucionChange && (
        <div className={styles.sideBlock}>
          <span className={styles.sideBlockTitle}>Tipo de visualización</span>
          <SegmentedControl<'combinado' | 'barras' | 'lineas'>
            options={[
              { value: 'combinado', label: 'Combinado' },
              { value: 'barras', label: 'Barras' },
              { value: 'lineas', label: 'Líneas' },
            ]}
            value={modoEvolucion ?? 'combinado'}
            onChange={onModoEvolucionChange}
            ariaLabel="Tipo de gráfico de evolución"
            fullWidth
          />
          {onOpenEditorSeries && (
            <button
              type="button"
              className={styles.sidebarSeriesBtn}
              onClick={onOpenEditorSeries}
            >
              <Sparkles size={14} />
              <span>{esModoPersonalizado ? 'Editar series' : 'Elegir categorías'}</span>
            </button>
          )}
          {esModoPersonalizado && onResetSeries && (
            <button
              type="button"
              className={styles.sidebarResetSeriesBtn}
              onClick={onResetSeries}
            >
              Ver general
            </button>
          )}
        </div>
      )}

      {visibles.includes('periodo') && (
        <div className={styles.sideBlock}>
          <span className={styles.sideBlockTitle}>Período</span>
          <SegmentedControl<string>
            options={OPCIONES_PERIODO}
            value={String(ciclos)}
            onChange={(val) => onCiclosChange(Number(val))}
            ariaLabel="Cantidad de ciclos"
            fullWidth
          />
        </div>
      )}

      {visibles.includes('moneda') && (
        <div className={styles.sideBlock}>
          <SelectInput
            label="Moneda"
            size="sm"
            value={monedaModo}
            onChange={(val) => onMonedaModoChange(val as MonedaModoAnalisis)}
            options={OPCIONES_MONEDA}
          />
          {esConsolidado && textoCotiz && <p className={styles.noticeText}>{textoCotiz}</p>}
        </div>
      )}

      {(visibles.includes('billetera') || visibles.includes('tarjeta')) && (
        <div className={styles.filterInputsRow}>
          {visibles.includes('billetera') && (
            <SelectInput
              label="Billetera / Cuenta"
              size="sm"
              value={billeteraId}
              onChange={onBilleteraIdChange}
              options={billeteraOptions}
            />
          )}
          {visibles.includes('tarjeta') && (
            <SelectInput
              label="Tarjeta"
              size="sm"
              value={tarjetaId}
              onChange={onTarjetaIdChange}
              options={tarjetaOptions}
            />
          )}
        </div>
      )}
    </>
  )

  // En mobile: se despliega como Modal sheet (idéntico a Transacciones)
  if (isMobile) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Filtros"
        variant="sheet"
      >
        <div className={styles.mobileDrawerContainer} data-modal-block>
          <div className={styles.mobileDrawerBody}>
            {renderFilterBlocks()}
          </div>
          <div className={styles.drawerActionsRowMobile}>
            <button
              type="button"
              className={`${styles.clearBtnMobileNew} ${!hasActiveFilters ? styles.clearBtnDisabled : ''}`}
              onClick={handleClear}
              disabled={!hasActiveFilters}
            >
              Limpiar
            </button>
            <button
              type="button"
              className={styles.applyBtnMobileNew}
              onClick={onClose}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  // En desktop: panel lateral dockeado
  if (!isOpen) {
    return null
  }

  return (
    <aside className={styles.sideMenuCard}>
      <div className={styles.sideMenuHeader}>
        <div className={styles.sideMenuTitleGroup}>
          <SlidersHorizontal size={15} className={styles.sideMenuIcon} />
          <span className={styles.sideMenuTitle}>Filtros</span>
        </div>
        <button
          type="button"
          className={styles.sideMenuCloseBtn}
          onClick={onClose}
          title="Cerrar"
          aria-label="Cerrar panel"
        >
          <X size={18} />
        </button>
      </div>
      {renderFilterBlocks()}
      {hasActiveFilters && (
        <button
          type="button"
          className={styles.desktopClearBtn}
          onClick={handleClear}
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  )
}
export { FiltrosAnalisis }
