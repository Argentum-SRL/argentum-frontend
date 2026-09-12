import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  CreditCard, 
  Trash2, 
  Edit2, 
  XCircle, 
  Calendar, 
  Sparkles, 
  Search, 
  ChevronRight,
  X,
  GripHorizontal
} from 'lucide-react'
import styles from './GruposCuotasTab.module.css'
import grupoCuotasService from '@/services/grupoCuotas.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import type { GrupoCuotasResumen, GrupoCuotasUpdate, Billetera, Categoria, Subcategoria, TarjetaCredito } from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { EmptyState, SelectInput, DateInput } from '@/components/ui'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import Modal from '@/components/ui/Modal/Modal'

export default function GruposCuotasTab() {
  const [grupos, setGrupos] = useState<GrupoCuotasResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoCuotasResumen | null>(null)
  const [editingGrupo, setEditingGrupo] = useState<GrupoCuotasResumen | null>(null)
  const [search, setSearch] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'todas' | 'activas' | 'completadas'>('activas')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // States for the edit form
  const [editDesc, setEditDesc] = useState('')
  const [editMonto, setEditMonto] = useState<number | ''>('')
  const [editCategoriaId, setEditCategoriaId] = useState('')
  const [prevEditCategoriaId, setPrevEditCategoriaId] = useState('')
  const [editSubcategoriaId, setEditSubcategoriaId] = useState('')
  const [showAllCats, setShowAllCats] = useState(false)
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingSubcats, setLoadingSubcats] = useState(false)
  const [saving, setSaving] = useState(false)

  // Categories list
  const [categorias, setCategorias] = useState<Categoria[]>([])

  // Tarjetas state
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])

  // States for card and reference date in edit form
  const [editTarjetaId, setEditTarjetaId] = useState('')
  const [editTarjetaTouched, setEditTarjetaTouched] = useState(false)
  const [editFechaReferencia, setEditFechaReferencia] = useState('')
  const [editFechaTouched, setEditFechaTouched] = useState(false)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const tarjetasCarouselRef = useRef<HTMLDivElement>(null)

  // Prepayment & Wallet states
  const [grupoPrepago, setGrupoPrepago] = useState<GrupoCuotasResumen | null>(null)
  const [billeteraSeleccionada, setBilleteraSeleccionada] = useState<string>('')
  const [billeteras, setBilleteras] = useState<Billetera[]>([])

  const { showToast } = useToast()
  const { confirm } = useModal()

  if (editCategoriaId !== prevEditCategoriaId) {
    setPrevEditCategoriaId(editCategoriaId)
    setSubcategorias([])
  }

  const fetchGrupos = useCallback(async () => {
    try {
      const data = await grupoCuotasService.getGruposCuotas()
      setGrupos(data)
    } catch (e) {
      console.error(e)
      showToast(getErrorMessage(e, 'No pudimos cargar los grupos de cuotas. Intentá de nuevo.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

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

  useEffect(() => {
    if (!editingGrupo || !editTarjetaId) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(editTarjetaId)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [editingGrupo, editTarjetaId])

  useEffect(() => {
    if (!editCategoriaId) return

    let isMounted = true
    const fetchSubcats = async () => {
      setLoadingSubcats(true)
      try {
        const data = await categoriaService.getSubcategorias(editCategoriaId)
        if (isMounted) {
          setSubcategorias(data)
        }
      } catch (e) {
        console.error('Error fetching subcategorias:', e)
      } finally {
        if (isMounted) {
          setLoadingSubcats(false)
        }
      }
    }

    fetchSubcats()
    return () => {
      isMounted = false
    }
  }, [editCategoriaId])

  const filteredCategorias = useMemo(() => {
    return categorias.filter(c => c.tipo === 'egreso')
  }, [categorias])

  const displayCategorias = useMemo(() => {
    if (showAllCats) return filteredCategorias
    return filteredCategorias.slice(0, 7)
  }, [filteredCategorias, showAllCats])

  const hasMoreCats = filteredCategorias.length > 7

  const currentCat = useMemo(() => categorias.find(c => c.id === editCategoriaId), [categorias, editCategoriaId])
  const currentCatNorm = useMemo(() => currentCat ? currentCat.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '', [currentCat])
  const hideGeneralSubcat = currentCatNorm === 'empleo' || currentCatNorm === 'trabajo independiente' || currentCatNorm === 'inversiones y rentas'

  const sortedSubcategorias = useMemo(() => {
    const PROBABILIDAD_SUBCATS: Record<string, string[]> = {
      transporte: ['taxi / apps', 'transporte publico', 'combustible', 'peajes', 'estacionamiento', 'mantenimiento y seguro del auto'],
      salud: ['farmacia', 'medico / consulta', 'obra social / prepaga', 'estudios y analisis', 'odontologia', 'terapias'],
      hogar: ['limpieza', 'reparaciones', 'muebles y electrodomesticos'],
      servicios: ['luz', 'gas', 'agua', 'alquiler', 'expensas', 'impuestos', 'seguros'],
      recreativo: ['salidas', 'deportes y gimnasio', 'hobbies y juegos', 'viajes'],
      alimentacion: ['supermercado', 'kiosco', 'verduleria', 'carniceria'],
      indumentaria: ['ropa', 'calzado', 'accesorios'],
      comunicacion: ['celular', 'internet y cable'],
      educacion: ['cuotas', 'materiales y libros', 'idiomas'],
      'restaurantes y delivery': ['restaurantes', 'delivery', 'cafeteria'],
      otros: ['reintegros', 'cuidado personal', 'mascotas', 'regalos'],
      banco: ['comisiones y gastos bancarios', 'impuesto al cheque / movimientos', 'prestamos', 'intereses pagados'],
      empleo: ['sueldo', 'bonos y horas extras', 'aguinaldo'],
      'trabajo independiente': ['honorarios', 'venta de productos/servicios'],
      'inversiones y rentas': ['dividendos e intereses', 'alquileres cobrados'],
    }

    const priorityList = PROBABILIDAD_SUBCATS[currentCatNorm] || []

    return [...subcategorias]
      .filter(s => s.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() !== 'otros')
      .sort((a, b) => {
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        const aNorm = norm(a.nombre)
        const bNorm = norm(b.nombre)

        const isAOtros = aNorm === 'otros' || aNorm === 'otro' || aNorm === 'otras' || aNorm === 'otros gastos' || aNorm === 'otros ingresos' || aNorm === 'varios'
        const isBOtros = bNorm === 'otros' || bNorm === 'otro' || bNorm === 'otras' || bNorm === 'otros gastos' || bNorm === 'otros ingresos' || bNorm === 'varios'

        if (isAOtros && !isBOtros) return 1
        if (!isAOtros && isBOtros) return -1
        if (isAOtros && isBOtros) return 0

        const ai = priorityList.indexOf(aNorm)
        const bi = priorityList.indexOf(bNorm)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1

        return aNorm.localeCompare(bNorm)
      })
  }, [subcategorias, currentCatNorm])

  const handleEditClick = (grupo: GrupoCuotasResumen) => {
    setEditingGrupo(grupo)
    setEditDesc(grupo.descripcion)
    setEditMonto(grupo.monto_total)
    setEditCategoriaId(grupo.categoria_id || '')
    setEditSubcategoriaId(grupo.subcategoria_id || '')
    setShowAllCats(false)

    const matchingTarjeta = tarjetas.find(t => t.nombre === grupo.tarjeta_nombre)
    setEditTarjetaId(matchingTarjeta ? matchingTarjeta.id : (tarjetas[0]?.id || ''))
    setEditTarjetaTouched(false)

    const fechaComp = grupo.fecha_compra ? grupo.fecha_compra.split('T')[0] : ''
    setEditFechaReferencia(fechaComp)
    setEditFechaTouched(false)
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
          showToast('Compra en cuotas cancelada', 'success')
          setSelectedGrupo(null)
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const handlePrepagar = (grupo: GrupoCuotasResumen) => {
    setSelectedGrupo(null)
    setGrupoPrepago(grupo)
    setBilleteraSeleccionada('')
  }

  const confirmarPrepago = async () => {
    if (!grupoPrepago || !billeteraSeleccionada) return
    confirm({
      title: '¿Prepagás las cuotas restantes?',
      description: 'Se van a saldar todas las cuotas pendientes de este grupo.',
      variant: 'default',
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        setSaving(true)
        try {
          await grupoCuotasService.prepagarGrupo(grupoPrepago.id, billeteraSeleccionada)
          showToast('¡Listo! Las cuotas restantes se saldaron.', 'success')
          setGrupoPrepago(null)
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos saldar las cuotas. Intentá de nuevo.'), 'error')
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGrupo) return

    if (editMonto === '' || editMonto <= 0) {
      showToast('Ingresá un monto total válido', 'error')
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
        showToast('Compra en cuotas actualizada', 'success')
        setEditingGrupo(null)
        fetchGrupos()
      } catch (e: unknown) {
        console.error(e)
        showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
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
          showToast('Compra en cuotas eliminada', 'success')
          setSelectedGrupo(null)
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
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
            const progressPercent = grupo.cantidad_cuotas > 0 
              ? Math.min(100, Math.max(0, (grupo.cantidad_pagadas / grupo.cantidad_cuotas) * 100))
              : 0

            const isCompleted = grupo.cantidad_pendientes === 0 && grupo.cantidad_pagadas >= grupo.cantidad_cuotas
            const isCancelled = grupo.estado === 'cancelado' || (grupo.cantidad_pendientes === 0 && grupo.cantidad_pagadas < grupo.cantidad_cuotas)

            return (
              <div 
                key={grupo.id} 
                className={`${styles.row} ${isCancelled ? styles.rowCancelled : ''}`}
                onClick={() => setSelectedGrupo(grupo)}
                role="button"
                tabIndex={0}
              >
                {/* Left: Squircle Avatar */}
                <div className={styles.rowAvatar}>
                  <CreditCard size={18} className={styles.rowAvatarIcon} />
                </div>

                {/* Center Column: Title + Subtitle */}
                <div className={styles.rowInfo}>
                  <div className={styles.rowTitleRow}>
                    <span className={styles.rowTitle} title={grupo.descripcion?.trim() || 'Compra en cuotas'}>
                      {grupo.descripcion?.trim() || 'Compra en cuotas'}
                    </span>

                    {grupo.tarjeta_nombre && (
                      <span className={styles.cardTag}>
                        {grupo.tarjeta_nombre}
                      </span>
                    )}

                    {isCompleted && (
                      <span className={styles.badgeCompleted}>Listo</span>
                    )}
                    {isCancelled && (
                      <span className={styles.badgeCancelled}>Cancelada</span>
                    )}
                  </div>

                  <div className={styles.rowMeta}>
                    <span className={styles.metaCuotas}>
                      <strong>{grupo.cantidad_pagadas}/{grupo.cantidad_cuotas}</strong> cuotas
                    </span>

                    {grupo.cantidad_pendientes > 0 && grupo.proximo_vencimiento && (
                      <>
                        <span className={styles.metaDot}>•</span>
                        <span className={styles.metaVencimiento}>
                          Vence {formatFecha(grupo.proximo_vencimiento)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress Line */}
                  <div className={styles.miniProgressBar}>
                    <div 
                      className={styles.miniProgressFill}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Right Column: Amounts */}
                <div className={styles.rowAmountArea}>
                  <span className={styles.rowMonthlyAmount}>
                    {formatMonto(grupo.monto_cuota, grupo.moneda)} <span className={styles.rowPerMonth}>/ mes</span>
                  </span>
                  <span className={styles.rowPendingAmount}>
                    {grupo.cantidad_pendientes > 0 
                      ? `${formatMonto(grupo.total_pendiente, grupo.moneda)} rest.`
                      : 'Completado'}
                  </span>
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
        onClose={() => setSelectedGrupo(null)}
        title="Detalle de compra en cuotas"
        size="md"
      >
        {selectedGrupo && (
          <div className={styles.detailModalContent}>
            {/* Header / Main Info */}
            <div className={styles.detailHeader}>
              <div className={styles.detailTitleArea}>
                <h3 className={styles.detailTitle}>{selectedGrupo.descripcion?.trim() || 'Compra en cuotas'}</h3>
                <div className={styles.detailTags}>
                  {selectedGrupo.tarjeta_nombre && (
                    <span className={styles.cardTag}>
                      <CreditCard size={12} /> {selectedGrupo.tarjeta_nombre}
                    </span>
                  )}
                  {selectedGrupo.tiene_interes && (
                    <span className={styles.interesBadge}>Con Interés</span>
                  )}
                </div>
              </div>
              <div className={styles.detailTotal}>
                <span className={styles.detailTotalLabel}>Monto total</span>
                <span className={styles.detailTotalValue}>
                  {formatMonto(selectedGrupo.monto_total, selectedGrupo.moneda)}
                </span>
              </div>
            </div>

            {/* Progress Card */}
            <div className={styles.detailProgressCard}>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill}
                  style={{ width: `${(selectedGrupo.cantidad_pagadas / selectedGrupo.cantidad_cuotas) * 100}%` }}
                />
              </div>
              <div className={styles.detailProgressTextRow}>
                <span><strong>{selectedGrupo.cantidad_pagadas}</strong> de <strong>{selectedGrupo.cantidad_cuotas}</strong> cuotas pagadas</span>
                <span><strong>{formatMonto(selectedGrupo.monto_cuota, selectedGrupo.moneda)}</strong> / cuota</span>
              </div>
              {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.proximo_vencimiento && (
                <div className={styles.detailVencimiento}>
                  <Calendar size={13} />
                  <span>Próximo vencimiento: {formatFecha(selectedGrupo.proximo_vencimiento)}</span>
                </div>
              )}
            </div>

            {/* Amounts Split */}
            <div className={styles.detailAmountsRow}>
              <div className={styles.detailAmountBox}>
                <span className={styles.detailAmountLabel}>Total Pagado</span>
                <span className={styles.detailAmountValue}>
                  {formatMonto(selectedGrupo.total_pagado, selectedGrupo.moneda)}
                </span>
              </div>
              <div className={styles.detailAmountBox}>
                <span className={styles.detailAmountLabel}>Total Pendiente</span>
                <span className={`${styles.detailAmountValue} ${styles.metricRed}`}>
                  {formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)}
                </span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className={styles.detailActionsGrid}>
              {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                <button
                  type="button"
                  className={styles.detailPrepayBtn}
                  onClick={() => handlePrepagar(selectedGrupo)}
                >
                  <Sparkles size={14} />
                  Prepagar restantes
                </button>
              )}

              <button
                type="button"
                className={styles.detailEditBtn}
                onClick={() => handleEditClick(selectedGrupo)}
              >
                <Edit2 size={14} />
                Editar
              </button>

              {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                <button
                  type="button"
                  className={styles.detailCancelBtn}
                  onClick={() => handleCancelar(selectedGrupo)}
                >
                  <XCircle size={14} />
                  Cancelar
                </button>
              )}

              <button
                type="button"
                className={styles.detailDeleteBtn}
                onClick={() => handleDeleteClick(selectedGrupo.id)}
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL DE EDICIÓN ─────────────────────────────────────────────── */}
      <Modal 
        isOpen={!!editingGrupo} 
        onClose={() => setEditingGrupo(null)}
        title="Editar compra en cuotas"
        size="md"
      >
        {editingGrupo && (
          <form onSubmit={handleSave} className={styles.editForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Descripción <span className={styles.fieldOptional}>(opcional)</span></label>
              <input 
                type="text" 
                className={styles.fieldInput} 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Ej. Smart TV 55"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Monto total recalculado</label>
              <div className={styles.inputWithCurrency}>
                <span className={styles.currencyPrefix}>{editingGrupo.moneda} $</span>
                <input 
                  type="number" 
                  step="any"
                  className={styles.fieldInput} 
                  value={editMonto} 
                  onChange={(e) => setEditMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Selector de Tarjeta */}
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Tarjeta</label>
              <div className={styles.billeterasCarouselScroller}>
                <div className={styles.billeterasCarousel} ref={tarjetasCarouselRef}>
                  {tarjetas.length === 0 ? (
                    <p className={styles.noTarjetas}>No tenés tarjetas activas.</p>
                  ) : (
                    tarjetas.map((t) => (
                      <div
                        key={t.id}
                        className={styles.billeteraSelectWrap}
                        data-active={editTarjetaId === t.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(t.id, el)
                          else cardRefs.current.delete(t.id)
                        }}
                      >
                        <RealCardPreview
                          ultimos4={t.nombre.replace('•••• ', '').slice(-4)}
                          red={t.red}
                          titular={t.nombre}
                          diaCierre={t.dia_cierre}
                          diaVencimiento={t.dia_vencimiento}
                          color={t.color || '#0D2045'}
                          billeteraNombre={billeteras.find(b => b.id === t.billetera_id)?.nombre || RED_LABEL[t.red]}
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Fecha de Referencia */}
            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="edit-fecha-referencia">
                Fecha de referencia
              </label>
              <DateInput
                id="edit-fecha-referencia"
                value={editFechaReferencia}
                onChange={(val) => {
                  setEditFechaReferencia(val)
                  setEditFechaTouched(true)
                }}
                className={styles.fieldInput}
              />
            </div>

            {/* Categoría y Subcategoría */}
            {!editCategoriaId ? (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Categoría</label>
                <div className={styles.catGrid}>
                  {displayCategorias.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      className={`${styles.catBtn} ${editCategoriaId === cat.id ? styles.catBtnActive : ''}`}
                      onClick={() => {
                        setEditCategoriaId(cat.id)
                        setEditSubcategoriaId('')
                      }}
                    >
                      <CategoriaIcon nombre={cat.nombre} size={36} />
                      <span className={styles.catName}>{cat.nombre}</span>
                    </button>
                  ))}
                  {!showAllCats && hasMoreCats && (
                    <button
                      type="button"
                      className={styles.catBtn}
                      onClick={() => setShowAllCats(true)}
                    >
                      <div className={styles.moreCatsIconWrap}>
                        <GripHorizontal size={22} strokeWidth={1.5} />
                      </div>
                      <span className={styles.catName}>Más</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.selectedCatBanner}>
                  <div className={styles.selectedCatInfo}>
                    <CategoriaIcon nombre={categorias.find(c => c.id === editCategoriaId)?.nombre} size={32} />
                    <div className={styles.selectedCatText}>
                      <span className={styles.selectedCatLabel}>Categoría</span>
                      <span className={styles.selectedCatName}>{categorias.find(c => c.id === editCategoriaId)?.nombre}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.changeCatBtn}
                    onClick={() => {
                      setEditCategoriaId('')
                      setEditSubcategoriaId('')
                    }}
                  >
                    Cambiar
                  </button>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Subcategoría</label>
                  <div className={styles.subcatGrid}>
                    {loadingSubcats ? <div className={styles.subcatLoading}>Cargando...</div> : (
                      <>
                        {!hideGeneralSubcat && (
                          <button
                            type="button"
                            className={`${styles.subcatChip} ${!editSubcategoriaId ? styles.subcatChipActive : ''}`}
                            onClick={() => setEditSubcategoriaId('')}
                          >
                            <SubcategoriaIcon nombre="general" parentCategory={categorias.find(c => c.id === editCategoriaId)?.nombre} size={32} />
                            General
                          </button>
                        )}
                        {sortedSubcategorias.map((sub) => (
                          <button
                            type="button"
                            key={sub.id}
                            className={`${styles.subcatChip} ${editSubcategoriaId === sub.id ? styles.subcatChipActive : ''}`}
                            onClick={() => setEditSubcategoriaId(sub.id)}
                          >
                            <SubcategoriaIcon nombre={sub.nombre} parentCategory={categorias.find(c => c.id === editCategoriaId)?.nombre} size={32} />
                            {sub.nombre}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className={styles.modalInfoPanel}>
              <CreditCard size={18} className={styles.infoIcon} />
              <p className={styles.infoText}>
                Al modificar el monto total, el saldo restante se redistribuirá entre las cuotas pendientes ({editingGrupo.cantidad_pendientes} cuotas restantes).
              </p>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={() => setEditingGrupo(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL DE PREPAGO ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!grupoPrepago}
        onClose={() => setGrupoPrepago(null)}
        title="Prepagar cuotas pendientes"
        size="md"
      >
        {grupoPrepago && (
          <div className={styles.editForm}>
            <div className={styles.modalInfoPanel}>
              <CreditCard size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                Vas a adelantar el pago total de las <strong>{grupoPrepago.cantidad_pendientes} cuotas pendientes</strong> por un total de <strong>{formatMonto(grupoPrepago.total_pendiente, grupoPrepago.moneda)}</strong>.
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>¿Desde qué billetera/cuenta pagás?</label>
              <SelectInput
                id="prepago-billetera"
                label=""
                value={billeteraSeleccionada}
                onChange={(val) => setBilleteraSeleccionada(val)}
                options={[
                  { value: '', label: 'Seleccioná una billetera...' },
                  ...billeteras
                    .filter(b => b.moneda === grupoPrepago.moneda)
                    .map(b => ({
                      value: b.id,
                      label: `${b.nombre} (${formatMonto(b.saldo_actual, b.moneda)})`
                    }))
                ]}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setGrupoPrepago(null)}
                disabled={saving}
              >
                Volver
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={confirmarPrepago}
                disabled={!billeteraSeleccionada || saving}
              >
                {saving ? 'Procesando...' : 'Confirmar Prepago'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
