import { useState } from 'react'
import {
  Sparkles,
  Star,
  Check,
  Save,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
} from '@/components/ui/icons'
import { FileCode, GitFork, RefreshCw } from 'lucide-react'
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
  DemoTarjetasPaneles,
  DemoModalesDialogos,
  DemoElementosInformativos,
  DemoInterfaceStates,
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
  const [showTechDetails, setShowTechDetails] = useState(false)
  const [openPlanPatternId, setOpenPlanPatternId] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'canonicos' | 'raw'>('canonicos')
  const [copiedPatternId, setCopiedPatternId] = useState<string | null>(null)



  // Selección directa e instantánea desde las tarjetas de demostración
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

  const handleCopyMigrationTask = (pat: CanonicalPattern) => {
    if (!pat.migrationTask) return

    const markdown = [
      `# Tarea de Migración de Diseño: ${pat.name}`,
      `**Categoría:** ${pat.category}`,
      `**Componente Origen:** \`${pat.componentName}\` (${pat.primaryFile})`,
      `**Uso en Código:** ${pat.usageCount} ocurrencias`,
      '',
      '## Archivos a Modificar',
      ...(pat.migrationTask.filesToModify.length > 0
        ? pat.migrationTask.filesToModify.map((f) => `- [ ] \`${f}\``)
        : ['- No requiere modificaciones (ya es la primitiva oficial).']),
      '',
      '## Reemplazo de Props / Sintaxis',
      '```tsx',
      ...Object.entries(pat.migrationTask.propsToReplace).map(([oldCode, newCode]) => `// Reemplazar:\n${oldCode}\n// Por:\n${newCode}`),
      '```',
      '',
      '## Riesgos de Ruptura (Breaking Changes)',
      ...pat.migrationTask.breakingRisks.map((r) => `- ⚠️ ${r}`),
      '',
      '## Pasos de Validación y Pruebas',
      ...pat.migrationTask.verificationSteps.map((s) => `- [ ] \`${s}\``),
      '',
      `*Generado automáticamente por el Catálogo de Diseño de Argentum — ${new Date().toLocaleDateString('es-AR')}*`,
    ].join('\n')

    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedPatternId(pat.id)
      setTimeout(() => setCopiedPatternId(null), 2500)
    })
  }

  // Renderizar la demo interactiva adecuada según la categoría con botones directos
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
      case 'tarjetas_paneles':
        return <DemoTarjetasPaneles {...demoProps} />
      case 'modales_dialogos':
        return <DemoModalesDialogos />
      case 'elementos_informativos':
        return <DemoElementosInformativos {...demoProps} />
      case 'estados_interfaz':
        return <DemoInterfaceStates {...demoProps} />
      default:
        return null
    }
  }

  return (
    <div className={styles.catalogContainer}>
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

      {/* Encabezado de Categoría y Barra de Estado */}
      <div className={styles.categoryOverview}>
        <div className={styles.overviewText}>
          <h2 className={styles.categoryTitle}>{categoryName}</h2>
          <p className={styles.categoryDesc}>{categoryDescription}</p>
        </div>

        {/* Banner de Estado Fácil y Claro */}
        <div className={styles.statusBanner}>
          <div className={styles.statusBannerLeft}>
            {preferredId ? (
              <div className={styles.statusActiveGroup}>
                <span className={styles.statusIcon}>🟢</span>
                <div>
                  <span className={styles.statusHeading}>Diseño Oficial Seleccionado</span>
                  <span className={styles.statusSelectedName}>
                    {canonicalPatterns.find((p) => p.id === preferredId)?.name ||
                      variants.find((v) => v.id === preferredId)?.name ||
                      preferredName ||
                      preferredId}
                  </span>
                  <p className={styles.statusSubtext} style={{ margin: '4px 0 0 0' }}>
                    Este diseño es el estándar elegido para esta familia. Podés cambiarlo tocando otra opción.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.statusPendingGroup}>
                <span className={styles.statusIcon}>⚪</span>
                <div>
                  <span className={styles.statusHeading}>Familia Pendiente de Elección</span>
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

        {/* Notas opcionales plegables */}
        <div className={styles.notesAccordion}>
          <button
            type="button"
            className={styles.notesToggleBtn}
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{notes ? '📝 Editar notas o directrices de equipo' : '➕ Agregar una nota o aclaración para el equipo (opcional)'}</span>
          </button>

          {showNotes && (
            <div className={styles.notesWrap} style={{ marginTop: 8 }}>
              <textarea
                className={styles.notesInput}
                rows={2}
                placeholder="Ej: Unificar todos los modales para que usen border-radius 12px, padding 4px y elevación sutil..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => handleSave()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sección 1: Laboratorio de Demostración Interactiva en Vivo (HERO) */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Sparkles size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>1. Opciones Reales en Pantalla (Hacé clic para probarlas)</h3>
          </div>
          <span className={styles.sectionSubtitle}>
            Tocá los botones, alterná opciones y elegí la variante que mejor se sienta.
          </span>
        </div>

        <div className={styles.demosWrapper}>{renderCategoryDemo()}</div>
      </section>

      {/* Sección 2: Acordeón de Datos de Código y Migración (Colapsado por defecto) */}
      <div className={styles.techAccordionBlock}>
        <button
          type="button"
          className={styles.techAccordionToggleBtn}
          onClick={() => setShowTechDetails(!showTechDetails)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCode size={16} />
            <span>
              {showTechDetails
                ? 'Ocultar datos técnicos de código'
                : `🛠️ Ver datos técnicos de auditoría (${canonicalPatterns.length} patrones canónicos en ${variants.length} archivos)`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span>{showTechDetails ? 'Cerrar' : 'Para programadores'}</span>
            {showTechDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showTechDetails && (
          <>
            {/* Selector de Modo de Visualización: Canónicos vs Ocurrencias Crudas */}
            <div className={styles.viewModeContainer}>
              <div className={styles.viewModeInfo}>
                <span className={styles.viewModeTitle}>Agrupación Inteligente & Reducción de Ruido</span>
                <span className={styles.viewModeDesc}>
                  Distingue firmas de diseño canónicas únicas de las repeticiones sintácticas en los archivos
                </span>
              </div>

              <div className={styles.viewModeToggle}>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${viewMode === 'canonicos' ? styles.viewModeBtnActive : ''}`}
                  onClick={() => setViewMode('canonicos')}
                >
                  <GitFork size={14} />
                  <span>Patrones Canónicos ({canonicalPatterns.length})</span>
                </button>
                <button
                  type="button"
                  className={`${styles.viewModeBtn} ${viewMode === 'raw' ? styles.viewModeBtnActive : ''}`}
                  onClick={() => setViewMode('raw')}
                >
                  <FileCode size={14} />
                  <span>Ocurrencias AST ({variants.length})</span>
                </button>
              </div>
            </div>

            {/* Patrones Canónicos */}
            {viewMode === 'canonicos' && (
              <div className={styles.canonicalStack}>
                {canonicalPatterns.map((pat) => {
                  const isPreferred = preferredId === pat.id
                  const isPlanOpen = openPlanPatternId === pat.id

                  return (
                    <div
                      key={pat.id}
                      className={`${styles.canonicalCard} ${isPreferred ? styles.canonicalCardPreferred : ''}`}
                    >
                      <div className={styles.canonicalHeader}>
                        <div className={styles.canonicalTitleWrap}>
                          <div className={styles.canonicalNameRow}>
                            <span className={styles.canonicalName}>{pat.name}</span>
                            {pat.isShared ? (
                              <span className={styles.canonicalOfficialBadge}>Primitiva Oficial</span>
                            ) : (
                              <span className={styles.badgeLocal}>Implementación Local</span>
                            )}

                            <span className={styles.usageBadge}>
                              {pat.usageCount} {pat.usageCount === 1 ? 'uso' : 'usos en código'}
                            </span>

                            {pat.divergenceAgainstOfficial?.hasDivergence && (
                              <span className={styles.divergenceBadge}>
                                Divergencia: {pat.divergenceAgainstOfficial.radiusDelta || 'estilos locales'}
                              </span>
                            )}
                          </div>

                          <div className={styles.rowMeta}>
                            <span className={styles.metaFile}>
                              <code>{pat.primaryFile}</code>
                            </span>
                            <span className={styles.metaProp}>
                              Capacidad: {pat.renderingCapability.label}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`${styles.choosePreferredBtn} ${isPreferred ? styles.btnAlreadyPreferred : ''}`}
                          onClick={() => handleDirectSelect(pat.id, pat.name)}
                        >
                          <Star size={14} fill={isPreferred ? 'currentColor' : 'none'} />
                          <span>{isPreferred ? '✅ Elegida' : 'Elegir'}</span>
                        </button>
                      </div>

                      {/* Chips de Tokens Extraídos */}
                      <div className={styles.stylesChipsGrid}>
                        {pat.extractedStyles.borderRadius && (
                          <div className={styles.styleChip}>
                            <span className={styles.chipKey}>radius</span>
                            <span className={styles.chipVal}>{pat.extractedStyles.borderRadius}</span>
                          </div>
                        )}
                        {pat.extractedStyles.height && (
                          <div className={styles.styleChip}>
                            <span className={styles.chipKey}>height</span>
                            <span className={styles.chipVal}>{pat.extractedStyles.height}</span>
                          </div>
                        )}
                        {pat.extractedStyles.padding && (
                          <div className={styles.styleChip}>
                            <span className={styles.chipKey}>padding</span>
                            <span className={styles.chipVal}>{pat.extractedStyles.padding}</span>
                          </div>
                        )}
                        {pat.extractedStyles.boxShadow && (
                          <div className={styles.styleChip}>
                            <span className={styles.chipKey}>shadow</span>
                            <span className={styles.chipVal}>{pat.extractedStyles.boxShadow}</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle del Plan de Migración */}
                      {pat.migrationTask && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            className={styles.migrationToggleBtn}
                            onClick={() => setOpenPlanPatternId(isPlanOpen ? null : pat.id)}
                          >
                            {isPlanOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            <span>{isPlanOpen ? 'Ocultar plan de migración' : '📋 Ver plan de migración y archivos a modificar'}</span>
                          </button>

                          {isPlanOpen && (
                            <div className={styles.migrationPanel} style={{ marginTop: 10 }}>
                              <div className={styles.migrationPanelHeader}>
                                <div className={styles.migrationPanelTitle}>
                                  <FileCode size={15} />
                                  <span>Plan de Migración & Reemplazo Concreto</span>
                                </div>
                                <button
                                  type="button"
                                  className={styles.copyPlanBtn}
                                  onClick={() => handleCopyMigrationTask(pat)}
                                >
                                  {copiedPatternId === pat.id ? (
                                    <>
                                      <Check size={14} />
                                      <span>Copiado al Portapapeles</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={14} />
                                      <span>Copiar Tarea en Markdown</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {pat.migrationTask.filesToModify.length > 0 && (
                                <div className={styles.migrationSection}>
                                  <span className={styles.migrationSectionLabel}>Archivos a Modificar:</span>
                                  <div className={styles.migrationFileList}>
                                    {pat.migrationTask.filesToModify.map((f, i) => (
                                      <span key={i} className={styles.migrationFileChip}>
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {pat.migrationTask.breakingRisks.length > 0 && (
                                <div className={styles.migrationSection}>
                                  <span className={styles.migrationSectionLabel}>
                                    Riesgos de Ruptura (Breaking Changes):
                                  </span>
                                  <ul className={styles.breakingRisksList}>
                                    {pat.migrationTask.breakingRisks.map((risk, i) => (
                                      <li key={i}>{risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {pat.migrationTask.verificationSteps.length > 0 && (
                                <div className={styles.migrationSection}>
                                  <span className={styles.migrationSectionLabel}>
                                    Checklist de Verificación & Pruebas:
                                  </span>
                                  <ul className={styles.verificationChecklist}>
                                    {pat.migrationTask.verificationSteps.map((step, i) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ocurrencias AST Crudas */}
            {viewMode === 'raw' && (
              <div className={styles.variantsStack}>
                {variants.map((v) => {
                  const isPreferred = preferredId === v.id

                  return (
                    <div
                      key={v.id}
                      className={`${styles.variantRow} ${isPreferred ? styles.variantRowPreferred : ''}`}
                    >
                      <div className={styles.rowMain}>
                        <div className={styles.rowTop}>
                          <div className={styles.rowTitleWrap}>
                            <span className={styles.rowName}>{v.name}</span>
                            {v.isShared ? (
                              <span className={styles.badgeShared}>Compartido (Oficial)</span>
                            ) : (
                              <span className={styles.badgeLocal}>Local (Divergente)</span>
                            )}
                            {isPreferred && (
                              <span className={styles.badgePreferred}>
                                <Star size={12} fill="currentColor" />
                                Variante Preferida
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className={`${styles.choosePreferredBtn} ${isPreferred ? styles.btnAlreadyPreferred : ''}`}
                            onClick={() => handleDirectSelect(v.id, v.name)}
                          >
                            <Star size={14} fill={isPreferred ? 'currentColor' : 'none'} />
                            <span>{isPreferred ? '✅ Elegida' : 'Elegir'}</span>
                          </button>
                        </div>

                        <div className={styles.rowMeta}>
                          <span className={styles.metaFile}>
                            <code>
                              {v.filePath}#L{v.line}
                            </code>
                          </span>
                          {v.role && <span className={styles.metaProp}>role: {v.role}</span>}
                          {v.className && <span className={styles.metaProp}>class: {v.className}</span>}
                        </div>

                        {/* Chips de Estilos AST Extraídos */}
                        <div className={styles.stylesChipsGrid}>
                          {v.extractedStyles.borderRadius && (
                            <div className={styles.styleChip}>
                              <span className={styles.chipKey}>radius</span>
                              <span className={styles.chipVal}>{v.extractedStyles.borderRadius}</span>
                            </div>
                          )}
                          {v.extractedStyles.height && (
                            <div className={styles.styleChip}>
                              <span className={styles.chipKey}>height</span>
                              <span className={styles.chipVal}>{v.extractedStyles.height}</span>
                            </div>
                          )}
                          {v.extractedStyles.padding && (
                            <div className={styles.styleChip}>
                              <span className={styles.chipKey}>padding</span>
                              <span className={styles.chipVal}>{v.extractedStyles.padding}</span>
                            </div>
                          )}
                          {v.extractedStyles.boxShadow && (
                            <div className={styles.styleChip}>
                              <span className={styles.chipKey}>shadow</span>
                              <span className={styles.chipVal}>{v.extractedStyles.boxShadow}</span>
                            </div>
                          )}
                        </div>

                        <p className={styles.rowObservations}>{v.observations}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
