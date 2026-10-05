import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  CreditCard, 
  Trash2, 
  Edit2, 
  XCircle, 
  Sparkles, 
  Search, 
  ChevronRight,
  ChevronLeft,
  X,
  Wallet
} from '@/components/ui/icons'
import styles from './GruposCuotasTab.module.css'
import grupoCuotasService from '@/services/grupoCuotas.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import type { GrupoCuotasResumen, GrupoCuotasUpdate, Billetera, Categoria, TarjetaCredito } from '@/types'
import { formatMonto } from '@/utils/format'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import { getErrorMessage } from '@/utils/errorMessages'
import { EmptyState, DateInput } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import Modal from '@/components/ui/Modal/Modal'

interface GruposCuotasTabProps {
  refreshTrigger?: number
  onRefreshNeeded?: () => void
  onOpenNew?: () => void
}

export default function GruposCuotasTab({ refreshTrigger, onRefreshNeeded, onOpenNew }: GruposCuotasTabProps = {}) {
  const [grupos, setGrupos] = useState<GrupoCuotasResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoCuotasResumen | null>(null)
  const [editingGrupo, setEditingGrupo] = useState<GrupoCuotasResumen | null>(null)
  const [search, setSearch] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'todas' | 'activas' | 'completadas'>('activas')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // States for the 2-step edit modal (matching TransaccionModal)
  const [editStep, setEditStep] = useState<1 | 2>(1)
  const [editSlideDirection, setEditSlideDirection] = useState<'forward' | 'back'>('forward')
  const [editDesc, setEditDesc] = useState('')
  const [editMonto, setEditMonto] = useState<number | null>(null)
  const [editCategoriaId, setEditCategoriaId] = useState('')
  const [editSubcategoriaId, setEditSubcategoriaId] = useState('')
  const [saving, setSaving] = useState(false)

  // States for the 2-slide Detail & Prepay modal
  const [detailSlide, setDetailSlide] = useState<'detail' | 'prepay'>('detail')
  const [detailSlideDirection, setDetailSlideDirection] = useState<'forward' | 'back'>('forward')
  const [billeteraSeleccionada, setBilleteraSeleccionada] = useState<string>('')
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const detailWalletsCarouselRef = useRef<HTMLDivElement>(null)

  // Categories list
  const [categorias, setCategorias] = useState<Categoria[]>([])

  // Tarjetas state
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])

  // States for card and reference date in edit form
  const [editTarjetaId, setEditTarjetaId] = useState('')
  const [editTarjetaTouched, setEditTarjetaTouched] = useState(false)
  const [editFechaReferencia, setEditFechaReferencia] = useState('')
  const [editFechaTouched, setEditFechaTouched] = useState(false)
  const tarjetasCarouselRef = useRef<HTMLDivElement>(null)

  // Tarjetas ordenadas: tarjeta asociada a billetera principal primero, luego por mayor saldo
  const tarjetasCarousel = useMemo(() => {
    const activas = tarjetas.filter(t => t.estado === 'activa' || t.id === editTarjetaId)
    return [...activas].sort((a, b) => {
      const billA = billeteras.find(x => x.id === a.billetera_id)
      const billB = billeteras.find(x => x.id === b.billetera_id)

      const isPrincA = billA?.es_principal ?? false
      const isPrincB = billB?.es_principal ?? false
      if (isPrincA && !isPrincB) return -1
      if (!isPrincA && isPrincB) return 1

      const saldoA = Number(billA?.saldo_actual) || 0
      const saldoB = Number(billB?.saldo_actual) || 0
      return saldoB - saldoA
    })
  }, [tarjetas, editTarjetaId, billeteras])

  // Datos computados para el modal de detalle
  const detailSelectedCat = useMemo(() => {
    if (!selectedGrupo) return undefined
    return categorias.find(c => c.id === selectedGrupo.categoria_id)
  }, [selectedGrupo, categorias])

  const detailMatchingWallets = useMemo(() => {
    if (!selectedGrupo) return []
    return billeteras
      .filter(b => b.moneda === selectedGrupo.moneda)
      .sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        return (Number(b.saldo_actual) || 0) - (Number(a.saldo_actual) || 0)
      })
  }, [selectedGrupo, billeteras])

  const detailProgressPercent = useMemo(() => {
    if (!selectedGrupo) return 0
    return Math.min(100, Math.max(0, Math.round((selectedGrupo.cantidad_pagadas / Math.max(selectedGrupo.cantidad_cuotas, 1)) * 100)))
  }, [selectedGrupo])

  const { confirm } = useModal()
  const { lastDataUpdate } = useNotificaciones()

  const {
    fieldsRef: editBodyRef,
    footerRef: editFooterRef,
    dynamicHeight: editDynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: !!editingGrupo,
    deps: [editStep, editMonto, editTarjetaId, editDesc, editFechaReferencia, editCategoriaId, editSubcategoriaId, tarjetas.length],
    extraPadding: 22,
    maxHeightRatio: 0.90,
  })

  const {
    fieldsRef: detailBodyRef,
    footerRef: detailFooterRef,
    dynamicHeight: detailDynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: !!selectedGrupo,
    deps: [selectedGrupo?.id, detailSlide, billeteraSeleccionada, billeteras.length],
    extraPadding: 22,
    maxHeightRatio: 0.90,
  })

  const fetchGrupos = useCallback(async () => {
    try {
      const data = await grupoCuotasService.getGruposCuotas()
      setGrupos(data)
    } catch (e) {
      console.error(e)
      sileo.error({ title: getErrorMessage(e, 'No pudimos cargar los grupos de cuotas. Intentá de nuevo.') })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBilleteras = useCallback(async () => {
    try {
      const data = await billeteraService.list()
      setBilleteras(data.filter(b => b.estado === 'activa'))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await categoriaService.getCategorias()
      setCategorias(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchTarjetas = useCallback(async () => {
    try {
      const data = await tarjetaService.getTarjetas()
      setTarjetas(data.filter(t => t.estado === 'activa'))
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrupos()
      fetchBilleteras()
      fetchCategorias()
      fetchTarjetas()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchGrupos, fetchBilleteras, fetchCategorias, fetchTarjetas])

  // Auto-refresco en vivo ante eventos SSE de actualización de datos
  useEffect(() => {
    if (
      lastDataUpdate?.entidad === 'cuotas' ||
      lastDataUpdate?.entidad === 'transacciones' ||
      lastDataUpdate?.entidad === 'tarjetas'
    ) {
      const timer = setTimeout(() => {
        void fetchGrupos()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchGrupos])

  // Refresco ante cambios en refreshTrigger (ej: creación de transacción)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      void fetchGrupos()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshTrigger, fetchGrupos])

  useEffect(() => {
    if (!editingGrupo || !editTarjetaId) return

    const timer = setTimeout(() => {
      const container = tarjetasCarouselRef.current
      if (!container) return
      const card = container.querySelector(`[data-id="${editTarjetaId}"]`) as HTMLElement | null
      const scroller = container.closest(`.${styles.billeterasCarouselScroller}`) as HTMLElement | null
      if (card && scroller) {
        const cardRect = card.getBoundingClientRect()
        const scrollerRect = scroller.getBoundingClientRect()
        const currentScroll = scroller.scrollLeft
        const offset = cardRect.left - scrollerRect.left + currentScroll
        const targetScrollLeft = offset - (scroller.clientWidth - cardRect.width) / 2

        scroller.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [editingGrupo, editTarjetaId])

  const handleEditClick = (grupo: GrupoCuotasResumen) => {
    setSelectedGrupo(null)
    setEditingGrupo(grupo)
    setEditStep(1)
    setEditSlideDirection('forward')
    setEditDesc(grupo.descripcion || '')
    setEditMonto(grupo.monto_total)
    setEditCategoriaId(grupo.categoria_id || '')
    setEditSubcategoriaId(grupo.subcategoria_id || '')

    const matchingTarjeta = tarjetas.find(t => t.nombre === grupo.tarjeta_nombre)
    setEditTarjetaId(matchingTarjeta ? matchingTarjeta.id : (tarjetas[0]?.id || ''))
    setEditTarjetaTouched(false)

    const fechaComp = grupo.fecha_compra ? grupo.fecha_compra.split('T')[0] : ''
    setEditFechaReferencia(fechaComp)
    setEditFechaTouched(false)
  }

  const goEditStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (editMonto === null || editMonto <= 0) {
      sileo.error({ title: 'Ingresá un monto total válido' })
      return
    }
    if (!editTarjetaId && tarjetas.length > 0) {
      sileo.error({ title: 'Seleccioná una tarjeta de crédito' })
      return
    }
    setEditSlideDirection('forward')
    setEditStep(2)
  }

  const goEditStep1 = () => {
    setEditSlideDirection('back')
    setEditStep(1)
  }

  // Auto-scroll billetera seleccionada en el carrusel de prepago
  useEffect(() => {
    if (!selectedGrupo || !billeteraSeleccionada || detailSlide !== 'prepay') return

    const timer = setTimeout(() => {
      const container = detailWalletsCarouselRef.current
      if (!container) return
      const card = container.querySelector(`[data-id="${billeteraSeleccionada}"]`) as HTMLElement | null
      const scroller = container.closest(`.${styles.billeterasCarouselScroller}`) as HTMLElement | null
      if (card && scroller) {
        const cardRect = card.getBoundingClientRect()
        const scrollerRect = scroller.getBoundingClientRect()
        const currentScroll = scroller.scrollLeft
        const offset = cardRect.left - scrollerRect.left + currentScroll
        const targetScrollLeft = offset - (scroller.clientWidth - cardRect.width) / 2

        scroller.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [selectedGrupo, billeteraSeleccionada, detailSlide])

  const handleOpenDetail = (grupo: GrupoCuotasResumen) => {
    setSelectedGrupo(grupo)
    setDetailSlide('detail')
    setDetailSlideDirection('forward')
    const matchingWallets = billeteras
      .filter(b => b.moneda === grupo.moneda)
      .sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        return (Number(b.saldo_actual) || 0) - (Number(a.saldo_actual) || 0)
      })
    const principal = matchingWallets.find(b => b.es_principal)
    setBilleteraSeleccionada(principal ? principal.id : (matchingWallets[0]?.id || ''))
  }

  const handleCloseDetail = () => {
    setSelectedGrupo(null)
    setDetailSlide('detail')
    setBilleteraSeleccionada('')
  }

  const handleGoPrepay = () => {
    setDetailSlideDirection('forward')
    setDetailSlide('prepay')
  }

  const handleBackToDetail = () => {
    setDetailSlideDirection('back')
    setDetailSlide('detail')
  }

  const handleCancelar = (grupo: GrupoCuotasResumen) => {
    confirm({
      title: '¿Cancelás las cuotas restantes?',
      description: 'Las cuotas que ya pagaste quedan registradas. Las pendientes se cancelan y no se van a cobrar.',
      variant: 'danger',
      confirmLabel: 'Cancelar cuotas',
      onConfirm: async () => {
        try {
          await grupoCuotasService.cancelarGrupo(grupo.id)
          sileo.success({ title: 'Compra en cuotas cancelada' })
          handleCloseDetail()
          fetchGrupos()
          onRefreshNeeded?.()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.') })
        }
      }
    })
  }

  const ejecutarPrepago = async (grupoId: string) => {
    if (!billeteraSeleccionada) return
    setSaving(true)
    try {
      await grupoCuotasService.prepagarGrupo(grupoId, billeteraSeleccionada)
      sileo.success({ title: '¡Listo! Las cuotas restantes se saldaron con éxito.' })
      handleCloseDetail()
      fetchGrupos()
      onRefreshNeeded?.()
    } catch (e) {
      console.error(e)
      sileo.error({ title: getErrorMessage(e, 'No pudimos saldar las cuotas. Intentá de nuevo.') })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGrupo) return

    if (editMonto === null || editMonto <= 0) {
      sileo.error({ title: 'Ingresá un monto total válido' })
      return
    }

    const ejecutarGuardado = async () => {
      setSaving(true)
      try {
        const payload: GrupoCuotasUpdate = {
          descripcion: editDesc.trim(),
          monto_total_nuevo: editMonto,
          categoria_id: editCategoriaId || null,
          subcategoria_id: editSubcategoriaId || null
        }

        if (editTarjetaTouched && editTarjetaId) {
          payload.tarjeta_id = editTarjetaId
          const selT = tarjetas.find(t => t.id === editTarjetaId)
          if (selT?.billetera_id) {
            payload.billetera_id = selT.billetera_id
          }
        }

        if (editFechaTouched && editFechaReferencia) {
          payload.fecha_referencia = editFechaReferencia
        }

        await grupoCuotasService.updateGrupoCuotas(editingGrupo.id, payload)
        sileo.success({ title: 'Compra en cuotas actualizada' })
        setEditingGrupo(null)
        fetchGrupos()
        onRefreshNeeded?.()
      } catch (e: unknown) {
        console.error(e)
        sileo.error({ title: getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.') })
      } finally {
        setSaving(false)
      }
    }

    if (editTarjetaTouched || editFechaTouched) {
      confirm({
        title: '¿Confirmar cambios?',
        description: 'Esto va a recalcular las cuotas pendientes con la tarjeta y fecha elegidas. Las cuotas ya pagadas no se modifican.',
        variant: 'default',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        onConfirm: ejecutarGuardado
      })
      return
    }

    await ejecutarGuardado()
  }

  const handleDeleteClick = (id: string) => {
    confirm({
      title: '¿Eliminás esta compra en cuotas?',
      description: 'Se borran todas las cuotas pendientes. Las ya pagadas quedan en tu historial.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await grupoCuotasService.deleteGrupoCuotas(id)
          sileo.success({ title: 'Compra en cuotas eliminada' })
          setSelectedGrupo(null)
          fetchGrupos()
          onRefreshNeeded?.()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.') })
        }
      }
    })
  }

  const handleOpenMobileSearch = () => {
    setMobileSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  const handleCloseMobileSearch = () => {
    setMobileSearchOpen(false)
    setSearch('')
  }

  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return ''
    try {
      const cleanStr = fechaStr.split('T')[0]
      const [year, month, day] = cleanStr.split('-')
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    } catch {
      return fechaStr
    }
  }

  // Métricas globales (Desktop only)
  const metricas = useMemo(() => {
    let cuotasActivas = 0
    let cuotaMensualARS = 0
    let cuotaMensualUSD = 0
    let deudaPendienteARS = 0
    let deudaPendienteUSD = 0

    grupos.forEach((g) => {
      const isActiva = g.cantidad_pendientes > 0 && g.estado !== 'cancelado'
      if (isActiva) {
        cuotasActivas++
        const moneda = (g.moneda || 'ARS').toUpperCase()
        if (moneda === 'USD') {
          cuotaMensualUSD += Number(g.monto_cuota) || 0
          deudaPendienteUSD += Number(g.total_pendiente) || 0
        } else {
          cuotaMensualARS += Number(g.monto_cuota) || 0
          deudaPendienteARS += Number(g.total_pendiente) || 0
        }
      }
    })

    return {
      cuotasActivas,
      cuotaMensualARS,
      cuotaMensualUSD,
      deudaPendienteARS,
      deudaPendienteUSD
    }
  }, [grupos])

  // Filtrado
  const filteredGrupos = useMemo(() => {
    return grupos.filter((g) => {
      const isCompleted = g.cantidad_pendientes === 0
      const isCancelled = g.estado === 'cancelado'

      if (statusFilter === 'activas' && (isCompleted || isCancelled)) return false
      if (statusFilter === 'completadas' && (!isCompleted && !isCancelled)) return false

      if (search.trim()) {
        const query = search.toLowerCase().trim()
        const matchesDesc = (g.descripcion || '').toLowerCase().includes(query)
        const matchesCard = (g.tarjeta_nombre || '').toLowerCase().includes(query)
        return matchesDesc || matchesCard
      }

      return true
    })
  }, [grupos, search, statusFilter])

  if (loading) {
    return <div className={styles.loadingState}>Cargando compras en cuotas...</div>
  }

  if (grupos.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No tenés compras en cuotas"
        description="Las compras financiadas con tarjeta aparecerán aquí organizadas."
        actionLabel={onOpenNew ? "Registrar compra en cuotas" : undefined}
        onActionClick={onOpenNew}
      />
    )
  }

  return (
    <div className={styles.container}>
      {/* ── 1. Resumen Superior (Desktop Only) ─────────────────────────── */}
      <div className={styles.metricsBar}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Compras activas</span>
          <span className={styles.metricValue}>{metricas.cuotasActivas}</span>
        </div>
        <div className={styles.metricDivider} />
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Compromiso / mes</span>
          <span className={styles.metricValue}>
            {formatMonto(Math.round(metricas.cuotaMensualARS), 'ARS')}
            {metricas.cuotaMensualUSD > 0 && ` + ${formatMonto(Math.round(metricas.cuotaMensualUSD), 'USD')}`}
          </span>
        </div>
        <div className={styles.metricDivider} />
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Total pendiente</span>
          <span className={`${styles.metricValue} ${styles.metricRed}`}>
            {formatMonto(Math.round(metricas.deudaPendienteARS), 'ARS')}
            {metricas.deudaPendienteUSD > 0 && ` + ${formatMonto(Math.round(metricas.deudaPendienteUSD), 'USD')}`}
          </span>
        </div>
      </div>

      {/* ── 2. Controles de Búsqueda y Filtro de Estado ────────────────── */}
      <div className={styles.controlsRow}>
        {/* Mobile controls bar (hidden when search expanded) */}
        <div className={`${styles.mobileControlsBar} ${mobileSearchOpen ? styles.mobileControlsHidden : ''}`}>
          <div className={styles.filterTabsWrapperMobile}>
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterTab} ${statusFilter === 'activas' ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter('activas')}
              >
                Activas ({metricas.cuotasActivas})
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${statusFilter === 'completadas' ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter('completadas')}
              >
                Finalizadas
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${statusFilter === 'todas' ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter('todas')}
              >
                Todas ({grupos.length})
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className={styles.mobileSearchTriggerBtn} 
            onClick={handleOpenMobileSearch}
            aria-label="Buscar cuotas"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Mobile Expanded Search Bar */}
        <div className={`${styles.mobileExpandedSearch} ${mobileSearchOpen ? styles.mobileExpandedSearchActive : ''}`}>
          <Search size={16} className={styles.mobileExpandedSearchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.mobileExpandedSearchInput}
            placeholder="Buscar cuotas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            type="button" 
            className={styles.mobileExpandedSearchClose} 
            onClick={handleCloseMobileSearch}
            aria-label="Cerrar búsqueda"
          >
            <X size={16} />
          </button>
        </div>

        {/* Desktop Controls */}
        <div className={styles.desktopControlsContainer}>
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'activas' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('activas')}
            >
              Activas ({metricas.cuotasActivas})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'completadas' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('completadas')}
            >
              Finalizadas
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${statusFilter === 'todas' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('todas')}
            >
              Todas ({grupos.length})
            </button>
          </div>

          <div className={styles.searchBoxDesktop}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar cuotas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Listado de Cuotas (TransaccionRow-Style) ─────────────────── */}
      {filteredGrupos.length === 0 ? (
        <div className={styles.emptyFilterState}>
          No se encontraron cuotas con ese filtro.
        </div>
      ) : (
        <div className={styles.listContainer}>
          {filteredGrupos.map((grupo) => {
            const isSinglePayment = (grupo.cantidad_cuotas || 1) <= 1
            const isCompleted = grupo.cantidad_pendientes === 0 && grupo.cantidad_pagadas >= grupo.cantidad_cuotas
            const isCancelled = grupo.estado === 'cancelado' || (grupo.cantidad_pendientes === 0 && grupo.cantidad_pagadas < grupo.cantidad_cuotas)

            const progressPercent = grupo.cantidad_cuotas > 0 
              ? Math.min(100, Math.max(0, (grupo.cantidad_pagadas / grupo.cantidad_cuotas) * 100))
              : 0

            const cat = categorias.find(c => c.id === grupo.categoria_id)

            return (
              <div 
                key={grupo.id} 
                className={`${styles.row} ${isCancelled ? styles.rowCancelled : ''}`}
                onClick={() => handleOpenDetail(grupo)}
                role="button"
                tabIndex={0}
              >
                {/* Left: Avatar (Category icon or styled Credit Card) */}
                <div className={styles.rowAvatar}>
                  {cat?.nombre ? (
                    <CategoriaIcon nombre={cat.nombre} size={24} />
                  ) : (
                    <CreditCard size={18} className={styles.rowAvatarIcon} />
                  )}
                </div>

                {/* Center Column: Title + Clean, Non-Redundant Subtitle */}
                <div className={styles.rowInfo}>
                  <div className={styles.rowTitleRow}>
                    <span className={styles.rowTitle} title={grupo.descripcion?.trim() || 'Compra con tarjeta'}>
                      {grupo.descripcion?.trim() || 'Compra con tarjeta'}
                    </span>

                    {isCompleted && (
                      <span className={styles.badgeCompleted}>Listo</span>
                    )}
                    {isCancelled && (
                      <span className={styles.badgeCancelled}>Cancelada</span>
                    )}
                  </div>

                  <div className={styles.rowMeta}>
                    {grupo.tarjeta_nombre && (
                      <>
                        <span className={styles.metaCard}>
                          {grupo.tarjeta_nombre}
                        </span>
                        <span className={styles.metaDot}>•</span>
                      </>
                    )}

                    {isSinglePayment ? (
                      <span className={styles.metaCuotas}>
                        Pago único
                      </span>
                    ) : (
                      <span className={styles.metaCuotas}>
                        Cuota <strong>{grupo.cantidad_pagadas}</strong> de <strong>{grupo.cantidad_cuotas}</strong>
                      </span>
                    )}

                    {grupo.cantidad_pendientes > 0 && grupo.proximo_vencimiento && (
                      <>
                        <span className={styles.metaDot}>•</span>
                        <span className={styles.metaVencimiento}>
                          Vence {formatFecha(grupo.proximo_vencimiento)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress Line only for multi-installment plans */}
                  {!isSinglePayment && (
                    <div className={styles.miniProgressBar}>
                      <div 
                        className={styles.miniProgressFill}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: Clean Amount Hierarchy */}
                <div className={styles.rowAmountArea}>
                  {isSinglePayment ? (
                    <span className={styles.rowMonthlyAmount}>
                      {formatMonto(grupo.monto_total, grupo.moneda)}
                    </span>
                  ) : (
                    <>
                      <span className={styles.rowMonthlyAmount}>
                        {formatMonto(grupo.monto_cuota, grupo.moneda)}
                        <span className={styles.rowPerMonth}>/cuota</span>
                      </span>
                      <span className={styles.rowPendingAmount}>
                        {grupo.cantidad_pendientes > 0 
                          ? `${grupo.cantidad_pendientes} rest.`
                          : 'Al día'}
                      </span>
                    </>
                  )}
                </div>

                {/* Desktop Chevron */}
                <ChevronRight size={16} className={styles.rowChevron} />
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL DE DETALLE & ACCIONES DE CUOTA ────────────────────────── */}
      <Modal
        isOpen={!!selectedGrupo}
        onClose={handleCloseDetail}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel="Detalle de compra en cuotas"
      >
        {selectedGrupo && (
          <div className={styles.modalRoot}>
            <div
              className={`${styles.slidesContainer} ${detailSlide === 'detail' ? styles.detailStep1 : styles.detailStep2}`}
              style={detailDynamicHeight ? { height: `${detailDynamicHeight}px` } : undefined}
            >
              
              {/* ──── SLIDE 1: Vista Detalle ──── */}
              <div
                className={`${styles.slide} ${
                  detailSlide === 'detail'
                    ? styles.slideVisible
                    : detailSlideDirection === 'forward'
                    ? styles.slideExitLeft
                    : styles.slideExitRight
                }`}
              >
                  <div className={styles.formContainer}>
                    <div
                      ref={detailSlide === 'detail' ? detailBodyRef : undefined}
                      className={`${styles.formBody} ${styles.formBodyWithHeader}`}
                    >
                      {/* Header */}
                      <div className={styles.formHeader}>
                        <div className={styles.headerLeft}>
                          <h2 className={styles.headerTitle}>Detalle de cuotas</h2>
                        </div>
                        <div className={styles.headerRightActions}>
                          <button
                            type="button"
                            className={styles.deleteHeaderBtn}
                            onClick={() => handleDeleteClick(selectedGrupo.id)}
                            title="Eliminar compra"
                            aria-label="Eliminar compra"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={handleCloseDetail}
                            title="Cerrar"
                            aria-label="Cerrar"
                          >
                            <X size={18} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className={styles.detailBodyContent}>
                        
                        {/* 1. Hero Identity & Amount Card */}
                        <div className={styles.detailHeroSurface}>
                          <div className={styles.detailHeroTopRow}>
                            <div className={styles.detailHeroAvatar}>
                              {detailSelectedCat ? (
                                <CategoriaIcon nombre={detailSelectedCat.nombre} size={24} />
                              ) : (
                                <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                              )}
                            </div>
                            <div className={styles.detailHeroMeta}>
                              <h3 className={styles.detailHeroTitle} title={selectedGrupo.descripcion?.trim() || 'Compra en cuotas'}>
                                {selectedGrupo.descripcion?.trim() || 'Compra en cuotas'}
                              </h3>
                              <div className={styles.detailHeroBadgeList}>
                                <span className={styles.cuotasCountBadge}>
                                  {selectedGrupo.cantidad_cuotas} {selectedGrupo.cantidad_cuotas === 1 ? 'pago' : 'cuotas'}
                                </span>
                                {selectedGrupo.tarjeta_nombre && (
                                  <span className={styles.cardInfoBadge}>
                                    <CreditCard size={11} strokeWidth={2} />
                                    <span>{selectedGrupo.tarjeta_nombre}</span>
                                  </span>
                                )}
                                {selectedGrupo.tiene_interes ? (
                                  <span className={styles.interesBadge}>Con Interés</span>
                                ) : (
                                  <span className={styles.sinInteresBadge}>Sin Interés</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.detailHeroNumbersRow}>
                            <div className={styles.detailHeroAmountGroup}>
                              <span className={styles.detailHeroMainAmount}>
                                {formatMonto(selectedGrupo.monto_cuota, selectedGrupo.moneda)}
                              </span>
                              <span className={styles.detailHeroAmountSuffix}>/ cuota</span>
                            </div>
                            <div className={styles.detailHeroTotalPill}>
                              <span className={styles.detailHeroTotalLabel}>Total:</span>
                              <span className={styles.detailHeroTotalVal}>
                                {formatMonto(selectedGrupo.monto_total, selectedGrupo.moneda)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Progress & Financial Breakdown */}
                        <div className={styles.detailProgressSurface}>
                          <div className={styles.detailProgressHeader}>
                            <span className={styles.detailProgressTitle}>
                              <strong>{selectedGrupo.cantidad_pagadas}</strong> de <strong>{selectedGrupo.cantidad_cuotas}</strong> cuotas pagadas
                            </span>
                            <span className={styles.detailProgressBadge}>
                              {detailProgressPercent}%
                            </span>
                          </div>

                          <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={detailProgressPercent} aria-valuemin={0} aria-valuemax={100}>
                            <div 
                              className={styles.progressBarFill}
                              style={{ width: `${detailProgressPercent}%` }}
                            />
                          </div>

                          <div className={styles.detailStatsGrid}>
                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Total Pagado</span>
                              <span className={styles.detailStatValue}>
                                {formatMonto(selectedGrupo.total_pagado, selectedGrupo.moneda)}
                              </span>
                            </div>

                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Total Pendiente</span>
                              <span className={`${styles.detailStatValue} ${selectedGrupo.cantidad_pendientes > 0 ? styles.statPendingRed : ''}`}>
                                {formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)}
                              </span>
                            </div>

                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Próximo vencimiento</span>
                              <span className={styles.detailStatValue}>
                                {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.proximo_vencimiento
                                  ? formatFecha(selectedGrupo.proximo_vencimiento)
                                  : 'Al día'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Costo Financiero (solo si tiene interés) */}
                        {selectedGrupo.tiene_interes && (
                          <div className={styles.detailTasasSurface}>
                            <div className={styles.detailTasasTop}>
                              <span className={styles.detailTasasHeading}>Costo financiero</span>
                              {selectedGrupo.tasa_interes != null && (
                                <span className={styles.detailTasaMensualPill}>
                                  {Number(selectedGrupo.tasa_interes).toFixed(2)}% mensual
                                </span>
                              )}
                            </div>
                            <div className={styles.detailTasasPillsRow}>
                              {selectedGrupo.cft_estimado != null && (
                                <div className={`${styles.tasaChip} ${styles.tasaChipCft}`}>
                                  <span className={styles.tasaChipLbl}>CFT</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.cft_estimado).toFixed(2)}%</span>
                                </div>
                              )}
                              {selectedGrupo.tna != null && (
                                <div className={styles.tasaChip}>
                                  <span className={styles.tasaChipLbl}>TNA</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.tna).toFixed(2)}%</span>
                                </div>
                              )}
                              {selectedGrupo.tea != null && (
                                <div className={styles.tasaChip}>
                                  <span className={styles.tasaChipLbl}>TEA</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.tea).toFixed(2)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div ref={detailSlide === 'detail' ? detailFooterRef : undefined} className={styles.detailFormFooter}>
                      <div className={styles.detailFooterLeftGroup}>
                        {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                          <button
                            type="button"
                            className={styles.detailCancelCuotasBtn}
                            onClick={() => handleCancelar(selectedGrupo)}
                            title="Cancelar cuotas restantes"
                          >
                            <XCircle size={15} />
                            <span>Cancelar cuotas</span>
                          </button>
                        )}
                      </div>

                      <div className={styles.detailFooterRightGroup}>
                        <button
                          type="button"
                          className={styles.detailEditActionBtn}
                          onClick={() => handleEditClick(selectedGrupo)}
                        >
                          <Edit2 size={14} />
                          <span>Editar</span>
                        </button>

                        {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                          <button
                            type="button"
                            className={styles.detailPrepayActionBtn}
                            onClick={handleGoPrepay}
                          >
                            <Sparkles size={14} />
                            <span>Prepagar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ──── SLIDE 2: Prepagar Cuotas (Solapa Separada) ──── */}
                <div
                  className={`${styles.slide} ${
                    detailSlide === 'prepay'
                      ? styles.slideVisible
                      : detailSlideDirection === 'forward'
                      ? styles.slideEnterRight
                      : styles.slideEnterLeft
                  }`}
                >
                  <form
                    className={styles.formContainer}
                    onSubmit={(e) => {
                      e.preventDefault()
                      ejecutarPrepago(selectedGrupo.id)
                    }}
                  >
                    <div
                      ref={detailSlide === 'prepay' ? detailBodyRef : undefined}
                      className={`${styles.formBody} ${styles.formBodyWithHeader}`}
                    >
                      <div className={styles.formHeader}>
                        <div className={styles.headerLeft}>
                          <button
                            type="button"
                            className={styles.backBtn}
                            onClick={handleBackToDetail}
                            title="Volver al detalle"
                            aria-label="Volver al detalle"
                          >
                            <ChevronLeft size={18} strokeWidth={2} />
                          </button>
                          <div>
                            <h2 className={styles.headerTitle}>Prepagar cuotas</h2>
                          </div>
                        </div>
                        <div className={styles.headerRightActions}>
                          <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={handleCloseDetail}
                            title="Cerrar"
                            aria-label="Cerrar"
                          >
                            <X size={18} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.formFields}>
                        {/* 1. Hero Prepay Banner */}
                        <div className={styles.prepayHeroBanner}>
                          <div className={styles.prepayHeroIconWrap}>
                            <Sparkles size={20} strokeWidth={2} />
                          </div>
                          <div className={styles.prepayHeroContent}>
                            <span className={styles.prepayHeroLabel}>Total a adelantar</span>
                            <div className={styles.prepayHeroAmount}>
                              {formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)}
                            </div>
                            <p className={styles.prepayHeroNarrative}>
                              Saldarás <strong>{selectedGrupo.cantidad_pendientes} {selectedGrupo.cantidad_pendientes === 1 ? 'cuota pendiente restante' : 'cuotas pendientes restantes'}</strong> de <strong>"{selectedGrupo.descripcion?.trim()}"</strong>.
                            </p>
                          </div>
                        </div>

                        {/* 2. Wallet Carousel */}
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>¿Con qué billetera o cuenta pagás?</label>
                          {detailMatchingWallets.length === 0 ? (
                            <div className={styles.emptyWalletBox}>
                              <div className={styles.emptyWalletIcon}>
                                <Wallet size={22} strokeWidth={1.75} />
                              </div>
                              <p className={styles.emptyWalletTitle}>
                                No tenés cuentas en {selectedGrupo.moneda}
                              </p>
                              <p className={styles.emptyWalletSub}>
                                Creá o activá una billetera en {selectedGrupo.moneda} para poder saldar estas cuotas.
                              </p>
                            </div>
                          ) : (
                            <div className={styles.billeterasCarouselScroller}>
                              <div className={styles.billeterasCarousel} ref={detailWalletsCarouselRef}>
                                {detailMatchingWallets.map((b) => (
                                  <div
                                    key={b.id}
                                    data-id={b.id}
                                    className={styles.billeteraSelectWrap}
                                    data-active={billeteraSeleccionada === b.id}
                                  >
                                    <BilleteraCard
                                      billetera={b}
                                      className={styles.fullHeightCard}
                                      disableNavigation={true}
                                      hideCurrencyChip={true}
                                    />
                                    <button
                                      type="button"
                                      className={styles.billeteraOverlay}
                                      onClick={() => setBilleteraSeleccionada(b.id)}
                                      title={`Seleccionar cuenta ${b.nombre}`}
                                      aria-label={`Seleccionar cuenta ${b.nombre}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Notice */}
                        <div className={styles.prepayNoticeTip}>
                          <span>💡</span>
                          <span>
                            Al confirmar el pago, las <strong>{selectedGrupo.cantidad_pendientes} cuotas pendientes</strong> se registrarán como pagadas inmediatamente y se debitarán de tu cuenta.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div ref={detailSlide === 'prepay' ? detailFooterRef : undefined} className={styles.formFooter}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={handleBackToDetail}
                        disabled={saving}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!billeteraSeleccionada || detailMatchingWallets.length === 0 || saving}
                      >
                        {saving
                          ? 'Procesando pago...'
                          : `Confirmar pago (${formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)})`}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          )}
      </Modal>

      {/* ── MODAL DE EDICIÓN (2 PASOS - ESTILO TRANSACCIONMODAL) ────────── */}
      <Modal 
        isOpen={!!editingGrupo} 
        onClose={() => setEditingGrupo(null)}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel="Editar compra en cuotas"
      >
        {editingGrupo && (
          <div className={styles.modalRoot}>
            {/* Indicador de pasos superior centrado */}
            <div className={styles.stepIndicator} aria-hidden="true">
              <div className={`${styles.dot} ${editStep === 1 ? styles.dotActive : styles.dotInactive}`} />
              <div className={`${styles.dot} ${editStep === 2 ? styles.dotActive : styles.dotInactive}`} />
            </div>

            <div
              className={`${styles.slidesContainer} ${editStep === 1 ? styles.editStep1 : styles.editStep2}`}
              style={editDynamicHeight ? { height: `${editDynamicHeight}px` } : undefined}
            >
              
              {/* ──── PASO 1: Monto y Tarjeta ──── */}
              <div
                className={`${styles.slide} ${
                  editStep === 1
                    ? styles.slideVisible
                    : editSlideDirection === 'forward'
                    ? styles.slideExitLeft
                    : styles.slideExitRight
                }`}
              >
                <form className={styles.formContainer} onSubmit={goEditStep2}>
                  <div
                    ref={editStep === 1 ? editBodyRef : undefined}
                    className={`${styles.formBody} ${styles.formBodyWithHeader} ${styles.formBodyStep1}`}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <h2 className={styles.headerTitle}>Editar compra en cuotas</h2>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={() => setEditingGrupo(null)}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFields}>
                      {/* 1. Hero Monto */}
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Monto total recalculado</label>
                        <MontoInput
                          value={editMonto}
                          onChange={(v) => setEditMonto(v)}
                          moneda={(editingGrupo.moneda as 'ARS' | 'USD') || 'ARS'}
                          allowDecimals
                          autoFocus
                        />
                      </div>

                      {/* 2. Tarjeta Carousel */}
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Tarjeta de crédito</label>
                        {tarjetasCarousel.length === 0 ? (
                          <div className={styles.emptyWalletBox}>
                            <div className={styles.emptyWalletIcon}>
                              <CreditCard size={22} strokeWidth={1.75} />
                            </div>
                            <p className={styles.emptyWalletTitle}>No tenés tarjetas activas</p>
                          </div>
                        ) : (
                          <div className={styles.billeterasCarouselScroller}>
                            <div className={styles.billeterasCarousel} ref={tarjetasCarouselRef}>
                              {tarjetasCarousel.map(t => (
                                <div
                                  key={t.id}
                                  data-id={t.id}
                                  className={`${styles.billeteraSelectWrap} ${styles.tarjetaSelectWrap}`}
                                  data-active={editTarjetaId === t.id}
                                >
                                  <RealCardPreview
                                    ultimos4={t.nombre.replace('•••• ', '').slice(-4)}
                                    red={t.red}
                                    titular={t.nombre}
                                    diaCierre={t.dia_cierre}
                                    diaVencimiento={t.dia_vencimiento}
                                    color={t.color || '#0D2045'}
                                    billeteraNombre={billeteras.find(b => b.id === t.billetera_id)?.nombre || RED_LABEL[t.red]}
                                    className={styles.fullHeightCard}
                                  />
                                  <button
                                    type="button"
                                    className={styles.billeteraOverlay}
                                    onClick={() => {
                                      setEditTarjetaId(t.id)
                                      setEditTarjetaTouched(true)
                                    }}
                                    title={`Seleccionar tarjeta ${t.nombre}`}
                                    aria-label={`Seleccionar tarjeta ${t.nombre}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div ref={editStep === 1 ? editFooterRef : undefined} className={styles.formFooter}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setEditingGrupo(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                      Continuar
                    </button>
                  </div>
                </form>
              </div>

              {/* ──── PASO 2: Detalles, Fecha y Categoría ──── */}
              <div
                className={`${styles.slide} ${
                  editStep === 2
                    ? styles.slideVisible
                    : editSlideDirection === 'forward'
                    ? styles.slideEnterRight
                    : styles.slideEnterLeft
                }`}
              >
                <form className={styles.formContainer} onSubmit={handleSave}>
                  <div
                    ref={editStep === 2 ? editBodyRef : undefined}
                    className={`${styles.formBody} ${styles.formBodyWithHeader}`}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={goEditStep1}
                          title="Atrás"
                          aria-label="Atrás"
                        >
                          <ChevronLeft size={18} strokeWidth={2} />
                        </button>
                        <div>
                          <h2 className={styles.headerTitle}>Detalles</h2>
                        </div>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={() => setEditingGrupo(null)}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFields}>
                      {/* Descripción + Fecha */}
                      <div className={styles.descFechaRow}>
                        <div className={`${styles.formField} ${styles.descCol}`}>
                          <label className={styles.fieldLabel} htmlFor="edit-cuota-desc">Descripción</label>
                          <input
                            id="edit-cuota-desc"
                            type="text"
                            className={styles.fieldInput}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Ej: Smart TV 55"
                          />
                        </div>
                        <div className={`${styles.formField} ${styles.fechaCol}`}>
                          <label className={styles.fieldLabel} htmlFor="edit-cuota-fecha">Fecha compra</label>
                          <DateInput
                            id="edit-cuota-fecha"
                            value={editFechaReferencia}
                            onChange={(val) => {
                              setEditFechaReferencia(val)
                              setEditFechaTouched(true)
                            }}
                            className={styles.fieldInput}
                          />
                        </div>
                      </div>

                      {/* Categoría y Subcategoría (reusado CategoriaSelector) */}
                      <CategoriaSelector
                        categorias={categorias}
                        categoriaId={editCategoriaId}
                        subcategoriaId={editSubcategoriaId}
                        tipo="egreso"
                        autoseleccionarPrimeraSubcategoria={true}
                        onSelectCategoria={(id) => {
                          setEditCategoriaId(id)
                          setEditSubcategoriaId('')
                        }}
                        onSelectSubcategoria={(id) => setEditSubcategoriaId(id)}
                      />

                      {/* Recalculation Notice */}
                      <div className={styles.editRecalcNotice}>
                        <span>💡</span>
                        <span>
                          Al modificar el monto total o tarjeta, se recalcularán automáticamente las <strong>{editingGrupo.cantidad_pendientes} cuotas pendientes</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div ref={editStep === 2 ? editFooterRef : undefined} className={styles.formFooter}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={goEditStep1}
                      disabled={saving}
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
