import { useState } from 'react'
import {
  CheckCircle2,
  Edit3,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  CreditCard,
  Building2,
  Banknote,
  AlertTriangle,
  Sparkles,
  Star,
} from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { LunarLoader } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import SelectableSurface from '@/components/ui/SelectableSurface/SelectableSurface'
import DebitoAutomaticoBadge from '@/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import TransaccionRow from '@/components/transacciones/TransaccionRow'
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

// ---------------------------------------------------------------------------
// 1. SELECTORES SEGMENTADOS (Segmented Controls Demos)
// ---------------------------------------------------------------------------
export function DemoSegmentedControls({ selectedId, onSelect }: DemoProps = {}) {
  const [variantA, setVariantA] = useState<'egreso' | 'ingreso'>('egreso')
  const [variantB, setVariantB] = useState<'total' | 'otro'>('total')
  const [variantC, setVariantC] = useState<'semanal' | 'quincenal' | 'mensual'>('mensual')
  const [variantD, setVariantD] = useState<'aporte' | 'retiro'>('aporte')
  const [variantE, setVariantE] = useState<'mes' | 'año' | 'historico'>('mes')

  return (
    <div className={styles.demoGrid}>
      {/* Variante 1: TransaccionModal (Apple Style Pill en container gris) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>TransaccionModal (Selector Operación)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/transacciones/TransaccionModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.transaccionSegmentedBar} role="radiogroup" aria-label="Tipo de transacción">
            <button
              type="button"
              role="radio"
              aria-checked={variantA === 'egreso'}
              className={`${styles.transaccionPill} ${variantA === 'egreso' ? styles.transaccionPillActive : ''}`}
              onClick={() => setVariantA('egreso')}
            >
              <ArrowUpRight size={14} strokeWidth={2.2} />
              <span>Egreso</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={variantA === 'ingreso'}
              className={`${styles.transaccionPill} ${variantA === 'ingreso' ? styles.transaccionPillActive : ''}`}
              onClick={() => setVariantA('ingreso')}
            >
              <ArrowDownLeft size={14} strokeWidth={2.2} />
              <span>Ingreso</span>
            </button>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Container: <code>padding: 4px; radius: 14px; bg: surface-alt</code></span>
          <span>Pill: <code>height: 38px; radius: 10px; shadow: elevation-sm</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionModal_pill') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-TransaccionModal_pill', 'Selector Tipo Transacción (TransaccionModal)')}
            >
              <Star size={13} fill={selectedId?.includes('TransaccionModal_pill') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('TransaccionModal_pill') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 2: PagarResumenModal (Pills independientes con borde) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>PagarResumenModal (Liquidación Tarjeta)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/tarjetas/PagarResumenModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.pagarResumenSegmentedBar} role="radiogroup" aria-label="Tipo de pago">
            <button
              type="button"
              role="radio"
              aria-checked={variantB === 'total'}
              className={`${styles.pagarResumenPill} ${variantB === 'total' ? styles.pagarResumenPillActive : ''}`}
              onClick={() => setVariantB('total')}
            >
              <CheckCircle2 size={14} strokeWidth={2.2} />
              <span>Pagar el total</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={variantB === 'otro'}
              className={`${styles.pagarResumenPill} ${variantB === 'otro' ? styles.pagarResumenPillActive : ''}`}
              onClick={() => setVariantB('otro')}
            >
              <Edit3 size={14} strokeWidth={2} />
              <span>Ingresar otro monto</span>
            </button>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Bordes: <code>border: 1px solid var(--border); sin container exterior</code></span>
          <span>Pill: <code>height: 42px; radius: 12px; active bg: surface</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PagarResumenModal_pill') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-PagarResumenModal_pill', 'Selector Pago Tarjeta (PagarResumenModal)')}
            >
              <Star size={13} fill={selectedId?.includes('PagarResumenModal_pill') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('PagarResumenModal_pill') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 3: PresupuestoModal (Periodo semanal/quincenal/mensual) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>PresupuestoModal (Selector Período)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/presupuestos/PresupuestoModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.presupuestoPeriodBar} role="radiogroup" aria-label="Período de presupuesto">
            {(['semanal', 'quincenal', 'mensual'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={variantC === p}
                className={`${styles.presupuestoPeriodPill} ${variantC === p ? styles.presupuestoPeriodPillActive : ''}`}
                onClick={() => setVariantC(p)}
              >
                <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Container: <code>padding: 3px; radius: 12px; bg: surface-3</code></span>
          <span>Pill: <code>height: 44px; radius: 9px; active shadow: elevation-sm</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PresupuestoModal_period') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-PresupuestoModal_period', 'Selector Período (PresupuestoModal)')}
            >
              <Star size={13} fill={selectedId?.includes('PresupuestoModal_period') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('PresupuestoModal_period') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 4: GoalContributionModal (Operación Aporte vs Retiro) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>GoalContributionModal (Aporte/Retiro)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/goals/GoalContributionModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.goalSegmentedBar} role="radiogroup" aria-label="Tipo de operación">
            <button
              type="button"
              role="radio"
              aria-checked={variantD === 'aporte'}
              className={`${styles.goalPill} ${variantD === 'aporte' ? styles.goalPillActive : ''}`}
              onClick={() => setVariantD('aporte')}
            >
              <Plus size={14} strokeWidth={2.2} />
              <span>Aportar</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={variantD === 'retiro'}
              className={`${styles.goalPill} ${variantD === 'retiro' ? styles.goalPillActive : ''}`}
              onClick={() => setVariantD('retiro')}
            >
              <Minus size={14} strokeWidth={2.2} />
              <span>Retirar</span>
            </button>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Container: <code>padding: 4px; radius: 14px; gap: 4px</code></span>
          <span>Pill: <code>height: 38px; radius: 10px; font-weight: 700</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('GoalContributionModal_operation') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-GoalContributionModal_operation', 'Selector Operación Meta (GoalContributionModal)')}
            >
              <Star size={13} fill={selectedId?.includes('GoalContributionModal_operation') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('GoalContributionModal_operation') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 5: SegmentedControl Oficial (Shared UI Component) */}
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>SegmentedControl (Shared UI Oficial)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/SegmentedControl.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <SegmentedControl
            options={[
              { value: 'mes', label: 'Este mes' },
              { value: 'año', label: 'Este año' },
              { value: 'historico', label: 'Histórico' },
            ]}
            value={variantE}
            onChange={(val) => setVariantE(val as 'mes' | 'año' | 'historico')}
            fullWidth
          />
        </div>
        <div className={styles.variantSpecs}>
          <span>Container: <code>padding: 4px; radius: 12px; border: 1px solid var(--border)</code></span>
          <span>Pill: <code>padding: 6px 14px; radius: 8px; scale(1.02)</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('SegmentedControl') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-selectores_segmentados-SegmentedControl', 'SegmentedControl (Shared UI Oficial)')}
            >
              <span>{selectedId?.includes('SegmentedControl') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. OPCIONES SELECCIONABLES (Selectable Cards Demos)
// ---------------------------------------------------------------------------
export function DemoSelectableCards({ selectedId, onSelect }: DemoProps = {}) {
  const [renewal, setRenewal] = useState<'auto' | 'manual'>('auto')
  const [metodo, setMetodo] = useState<'debito' | 'transferencia' | 'credito' | 'efectivo'>('debito')
  const [surfaceActive, setSurfaceActive] = useState(true)

  return (
    <div className={styles.demoGrid}>
      {/* Variante 1: Tarjetas de Renovación (PresupuestoModal) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>Tarjetas de Renovación (PresupuestoModal)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/presupuestos/PresupuestoModal.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.renewalCardsGrid}>
            <div
              className={`${styles.renewalCard} ${renewal === 'auto' ? styles.renewalCardActive : ''}`}
              onClick={() => setRenewal('auto')}
            >
              <div className={styles.renewalRadioCircle}>
                {renewal === 'auto' && <div className={styles.radioInnerDot} />}
              </div>
              <div className={styles.renewalText}>
                <strong>Automática</strong>
                <span>Se reinicia al inicio del ciclo</span>
              </div>
            </div>

            <div
              className={`${styles.renewalCard} ${renewal === 'manual' ? styles.renewalCardActive : ''}`}
              onClick={() => setRenewal('manual')}
            >
              <div className={styles.renewalRadioCircle}>
                {renewal === 'manual' && <div className={styles.radioInnerDot} />}
              </div>
              <div className={styles.renewalText}>
                <strong>Manual</strong>
                <span>Se archiva al expirar</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Radio: <code>border-radius: 14px; border: 1.5px solid</code></span>
          <span>Física: <code>border-color activo var(--gold); shadow-sm</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('PresupuestoModal_renewal') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-PresupuestoModal_renewal', 'Tarjetas de Renovación (PresupuestoModal)')}
            >
              <Star size={13} fill={selectedId?.includes('PresupuestoModal_renewal') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('PresupuestoModal_renewal') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 2: Métodos de Pago (TransaccionModal) */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>Método de Pago (TransaccionModal)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/transacciones/TransaccionModal.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.paymentMethodsRow}>
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
                  className={`${styles.methodCard} ${active ? styles.methodCardActive : ''}`}
                  onClick={() => setMetodo(m.id as 'debito' | 'transferencia' | 'credito' | 'efectivo')}
                >
                  <Icon size={16} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Píldora botón: <code>height: 48px; radius: 10px; gap: 6px</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionModal_payment') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-TransaccionModal_payment', 'Métodos de Pago (TransaccionModal)')}
            >
              <Star size={13} fill={selectedId?.includes('TransaccionModal_payment') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('TransaccionModal_payment') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 3: SelectableSurface Oficial (Shared UI) */}
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>SelectableSurface (Shared UI Oficial)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/SelectableSurface/SelectableSurface.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <SelectableSurface
            selected={surfaceActive}
            onClick={() => setSurfaceActive(!surfaceActive)}
            className={styles.surfaceDemoWrap}
          >
            <div className={styles.surfaceContent}>
              <div className={styles.surfaceIconWrap}>
                <Sparkles size={18} />
              </div>
              <div className={styles.surfaceInfo}>
                <strong>Superficie Oficial Estandarizada</strong>
                <span>Borde accesible, micro-resorte y foco visible</span>
              </div>
            </div>
          </SelectableSurface>
        </div>
        <div className={styles.variantSpecs}>
          <span>Tokens: <code>radius: 14px; transition: 0.15s; outline-offset: 2px</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('SelectableSurface') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-opciones_seleccionables-SelectableSurface', 'SelectableSurface (Shared UI Oficial)')}
            >
              <Star size={13} fill={selectedId?.includes('SelectableSurface') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('SelectableSurface') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. BOTONES DE ACCIÓN (Action Buttons Demos)
// ---------------------------------------------------------------------------
export function DemoActionButtons({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      {/* Variante 1: Button Oficial (Shared UI) */}
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>Button (Shared UI Oficial)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/Button/Button.tsx</span>
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
        <div className={styles.variantSpecs}>
          <span>Tokens: <code>radius: 12px; font-weight: 600; padding: 10px 18px</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('Button') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-botones_accion-Button', 'Button (Shared UI Oficial)')}
            >
              <Star size={13} fill={selectedId?.includes('Button') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('Button') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Variante 2: Botones Locales en Modales */}
      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>Botones HTML Locales en Modales</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/transacciones/TransaccionModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.buttonsStack}>
            <button type="button" className={styles.modalSubmitBtnLocal}>
              <span>Confirmar en Modal (10px Radius)</span>
            </button>
            <button type="button" className={styles.modalCancelBtnLocal}>
              <span>Cerrar Diálogo</span>
            </button>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Divergencia: <code>radius: 10px; font-size: 14px; sin tokens compartidos</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('modal_buttons') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-botones_accion-modal_buttons', 'Botones Locales en Modales')}
            >
              <Star size={13} fill={selectedId?.includes('modal_buttons') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('modal_buttons') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. CAMPOS DE ENTRADA & IMPORTES HERO (Inputs Demos)
// ---------------------------------------------------------------------------
export function DemoInputs({ selectedId, onSelect }: DemoProps = {}) {
  const [monto, setMonto] = useState<number | null>(45000)

  return (
    <div className={styles.demoGrid}>
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>MontoInput (Formateo Monetario Oficial)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/MontoInput/MontoInput.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <MontoInput
            value={monto}
            onChange={(val) => setMonto(val)}
            moneda="ARS"
            autoFocus={false}
          />
        </div>
        <div className={styles.variantSpecs}>
          <span>Monto: <code>font-size: 36px; font-weight: 700; letter-spacing: -0.02em</code></span>
          <span>Selector moneda: <code>badge ARS / USD conmutador dinámico</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('MontoInput') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-campos_entrada-MontoInput', 'MontoInput (Formateo Monetario Oficial)')}
            >
              <Star size={13} fill={selectedId?.includes('MontoInput') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('MontoInput') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>Monto Hero Card (PagarResumenModal)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/tarjetas/PagarResumenModal.module.css</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.montoHeroCardDemo}>
            <span className={styles.montoHeroLabel}>TOTAL A LIQUIDAR</span>
            <div className={styles.montoHeroAmount}>$ 161.700</div>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Card: <code>bg: var(--surface-3); radius: 16px; padding: 16px 20px</code></span>
          <span>Display: <code>font-size: 32px; font-weight: 800; color: var(--text)</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('MontoHeroCard') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-campos_entrada-MontoHeroCard', 'Monto Hero Card (PagarResumenModal)')}
            >
              <Star size={13} fill={selectedId?.includes('MontoHeroCard') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('MontoHeroCard') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. TARJETAS Y PANELES (Cards & Rows In Vivo)
// ---------------------------------------------------------------------------
export function DemoTarjetasPaneles({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>BilleteraCard (Producción In Vivo)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/billeteras/BilleteraCard.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <BilleteraCard
            billetera={MOCK_BILLETERA}
            disableNavigation
          />
        </div>
        <div className={styles.variantSpecs}>
          <span>Tokens: <code>radius: 18px; elevación con micro-interacción de opciones</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('BilleteraCard') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-tarjetas_paneles-BilleteraCard', 'BilleteraCard (Producción In Vivo)')}
            >
              <Star size={13} fill={selectedId?.includes('BilleteraCard') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('BilleteraCard') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>TransaccionRow (Fila Transacción In Vivo)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/transacciones/TransaccionRow.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <TransaccionRow
            transaccion={MOCK_TRANSACCION}
            billetera={MOCK_BILLETERA}
          />
        </div>
        <div className={styles.variantSpecs}>
          <span>Tokens: <code>radius: 12px; icon container: 40px; amount color semántico</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('TransaccionRow') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-tarjetas_paneles-TransaccionRow', 'TransaccionRow (Fila Transacción In Vivo)')}
            >
              <Star size={13} fill={selectedId?.includes('TransaccionRow') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('TransaccionRow') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 6. MODALES Y DIÁLOGOS (Tokens & Unrenderable Showcases)
// ---------------------------------------------------------------------------
export function DemoModalesDialogos() {
  return (
    <div className={styles.demoGrid}>
      {/* Componente No Renderizable 1: WhatsAppQrModal */}
      <div className={`${styles.variantCard} ${styles.unrenderableCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>WhatsAppQrModal (Vinculación Admin)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeBlocked}`}>No Renderizable Aislado</span>
          </div>
          <span className={styles.variantFile}>src/components/admin/WhatsAppQrModal.tsx</span>
        </div>
        <div className={styles.unrenderableCanvas}>
          <div className={styles.unrenderableReasonHeader}>
            <AlertTriangle size={16} />
            <span>Bloqueo Técnico de Aislamiento</span>
          </div>
          <p className={styles.unrenderableReasonText}>
            Este componente mantiene una conexión bidireccional por WebSocket con el servicio de sesión de WhatsApp Baileys en el backend. Instanciarlo en un catálogo estático provocaría reconexiones fantasma y mutaciones no deseadas.
          </p>
          <div className={styles.unrenderableBlockerTag}>
            <code>Bloqueador: WebSocket / Sesión Activa de Dispositivo</code>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Directriz: <code>Auditado estáticamente vía AST; dialog width: 440px; radius: 16px</code></span>
        </div>
      </div>

      {/* Componente No Renderizable 2: TransaccionModal Completo */}
      <div className={`${styles.variantCard} ${styles.unrenderableCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>TransaccionModal (Diálogo Completo)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeBlocked}`}>No Renderizable Completo</span>
          </div>
          <span className={styles.variantFile}>src/components/transacciones/TransaccionModal.tsx</span>
        </div>
        <div className={styles.unrenderableCanvas}>
          <div className={styles.unrenderableReasonHeader}>
            <AlertTriangle size={16} />
            <span>Bloqueo de Estado Global Vivo</span>
          </div>
          <p className={styles.unrenderableReasonText}>
            El modal completo acopla 4 queries de React Query (billeteras, categorías, tarjetas, cuotas) y el hook de mutación `useCrearTransaccion`. Sus componentes hijos (SegmentedBar, MontoInput, SelectableSurface) sí son auditados y renderizados individualmente.
          </p>
          <div className={styles.unrenderableBlockerTag}>
            <code>Bloqueador: React Query Cache + Mutation Tree</code>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Directriz: <code>Subcomponentes aislados renderizados en vivo en sus respectivas categorías</code></span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 7. ELEMENTOS INFORMATIVOS & BADGES
// ---------------------------------------------------------------------------
export function DemoElementosInformativos({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>DebitoAutomaticoBadge (Producción In Vivo)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <DebitoAutomaticoBadge />
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Tokens: <code>radius: 6px; font-size: 11px; bg: surface-3; color: gold</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('DebitoAutomaticoBadge') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-elementos_informativos-DebitoAutomaticoBadge', 'DebitoAutomaticoBadge (Producción In Vivo)')}
            >
              <Star size={13} fill={selectedId?.includes('DebitoAutomaticoBadge') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('DebitoAutomaticoBadge') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 8. ESTADOS DE INTERFAZ & FEEDBACK
// ---------------------------------------------------------------------------
export function DemoInterfaceStates({ selectedId, onSelect }: DemoProps = {}) {
  return (
    <div className={styles.demoGrid}>
      <div className={`${styles.variantCard} ${styles.sharedReferenceCard}`}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={`${styles.variantTag} ${styles.tagShared}`}>LunarLoader (Animación Identitaria)</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeInVivo}`}>Componente Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui/LunarLoader/LunarLoader.tsx</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.loaderRow}>
            <LunarLoader size={24} />
            <LunarLoader size={36} />
            <LunarLoader size={48} />
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Física: <code>Órbita elíptica lunar con destello ámbar/cobre</code></span>
          <span>Tallas: <code>24px, 36px, 48px, 64px</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('LunarLoader') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-estados_interfaz-LunarLoader', 'LunarLoader (Animación Identitaria)')}
            >
              <Star size={13} fill={selectedId?.includes('LunarLoader') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('LunarLoader') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.variantCard}>
        <div className={styles.variantHeader}>
          <div className={styles.headerTopRow}>
            <span className={styles.variantTag}>Alertas y Badges de Estado</span>
            <span className={`${styles.capabilityBadge} ${styles.badgeCssModule}`}>CSS Module Original</span>
          </div>
          <span className={styles.variantFile}>src/components/ui</span>
        </div>
        <div className={styles.demoCanvas}>
          <div className={styles.alertStack}>
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <CheckCircle2 size={16} />
              <span>Pago liquidado correctamente en cuenta Galicia</span>
            </div>
            <div className={`${styles.alertBox} ${styles.alertWarning}`}>
              <AlertTriangle size={16} />
              <span>Vencimiento estimado en 4 días hábiles</span>
            </div>
          </div>
        </div>
        <div className={styles.variantSpecs}>
          <span>Radio: <code>10px; padding: 10px 14px; gap: 8px</code></span>
        </div>
        {onSelect && (
          <div className={styles.cardActionBar}>
            <button
              type="button"
              className={`${styles.selectInDemoBtn} ${selectedId?.includes('AlertasBadges') ? styles.selectedInDemoBtnActive : ''}`}
              onClick={() => onSelect('canonical-estados_interfaz-AlertasBadges', 'Alertas y Badges de Estado')}
            >
              <Star size={13} fill={selectedId?.includes('AlertasBadges') ? 'currentColor' : 'none'} />
              <span>{selectedId?.includes('AlertasBadges') ? '✅ Diseño oficial elegido' : '⭐ Elegir este diseño'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
