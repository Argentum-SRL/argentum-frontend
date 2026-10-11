import { useState } from 'react'
import {
  FileText,
  Save,
  Check,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from '@/components/ui/icons'
import { SlidersHorizontal, RefreshCw } from 'lucide-react'
import type { DesignSpecification } from '@/types/diseno'
import { ConcurrencyConflictError } from '@/services/disenoService'
import styles from './DisenoSpecificationView.module.css'

interface Props {
  categoryId: string
  categoryName: string
  specifications: Record<string, DesignSpecification>
  onSaveSpec: (spec: DesignSpecification) => Promise<void> | void
  isSaving: boolean
  onReload?: () => void
}

export default function DisenoSpecificationView({
  categoryId,
  categoryName,
  specifications,
  onSaveSpec,
  isSaving,
  onReload,
}: Props) {
  const existingSpec = specifications[categoryId] || {
    familyId: categoryId,
    familyName: categoryName,
    targetTokens: {
      borderRadius: '12px',
      height: '40px',
      padding: '4px',
      fontSize: '13px',
      fontWeight: '600',
      boxShadow: 'var(--elevation-sm)',
      background: 'var(--surface-alt)',
      activeBackground: 'var(--surface)',
      transition: '180ms cubic-bezier(0.16, 1, 0.3, 1)',
    },
    stateGuidelines: {
      hover: 'color: var(--text); transform: translateY(-0.5px);',
      active: 'box-shadow: var(--elevation-sm); transform: translateY(-1.5px) scale(1.02); font-weight: 700;',
      focus: 'outline: 2px solid var(--primary); outline-offset: 2px;',
      disabled: 'opacity: 0.5; pointer-events: none;',
    },
    accessibilityRules: [
      'Contraste mínimo WCAG AA (ratio 4.5:1)',
      'Soporte completo de navegación por teclado (Enter, Espacio, Flechas)',
      'Roles ARIA estrictos (role=radiogroup, aria-checked o role=button)',
      'Focus visible accesible siempre presente',
    ],
    status: 'borrador',
    notes: 'Especificación oficial para unificar todas las instancias en la aplicación',
  }

  const [borderRadius, setBorderRadius] = useState(existingSpec.targetTokens.borderRadius || '12px')
  const [height, setHeight] = useState(existingSpec.targetTokens.height || '40px')
  const [padding, setPadding] = useState(existingSpec.targetTokens.padding || '4px')
  const [fontSize, setFontSize] = useState(existingSpec.targetTokens.fontSize || '13px')
  const [fontWeight, setFontWeight] = useState(existingSpec.targetTokens.fontWeight || '600')
  const [boxShadow, setBoxShadow] = useState(existingSpec.targetTokens.boxShadow || 'var(--elevation-sm)')
  const [containerBg, setContainerBg] = useState(existingSpec.targetTokens.background || 'var(--surface-alt)')
  const [status, setStatus] = useState<DesignSpecification['status']>(existingSpec.status || 'borrador')
  const [notes, setNotes] = useState(existingSpec.notes || '')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)

  // Estado del preview interactivo unificado
  const [previewActiveTab, setPreviewActiveTab] = useState<'opcion1' | 'opcion2' | 'opcion3'>('opcion1')

  const handleSave = async () => {
    setConflictError(null)
    const payload: DesignSpecification = {
      familyId: categoryId,
      familyName: categoryName,
      targetTokens: {
        borderRadius,
        height,
        padding,
        fontSize,
        fontWeight,
        boxShadow,
        background: containerBg,
        activeBackground: 'var(--surface)',
        transition: '180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      stateGuidelines: existingSpec.stateGuidelines,
      accessibilityRules: existingSpec.accessibilityRules,
      status,
      notes,
    }

    try {
      await onSaveSpec(payload)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        setConflictError(err.message)
      } else if (err instanceof Error) {
        setConflictError(`Error al sincronizar: ${err.message}`)
      }
    }
  }

  return (
    <div className={styles.specContainer}>
      {/* Banner de Conflicto de Concurrencia (si ocurrió 409) */}
      {conflictError && (
        <div className={styles.conflictAlertBanner}>
          <div className={styles.conflictAlertText}>
            <AlertTriangle size={18} />
            <span>{conflictError}</span>
          </div>
          <button
            type="button"
            className={styles.conflictDismissBtn}
            onClick={() => {
              setConflictError(null)
              if (onReload) onReload()
            }}
          >
            <RefreshCw size={12} style={{ marginRight: 4 }} />
            Recargar Versión del Servidor
          </button>
        </div>
      )}

      <div className={styles.specHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.specIconWrap}>
            <FileText size={20} />
          </div>
          <div>
            <h2 className={styles.specTitle}>Especificación Centralizada: {categoryName}</h2>
            <p className={styles.specSubtitle}>
              Define los tokens normativos oficiales que heredarán todos los módulos productivos de Argentum.
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.statusButtons}>
            {(['borrador', 'revisada', 'aprobada'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`${styles.statusBtn} ${status === st ? styles.statusBtnActive : ''}`}
                onClick={() => setStatus(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.saveSpecBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {savedSuccess ? (
              <>
                <Check size={16} />
                <span>Especificación Guardada</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isSaving ? 'Guardando...' : 'Aprobar & Guardar'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Editor de Tokens a la izquierda + Live Component Preview a la derecha */}
      <div className={styles.specEditorGrid}>
        {/* Panel 1: Tokens Configurables */}
        <div className={styles.tokensEditorCard}>
          <div className={styles.cardHeader}>
            <SlidersHorizontal size={16} />
            <span className={styles.cardTitle}>Tokens Visuales Objetivo</span>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Curvatura (Border Radius)</label>
              <select
                className={styles.selectField}
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
              >
                <option value="8px">8px (Compacto)</option>
                <option value="10px">10px (Semi-curvo)</option>
                <option value="12px">12px (Estándar Argentum)</option>
                <option value="14px">14px (Suave / Modales)</option>
                <option value="16px">16px (Tarjetas)</option>
                <option value="9999px">Píldora completa (9999px)</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Altura Base (Height)</label>
              <select
                className={styles.selectField}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              >
                <option value="36px">36px (Compacto)</option>
                <option value="38px">38px (Transacciones)</option>
                <option value="40px">40px (Equilibrado)</option>
                <option value="42px">42px (Pagar Resumen)</option>
                <option value="44px">44px (Presupuesto)</option>
                <option value="48px">48px (Hero Touch)</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Relleno Contenedor (Padding)</label>
              <select
                className={styles.selectField}
                value={padding}
                onChange={(e) => setPadding(e.target.value)}
              >
                <option value="2px">2px (Mínimo)</option>
                <option value="3px">3px</option>
                <option value="4px">4px (Recomendado)</option>
                <option value="6px">6px</option>
                <option value="0px">Sin contenedor (0px)</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Tamaño Tipográfico (Font Size)</label>
              <select
                className={styles.selectField}
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              >
                <option value="12px">12px (Compacto)</option>
                <option value="13px">13px (Predeterminado Figtree)</option>
                <option value="14px">14px</option>
                <option value="15px">15px</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Grosor Tipográfico (Font Weight)</label>
              <select
                className={styles.selectField}
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
              >
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Sombra de Selección (Box Shadow)</label>
              <select
                className={styles.selectField}
                value={boxShadow}
                onChange={(e) => setBoxShadow(e.target.value)}
              >
                <option value="var(--elevation-none)">Ninguna (--elevation-none)</option>
                <option value="var(--elevation-xs)">Sutil (--elevation-xs)</option>
                <option value="var(--elevation-sm)">Elevación Sm (--elevation-sm)</option>
                <option value="var(--elevation-md)">Elevación Md (--elevation-md)</option>
                <option value="var(--elevation-selection)">Selección Contextual</option>
              </select>
            </div>

            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>Fondo Contenedor</label>
              <select
                className={styles.selectField}
                value={containerBg}
                onChange={(e) => setContainerBg(e.target.value)}
              >
                <option value="var(--surface-alt)">var(--surface-alt)</option>
                <option value="var(--surface-3)">var(--surface-3)</option>
                <option value="var(--page)">var(--page)</option>
                <option value="transparent">transparent (Sin caja gris)</option>
              </select>
            </div>
          </div>

          <div className={styles.notesSection}>
            <label className={styles.fieldLabel}>Notas & Criterios de Migración:</label>
            <textarea
              className={styles.textareaField}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones para reemplazar las versiones locales..."
            />
          </div>
        </div>

        {/* Panel 2: Live Preview Estandarizado */}
        <div className={styles.previewCard}>
          <div className={styles.cardHeader}>
            <Sparkles size={16} />
            <span className={styles.cardTitle}>Vista Previa Viva del Componente Unificado</span>
          </div>

          <div className={styles.livePreviewCanvas}>
            <div
              className={styles.dynamicUnifiedContainer}
              style={{
                borderRadius,
                padding,
                background: containerBg,
              }}
              role="radiogroup"
              aria-label="Componente unificado según especificación"
            >
              {[
                { id: 'opcion1', label: 'Opción Primaria' },
                { id: 'opcion2', label: 'Opción Secundaria' },
                { id: 'opcion3', label: 'Tercera Opción' },
              ].map((opt) => {
                const isActive = previewActiveTab === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`${styles.dynamicUnifiedPill} ${isActive ? styles.dynamicActivePill : ''}`}
                    style={{
                      height,
                      borderRadius: borderRadius === '9999px' ? '9999px' : `calc(${borderRadius} - 2px)`,
                      fontSize,
                      fontWeight: isActive ? 700 : Number(fontWeight),
                      boxShadow: isActive ? boxShadow : 'none',
                    }}
                    onClick={() => setPreviewActiveTab(opt.id as typeof previewActiveTab)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reglas de Accesibilidad y Estado */}
          <div className={styles.a11yBox}>
            <div className={styles.a11yHeader}>
              <ShieldCheck size={16} />
              <span>Garantías de Calidad y Accesibilidad (a11y)</span>
            </div>
            <ul className={styles.a11yList}>
              {existingSpec.accessibilityRules.map((rule, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={13} className={styles.checkIcon} />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
