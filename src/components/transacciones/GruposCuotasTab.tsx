import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  CreditCard, 
  Search, 
  ChevronRight,
  X,
} from '@/components/ui/icons'
import styles from './GruposCuotasTab.module.css'
import grupoCuotasService from '@/services/grupoCuotas.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import suscripcionService from '@/services/suscripcion.service'
import type { GrupoCuotasResumen, GrupoCuotasUpdate, Billetera, Categoria, TarjetaCredito, Subcategoria, Suscripcion } from '@/types'
import { formatMonto } from '@/utils/format'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { getErrorMessage } from '@/utils/errorMessages'
import { EmptyState, GruposCuotasSkeleton } from '@/components/ui'
import SegmentedControl from '@/components/ui/SegmentedControl'
import GrupoCuotasAvatar from './GrupoCuotasAvatar'
import GrupoCuotasDetalleModal from './GrupoCuotasDetalleModal'
import GrupoCuotasEditarModal from './GrupoCuotasEditarModal'

function formatDiaMes(fechaStr?: string | null): string {
  if (!fechaStr) return ''
  const clean = fechaStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    const [, mm, dd] = parts
    return `${dd}/${mm}`
  }
  return fechaStr
}

interface GruposCuotasTabProps {
  refreshTrigger?: number
  onRefreshNeeded?: () => void
  onOpenNew?: () => void
  grupoInicialId?: string | null
}

export default function GruposCuotasTab({ refreshTrigger, onRefreshNeeded, onOpenNew, grupoInicialId }: GruposCuotasTabProps = {}) {
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

  // Categories and subscriptions lists
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])

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
    return sortBilleteras(
      billeteras.filter(b => b.moneda === selectedGrupo.moneda),
      selectedGrupo.moneda
    )
  }, [selectedGrupo, billeteras])

  const detailProgressPercent = useMemo(() => {
    if (!selectedGrupo) return 0
    return Math.min(100, Math.max(0, Math.round((selectedGrupo.cantidad_pagadas / Math.max(selectedGrupo.cantidad_cuotas, 1)) * 100)))
  }, [selectedGrupo])

  const { confirm } = useModal()
  const { lastDataUpdate } = useNotificaciones()

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

  const fetchSubcategorias = useCallback(async () => {
    try {
      const data = await categoriaService.getAllSubcategorias()
      setSubcategorias(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchSuscripciones = useCallback(async () => {
    try {
      const data = await suscripcionService.getSuscripciones()
      setSuscripciones(data)
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
      fetchSubcategorias()
      fetchSuscripciones()
      fetchTarjetas()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchGrupos, fetchBilleteras, fetchCategorias, fetchSubcategorias, fetchSuscripciones, fetchTarjetas])

  useEffect(() => {
    if (grupoInicialId && grupos.length > 0) {
      const match = grupos.find(g => g.id === grupoInicialId)
      if (match) {
        const timer = setTimeout(() => {
          setSelectedGrupo(match)
          setDetailSlide('detail')
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [grupoInicialId, grupos])

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
      const scroller = container.closest('[data-modal-carousel]') as HTMLElement | null
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
      const scroller = container.closest('[data-modal-carousel]') as HTMLElement | null
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
    const matchingWallets = sortBilleteras(
      billeteras.filter(b => b.moneda === grupo.moneda),
      grupo.moneda
    )
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
      description: 'Las cuotas que faltan dejan de figurar en tus vencimientos futuros. Esta acción no mueve plata ni registra un pago.',
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

  const handleAdelantar = (grupo: GrupoCuotasResumen) => {
    const ddmm = formatDiaMes(grupo.vencimiento_adelanto)
    const fechaTexto = ddmm ? ` que vence el ${ddmm}` : ''
    const linea = `Todas las cuotas pendientes (${grupo.cantidad_pendientes}) pasan al próximo resumen de tu tarjeta${fechaTexto}. El banco te las cobrará juntas en ese resumen.`
    confirm({
      title: '¿Adelantar cuotas?',
      description: linea,
      confirmLabel: 'Adelantar cuotas',
      onConfirm: async () => {
        try {
          await grupoCuotasService.adelantarGrupo(grupo.id)
          sileo.success({ title: `Listo, las cuotas que faltaban pasan al resumen que vence el ${ddmm}.` })
          handleCloseDetail()
          fetchGrupos()
          onRefreshNeeded?.()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No pudimos adelantar las cuotas. Intentá de nuevo.') })
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
    return <GruposCuotasSkeleton count={4} />
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
            <SegmentedControl<'activas' | 'completadas' | 'todas'>
              options={[
                { value: 'activas', label: `Activas (${metricas.cuotasActivas})` },
                { value: 'completadas', label: 'Finalizadas' },
                { value: 'todas', label: `Todas (${grupos.length})` },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              fullWidth
              ariaLabel="Filtrar cuotas por estado"
            />
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
          <SegmentedControl<'activas' | 'completadas' | 'todas'>
            options={[
              { value: 'activas', label: `Activas (${metricas.cuotasActivas})` },
              { value: 'completadas', label: 'Finalizadas' },
              { value: 'todas', label: `Todas (${grupos.length})` },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filtrar cuotas por estado"
          />

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

            return (
              <div 
                key={grupo.id} 
                className={`${styles.row} ${isCancelled ? styles.rowCancelled : ''}`}
                onClick={() => handleOpenDetail(grupo)}
                role="button"
                tabIndex={0}
              >
                {/* Left: Avatar (Subscription logo, subcategory icon or fallback) */}
                <div className={styles.rowAvatar}>
                  <GrupoCuotasAvatar
                    grupo={grupo}
                    categorias={categorias}
                    subcategorias={subcategorias}
                    suscripciones={suscripciones}
                    size={24}
                    fallbackIconSize={18}
                    fallbackClassName={styles.rowAvatarIcon}
                  />
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
      <GrupoCuotasDetalleModal
        selectedGrupo={selectedGrupo}
        detailSlide={detailSlide}
        detailSlideDirection={detailSlideDirection}
        detailSelectedCat={detailSelectedCat}
        categorias={categorias}
        subcategorias={subcategorias}
        suscripciones={suscripciones}
        detailProgressPercent={detailProgressPercent}
        detailMatchingWallets={detailMatchingWallets}
        billeteraSeleccionada={billeteraSeleccionada}
        saving={saving}
        handleCloseDetail={handleCloseDetail}
        handleDeleteClick={handleDeleteClick}
        formatFecha={formatFecha}
        handleCancelar={handleCancelar}
        handleAdelantar={handleAdelantar}
        handleEditClick={handleEditClick}
        handleGoPrepay={handleGoPrepay}
        handleBackToDetail={handleBackToDetail}
        ejecutarPrepago={ejecutarPrepago}
        setBilleteraSeleccionada={setBilleteraSeleccionada}
        detailWalletsCarouselRef={detailWalletsCarouselRef}
      />

      {/* ── MODAL DE EDICIÓN (2 PASOS - ESTILO TRANSACCIONMODAL) ────────── */}
      <GrupoCuotasEditarModal
        editingGrupo={editingGrupo}
        setEditingGrupo={setEditingGrupo}
        editStep={editStep}
        editSlideDirection={editSlideDirection}
        editMonto={editMonto}
        setEditMonto={setEditMonto}
        tarjetasCarousel={tarjetasCarousel}
        editTarjetaId={editTarjetaId}
        setEditTarjetaId={setEditTarjetaId}
        setEditTarjetaTouched={setEditTarjetaTouched}
        billeteras={billeteras}
        editDesc={editDesc}
        setEditDesc={setEditDesc}
        editFechaReferencia={editFechaReferencia}
        setEditFechaReferencia={setEditFechaReferencia}
        setEditFechaTouched={setEditFechaTouched}
        categorias={categorias}
        editCategoriaId={editCategoriaId}
        setEditCategoriaId={setEditCategoriaId}
        editSubcategoriaId={editSubcategoriaId}
        setEditSubcategoriaId={setEditSubcategoriaId}
        saving={saving}
        goEditStep1={goEditStep1}
        goEditStep2={goEditStep2}
        handleSave={handleSave}
        tarjetasCarouselRef={tarjetasCarouselRef}
      />

    </div>
  )
}
