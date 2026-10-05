import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Plus, 
  Minus,
  Trash2, 
  Target,
  Trophy,
  Pencil,
  Pause,
  Play,
  CheckCircle2,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import goalsService from '@/services/goals.service'
import type { Goal, GoalMovement } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import type { Billetera } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './GoalDetailModal.module.css'

interface GoalDetailModalProps {
  open: boolean
  onClose: () => void
  goal: Goal | null
  billeteras: Billetera[]
  onSuccess?: () => void
}

export default function GoalDetailModal({
  open,
  onClose,
  goal: initialGoal,
  billeteras,
  onSuccess
}: GoalDetailModalProps) {
  const { open: openModal, confirm } = useModal()
  const [freshGoal, setFreshGoal] = useState<Goal | null>(null)
  const [showAllMovements, setShowAllMovements] = useState(false)

  const goalId = initialGoal?.id

  const refreshGoal = async () => {
    if (!goalId) return
    try {
      const data = await goalsService.getGoal(goalId)
      setFreshGoal(data)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!open || !goalId) return
    const controller = new AbortController()

    const load = async () => {
      try {
        const data = await goalsService.getGoal(goalId, controller.signal)
        if (!controller.signal.aborted) {
          setFreshGoal(data)
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error(err)
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [open, goalId])

  const goal = freshGoal || initialGoal

  const objetivo = Number(goal?.monto_objetivo || 1)
  const actual = Number(goal?.monto_actual || 0)
  const porcentaje = objetivo > 0 ? (actual / objetivo) * 100 : 0
  const restante = Math.max(0, objetivo - actual)
  const isCompleted = porcentaje >= 100 || goal?.estado === EstadoMeta.COMPLETADA
  const isPaused = goal?.estado === EstadoMeta.PAUSADA
  const goalColor = goal?.color || 'var(--primary)'

  // Sort movements newest first
  const sortedMovements = goal?.movimientos && goal.movimientos.length > 0
    ? [...goal.movimientos].sort((a, b) => {
        const dateA = new Date(a.fecha || a.fecha_creacion).getTime()
        const dateB = new Date(b.fecha || b.fecha_creacion).getTime()
        return dateB - dateA
      })
    : []

  const visibleMovements = showAllMovements ? sortedMovements : sortedMovements.slice(0, 5)
  const remainingMovementsCount = Math.max(0, sortedMovements.length - 5)

  // Adaptive Height Hook
  const {
    fieldsRef,
    footerRef,
    dynamicHeight
  } = useAdaptiveModalHeight({
    enabled: open,
    extraPadding: 24,
    deps: [goal?.id, actual, objetivo, sortedMovements.length, showAllMovements]
  })

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleContribute = () => {
    if (!goal) return
    onClose()
    openModal('goalContribution', {
      data: {
        goal,
        billeteras,
        onSuccess: async () => {
          onSuccess?.()
        }
      }
    })
  }

  const handleEdit = () => {
    if (!goal) return
    onClose()
    openModal('goal', {
      data: {
        goal,
        onSuccess: async () => {
          onSuccess?.()
        }
      }
    })
  }

  const handleToggleStatus = async () => {
    if (!goal) return
    const nuevoEstado = goal.estado === EstadoMeta.ACTIVA ? EstadoMeta.PAUSADA : EstadoMeta.ACTIVA
    try {
      await goalsService.updateGoal(goal.id, { estado: nuevoEstado })
      sileo.success({ title: `Meta ${nuevoEstado === EstadoMeta.PAUSADA ? 'pausada' : 'reanudada'}` })
      void refreshGoal()
      onSuccess?.()
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'Error al cambiar el estado') })
    }
  }

  const handleDeleteMovement = (movementId: string) => {
    if (!goal) return

    confirm({
      title: '¿Eliminás este movimiento?',
      description: 'El saldo de la billetera y el acumulado de la meta se van a ajustar automáticamente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await goalsService.deleteMovement(goal.id, movementId)
          sileo.success({ title: 'Movimiento eliminado' })
          void refreshGoal()
          onSuccess?.()
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos eliminar el movimiento.') })
        }
      }
    })
  }

  const handleDeleteGoal = () => {
    if (!goal) return
    
    if (goal.monto_actual > 0) {
      confirm({
        title: 'Meta con fondos acumulados',
        description: `Esta meta todavía tiene ${formatMonto(goal.monto_actual, goal.moneda as 'ARS' | 'USD')} ahorrados. Tenés que retirar el saldo antes de poder eliminarla.`,
        variant: 'warning',
        confirmLabel: 'Retirar fondos',
        cancelLabel: 'Cerrar',
        onConfirm: () => {
          handleContribute()
        }
      })
      return
    }

    confirm({
      title: `¿Eliminar "${goal.nombre}"?`,
      description: 'Se borrará permanentemente la meta y todo su historial de movimientos. Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar meta',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await goalsService.deleteGoal(goal.id)
          sileo.success({ title: 'Meta eliminada' })
          onClose()
          onSuccess?.()
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos eliminar la meta.') })
        }
      }
    })
  }

  if (!goal) return null

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel={`Detalle de ${goal.nombre}`}
      className={styles.modalDialog}
    >
      <div 
        className={styles.modalContainer}
        style={{ height: dynamicHeight ? `${dynamicHeight}px` : 'auto' }}
      >
        {/* ── Modal Body (Scrollable Content) ─────────────────────────── */}
        <div ref={fieldsRef} className={styles.body}>
          
          {/* Header integrado en el flujo de scroll */}
          <div className={styles.formHeader}>
            <div className={styles.headerLeft}>
              <h2 className={styles.headerTitle}>Detalle de meta</h2>
            </div>
            <div className={styles.headerRightActions}>
              <button 
                type="button" 
                className={styles.closeBtn} 
                onClick={onClose}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Tarjeta de Identidad de la Meta */}
          <div className={styles.identityCard}>
            <div 
              className={styles.goalAvatar}
              style={{
                backgroundColor: isCompleted 
                  ? 'rgba(26, 122, 74, 0.12)' 
                  : (goal.color ? `${goal.color}15` : 'var(--surface-alt)'),
                color: isCompleted ? 'var(--success)' : (goal.color || 'var(--primary)'),
                borderColor: isCompleted 
                  ? 'rgba(26, 122, 74, 0.25)' 
                  : (goal.color ? `${goal.color}30` : 'var(--border)')
              }}
            >
              {isCompleted ? (
                <Trophy size={20} strokeWidth={2.2} />
              ) : (
                <Target size={20} strokeWidth={2.2} />
              )}
            </div>

            <div className={styles.identityInfo}>
              <div className={styles.titleRow}>
                <h3 className={styles.goalName} title={goal.nombre}>
                  {goal.nombre}
                </h3>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.currencyPill}>
                  {goal.moneda === 'USD' ? 'USD' : 'ARS'}
                </span>

                {isPaused && (
                  <span className={styles.statusPillPaused}>
                    <Pause size={10} strokeWidth={2.5} />
                    Pausada
                  </span>
                )}

                {isCompleted && (
                  <span className={styles.statusPillCompleted}>
                    <CheckCircle2 size={11} strokeWidth={2.5} />
                    Completada
                  </span>
                )}

                <span className={styles.dateMeta}>
                  <Calendar size={12} className={styles.dateIcon} />
                  <span>
                    {goal.fecha_limite ? `Vence ${formatFecha(goal.fecha_limite)}` : 'Sin límite'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Hero de Progreso */}
          <div className={styles.heroCard}>
            <div className={styles.heroAmounts}>
              <div className={styles.amountBlock}>
                <span className={styles.amountLabel}>Ahorrado</span>
                <div className={styles.currentAmount}>
                  {formatMonto(actual, goal.moneda as 'ARS' | 'USD')}
                </div>
              </div>

              <div className={`${styles.amountBlock} ${styles.targetBlock}`}>
                <span className={styles.amountLabel}>Objetivo</span>
                <div className={styles.targetAmount}>
                  {formatMonto(objetivo, goal.moneda as 'ARS' | 'USD')}
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className={styles.progressTrackContainer}>
              <div 
                className={styles.progressFill}
                style={{
                  width: `${Math.min(porcentaje, 100)}%`,
                  backgroundColor: isCompleted ? 'var(--success)' : goalColor
                }}
              />
            </div>

            {/* Resumen inferior del Hero */}
            <div className={styles.heroFooter}>
              <div className={styles.percentDisplay}>
                <span className={styles.percentNumber}>{porcentaje.toFixed(1)}%</span>
                <span className={styles.percentText}>completado</span>
              </div>

              <div className={styles.deltaDisplay}>
                {isCompleted ? (
                  <span className={styles.successNote}>
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    ¡Objetivo alcanzado!
                  </span>
                ) : actual > objetivo ? (
                  <span className={styles.excessNote}>
                    Excedente: +{formatMonto(actual - objetivo, goal.moneda as 'ARS' | 'USD')}
                  </span>
                ) : (
                  <span className={styles.remainingNote}>
                    Faltan <strong className={styles.remainingStrong}>{formatMonto(restante, goal.moneda as 'ARS' | 'USD')}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Nota de la meta */}
            {goal.nota && (
              <div className={styles.noteBox}>
                <FileText size={13} className={styles.noteIcon} />
                <p className={styles.noteText}>{goal.nota}</p>
              </div>
            )}
          </div>

          {/* Historial de Movimientos */}
          <div className={styles.movementsSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.titleWithBadge}>
                <h3 className={styles.sectionTitle}>Movimientos</h3>
                <span className={styles.countBadge}>{sortedMovements.length}</span>
              </div>
            </div>

            {sortedMovements.length > 0 ? (
              <>
                <div className={styles.movementsList}>
                  {visibleMovements.map((m: GoalMovement) => {
                    const isAporte = m.tipo === 'aporte'
                    return (
                      <div key={m.id} className={styles.movementItem}>
                        <div className={`${styles.movIconWrap} ${isAporte ? styles.movIconAporte : styles.movIconRetiro}`}>
                          {isAporte ? <Plus size={13} strokeWidth={2.5} /> : <Minus size={13} strokeWidth={2.5} />}
                        </div>

                        <div className={styles.movDetails}>
                          <span className={styles.movTitle}>
                            {isAporte ? 'Aporte a la meta' : 'Retiro de fondos'}
                          </span>
                          <span className={styles.movMeta}>
                            {m.billetera?.nombre ? `${m.billetera.nombre} · ` : ''}
                            {formatFecha(m.fecha || m.fecha_creacion)}
                          </span>
                        </div>

                        <div className={styles.movAmountGroup}>
                          <span className={`${styles.movAmount} ${isAporte ? styles.amountPositive : styles.amountNegative}`}>
                            {isAporte ? '+' : '-'}{formatMonto(m.monto, (m.moneda_movimiento || goal.moneda) as 'ARS' | 'USD')}
                          </span>
                          <button 
                            type="button" 
                            className={styles.deleteMovBtn} 
                            onClick={() => handleDeleteMovement(m.id)}
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {sortedMovements.length > 5 && (
                  <button
                    type="button"
                    className={styles.toggleMovementsBtn}
                    onClick={() => setShowAllMovements(prev => !prev)}
                  >
                    {showAllMovements ? (
                      <>
                        <ChevronUp size={14} />
                        <span>Mostrar menos</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        <span>
                          Mostrar {remainingMovementsCount} {remainingMovementsCount === 1 ? 'movimiento más' : 'movimientos más'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className={styles.emptyMovementsState}>
                <div className={styles.emptyIconCircle}>
                  <Activity size={18} />
                </div>
                <p className={styles.emptyMovTitle}>No hay movimientos registrados</p>
                <p className={styles.emptyMovSubtitle}>
                  Comenzá aportando saldo desde una de tus billeteras.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── Modal Footer (Actions) ──────────────────────────────────── */}
        <div ref={footerRef} className={styles.footer}>
          <div className={styles.footerSecondaryGroup}>
            {!isCompleted && (
              <button 
                type="button"
                className={styles.footerIconBtn} 
                onClick={handleToggleStatus}
                title={isPaused ? 'Reanudar meta' : 'Pausar meta'}
                aria-label={isPaused ? 'Reanudar meta' : 'Pausar meta'}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}

            <button 
              type="button"
              className={styles.footerIconBtn} 
              onClick={handleEdit}
              title="Editar meta"
              aria-label="Editar meta"
            >
              <Pencil size={15} />
            </button>

            <button 
              type="button"
              className={`${styles.footerIconBtn} ${styles.dangerIconBtn}`} 
              onClick={handleDeleteGoal}
              title="Eliminar meta"
              aria-label="Eliminar meta"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <button 
            type="button"
            className={`${styles.primaryBtn} ${isCompleted ? styles.completedBtn : ''}`}
            onClick={handleContribute}
          >
            {isCompleted ? (
              <>
                <Trophy size={15} />
                <span>Gestionar fondos</span>
              </>
            ) : (
              <>
                <Plus size={15} strokeWidth={2.5} />
                <span>Aportar dinero</span>
              </>
            )}
          </button>
        </div>

      </div>
    </Modal>
  )
}
