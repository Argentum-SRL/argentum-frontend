import { useState } from 'react'
import {
  CheckCircle2,
  Edit3,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Banknote,
  AlertTriangle,
  Sparkles,
  X,
  Search,
  Home,
  PieChart,
  Target,
  Layers,
  Check,
} from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { LunarLoader } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import SelectableSurface from '@/components/ui/SelectableSurface/SelectableSurface'
import DebitoAutomaticoBadge from '@/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import TransaccionRow from '@/components/transacciones/TransaccionRow'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import type { Billetera, Transaccion } from '@/types'
import styles from './InteractiveDemos.module.css'

export interface DemoProps {
  selectedId?: string | null
  onSelect?: (id: string, name: string) => void
}

// ─── Fixtures Seguros para Renderizado In-Vivo ─────────────────────────────
const MOCK_BILLETERA: Billetera = {
  id: 'billetera-galicia-demo',
  nombre: 'Banco Galicia',
  moneda: 'ARS',
  saldo_actual: 485200,
  saldo_inicial: 100000,
  es_principal: true,
  es_efectivo: false,
  estado: 'activa',
  fecha_creacion: '2026-01-01T00:00:00Z',
  tiene_transacciones: true,
  bank_id: 'galicia',
}

const MOCK_TRANSACCION: Transaccion = {
  id: 'tx-supermercado-demo',
  tipo: 'egreso',
  monto: 24500,
  moneda: 'ARS',
  fecha: '2026-10-10T14:30:00Z',
  descripcion: 'Supermercado Coto',
  categoria_id: 'cat-supermercado',
  subcategoria_id: null,
  metodo_pago: 'debito',
  billetera_id: 'billetera-galicia-demo',
  tarjeta_id: null,
  es_cuota_hija: false,
  es_padre_cuotas: false,
  grupo_cuotas_id: null,
  origen: 'manual',
  estado_verificacion: 'confirmada',
  fecha_creacion: '2026-10-10T14:30:00Z',
}

// ===========================================================================
// 1. SELECTORES SEGMENTADOS (Pills & Bars)
// ===========================================================================
export function DemoSegmentedControls({ selectedId, onSelect }: DemoProps = {}) {
  const [variantA, setVariantA] = useState<'egreso' | 'ingreso'>('egreso')
  const [variantB, setVariantB] = useState<'total' | 'otro'>('total')
  const [variantC, setVariantC] = useState<'semanal' | 'quincenal' | 'mensual'>('mensual')
  const [variantD, setVariantD] = useState<'mes' | 'año' | 'historico'>('mes')

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Cápsula Gris (Transacciones) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Selector en Cápsula (Transacciones)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.segmentedCapsule} role="radiogroup">
            <button
              type="button"
              className={`${styles.segmentedCapsulePill} ${variantA === 'egreso' ? styles.segmentedCapsulePillActive : ''}`}
              onClick={() => setVariantA('egreso')}
            >
              <ArrowUpRight size={15} />
              <span>Egreso</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentedCapsulePill} ${variantA === 'ingreso' ? styles.segmentedCapsulePillActive : ''}`}
              onClick={() => setVariantA('ingreso')}
            >
              <ArrowDownLeft size={15} />
              <span>Ingreso</span>
            </button>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionModal_pill') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-TransaccionModal_pill', 'Selector en Cápsula (Transacciones)')}
            >
              <span>{selectedId?.includes('TransaccionModal_pill') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Botones con Borde Separado (Liquidación) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Botones con Borde Separado (Liquidación)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.segmentedBorderRow} role="radiogroup">
            <button
              type="button"
              className={`${styles.segmentedBorderPill} ${variantB === 'total' ? styles.segmentedBorderPillActive : ''}`}
              onClick={() => setVariantB('total')}
            >
              <CheckCircle2 size={15} />
              <span>Pagar el total</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentedBorderPill} ${variantB === 'otro' ? styles.segmentedBorderPillActive : ''}`}
              onClick={() => setVariantB('otro')}
            >
              <Edit3 size={15} />
              <span>Otro monto</span>
            </button>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PagarResumenModal_pill') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-PagarResumenModal_pill', 'Botones con Borde Separado (Liquidación)')}
            >
              <span>{selectedId?.includes('PagarResumenModal_pill') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 3: Selector de Períodos en Fondo Sutil */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 3: Períodos con Fondo Sutil (Presupuestos)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.periodSelectorBar} role="radiogroup">
            {(['semanal', 'quincenal', 'mensual'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.periodPill} ${variantC === p ? styles.periodPillActive : ''}`}
                onClick={() => setVariantC(p)}
              >
                <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PresupuestoModal_period') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-PresupuestoModal_period', 'Períodos con Fondo Sutil (Presupuestos)')}
            >
              <span>{selectedId?.includes('PresupuestoModal_period') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 4: SegmentedControl Oficial Compartido */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 4: SegmentedControl Oficial Compartido</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <SegmentedControl
            options={[
              { value: 'mes', label: 'Este mes' },
              { value: 'año', label: 'Este año' },
              { value: 'historico', label: 'Histórico' },
            ]}
            value={variantD}
            onChange={(val) => setVariantD(val as 'mes' | 'año' | 'historico')}
            fullWidth
          />
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('SegmentedControl') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-SegmentedControl', 'SegmentedControl Oficial Compartido')}
            >
              <span>{selectedId?.includes('SegmentedControl') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 2. TARJETAS DE SELECCIÓN (Renewal & Payments)
// ===========================================================================
export function DemoSelectableCards({ selectedId, onSelect }: DemoProps = {}) {
  const [renewal, setRenewal] = useState<'auto' | 'manual'>('auto')
  const [metodo, setMetodo] = useState<'debito' | 'transferencia' | 'credito' | 'efectivo'>('debito')
  const [surfaceActive, setSurfaceActive] = useState(true)

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Tarjetas con Radio Button (Presupuesto) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Tarjetas con Radio Button (Presupuestos)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.renewalList}>
            <div
              className={`${styles.renewalOption} ${renewal === 'auto' ? styles.renewalOptionActive : ''}`}
              onClick={() => setRenewal('auto')}
            >
              <div className={`${styles.renewalRadio} ${renewal === 'auto' ? styles.renewalRadioActive : ''}`}>
                {renewal === 'auto' && <div className={styles.renewalRadioDot} />}
              </div>
              <div className={styles.renewalTexts}>
                <span className={styles.renewalTitle}>Automática</span>
                <span className={styles.renewalDesc}>Se reinicia al comenzar cada ciclo</span>
              </div>
            </div>

            <div
              className={`${styles.renewalOption} ${renewal === 'manual' ? styles.renewalOptionActive : ''}`}
              onClick={() => setRenewal('manual')}
            >
              <div className={`${styles.renewalRadio} ${renewal === 'manual' ? styles.renewalRadioActive : ''}`}>
                {renewal === 'manual' && <div className={styles.renewalRadioDot} />}
              </div>
              <div className={styles.renewalTexts}>
                <span className={styles.renewalTitle}>Manual</span>
                <span className={styles.renewalDesc}>Se archiva al expirar el período</span>
              </div>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PresupuestoModal_renewal') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-PresupuestoModal_renewal', 'Tarjetas con Radio Button (Presupuestos)')}
            >
              <span>{selectedId?.includes('PresupuestoModal_renewal') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Botones Cuadrados con Ícono (Métodos de Pago) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Botones con Ícono en Grilla (Pagos)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.paymentGrid}>
            {[
              { id: 'debito', label: 'Débito', icon: CreditCard },
              { id: 'transferencia', label: 'Transf.', icon: Building2 },
              { id: 'credito', label: 'Crédito', icon: CreditCard },
              { id: 'efectivo', label: 'Efectivo', icon: Banknote },
            ].map((m) => {
              const Icon = m.icon
              const active = metodo === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.paymentBtn} ${active ? styles.paymentBtnActive : ''}`}
                  onClick={() => setMetodo(m.id as 'debito' | 'transferencia' | 'credito' | 'efectivo')}
                >
                  <Icon size={18} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionModal_payment') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-TransaccionModal_payment', 'Botones con Ícono en Grilla (Pagos)')}
            >
              <span>{selectedId?.includes('TransaccionModal_payment') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 3: SelectableSurface Oficial Compartido */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 3: Superficie Seleccionable Oficial</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <SelectableSurface
            selected={surfaceActive}
            onClick={() => setSurfaceActive(!surfaceActive)}
          >
            <div className={styles.surfaceDemoBox}>
              <div className={styles.surfaceIconBox}>
                <Sparkles size={20} />
              </div>
              <div className={styles.surfaceTextBox}>
                <strong className={styles.surfaceTextTitle}>Superficie Estándar de Selección</strong>
                <span className={styles.surfaceTextDesc}>Micro-resorte al clic y borde accesible</span>
              </div>
            </div>
          </SelectableSurface>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('SelectableSurface') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-SelectableSurface', 'Superficie Seleccionable Oficial')}
            >
              <span>{selectedId?.includes('SelectableSurface') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 3. BOTONES DE ACCIÓN
// ===========================================================================
export function DemoActionButtons({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Botones Oficiales en Pila */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Botones Compartidos Oficiales</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.buttonsStack}>
            <Button variant="primary">
              <span>Guardar Transacción (Primario)</span>
            </Button>
            <Button variant="secondary">
              <span>Cancelar Acción (Secundario)</span>
            </Button>
            <Button variant="danger">
              <span>Eliminar Registro (Peligro)</span>
            </Button>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('Button') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-botones_accion-Button', 'Botones Compartidos Oficiales')}
            >
              <span>{selectedId?.includes('Button') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Botones de Modal Lado a Lado */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Botones de Diálogo Lado a Lado</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.modalButtonsPair}>
            <button type="button" className={styles.modalCancelBtn}>
              <span>Cancelar</span>
            </button>
            <button type="button" className={styles.modalConfirmBtn}>
              <span>Confirmar</span>
            </button>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('modal_buttons') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-botones_accion-modal_buttons', 'Botones de Diálogo Lado a Lado')}
            >
              <span>{selectedId?.includes('modal_buttons') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 4. CAMPOS DE ENTRADA & INPUTS
// ===========================================================================
export function DemoInputs({ selectedId, onSelect }: DemoProps = {}) {
  const [textVal, setTextVal] = useState('Supermercado Coto')
  const [searchVal, setSearchVal] = useState('')

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Input Estándar con Etiqueta Superior */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Campo de Texto Estándar</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.inputFieldStack}>
            <div className={styles.inputFieldGroup}>
              <label className={styles.inputFieldLabel}>Descripción del gasto</label>
              <div className={styles.inputFieldBox}>
                <input
                  type="text"
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  placeholder="Ej: Compra de alimentos..."
                />
              </div>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('input_standard') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-campos_entrada-input_standard', 'Campo de Texto Estándar')}
            >
              <span>{selectedId?.includes('input_standard') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Campo con Ícono de Búsqueda */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Campo de Búsqueda con Ícono</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.inputFieldStack}>
            <div className={styles.inputFieldGroup}>
              <label className={styles.inputFieldLabel}>Buscar transacción o categoría</label>
              <div className={styles.inputFieldBox}>
                <Search size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar por nombre, comercio..."
                />
              </div>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('input_search') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-campos_entrada-input_search', 'Campo de Búsqueda con Ícono')}
            >
              <span>{selectedId?.includes('input_search') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 5. MONTOS Y SALDOS (Financial Displays)
// ===========================================================================
export function DemoElementosFinancieros({ selectedId, onSelect }: DemoProps = {}) {
  const [monto, setMonto] = useState<number | null>(45000)

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: MontoInput Interactivo de Ingreso */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Teclado de Ingreso Monetario (MontoInput)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <MontoInput
            value={monto}
            onChange={(val) => setMonto(val)}
            moneda="ARS"
            autoFocus={false}
          />
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('MontoInput') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_financieros-MontoInput', 'Teclado de Ingreso Monetario (MontoInput)')}
            >
              <span>{selectedId?.includes('MontoInput') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Saldo Destacado Hero (Dashboard) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Saldo Destacado Principal (Dashboard / Billeteras)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.heroBalanceCard}>
            <span className={styles.heroBalanceLabel}>SALDO DISPONIBLE TOTAL</span>
            <div className={styles.heroBalanceAmount}>$ 1.485.200,00</div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('saldo_hero') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_financieros-saldo_hero', 'Saldo Destacado Principal (Dashboard / Billeteras)')}
            >
              <span>{selectedId?.includes('saldo_hero') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 3: Monto en Tarjeta Gris (PagarResumenModal) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 3: Tarjeta de Monto a Liquidar (Liquidación)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.pagoResumenCard}>
            <span className={styles.pagoResumenLabel}>TOTAL A LIQUIDAR</span>
            <div className={styles.pagoResumenAmount}>$ 161.700</div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('MontoHeroCard') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_financieros-MontoHeroCard', 'Tarjeta de Monto a Liquidar (Liquidación)')}
            >
              <span>{selectedId?.includes('MontoHeroCard') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 4: Movimientos Positivos y Negativos */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 4: Movimientos con Color Semántico (+ Verde / - Rojo)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.txAmountsCompare}>
            <div className={styles.txAmountRow}>
              <span className={styles.txAmountDesc}>Sueldo mensual</span>
              <span className={styles.txAmountPositive}>+$ 1.250.000</span>
            </div>
            <div className={styles.txAmountRow}>
              <span className={styles.txAmountDesc}>Supermercado</span>
              <span className={styles.txAmountNegative}>-$ 48.300</span>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('tx_semantic') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_financieros-tx_semantic', 'Movimientos con Color Semántico (+ Verde / - Rojo)')}
            >
              <span>{selectedId?.includes('tx_semantic') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 6. TARJETAS DE RESUMEN Y BILLETERAS
// ===========================================================================
export function DemoTarjetasPaneles({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: BilleteraCard Oficial en Vivo */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Tarjeta de Cuenta Bancaria (BilleteraCard)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <BilleteraCard
            billetera={MOCK_BILLETERA}
            disableNavigation
          />
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('BilleteraCard') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-tarjetas_paneles-BilleteraCard', 'Tarjeta de Cuenta Bancaria (BilleteraCard)')}
            >
              <span>{selectedId?.includes('BilleteraCard') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Fila de Movimiento en Vivo */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Renglón de Movimiento (TransaccionRow)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <TransaccionRow
            transaccion={MOCK_TRANSACCION}
            billetera={MOCK_BILLETERA}
          />
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionRow') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-tarjetas_paneles-TransaccionRow', 'Renglón de Movimiento (TransaccionRow)')}
            >
              <span>{selectedId?.includes('TransaccionRow') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 7. VENTANAS Y MODALES (DISEÑO DE BORDES Y CABECERAS)
// ===========================================================================
export function DemoModalesDialogos({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Borde Suave 16px */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Ventana con Esquinas Suaves (16px de Redondez)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={`${styles.modalFrameMockup} ${styles.modalFrameRadius16}`}>
            <div className={styles.modalFrameHeader}>
              <span className={styles.modalFrameTitle}>Nueva Transacción</span>
              <button type="button" className={styles.modalFrameClose}><X size={14} /></button>
            </div>
            <div className={styles.modalFrameBody}>
              <p className={styles.modalFrameBodyText}>
                Diseño compacto con bordes de 16px. Ideal para pantallas con mucha densidad de información.
              </p>
            </div>
            <div className={styles.modalFrameFooter}>
              <button type="button" className={styles.modalCancelBtn}>Cerrar</button>
              <button type="button" className={styles.modalConfirmBtn}>Guardar</button>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('modal_16px') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-modales_dialogos-modal_16px', 'Ventana con Esquinas Suaves (16px)')}
            >
              <span>{selectedId?.includes('modal_16px') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Borde Moderno 20px */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Ventana Equilibrada (20px de Redondez)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={`${styles.modalFrameMockup} ${styles.modalFrameRadius20}`}>
            <div className={styles.modalFrameHeader}>
              <span className={styles.modalFrameTitle}>Configurar Presupuesto</span>
              <button type="button" className={styles.modalFrameClose}><X size={14} /></button>
            </div>
            <div className={styles.modalFrameBody}>
              <p className={styles.modalFrameBodyText}>
                Curvatura intermedia de 20px con sombras suaves. Se siente moderna sin perder estructura.
              </p>
            </div>
            <div className={styles.modalFrameFooter}>
              <button type="button" className={styles.modalCancelBtn}>Cerrar</button>
              <button type="button" className={styles.modalConfirmBtn}>Aceptar</button>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('modal_20px') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-modales_dialogos-modal_20px', 'Ventana Equilibrada (20px)')}
            >
              <span>{selectedId?.includes('modal_20px') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 3: Borde Amplio Curvado 24px (Apple Style) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 3: Ventana Amplia Curvada (24px - Estilo Apple)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={`${styles.modalFrameMockup} ${styles.modalFrameRadius24}`}>
            <div className={styles.modalFrameHeader}>
              <span className={styles.modalFrameTitle}>Confirmar Transferencia</span>
              <button type="button" className={styles.modalFrameClose}><X size={14} /></button>
            </div>
            <div className={styles.modalFrameBody}>
              <p className={styles.modalFrameBodyText}>
                Curvatura amplia de 24px igual a las tarjetas y modales oficiales de Argentum. Muy suave a la vista.
              </p>
            </div>
            <div className={styles.modalFrameFooter}>
              <button type="button" className={styles.modalCancelBtn}>Cerrar</button>
              <button type="button" className={styles.modalConfirmBtn}>Transferir</button>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('modal_24px') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-modales_dialogos-modal_24px', 'Ventana Amplia Curvada (24px - Estilo Apple)')}
            >
              <span>{selectedId?.includes('modal_24px') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 8. SELECTORES ESPECIALES (Categorías, País, Colores)
// ===========================================================================
export function DemoSeleccionAvanzada({ selectedId, onSelect }: DemoProps = {}) {
  const [selectedColor, setSelectedColor] = useState('#2563EB')
  const [selectedCat, setSelectedCat] = useState('supermercado')

  const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Selector de Color de Cuenta */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Paleta Circular de Colores (Billeteras)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: selectedColor === c ? '3px solid #fff' : '2px solid transparent',
                  outline: selectedColor === c ? `2px solid ${c}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                }}
              />
            ))}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('color_palette') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-seleccion_avanzada-color_palette', 'Paleta Circular de Colores (Billeteras)')}
            >
              <span>{selectedId?.includes('color_palette') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Selector de Categoría con Ícono */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Selector de Categorías en Tarjetas</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
            {[
              { id: 'supermercado', label: 'Alimentos', color: '#10B981' },
              { id: 'transporte', label: 'Transporte', color: '#3B82F6' },
              { id: 'servicios', label: 'Servicios', color: '#F59E0B' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 6px',
                  borderRadius: 12,
                  background: selectedCat === cat.id ? 'rgba(201, 162, 39, 0.12)' : 'var(--surface)',
                  border: selectedCat === cat.id ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                  color: selectedCat === cat.id ? 'var(--gold)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('category_picker') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-seleccion_avanzada-category_picker', 'Selector de Categorías en Tarjetas')}
            >
              <span>{selectedId?.includes('category_picker') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 9. MENÚS Y NAVEGACIÓN
// ===========================================================================
export function DemoNavegacion({ selectedId, onSelect }: DemoProps = {}) {
  const [navTab, setNavTab] = useState('dashboard')

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Barra Superior Flotante en Cápsula */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Barra Superior Flotante en Cápsula (Desktop)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.navPillMockup}>
            {[
              { id: 'dashboard', label: 'Inicio', icon: Home },
              { id: 'transacciones', label: 'Movimientos', icon: Layers },
              { id: 'presupuestos', label: 'Presupuestos', icon: PieChart },
            ].map((item) => {
              const Icon = item.icon
              const active = navTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navPillItem} ${active ? styles.navPillItemActive : ''}`}
                  onClick={() => setNavTab(item.id)}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('nav_floating') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-navegacion-nav_floating', 'Barra Superior Flotante en Cápsula')}
            >
              <span>{selectedId?.includes('nav_floating') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Barra de Navegación Inferior Móvil (Dock) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Menú Inferior Móvil (Dock Táctil)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.mobileDockMockup}>
            {[
              { id: 'dashboard', label: 'Inicio', icon: Home },
              { id: 'transacciones', label: 'Gastos', icon: Layers },
              { id: 'metas', label: 'Metas', icon: Target },
            ].map((item) => {
              const Icon = item.icon
              const active = navTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.mobileDockItem} ${active ? styles.mobileDockItemActive : ''}`}
                  onClick={() => setNavTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('nav_dock') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-navegacion-nav_dock', 'Menú Inferior Móvil (Dock Táctil)')}
            >
              <span>{selectedId?.includes('nav_dock') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 10. AVISOS, BADGES Y ALERTAS
// ===========================================================================
export function DemoElementosInformativos({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Etiquetas de Estado y Badges */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Etiquetas de Estado (Badges)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.badgesGroupWrap}>
            <span className={`${styles.badgePill} ${styles.badgeSuccess}`}>
              <CheckCircle2 size={12} /> Confirmada
            </span>
            <span className={`${styles.badgePill} ${styles.badgeWarning}`}>
              <AlertTriangle size={12} /> Pendiente
            </span>
            <span className={`${styles.badgePill} ${styles.badgeGold}`}>
              <DebitoAutomaticoBadge />
            </span>
            <span className={`${styles.badgePill} ${styles.badgeDanger}`}>
              Rechazada
            </span>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('badges_pack') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_informativos-badges_pack', 'Etiquetas de Estado (Badges)')}
            >
              <span>{selectedId?.includes('badges_pack') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Banners de Alerta en Pantalla */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Banners de Alerta en Pantalla</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <div className={`${styles.alertBoxBanner} ${styles.alertBoxSuccess}`}>
              <CheckCircle2 size={16} />
              <span>Pago liquidado exitosamente en cuenta Galicia</span>
            </div>
            <div className={`${styles.alertBoxBanner} ${styles.alertBoxWarning}`}>
              <AlertTriangle size={16} />
              <span>Tu presupuesto mensual superó el 85 %</span>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('alert_banners') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_informativos-alert_banners', 'Banners de Alerta en Pantalla')}
            >
              <span>{selectedId?.includes('alert_banners') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 11. PANTALLAS DE CARGA Y VACÍAS
// ===========================================================================
export function DemoEstadosInterfaz({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: LunarLoader Identitario */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Animación de Carga Lunar (LunarLoader)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.loaderRow}>
            <LunarLoader size={26} />
            <LunarLoader size={38} />
            <LunarLoader size={50} />
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('LunarLoader') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-estados_interfaz-LunarLoader', 'Animación de Carga Lunar (LunarLoader)')}
            >
              <span>{selectedId?.includes('LunarLoader') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Tarjeta Skeleton con Efecto Shimmer */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Esqueleto de Carga (Skeleton Shimmer)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.skeletonPreviewCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={styles.skeletonCircle} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
              </div>
            </div>
            <div className={styles.skeletonLine} style={{ width: '100%' }} />
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('skeleton_shimmer') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-estados_interfaz-skeleton_shimmer', 'Esqueleto de Carga (Skeleton Shimmer)')}
            >
              <span>{selectedId?.includes('skeleton_shimmer') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 3: Pantalla Vacía Oficial */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 3: Pantalla Vacía Oficial (EmptyState)</h4>
          <span className={`${styles.cardTag} ${styles.cardTagOfficial}`}>Oficial</span>
        </div>
        <div className={styles.demoCanvas}>
          <EmptyState
            title="Sin transacciones aún"
            description="Tus movimientos aparecerán aquí cuando crees el primero."
            actionLabel="Crear gasto"
            onActionClick={() => {}}
            variant="compact"
          />
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('EmptyState') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-estados_interfaz-EmptyState', 'Pantalla Vacía Oficial (EmptyState)')}
            >
              <span>{selectedId?.includes('EmptyState') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// 12. CONMUTADORES Y AJUSTES ESPECIALES
// ===========================================================================
export function DemoControlesEspeciales({ selectedId, onSelect }: DemoProps = {}) {
  const [switchA, setSwitchA] = useState(true)
  const [switchB, setSwitchB] = useState(false)
  const [checkA, setCheckA] = useState(true)

  return (
    <div className={styles.demoGrid}>
      {/* Opción 1: Conmutadores Switch Estilo iOS */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 1: Conmutadores Deslizables (Switches ON/OFF)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.switchesStack}>
            <div className={styles.switchRow} onClick={() => setSwitchA(!switchA)}>
              <span className={styles.switchLabel}>Notificaciones push de gastos</span>
              <div className={`${styles.switchTrack} ${switchA ? styles.switchTrackOn : ''}`}>
                <div className={`${styles.switchThumb} ${switchA ? styles.switchThumbOn : ''}`} />
              </div>
            </div>

            <div className={styles.switchRow} onClick={() => setSwitchB(!switchB)}>
              <span className={styles.switchLabel}>Ocultar saldos en pantalla</span>
              <div className={`${styles.switchTrack} ${switchB ? styles.switchTrackOn : ''}`}>
                <div className={`${styles.switchThumb} ${switchB ? styles.switchThumbOn : ''}`} />
              </div>
            </div>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('switches_ios') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-controles_especiales-switches_ios', 'Conmutadores Deslizables (Switches ON/OFF)')}
            >
              <span>{selectedId?.includes('switches_ios') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Opción 2: Casilla de Verificación (Checkbox) */}
      <div className={styles.variantCard}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>Opción 2: Casilla de Verificación (Checkbox)</h4>
        </div>
        <div className={styles.demoCanvas}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              padding: '12px 16px',
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              width: '100%',
            }}
            onClick={() => setCheckA(!checkA)}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                backgroundColor: checkA ? 'var(--gold)' : 'var(--surface-alt)',
                border: checkA ? '2px solid var(--gold)' : '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'all 160ms ease',
              }}
            >
              {checkA && <Check size={14} strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Repetir automáticamente cada mes
            </span>
          </div>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('checkbox_styled') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-controles_especiales-checkbox_styled', 'Casilla de Verificación (Checkbox)')}
            >
              <span>{selectedId?.includes('checkbox_styled') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
