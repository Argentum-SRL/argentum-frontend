import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Calendar,
  Trash2,
  PieChart,
  Pencil,
  Pause,
  Play,
  AlertCircle,
  ArrowLeftRight,
  Receipt,
  History,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import presupuestoService from '@/services/presupuesto.service'
import transaccionService from '@/services/transaccion.service'
import type { Presupuesto, PeriodoPresupuesto, Categoria, Billetera, Transaccion } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { EmptyState } from '@/components/ui'
import styles from './PresupuestoDetailModal.module.css'

interface PresupuestoDetailModalProps {
  open: boolean
  onClose: () => void
  presupuesto: Presupuesto | null
  categorias?: Categoria[]
  billeteras?: Billetera[]
  onSuccess?: () => void
}

export default function PresupuestoDetailModal({
  open,
  onClose,
  presupuesto: initialPresupuesto,
  categorias = [],
  billeteras = [],
  onSuccess
}: PresupuestoDetailModalProps) {
  const { open: openModal, confirm } = useModal()
  const [freshPresupuesto, setFreshPresupuesto] = useState<Presupuesto | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [animClass, setAnimClass] = useState('')
  const [activeTab, setActiveTab] = useState<'gastos' | 'historial'>('gastos')
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [historial, setHistorial] = useState<PeriodoPresupuesto[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)

  const presupuestoId = initialPresupuesto?.id

  // Resetear a paso 1 al abrir o cambiar presupuesto (patrón canónico React sin efecto)
  const [prevOpenState, setPrevOpenState] = useState<{ open: boolean; id?: string }>({
    open,
    id: presupuestoId
  })

  if (prevOpenState.open !== open || prevOpenState.id !== presupuestoId) {
    setPrevOpenState({ open, id: presupuestoId })
    if (step !== 1) {
      setStep(1)
    }
    if (animClass !== '') {
      setAnimClass('')
    }
  }

  const handleGoStep = (targetStep: 1 | 2) => {
    if (targetStep === step) return
    setAnimClass(targetStep > step ? styles.slideForward : styles.slideBack)
    setStep(targetStep)
  }

  // ── 1. Cargar presupuesto fresco ───────────────────────────────────────────
  const refreshPresupuesto = useCallback(async () => {
    if (!presupuestoId) return
    try {
      const data = await presupuestoService.getPresupuesto(presupuestoId)
      setFreshPresupuesto(data)
    } catch {
      // Ignorar error de refresh
    }
  }, [presupuestoId])

  useEffect(() => {
    if (!open || !presupuestoId) return
    const controller = new AbortController()

    const load = async () => {
      try {
        const data = await presupuestoService.getPresupuesto(presupuestoId, controller.signal)
        if (!controller.signal.aborted) {
          setFreshPresupuesto(data)
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
  }, [open, presupuestoId])

  const presupuesto = freshPresupuesto || initialPresupuesto
  const p = presupuesto?.periodo_actual

  const limite = Number(p?.monto_limite || presupuesto?.monto || 1)
  const gastado = Number(p?.monto_usado || 0)
  const porcentaje = p && Number.isFinite(p.porcentaje_usado) ? p.porcentaje_usado : (limite > 0 ? (gastado / limite) * 100 : 0)
  const disponible = Math.max(0, limite - gastado)
  const isSuperado = porcentaje >= 100
  const isAlerta = porcentaje >= 80 && porcentaje < 100
  const isPaused = presupuesto?.estado === 'pausado'
  const moneda = (presupuesto?.moneda || 'ARS') as 'ARS' | 'USD'

  // ── 2. Cargar Transacciones del Ciclo Actual ────────────────────────────────
  useEffect(() => {
    if (!open || !presupuesto) return
    const controller = new AbortController()

    const loadTransacciones = async () => {
      setLoadingTx(true)
      try {
        const catIds = Array.from(
          new Set(
            (presupuesto.categorias || [])
              .map(c => c.categoria_id)
              .filter((id): id is string => Boolean(id))
          )
        )

        // Si NO hay periodo activo (p es undefined o no tiene fechas delimitadas),
        // este presupuesto no tiene gastos en un ciclo vigente
        if (!p?.fecha_inicio || !p?.fecha_fin) {
          setTransacciones([])
          setLoadingTx(false)
          return
        }

        const txList = await transaccionService.getTransacciones({
          categoria_ids: catIds.length > 0 ? catIds : undefined,
          fecha_desde: p.fecha_inicio,
          fecha_hasta: p.fecha_fin,
          tipo: 'egreso'
        }, controller.signal)

        if (!controller.signal.aborted) {
          // Filtrar adicionalmente si hay subcategorías específicas en el presupuesto
          const subcatIds = new Set(
            (presupuesto.categorias || [])
              .filter(c => c.es_subcategoria && c.subcategoria_id)
              .map(c => c.subcategoria_id)
          )

          let filtered = txList
          if (subcatIds.size > 0) {
            filtered = txList.filter(t => {
              // Si la transacción coincide con la subcategoría o si la categoría principal no exige subcat
              if (t.subcategoria_id && subcatIds.has(t.subcategoria_id)) return true
              return (presupuesto.categorias || []).some(c => !c.es_subcategoria && c.categoria_id === t.categoria_id)
            })
          }

          setTransacciones(filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error(err)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTx(false)
        }
      }
    }

    void loadTransacciones()
    return () => {
      controller.abort()
    }
  }, [open, presupuesto, p?.fecha_inicio, p?.fecha_fin])

  // ── 3. Cargar Historial de Ciclos ───────────────────────────────────────────
  useEffect(() => {
    if (!open || !presupuestoId) return
    const controller = new AbortController()

    const loadHistorial = async () => {
      setLoadingHistorial(true)
      try {
        const data = await presupuestoService.getHistorial(presupuestoId, controller.signal)
        if (!controller.signal.aborted) {
          setHistorial(data)
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error(err)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistorial(false)
        }
      }
    }

    void loadHistorial()
    return () => {
      controller.abort()
    }
  }, [open, presupuestoId])

  // Cálculo de sugerencia de ajuste
  const superado3Seguidos = useMemo(() => {
    if (historial.length < 3) return false
    return historial.slice(0, 3).every(h => h.superado)
  }, [historial])

  const gastoPromedio = useMemo(() => {
    if (historial.length === 0) return 0
    const sum = historial.slice(0, 3).reduce((acc, h) => acc + Number(h.monto_usado || 0), 0)
    return sum / Math.min(historial.length, 3)
  }, [historial])

  // Altura adaptativa
  const { fieldsRef, footerRef, dynamicHeight } = useAdaptiveModalHeight({
    enabled: open,
    extraPadding: 24,
    deps: [presupuesto?.id, step, activeTab, transacciones.length, historial.length, gastado, limite]
  })

  // Estilo semántico para avatar y barra
  const progressFillColor = useMemo(() => {
    if (isSuperado) return 'var(--error)'
    if (isAlerta) return 'var(--warning)'
    return 'var(--success)'
  }, [isSuperado, isAlerta])

  const avatarStyle = useMemo(() => {
    if (isSuperado) {
      return {
        backgroundColor: 'rgba(192, 57, 43, 0.12)',
        color: 'var(--error)',
        borderColor: 'rgba(192, 57, 43, 0.25)'
      }
    }
    if (isAlerta) {
      return {
        backgroundColor: 'rgba(201, 162, 39, 0.12)',
        color: 'var(--warning)',
        borderColor: 'rgba(201, 162, 39, 0.25)'
      }
    }
    if (isPaused) {
      return {
        backgroundColor: 'var(--surface-alt)',
        color: 'var(--text-3)',
        borderColor: 'var(--border)'
      }
    }
    return {
      backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
      color: 'var(--primary)',
      borderColor: 'rgba(var(--primary-rgb), 0.18)'
    }
  }, [isSuperado, isAlerta, isPaused])

  // Categoría primaria para icono
  const primaryCat = presupuesto?.categorias && presupuesto.categorias.length > 0
    ? presupuesto.categorias[0]
    : null

  // ── Acciones ───────────────────────────────────────────────────────────────
  const handleToggleStatus = async () => {
    if (!presupuesto) return
    const isActivo = presupuesto.estado === 'activo'
    try {
      if (isActivo) {
        await presupuestoService.pausarPresupuesto(presupuesto.id)
        sileo.success({ title: 'Presupuesto pausado' })
      } else {
        await presupuestoService.reanudarPresupuesto(presupuesto.id)
        sileo.success({ title: 'Presupuesto reanudado' })
      }
      void refreshPresupuesto()
      onSuccess?.()
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo cambiar el estado del presupuesto') })
    }
  }

  const handleEdit = () => {
    if (!presupuesto) return
    onClose()
    openModal('presupuesto', {
      data: {
        presupuesto,
        categorias,
        onSuccess: () => {
          onSuccess?.()
        }
      }
    })
  }

  const handleRenovar = async () => {
    if (!presupuesto || isRenewing) return
    setIsRenewing(true)
    try {
      const updated = await presupuestoService.renovarPresupuesto(presupuesto.id)
      setFreshPresupuesto(updated)
      sileo.success({ title: 'Ciclo iniciado', description: 'Se inició el nuevo ciclo de este presupuesto correctamente.' })
      onSuccess?.()
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo iniciar el nuevo ciclo.') })
    } finally {
      setIsRenewing(false)
    }
  }

  const handleDelete = () => {
    if (!presupuesto) return
    const isFinalizado = presupuesto.estado === 'finalizado'
    confirm({
      title: isFinalizado ? '¿Eliminás definitivamente este presupuesto?' : '¿Finalizás este presupuesto?',
      description: isFinalizado
        ? 'Se borrará permanentemente de tu historial.'
        : 'El presupuesto pasará a la pestaña de finalizados.',
      variant: 'danger',
      confirmLabel: isFinalizado ? 'Eliminar definitivamente' : 'Finalizar',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(presupuesto.id)
          sileo.success({ title: isFinalizado ? 'Presupuesto eliminado definitivamente' : 'Presupuesto finalizado' })
          onClose()
          onSuccess?.()
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No se pudo completar la acción.') })
        }
      }
    })
  }

  if (!presupuesto) return null

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel={`Detalle de ${presupuesto.nombre}`}
      className={styles.modalDialog}
    >
      <div 
        className={styles.slidesContainer}
        style={{ height: dynamicHeight ? `${dynamicHeight}px` : 'auto' }}
      >
        {/* Indicador de pasos superior centrado (Pill Dots) */}
        <div className={styles.stepDots} aria-hidden="true">
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ──── SOLAPA 1: Resumen y métricas del presupuesto ──── */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            {/* Modal Body (Scrollable Content) */}
            <div ref={fieldsRef} className={styles.body}>
              {/* Header integrado */}
              <div className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <h2 className={styles.headerTitle}>Detalle de presupuesto</h2>
                </div>
                <div className={styles.headerRightActions}>
                  <button 
                    type="button" 
                    className={styles.nextSlideBtn} 
                    onClick={() => handleGoStep(2)}
                    aria-label="Ver gastos e historial"
                    title="Ver gastos e historial"
                  >
                    <ChevronRight size={18} strokeWidth={2} />
                  </button>
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

              {/* Tarjeta de Identidad */}
              <div className={styles.identityCard}>
                <div className={styles.budgetAvatar} style={avatarStyle}>
                  {primaryCat ? (
                    <SubcategoriaIcon 
                      nombre={primaryCat.es_subcategoria ? primaryCat.nombre : null} 
                      parentCategory={primaryCat.es_subcategoria ? null : primaryCat.nombre} 
                      size={20} 
                    />
                  ) : (
                    <PieChart size={20} strokeWidth={2.2} />
                  )}
                </div>

                <div className={styles.identityInfo}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.budgetName} title={presupuesto.nombre}>
                      {presupuesto.nombre}
                    </h3>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.currencyPill}>{presupuesto.moneda === 'USD' ? 'Dólares' : 'Pesos'}</span>
                    <span className={styles.periodPill}>{presupuesto.periodo}</span>

                    {isPaused && (
                      <span className={styles.statusPillPaused}>
                        <Pause size={10} strokeWidth={2.5} />
                        Pausado
                      </span>
                    )}
                    {isSuperado && (
                      <span className={styles.statusPillSuperado}>
                        Superado
                      </span>
                    )}
                    {isAlerta && (
                      <span className={styles.statusPillAlerta}>
                        En alerta
                      </span>
                    )}

                    <span className={styles.dateMeta}>
                      <Calendar size={12} className={styles.dateIcon} />
                      <span>{p ? `Vence el ${formatFecha(p.fecha_fin)}` : 'Sin periodo'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorías Asociadas */}
              {presupuesto.categorias && presupuesto.categorias.length > 0 && (
                <div className={styles.categorySection}>
                  <span className={styles.sectionMiniLabel}>Categorías controladas</span>
                  <div className={styles.categoryChipsList}>
                    {presupuesto.categorias.map((c, i) => (
                      <span key={i} className={styles.catChip} title={c.nombre}>
                        <SubcategoriaIcon 
                          nombre={c.es_subcategoria ? c.nombre : null} 
                          parentCategory={c.es_subcategoria ? null : c.nombre} 
                          size={13} 
                        />
                        <span>{c.nombre}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner de aviso cuando no hay ciclo activo */}
              {!p && !isPaused && presupuesto.estado === 'activo' && (
                <div className={styles.noPeriodBanner}>
                  <div className={styles.noPeriodText}>
                    <span className={styles.noPeriodTitle}>Sin ciclo activo</span>
                    <p className={styles.noPeriodDesc}>El período anterior finalizó. Iniciá un nuevo ciclo para comenzar a medir gastos.</p>
                  </div>
                  <button
                    type="button"
                    className={styles.renewActionBtn}
                    onClick={handleRenovar}
                    disabled={isRenewing}
                  >
                    <RefreshCw size={13} className={isRenewing ? styles.spinIcon : ''} />
                    <span>{isRenewing ? 'Iniciando...' : 'Iniciar ciclo'}</span>
                  </button>
                </div>
              )}

              {/* Hero de Progreso Financiero */}
              <div className={styles.heroCard}>
                <div className={styles.heroAmounts}>
                  <div className={styles.amountBlock}>
                    <span className={styles.amountLabel}>Gastado este ciclo</span>
                    <div className={styles.spentAmount}>
                      {formatMonto(gastado, moneda)}
                    </div>
                  </div>

                  <div className={`${styles.amountBlock} ${styles.limitBlock}`}>
                    <span className={styles.amountLabel}>Límite asignado</span>
                    <div className={styles.limitAmount}>
                      {formatMonto(limite, moneda)}
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className={styles.progressTrackContainer}>
                  <div 
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min(porcentaje, 100)}%`,
                      backgroundColor: progressFillColor
                    }}
                  />
                </div>

                {/* Resumen inferior del Hero */}
                <div className={styles.heroFooter}>
                  <div className={styles.percentDisplay}>
                    <span className={styles.percentNumber}>{porcentaje.toFixed(1)}%</span>
                    <span className={styles.percentText}>utilizado</span>
                  </div>

                  <div className={styles.deltaDisplay}>
                    {isSuperado ? (
                      <span className={styles.excessNote}>
                        Excedido por +{formatMonto(gastado - limite, moneda)}
                      </span>
                    ) : (
                      <span className={styles.remainingNote}>
                        Te quedan <strong className={styles.remainingStrong}>{formatMonto(disponible, moneda)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Aviso de conversión bimonetaria si corresponde */}
                {p && (p.monto_convertido ?? 0) > 0 && (
                  <div className={styles.noticeBox}>
                    <ArrowLeftRight size={13} className={styles.noticeIcon} />
                    <span>Incluye {formatMonto(p.monto_convertido!, moneda)} convertidos de gastos en otra moneda</span>
                  </div>
                )}

                {p && (p.monto_sin_cotizacion ?? 0) > 0 && (
                  <div className={styles.noticeBox}>
                    <AlertCircle size={13} className={styles.noticeIcon} />
                    <span>Quedaron gastos sin cotización para esas fechas</span>
                  </div>
                )}
              </div>

              {/* Tarjeta de acceso a gastos e historial */}
              <button
                type="button"
                className={styles.movimientosNavCard}
                onClick={() => handleGoStep(2)}
                title="Ver gastos del ciclo e historial"
              >
                <div className={styles.movimientosNavLeft}>
                  <div className={styles.movimientosNavIconBox}>
                    <Receipt size={16} />
                  </div>
                  <div className={styles.movimientosNavInfo}>
                    <span className={styles.movimientosNavTitle}>Gastos e historial de ciclos</span>
                    <span className={styles.movimientosNavSub}>
                      {transacciones.length} {transacciones.length === 1 ? 'gasto registrado' : 'gastos registrados'} · {historial.length} {historial.length === 1 ? 'ciclo anterior' : 'ciclos anteriores'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className={styles.movimientosNavArrow} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Footer Step 1 */}
            <div ref={footerRef} className={styles.footer}>
              <div className={styles.footerSecondaryGroup}>
                <button 
                  type="button"
                  className={styles.footerIconBtn} 
                  onClick={handleToggleStatus}
                  title={isPaused ? 'Reactivar presupuesto' : 'Pausar presupuesto'}
                  aria-label={isPaused ? 'Reactivar presupuesto' : 'Pausar presupuesto'}
                >
                  {isPaused ? <Play size={15} /> : <Pause size={15} />}
                </button>

                <button 
                  type="button"
                  className={`${styles.footerIconBtn} ${styles.dangerIconBtn}`} 
                  onClick={handleDelete}
                  title="Finalizar presupuesto"
                  aria-label="Finalizar presupuesto"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <button 
                type="button"
                className={styles.primaryBtn}
                onClick={handleEdit}
              >
                <Pencil size={14} />
                <span>Editar presupuesto</span>
              </button>
            </div>
          </div>
        )}

        {/* ──── SOLAPA 2: Movimientos de Gastos e Historial de Ciclos ──── */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <div ref={fieldsRef} className={styles.body}>
              {/* Header integrado con botón volver y cerrar */}
              <div className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <button 
                    type="button" 
                    className={styles.backBtn} 
                    onClick={() => handleGoStep(1)}
                    aria-label="Volver al resumen"
                    title="Volver"
                  >
                    <ChevronLeft size={18} strokeWidth={2.2} />
                  </button>
                  <h2 className={styles.headerTitle}>Gastos e historial</h2>
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

              {/* Selector Segmentado Estilo Apple idéntico a _segmentedBar_51wt9_252 */}
              <div className={styles.segmentedBar} role="radiogroup" aria-label="Vista de gastos e historial">
                <button
                  type="button"
                  role="radio"
                  aria-checked={activeTab === 'gastos'}
                  className={`${styles.segmentedPill} ${activeTab === 'gastos' ? styles.segmentedPillActive : ''}`}
                  onClick={() => setActiveTab('gastos')}
                >
                  <Receipt size={14} strokeWidth={2} />
                  <span>Gastos del ciclo</span>
                  <span className={styles.segmentedBadge}>{transacciones.length}</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={activeTab === 'historial'}
                  className={`${styles.segmentedPill} ${activeTab === 'historial' ? styles.segmentedPillActive : ''}`}
                  onClick={() => setActiveTab('historial')}
                >
                  <History size={14} strokeWidth={2} />
                  <span>Historial de ciclos</span>
                  <span className={styles.segmentedBadge}>{historial.length}</span>
                </button>
              </div>

              {/* Contenido de la pestaña activa */}
              <div className={styles.contentSection}>
                {activeTab === 'gastos' ? (
                  loadingTx ? (
                    <div className={styles.loadingBox}>
                      <div className="spinner" />
                      <span>Cargando transacciones del ciclo...</span>
                    </div>
                  ) : !p ? (
                    <div className={styles.emptyStateWrap}>
                      <EmptyState
                        variant="compact"
                        icon={Receipt}
                        title="Sin período activo"
                        description="Este presupuesto no tiene un ciclo vigente actualmente. Podés iniciar un nuevo ciclo para comenzar a medir gastos."
                        actionLabel={!isPaused && presupuesto.estado === 'activo' ? (isRenewing ? 'Iniciando...' : 'Iniciar nuevo ciclo') : undefined}
                        onActionClick={!isPaused && presupuesto.estado === 'activo' ? handleRenovar : undefined}
                      />
                    </div>
                  ) : transacciones.length === 0 ? (
                    <div className={styles.emptyStateWrap}>
                      <EmptyState
                        variant="compact"
                        icon={Receipt}
                        title="Sin gastos este ciclo"
                        description="No hay consumos registrados en las categorías de este presupuesto."
                      />
                    </div>
                  ) : (
                    <div className={styles.txList}>
                      {transacciones.map(t => {
                        const catName = categorias.find(c => c.id === t.categoria_id)?.nombre || t.subcategoria?.nombre || 'Gasto'
                        const billeteraName = billeteras.find(b => b.id === t.billetera_id)?.nombre
                        return (
                          <div key={t.id} className={styles.txItem}>
                            <div className={styles.txLeft}>
                              <div className={styles.txIconWrap}>
                                <ArrowDownLeft size={13} strokeWidth={2.5} />
                              </div>
                              <div className={styles.txDetails}>
                                <span className={styles.txTitle}>
                                  {t.descripcion || catName}
                                </span>
                                <span className={styles.txMeta}>
                                  {billeteraName ? `${billeteraName} · ` : ''}
                                  {formatFecha(t.fecha)}
                                </span>
                              </div>
                            </div>
                            <span className={styles.txAmount}>
                              -{formatMonto(Number(t.monto), t.moneda as 'ARS' | 'USD')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                ) : (
                  loadingHistorial ? (
                    <div className={styles.loadingBox}>
                      <div className="spinner" />
                      <span>Cargando historial de periodos...</span>
                    </div>
                  ) : historial.length === 0 ? (
                    <div className={styles.emptyStateWrap}>
                      <EmptyState
                        variant="compact"
                        icon={History}
                        title="Sin periodos anteriores"
                        description="Aún no hay ciclos cerrados para este presupuesto."
                      />
                    </div>
                  ) : (
                    <div className={styles.historyList}>
                      {superado3Seguidos && (
                        <div className={styles.suggestionBanner}>
                          <AlertCircle size={20} className={styles.suggestionIcon} />
                          <div>
                            <p className={styles.suggestionTitle}>Sugerencia de ajuste</p>
                            <p className={styles.suggestionDesc}>
                              Superaste este presupuesto los últimos 3 periodos. Tu gasto promedio real es de{' '}
                              <b>{formatMonto(gastoPromedio, moneda)}</b>. Considerá aumentar el límite para ajustarlo a tu realidad.
                            </p>
                          </div>
                        </div>
                      )}

                      {historial.map(h => {
                        const isOver = h.porcentaje_usado >= 100
                        const barColor = isOver ? 'var(--error)' : 'var(--success)'
                        return (
                          <div key={h.id} className={styles.historyItem}>
                            <div className={styles.historyHeader}>
                              <span className={styles.historyDates}>
                                {formatFecha(h.fecha_inicio)} – {formatFecha(h.fecha_fin)}
                              </span>
                              <span className={`${styles.historyStatusBadge} ${isOver ? styles.historyStatusSuperado : styles.historyStatusCumplido}`}>
                                {isOver ? 'Superado' : 'Cumplido'}
                              </span>
                            </div>

                            <div className={styles.historyProgress}>
                              <div 
                                className={styles.historyBar} 
                                style={{ 
                                  width: `${Math.min(h.porcentaje_usado, 100)}%`, 
                                  backgroundColor: barColor 
                                }} 
                              />
                            </div>

                            <div className={styles.historyStats}>
                              <span>
                                <strong className={styles.historyUsed}>{formatMonto(h.monto_usado, moneda)}</strong> de {formatMonto(h.monto_limite, moneda)}
                              </span>
                              <span className={styles.historyPercent}>
                                {h.porcentaje_usado.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Modal Footer Step 2 */}
            <div ref={footerRef} className={styles.footer}>
              <button
                type="button"
                className={styles.volverBtn}
                onClick={() => handleGoStep(1)}
              >
                <ChevronLeft size={15} strokeWidth={2.2} />
                <span>Volver al resumen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
