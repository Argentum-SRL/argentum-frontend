import { useState } from 'react'
import {
  Sparkles,
  Check,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from '@/components/ui/icons'
import { RefreshCw } from 'lucide-react'
import type {
  DesignVariant,
  DesignDecision,
  DecisionState,
  CanonicalPattern,
} from '@/types/diseno'
import { ConcurrencyConflictError } from '@/services/disenoService'
import {
  DemoSegmentedControls,
  DemoSelectableCards,
  DemoActionButtons,
  DemoInputs,
  DemoElementosFinancieros,
  DemoTarjetasPaneles,
  DemoModalesDialogos,
  DemoSeleccionAvanzada,
  DemoNavegacion,
  DemoElementosInformativos,
  DemoEstadosInterfaz,
  DemoControlesEspeciales,
} from './InteractiveDemos'
import styles from './DisenoCatalogView.module.css'

interface Props {
  categoryId: string
  categoryName: string
  categoryDescription: string
  variants: DesignVariant[]
  canonicalPatterns: CanonicalPattern[]
  decisions: Record<string, DesignDecision>
  onSaveDecision: (decision: DesignDecision) => Promise<void> | void
  isSaving: boolean
  onReload?: () => void
}

export default function DisenoCatalogView({
  categoryId,
  categoryName,
  categoryDescription,
  variants,
  canonicalPatterns,
  decisions,
  onSaveDecision,
  isSaving,
  onReload,
}: Props) {
  const currentDecision = decisions[categoryId] || {
    categoryId,
    preferredVariantId: null,
    preferredVariantName: null,
    decisionState: 'pendiente',
    notes: '',
    equivalentComponents: [],
    customTokens: {},
    version: 1,
  }

  const [preferredId, setPreferredId] = useState<string | null>(
    currentDecision.preferredVariantId || null
  )
  const [preferredName, setPreferredName] = useState<string | null>(
    currentDecision.preferredVariantName || null
  )
  const [decisionState, setDecisionState] = useState<DecisionState>(
    currentDecision.decisionState || 'pendiente'
  )
  const [notes, setNotes] = useState<string>(currentDecision.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)

  // Selección directa e instantánea al tocar "Elegir este diseño" en cualquier tarjeta
  const handleDirectSelect = async (id: string, name: string) => {
    setConflictError(null)
    const isUnselecting = preferredId === id
    const newId = isUnselecting ? null : id
    const newName = isUnselecting ? null : name
    const newState: DecisionState = isUnselecting ? 'pendiente' : 'aprobada'

    setPreferredId(newId)
    setPreferredName(newName)
    setDecisionState(newState)

    const selectedVariant = variants.find((v) => v.id === newId)
    const payload: DesignDecision = {
      categoryId,
      preferredVariantId: newId,
      preferredVariantName: newName,
      decisionState: newState,
      notes,
      equivalentComponents: variants.filter((v) => !v.isShared).map((v) => v.name),
      customTokens: selectedVariant
        ? (Object.fromEntries(
            Object.entries(selectedVariant.extractedStyles).filter(([, v]) => v !== null) as [string, string][]
          ) as Record<string, string>)
        : {},
      version: currentDecision.version,
    }

    try {
      await onSaveDecision(payload)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2200)
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        setConflictError(err.message)
      } else if (err instanceof Error) {
        setConflictError(`Error al sincronizar: ${err.message}`)
      }
    }
  }

  // Guardado manual de estado o notas
  const handleSave = async (overrideState?: DecisionState) => {
    setConflictError(null)
    const stateToSave = overrideState || decisionState
    const selectedVariant = variants.find((v) => v.id === preferredId)
    const selectedCanonical = canonicalPatterns.find((p) => p.id === preferredId)

    const payload: DesignDecision = {
      categoryId,
      preferredVariantId: preferredId,
      preferredVariantName: selectedCanonical
        ? selectedCanonical.name
        : selectedVariant
        ? selectedVariant.name
        : preferredName || currentDecision.preferredVariantName,
      decisionState: stateToSave,
      notes,
      equivalentComponents: variants.filter((v) => !v.isShared).map((v) => v.name),
      customTokens: selectedVariant
        ? (Object.fromEntries(
            Object.entries(selectedVariant.extractedStyles).filter(([, v]) => v !== null) as [string, string][]
          ) as Record<string, string>)
        : {},
      version: currentDecision.version,
    }

    try {
      await onSaveDecision(payload)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2200)
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        setConflictError(err.message)
      } else if (err instanceof Error) {
        setConflictError(`Error al sincronizar: ${err.message}`)
      }
    }
  }

  // Renderizar la demo interactiva correspondiente a las 12 familias de la app
  const renderCategoryDemo = () => {
    const demoProps = {
      selectedId: preferredId,
      onSelect: handleDirectSelect,
    }

    switch (categoryId) {
      case 'selectores_segmentados':
        return <DemoSegmentedControls {...demoProps} />
      case 'opciones_seleccionables':
        return <DemoSelectableCards {...demoProps} />
      case 'botones_accion':
        return <DemoActionButtons {...demoProps} />
      case 'campos_entrada':
        return <DemoInputs {...demoProps} />
      case 'elementos_financieros':
        return <DemoElementosFinancieros {...demoProps} />
      case 'tarjetas_paneles':
        return <DemoTarjetasPaneles {...demoProps} />
      case 'modales_dialogos':
        return <DemoModalesDialogos {...demoProps} />
      case 'seleccion_avanzada':
        return <DemoSeleccionAvanzada {...demoProps} />
      case 'navegacion':
        return <DemoNavegacion {...demoProps} />
      case 'elementos_informativos':
        return <DemoElementosInformativos {...demoProps} />
      case 'estados_interfaz':
        return <DemoEstadosInterfaz {...demoProps} />
      case 'controles_especiales':
        return <DemoControlesEspeciales {...demoProps} />
      default:
        return null
    }
  }

  const chosenDisplayName =
    canonicalPatterns.find((p) => p.id === preferredId)?.name ||
    variants.find((v) => v.id === preferredId)?.name ||
    preferredName ||
    preferredId

  return (
    <div className={styles.catalogContainer}>
      {/* Alerta de conflicto de concurrencia */}
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

      {/* Encabezado de la Familia */}
      <div className={styles.categoryOverview}>
        <div className={styles.overviewText}>
          <h2 className={styles.categoryTitle}>{categoryName}</h2>
          <p className={styles.categoryDesc}>{categoryDescription}</p>
        </div>

        {/* Banner de Estado Visual */}
        <div className={styles.statusBanner}>
          <div className={styles.statusBannerLeft}>
            {preferredId ? (
              <div className={styles.statusActiveGroup}>
                <span className={styles.statusIcon}>🟢</span>
                <div>
                  <span className={styles.statusHeading}>Diseño Oficial Seleccionado</span>
                  <span className={styles.statusSelectedName}>{chosenDisplayName}</span>
                  <p className={styles.statusSubtext} style={{ margin: '4px 0 0 0' }}>
                    Este es el estándar elegido para esta familia. Podés cambiarlo tocando otra opción abajo.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.statusPendingGroup}>
                <span className={styles.statusIcon}>⚪</span>
                <div>
                  <span className={styles.statusHeading}>Pendiente de Decisión</span>
                  <span className={styles.statusSubtext} style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Todavía no elegiste el diseño estándar para esta familia.
                  </span>
                  <p className={styles.statusSubtext} style={{ margin: '4px 0 0 0' }}>
                    Mirá las opciones abajo y tocá <strong>"⭐ Elegir este diseño"</strong> en tu favorita.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.statusBannerRight}>
            <div className={styles.statusButtonsMini} title="Estado de la decisión">
              {(['pendiente', 'revisada', 'aprobada'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`${styles.miniStatusBtn} ${decisionState === st ? styles.miniStatusBtnActive : ''}`}
                  onClick={() => {
                    setDecisionState(st)
                    handleSave(st)
                  }}
                >
                  {st === 'aprobada' ? '✅ Aprobada' : st === 'revisada' ? '🟡 Revisión' : '⚪ Pendiente'}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.saveBtnDirect}
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {savedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Acordeón de Notas Opcionales */}
        <div className={styles.notesAccordion}>
          <button
            type="button"
            className={styles.notesToggleBtn}
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{notes ? '📝 Editar aclaración o nota personal' : '➕ Agregar una nota o aclaración para el diseño (opcional)'}</span>
          </button>

          {showNotes && (
            <div className={styles.notesWrap} style={{ marginTop: 8 }}>
              <textarea
                className={styles.notesInput}
                rows={2}
                placeholder="Ej: Quiero que todos los modales de la app tengan las esquinas amplias estilo Apple..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => handleSave()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Galería Visual de Opciones */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Sparkles size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Opciones Reales en Pantalla (Hacé clic para probarlas)</h3>
          </div>
          <span className={styles.sectionSubtitle}>
            Probá la interacción de cada variante y tocá <strong>"⭐ Elegir este diseño"</strong> en la que prefieras.
          </span>
        </div>

        <div className={styles.demosWrapper}>{renderCategoryDemo()}</div>
      </section>
    </div>
  )
}
