import React, { useState, useMemo, useEffect, useReducer, useRef, useCallback } from 'react'
import { esPunteroFino } from '@/utils/foco'
import { X, ChevronLeft, Search, Pencil, CreditCard, Wallet, Plus } from '@/components/ui/icons'
import { nombreInicial, preseleccionCategoria } from '@/lib/utils/sugerirCategoriaSuscripcion'
import { ICONOS_GENERICOS, CATALOGO_SUSCRIPCIONES, CATEGORIAS_CATALOGO } from '@/lib/constants/suscripciones'
import type { ServicioCatalogo } from '@/lib/constants/suscripciones'
import Modal from '@/components/ui/Modal/Modal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { DateInput } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import SegmentedControl from '@/components/ui/SegmentedControl'
import SelectableSurface from '@/components/ui/SelectableSurface'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import { setCachedSuscripciones } from '@/lib/utils/movimientoVisual.utils'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import categoriaService from '@/services/categoria.service'
import { dashboardService } from '@/services/dashboard.service'
import type { Billetera, TarjetaCredito, Categoria, Suscripcion, CotizacionDolar, SuscripcionCreate, SuscripcionUpdate } from '@/types'
import styles from './SuscripcionModal.module.css'

export interface SuscripcionModalProps {
  open: boolean
  onClose: () => void
  suscripcion?: Suscripcion | null
  onSuccess: () => void
}

type ModalStep = 1 | 2 | 3
type FrecuenciaType = 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'

interface ModalState {
  step: ModalStep
  slideDirection: 'forward' | 'back'
  searchQuery: string
  servicioId: string | null
  nombre: string
  monto: number | null
  moneda: 'ARS' | 'USD'
  frecuencia: FrecuenciaType
  proximo_cobro: string
  metodoCobro: 'debito' | 'tarjeta'
  billeteraId: string
  tarjetaId: string
  categoriaId: string
  subcategoriaId: string
  isEdit: boolean
  isSubmitting: boolean
  isEditingName: boolean
}

type ModalAction =
  | { type: 'RESET'; data?: Suscripcion | null; defaultBilleteraId?: string; defaultTarjetaId?: string }
  | { type: 'SET_STEP'; step: ModalStep; direction?: 'forward' | 'back' }
  | { type: 'SELECT_SERVICIO'; servicio: ServicioCatalogo | null; nombre: string }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_DEFAULT_PAYMENT_METHODS'; defaultBilleteraId?: string; defaultTarjetaId?: string }
  | { [K in keyof ModalState]: { type: 'SET_FIELD'; field: K; value: ModalState[K] } }[keyof ModalState]

function getHoyLocal(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInitialFormState(suscripcion?: Suscripcion | null): ModalState {
  if (suscripcion) {
    const matchingService = CATALOGO_SUSCRIPCIONES.find(
      (s) =>
        s.nombre.toLowerCase() === suscripcion.nombre.toLowerCase() ||
        s.id.toLowerCase() === suscripcion.nombre.toLowerCase()
    )
    return {
      step: 2,
      slideDirection: 'forward',
      searchQuery: '',
      servicioId: matchingService?.id || 'other',
      nombre: suscripcion.nombre,
      monto: suscripcion.precio_actual?.monto || null,
      moneda: (suscripcion.precio_actual?.moneda as 'ARS' | 'USD') || 'ARS',
      frecuencia: (suscripcion.frecuencia as FrecuenciaType) || 'mensual',
      proximo_cobro: suscripcion.proximo_cobro || getHoyLocal(),
      metodoCobro: suscripcion.tarjeta_id ? 'tarjeta' : 'debito',
      tarjetaId: suscripcion.tarjeta_id || '',
      billeteraId: suscripcion.billetera_id || '',
      categoriaId: suscripcion.categoria_id || '',
      subcategoriaId: suscripcion.subcategoria_id || '',
      isEdit: true,
      isSubmitting: false,
      isEditingName: false,
    }
  }

  return {
    step: 1,
    slideDirection: 'forward',
    searchQuery: '',
    servicioId: null,
    nombre: '',
    monto: null,
    moneda: 'ARS',
    frecuencia: 'mensual',
    proximo_cobro: getHoyLocal(),
    metodoCobro: 'debito',
    billeteraId: '',
    tarjetaId: '',
    categoriaId: '',
    subcategoriaId: '',
    isEdit: false,
    isSubmitting: false,
    isEditingName: false,
  }
}

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'RESET': {
      const base = getInitialFormState(action.data)
      return {
        ...base,
        billeteraId: base.billeteraId || action.defaultBilleteraId || '',
        tarjetaId: base.tarjetaId || action.defaultTarjetaId || '',
      }
    }
    case 'SET_STEP':
      return {
        ...state,
        step: action.step,
        slideDirection: action.direction || state.slideDirection,
      }
    case 'SELECT_SERVICIO':
      return {
        ...state,
        servicioId: action.servicio ? action.servicio.id : 'other',
        nombre: action.nombre,
        frecuencia: (action.servicio?.frecuenciaDefault as FrecuenciaType) || state.frecuencia,
        slideDirection: 'forward',
        step: 2,
        isEditingName: !action.servicio,
      }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'SET_DEFAULT_PAYMENT_METHODS':
      return {
        ...state,
        billeteraId: state.billeteraId || action.defaultBilleteraId || '',
        tarjetaId: state.tarjetaId || action.defaultTarjetaId || '',
      }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

// ── Clasificación óptica de identidades visuales ─────────────────────────────

type LogoVisualType = 'app-squircle' | 'round-emblem' | 'youtube-pill' | 'tidal' | 'glyph'

function getLogoVisualType(serviceId?: string | null): LogoVisualType {
  if (!serviceId) return 'glyph'
  const id = serviceId.toLowerCase()
  if (id === 'youtubepremium') return 'youtube-pill'
  if (id === 'tidal') return 'tidal'
  if (['spotify', 'youtubemusic', 'netflix', 'appletv', 'paramount', 'hbomax', 'plutotv', 'peacock', 'discord'].includes(id)) {
    return 'round-emblem'
  }
  if ([
    'applemusic', 'amazonmusic', 'deezer', 'primevideo', 'crunchyroll', 'twitch', 'kick',
    'rakutenviki', 'canva', 'chatgpt', 'duolingo', 'xbox', 'linkedin', 'meli', 'rappi',
    'pedidosya', 'playstation', 'dropbox', 'adobe', 'copilot', 'microsoft365', 'ubisoft'
  ].includes(id)) {
    return 'app-squircle'
  }
  return 'glyph'
}

// ── Logo del servicio ─────────────────────────────────────────────────────────

interface ServiceLogoProps {
  servicio?: ServicioCatalogo | null
  nombre: string
  size?: 40 | 36
  failedLogos?: Record<string, boolean>
  onLogoError?: (id: string) => void
}

function ServiceLogo({
  servicio,
  nombre,
  size = 40,
  failedLogos = {},
  onLogoError,
}: ServiceLogoProps) {
  const isCompact = size === 36
  const slotClass = isCompact ? styles.logoSlot36 : styles.logoSlot40
  const hasLogo = servicio?.logoPath && !failedLogos[servicio.id]

  if (hasLogo && servicio?.logoPath) {
    const visualType = getLogoVisualType(servicio.id)

    let imgClass = styles.logoImgGlyph
    if (visualType === 'app-squircle') {
      imgClass = styles.logoImgAppSquircle
    } else if (visualType === 'round-emblem') {
      imgClass = styles.logoImgRoundEmblem
    } else if (visualType === 'youtube-pill') {
      imgClass = styles.logoImgYoutubePill
    } else if (visualType === 'tidal') {
      imgClass = styles.logoImgTidal
    }

    return (
      <div className={`${styles.serviceIconSlot} ${slotClass}`}>
        <img
          src={servicio.logoPath}
          alt={servicio.nombre}
          className={imgClass}
          onError={() => onLogoError?.(servicio.id)}
        />
      </div>
    )
  }

  if (servicio?.icono && ICONOS_GENERICOS[servicio.icono]) {
    const IconComp = ICONOS_GENERICOS[servicio.icono]
    return (
      <div className={`${styles.serviceIconSlot} ${slotClass}`}>
        <div className={styles.serviceIconGenericBox}>
          <IconComp size={isCompact ? 16 : 18} />
        </div>
      </div>
    )
  }

  const initial = (nombre.trim() || servicio?.nombre || 'S')[0].toUpperCase()

  return (
    <div className={`${styles.serviceIconSlot} ${slotClass}`}>
      <div className={styles.serviceIconGenericBox}>
        <span className={styles.serviceInitialText}>{initial}</span>
      </div>
    </div>
  )
}

// ── Item del catálogo ─────────────────────────────────────────────────────────

function SuscripcionPickerItem({
  servicio,
  onSelect,
  failedLogos,
  onLogoError,
}: {
  servicio: ServicioCatalogo
  onSelect: (servicio: ServicioCatalogo) => void
  failedLogos: Record<string, boolean>
  onLogoError: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={styles.pickerCard}
      onClick={() => onSelect(servicio)}
      aria-label={`Seleccionar ${servicio.nombre}`}
    >
      <ServiceLogo
        servicio={servicio}
        nombre={servicio.nombre}
        size={36}
        failedLogos={failedLogos}
        onLogoError={onLogoError}
      />
      <span className={styles.pickerCardTitle}>{servicio.nombre}</span>
    </button>
  )
}

// ── Modal Principal ───────────────────────────────────────────────────────────

export default function SuscripcionModal({
  open,
  onClose,
  suscripcion,
  onSuccess,
}: SuscripcionModalProps) {
  const [state, dispatch] = useReducer(modalReducer, suscripcion, getInitialFormState)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({})

  const {
    step,
    searchQuery,
    servicioId,
    nombre,
    monto,
    moneda,
    frecuencia,
    proximo_cobro,
    metodoCobro,
    billeteraId,
    tarjetaId,
    categoriaId,
    subcategoriaId,
    isEdit,
    isSubmitting,
    isEditingName,
  } = state

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevSuscripcion, setPrevSuscripcion] = useState(suscripcion)

  if (open !== prevOpen || suscripcion !== prevSuscripcion) {
    setPrevOpen(open)
    setPrevSuscripcion(suscripcion)
    if (open) {
      dispatch({ type: 'RESET', data: suscripcion })
    }
  }

  // Cargar billeteras, tarjetas, categorías y cotización al abrir
  useEffect(() => {
    let isMounted = true
    const loadInitialData = async () => {
      try {
        const [b, t, c, cotiz] = (await Promise.all([
          billeteraService.list(),
          tarjetaService.getTarjetas(),
          categoriaService.getCategorias(),
          dashboardService.getCotizacion().catch(() => null),
        ])) as [Billetera[], TarjetaCredito[], Categoria[], CotizacionDolar | null]
        if (!isMounted) return

        const validBilleteras = sortBilleteras(b.filter((x) => !x.es_efectivo && x.estado === 'activa'))
        const validTarjetas = t.filter((x) => x.estado === 'activa')
        setBilleteras(validBilleteras)
        setTarjetas(validTarjetas)
        setCategorias(c)
        if (cotiz) {
          setCotizacion(cotiz)
        }

        const defB = validBilleteras.find((x) => x.es_principal)?.id || validBilleteras[0]?.id || ''
        const defT = validTarjetas[0]?.id || ''

        dispatch({
          type: 'SET_DEFAULT_PAYMENT_METHODS',
          defaultBilleteraId: defB,
          defaultTarjetaId: defT,
        })
      } catch (error) {
        console.error('Error al cargar datos en SuscripcionModal', error)
      }
    }

    if (open) {
      void loadInitialData()
    }
    return () => {
      isMounted = false
    }
  }, [open, suscripcion])

  // Foco al editar nombre en el encabezado
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      const len = nameInputRef.current.value.length
      nameInputRef.current.setSelectionRange(len, len)
    }
  }, [isEditingName])

  // Servicio seleccionado del catálogo
  const serv = useMemo(() => {
    if (!servicioId || servicioId === 'other') {
      return CATALOGO_SUSCRIPCIONES.find(
        (s) => s.nombre.toLowerCase() === nombre.trim().toLowerCase()
      ) || null
    }
    return CATALOGO_SUSCRIPCIONES.find((s) => s.id === servicioId) || null
  }, [servicioId, nombre])

  // Medio de pago seleccionado y cálculo de equivalente en moneda alternativa
  const selectedMedio = useMemo(() => {
    if (metodoCobro === 'tarjeta') {
      return tarjetas.find((t) => t.id === tarjetaId)
    }
    return billeteras.find((b) => b.id === billeteraId)
  }, [metodoCobro, tarjetaId, billeteraId, tarjetas, billeteras])

  const equivalenteEstimado = useMemo(() => {
    if (!monto || !selectedMedio || !cotizacion) return null
    const medioMoneda = selectedMedio.moneda
    if (moneda === medioMoneda) return null

    const cotizValor = cotizacion.venta || cotizacion.promedio || cotizacion.compra || 0
    if (cotizValor <= 0) return null

    if (moneda === 'USD' && medioMoneda === 'ARS') {
      const totalArs = monto * cotizValor
      return `≈ $ ${totalArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pesos (cotiz. ${cotizValor.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
    }
    if (moneda === 'ARS' && medioMoneda === 'USD') {
      const totalUsd = monto / cotizValor
      return `≈ US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dólares (cotiz. ${cotizValor.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
    }
    return null
  }, [monto, moneda, selectedMedio, cotizacion])

  // Cálculo de costo mensual aproximado si la frecuencia no es mensual
  const costoMensual = useMemo(() => {
    if (!monto) return null
    const DIVISORES: Record<FrecuenciaType, number> = {
      mensual: 1,
      bimestral: 2,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    }
    const val = monto / DIVISORES[frecuencia]
    return val % 1 === 0 ? val.toString() : val.toFixed(2)
  }, [monto, frecuencia])

  // Filtro de categoría rápida en picker
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)

  // Catálogo filtrado por búsqueda
  const catalogoFiltrado = useMemo(() => {
    if (!searchQuery.trim()) return CATALOGO_SUSCRIPCIONES
    const q = searchQuery.toLowerCase().trim()
    return CATALOGO_SUSCRIPCIONES.filter((s) => s.nombre.toLowerCase().includes(q))
  }, [searchQuery])

  const sinResultados = catalogoFiltrado.length === 0

  const categoriasAMostrar = useMemo(() => {
    if (searchQuery.trim()) return CATEGORIAS_CATALOGO
    if (!categoriaFiltro) return CATEGORIAS_CATALOGO
    return CATEGORIAS_CATALOGO.filter((c) => c.label === categoriaFiltro)
  }, [searchQuery, categoriaFiltro])

  // Scroll automático a la tarjeta / billetera activa en el carrusel
  useEffect(() => {
    if (!open || step !== 2) return
    const idToScroll = metodoCobro === 'tarjeta' ? tarjetaId : billeteraId
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        const scroller = card.closest('[data-modal-carousel]') as HTMLElement | null
        if (scroller) {
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
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [billeteraId, tarjetaId, metodoCobro, step, open])

  // Resolución de IDs de categoría y subcategoría para sincronización
  const resolverIdsCategoria = useCallback(
    async (catNombre: string, subcatNombre?: string | null) => {
      let cats = categorias
      if (cats.length === 0) {
        try {
          cats = await categoriaService.getCategorias()
          setCategorias(cats)
        } catch {
          return { catId: '', subId: '' }
        }
      }
      const norm = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const egresoCats = cats.filter((c) => c.tipo === 'egreso')
      const cat =
        egresoCats.find((c) => norm(c.nombre) === norm(catNombre)) ||
        egresoCats.find((c) => norm(c.nombre) === 'otros')
      if (!cat) return { catId: '', subId: '' }

      let subId = ''
      if (subcatNombre) {
        try {
          const subcats = await categoriaService.getSubcategorias(cat.id)
          const sub = subcats.find((s) => norm(s.nombre) === norm(subcatNombre))
          if (sub) subId = sub.id
        } catch {
          /* ignore */
        }
      }
      return { catId: cat.id, subId }
    },
    [categorias]
  )

  // Acciones de navegación y selección
  const handleSelectServicio = async (s: ServicioCatalogo) => {
    const nInicial = nombreInicial(s)
    dispatch({ type: 'SELECT_SERVICIO', servicio: s, nombre: nInicial })

    const pre = preseleccionCategoria(s, nInicial)
    const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
    dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
    dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
  }

  const handleSelectCustom = () => {
    dispatch({ type: 'SELECT_SERVICIO', servicio: null, nombre: '' })
  }

  const handleBackToStep1 = () => {
    dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
    dispatch({ type: 'SET_STEP', step: 1, direction: 'back' })
  }

  const handleBackToStep2 = () => {
    dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
    dispatch({ type: 'SET_STEP', step: 2, direction: 'back' })
  }

  const handleGoToStep3 = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!monto || !nombre.trim()) return
    dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
    dispatch({ type: 'SET_STEP', step: 3, direction: 'forward' })
  }

  const getSlideClass = (slideStep: 1 | 2 | 3) => {
    if (step === slideStep) return styles.slideVisible
    if (slideStep < step) return styles.slideExitLeft
    return styles.slideEnterRight
  }

  const handleCommitName = async (newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) {
      const fallback = serv?.nombre || suscripcion?.nombre || 'Suscripción'
      dispatch({ type: 'SET_FIELD', field: 'nombre', value: fallback })
    } else {
      dispatch({ type: 'SET_FIELD', field: 'nombre', value: trimmed })
      if (!isEdit) {
        const target = serv || 'other'
        const pre = preseleccionCategoria(target, trimmed)
        if (pre.categoria) {
          const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
          dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
          dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
        }
      }
    }
    dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
  }

  // Guardar suscripción (Crear / Actualizar)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!monto || !nombre.trim() || isSubmitting) {
      if (!nombre.trim()) {
        dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: true })
      } else if (!monto) {
        sileo.error({ title: 'Completá los campos obligatorios' })
      }
      return
    }

    const hoyLocal = getHoyLocal()
    if (proximo_cobro < hoyLocal) {
      sileo.error({ title: 'Tiene que ser hoy o una fecha futura.' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload: SuscripcionCreate | SuscripcionUpdate = {
        nombre: nombre.trim(),
        categoria_id: categoriaId || null,
        subcategoria_id: subcategoriaId || null,
        frecuencia,
        proximo_cobro,
        monto,
        moneda,
        billetera_id: metodoCobro === 'debito' && billeteraId ? billeteraId : null,
        tarjeta_id: metodoCobro === 'tarjeta' && tarjetaId ? tarjetaId : null,
      }

      if (isEdit && suscripcion) {
        await suscripcionService.updateSuscripcion(suscripcion.id, payload)
        sileo.success({ title: 'Suscripción actualizada' })
      } else {
        await suscripcionService.createSuscripcion(payload as SuscripcionCreate)
        sileo.success({ title: 'Suscripción creada' })
      }

      void suscripcionService.getSuscripciones().then(setCachedSuscripciones)
      onSuccess()
      onClose()
    } catch (error: unknown) {
      sileo.error({
        title: getErrorMessage(error, 'No pudimos guardar la suscripción. Intentá de nuevo.'),
      })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      className={styles.modal}
      ariaLabel={isEdit ? 'Editar suscripción' : 'Nueva suscripción'}
    >
      <div className={styles.modalRoot}>
        {/* Indicador de pasos */}
        <div className={styles.stepIndicator} aria-hidden="true">
          {isEdit ? (
            <>
              <div
                className={`${styles.dot} ${
                  step === 2 ? styles.dotActive : styles.dotInactive
                }`}
              />
              <div
                className={`${styles.dot} ${
                  step === 3 ? styles.dotActive : styles.dotInactive
                }`}
              />
            </>
          ) : (
            <>
              <div
                className={`${styles.dot} ${
                  step === 1 ? styles.dotActive : styles.dotInactive
                }`}
              />
              <div
                className={`${styles.dot} ${
                  step === 2 ? styles.dotActive : styles.dotInactive
                }`}
              />
              <div
                className={`${styles.dot} ${
                  step === 3 ? styles.dotActive : styles.dotInactive
                }`}
              />
            </>
          )}
        </div>

        {/* Contenedor con transición de slides y altura adaptativa */}
        <div className={styles.slidesContainer} data-modal-frame>
          {/* ── PASO 1: PICKER (Catálogo de Servicios) ── */}
          <div
            className={`${styles.slide} ${getSlideClass(1)}`}
            data-modal-frame
          >
            <div className={styles.pickerBody}>
              {/* Header del picker */}
              <div className={styles.pickerHeader}>
                <div className={styles.headerTopRow}>
                  <h2 className={styles.pickerTitle}>¿Qué suscripción querés agregar?</h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Búsqueda */}
                <div className={styles.searchWrap}>
                  <Search size={15} className={styles.searchIcon} strokeWidth={1.75} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar por nombre"
                    value={searchQuery}
                    onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
                    autoFocus={esPunteroFino()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.searchClear}
                      onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filtro rápido por categoría (Chips) */}
                <div
                  className={styles.categoryChipsWrap}
                  role="tablist"
                  aria-label="Filtrar por categoría"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={categoriaFiltro === null}
                    className={`${styles.categoryChip} ${categoriaFiltro === null ? styles.categoryChipActive : ''}`}
                    onClick={() => setCategoriaFiltro(null)}
                  >
                    Todos
                  </button>
                  {CATEGORIAS_CATALOGO.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      role="tab"
                      aria-selected={categoriaFiltro === cat.label}
                      className={`${styles.categoryChip} ${categoriaFiltro === cat.label ? styles.categoryChipActive : ''}`}
                      onClick={() =>
                        setCategoriaFiltro((prev) => (prev === cat.label ? null : cat.label))
                      }
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido del picker */}
              {sinResultados ? (
                <div className={styles.noResults}>
                  <p className={styles.noResultsText}>No encontramos ese servicio.</p>
                  <p className={styles.noResultsSub}>
                    Podés agregarlo como suscripción personalizada.
                  </p>
                  <button
                    type="button"
                    className={styles.customBtn}
                    onClick={handleSelectCustom}
                  >
                    Agregar suscripción personalizada
                  </button>
                </div>
              ) : (
                <>
                  {categoriasAMostrar.map((cat) => {
                    const items = catalogoFiltrado.filter((s) => cat.ids.includes(s.id))
                    if (items.length === 0) return null
                    const isFijos = cat.label.toLowerCase().includes('fijos')
                    return (
                      <div key={cat.label} className={styles.section}>
                        <p className={styles.sectionLabel}>{cat.label}</p>
                        <div className={isFijos ? styles.pickerGridFijos : styles.pickerGrid}>
                          {items.map((s) => (
                            <SuscripcionPickerItem
                              key={s.id}
                              servicio={s}
                              onSelect={handleSelectServicio}
                              failedLogos={failedLogos}
                              onLogoError={(id) =>
                                setFailedLogos((prev) => ({ ...prev, [id]: true }))
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Opción "+ Otra suscripción" */}
                  <div className={styles.section}>
                    <button
                      type="button"
                      className={styles.otraBtn}
                      onClick={handleSelectCustom}
                    >
                      <Plus size={15} strokeWidth={2} />
                      <span>Agregar suscripción personalizada</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── PASO 2: MONTO Y MÉTODO DE COBRO ── */}
          <div
            className={`${styles.slide} ${getSlideClass(2)}`}
            data-modal-frame
          >
            <form onSubmit={handleGoToStep3} className={styles.formContainer} data-modal-frame>
              {/* Cuerpo scrolleable que incluye el header */}
              <div className={`${styles.formBody} ${styles.formBodyWithHeader}`}>
                {/* Header del formulario */}
                <div className={styles.formHeader}>
                  {!isEdit ? (
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={handleBackToStep1}
                      aria-label="Volver al catálogo"
                    >
                      <ChevronLeft size={20} strokeWidth={1.75} />
                    </button>
                  ) : (
                    <div style={{ width: 32 }} />
                  )}

                  {/* Preview del servicio con edición en línea del nombre */}
                  <div className={styles.bankPreview}>
                    <ServiceLogo
                      servicio={serv}
                      nombre={nombre}
                      size={36}
                      failedLogos={failedLogos}
                      onLogoError={(id) => setFailedLogos((prev) => ({ ...prev, [id]: true }))}
                    />
                    <div className={styles.bankPreviewInfo}>
                      <div className={styles.bankPreviewNombreRow}>
                        {isEditingName ? (
                          <div className={styles.inlineNameWrap}>
                            <input
                              ref={nameInputRef}
                              autoFocus
                              type="text"
                              className={styles.inlineNameInput}
                              value={nombre}
                              onChange={(e) =>
                                dispatch({
                                  type: 'SET_FIELD',
                                  field: 'nombre',
                                  value: e.target.value,
                                })
                              }
                              onBlur={() => handleCommitName(nombre)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void handleCommitName(nombre)
                                } else if (e.key === 'Escape') {
                                  const fallback =
                                    serv?.nombre || suscripcion?.nombre || 'Suscripción'
                                  dispatch({ type: 'SET_FIELD', field: 'nombre', value: fallback })
                                  dispatch({
                                    type: 'SET_FIELD',
                                    field: 'isEditingName',
                                    value: false,
                                  })
                                }
                              }}
                              placeholder={serv?.nombre || 'Nombre de la suscripción'}
                              maxLength={100}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.bankPreviewNombreBtn}
                            onClick={() =>
                              dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: true })
                            }
                            title="Editar nombre"
                          >
                            <span className={styles.bankPreviewNombreText}>
                              {nombre.trim() ||
                                serv?.nombre ||
                                suscripcion?.nombre ||
                                'Suscripción'}
                            </span>
                            <span className={styles.pencilIconWrapper} aria-hidden="true">
                              <Pencil size={13} strokeWidth={2} />
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Campos del paso 2 */}
                <div className={styles.formFields} data-modal-stack>
                  {/* Bloque 1: Monto Hero */}
                  <div className={styles.montoHeroField} data-modal-block>
                    <div data-modal-field>
                      <MontoInput
                        value={monto}
                        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                        moneda={moneda}
                        onMonedaChange={(m) =>
                          dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })
                        }
                        placeholder="0"
                        allowDecimals
                        autoFocus={esPunteroFino()}
                      />

                      {equivalenteEstimado && (
                        <div className={styles.equivalenteEstimado}>
                          <span className={styles.equivalenteLabel}>Equivalente estimado:</span>
                          <span className={styles.equivalenteMonto}>{equivalenteEstimado}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloque 2: Método de cobro y carrusel de medios */}
                  <div data-modal-block>
                    <div className={styles.formField} data-modal-field>
                      <label className={styles.fieldLabel}>¿Cómo se cobra?</label>
                      <SegmentedControl<'debito' | 'tarjeta'>
                        options={[
                          {
                            value: 'debito',
                            label: 'Billetera',
                            icon: <Wallet size={15} />,
                          },
                          {
                            value: 'tarjeta',
                            label: 'Tarjeta de crédito',
                            icon: <CreditCard size={15} />,
                          },
                        ]}
                        value={metodoCobro}
                        onChange={(value) =>
                          dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value })
                        }
                        fullWidth
                        ariaLabel="Método de cobro"
                      />
                    </div>

                    <div className={styles.formField} data-modal-field>
                      <label className={styles.fieldLabel}>
                        {metodoCobro === 'tarjeta'
                          ? 'Seleccioná tu tarjeta'
                          : '¿De qué billetera?'}
                      </label>

                      <div data-modal-carousel>
                        <div data-modal-carousel-track>
                          {metodoCobro === 'tarjeta' ? (
                            tarjetas.length === 0 ? (
                              <p className={styles.emptyCardsHint}>
                                No tenés tarjetas activas registradas.
                              </p>
                            ) : (
                              tarjetas.map((t) => (
                                <SelectableSurface
                                  key={t.id}
                                  selected={tarjetaId === t.id}
                                  context="modal"
                                  onClick={() =>
                                    dispatch({
                                      type: 'SET_FIELD',
                                      field: 'tarjetaId',
                                      value: t.id,
                                    })
                                  }
                                  ref={(el) => {
                                    if (el) cardRefs.current.set(t.id, el as HTMLDivElement)
                                    else cardRefs.current.delete(t.id)
                                  }}
                                  title={`Seleccionar tarjeta ${t.nombre}`}
                                  aria-label={`Seleccionar tarjeta ${t.nombre}`}
                                >
                                  <RealCardPreview
                                    ultimos4={t.nombre.replace('•••• ', '').slice(-4)}
                                    red={t.red}
                                    titular={t.nombre}
                                    diaCierre={t.dia_cierre}
                                    diaVencimiento={t.dia_vencimiento}
                                    proximoCierre={t.proximo_cierre}
                                    proximoVencimiento={t.proximo_vencimiento}
                                    color={t.color || '#0D2045'}
                                    billeteraNombre={
                                      billeteras.find((b) => b.id === t.billetera_id)?.nombre ||
                                      RED_LABEL[t.red]
                                    }
                                  />
                                </SelectableSurface>
                              ))
                            )
                          ) : billeteras.length === 0 ? (
                            <p className={styles.emptyCardsHint}>
                              No tenés billeteras activas registradas.
                            </p>
                          ) : (
                            billeteras.map((b) => (
                              <SelectableSurface
                                key={b.id}
                                selected={billeteraId === b.id}
                                context="modal"
                                onClick={() =>
                                  dispatch({
                                    type: 'SET_FIELD',
                                    field: 'billeteraId',
                                    value: b.id,
                                  })
                                }
                                ref={(el) => {
                                  if (el) cardRefs.current.set(b.id, el as HTMLDivElement)
                                  else cardRefs.current.delete(b.id)
                                }}
                                title={`Seleccionar billetera ${b.nombre}`}
                                aria-label={`Seleccionar billetera ${b.nombre}`}
                              >
                                <BilleteraCard billetera={b} variant="select" />
                              </SelectableSurface>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer fijo del paso 2 */}
              <div className={styles.formFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={isEdit ? onClose : handleBackToStep1}
                >
                  {isEdit ? 'Cancelar' : 'Atrás'}
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={!monto || !nombre.trim()}
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>

          {/* ── PASO 3: FRECUENCIA Y FECHA DE PRÓXIMO COBRO ── */}
          <div
            className={`${styles.slide} ${getSlideClass(3)}`}
            data-modal-frame
          >
            <form onSubmit={handleSubmit} className={styles.formContainer} data-modal-frame>
              {/* Cuerpo scrolleable que incluye el header */}
              <div className={`${styles.formBody} ${styles.formBodyWithHeader}`}>
                {/* Header del paso 3 */}
                <div className={styles.formHeader}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={handleBackToStep2}
                    aria-label="Volver al paso anterior"
                  >
                    <ChevronLeft size={20} strokeWidth={1.75} />
                  </button>

                  <div className={styles.bankPreview}>
                    <ServiceLogo
                      servicio={serv}
                      nombre={nombre}
                      size={36}
                      failedLogos={failedLogos}
                      onLogoError={(id) => setFailedLogos((prev) => ({ ...prev, [id]: true }))}
                    />
                    <div className={styles.bankPreviewInfo}>
                      <div className={styles.bankPreviewNombreRow}>
                        {isEditingName ? (
                          <div className={styles.inlineNameWrap}>
                            <input
                              ref={nameInputRef}
                              autoFocus
                              type="text"
                              className={styles.inlineNameInput}
                              value={nombre}
                              onChange={(e) =>
                                dispatch({
                                  type: 'SET_FIELD',
                                  field: 'nombre',
                                  value: e.target.value,
                                })
                              }
                              onBlur={() => handleCommitName(nombre)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void handleCommitName(nombre)
                                } else if (e.key === 'Escape') {
                                  const fallback =
                                    serv?.nombre || suscripcion?.nombre || 'Suscripción'
                                  dispatch({ type: 'SET_FIELD', field: 'nombre', value: fallback })
                                  dispatch({
                                    type: 'SET_FIELD',
                                    field: 'isEditingName',
                                    value: false,
                                  })
                                }
                              }}
                              placeholder={serv?.nombre || 'Nombre de la suscripción'}
                              maxLength={100}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.bankPreviewNombreBtn}
                            onClick={() =>
                              dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: true })
                            }
                            title="Editar nombre"
                          >
                            <span className={styles.bankPreviewNombreText}>
                              {nombre.trim() ||
                                serv?.nombre ||
                                suscripcion?.nombre ||
                                'Suscripción'}
                            </span>
                            <span className={styles.pencilIconWrapper} aria-hidden="true">
                              <Pencil size={13} strokeWidth={2} />
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Campos del paso 3 */}
                <div className={styles.formFields} data-modal-stack>
                  {/* Bloque 1: Frecuencia de cobro */}
                  <div data-modal-block>
                    <div className={styles.formField} data-modal-field>
                      <label className={styles.fieldLabel}>Frecuencia de cobro</label>
                      <SegmentedControl<FrecuenciaType>
                        options={[
                          { value: 'mensual', label: 'Mensual' },
                          { value: 'bimestral', label: 'Bimestral' },
                          { value: 'trimestral', label: 'Trimestral' },
                          { value: 'semestral', label: 'Semestral' },
                          { value: 'anual', label: 'Anual' },
                        ]}
                        value={frecuencia}
                        onChange={(value) =>
                          dispatch({ type: 'SET_FIELD', field: 'frecuencia', value })
                        }
                        fullWidth
                        layout="wrap"
                        ariaLabel="Frecuencia de cobro"
                      />
                      {costoMensual && frecuencia !== 'mensual' && (
                        <p className={styles.previewCosto}>
                          Equivale a {moneda === 'ARS' ? '$' : 'US$'} {costoMensual} por mes
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bloque 2: Fecha de próximo cobro */}
                  <div data-modal-block>
                    <div className={styles.formField} data-modal-field>
                      <DateInput
                        id="suscripcion-proximo-cobro"
                        variant="compact"
                        label="Próximo cobro"
                        min={getHoyLocal()}
                        value={proximo_cobro}
                        onChange={(val) =>
                          dispatch({ type: 'SET_FIELD', field: 'proximo_cobro', value: val })
                        }
                        error={
                          proximo_cobro && proximo_cobro < getHoyLocal()
                            ? 'Tiene que ser hoy o una fecha futura.'
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer fijo del paso 3 */}
              <div className={styles.formFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleBackToStep2}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={
                    !monto ||
                    !nombre.trim() ||
                    isSubmitting ||
                    (!!proximo_cobro && proximo_cobro < getHoyLocal())
                  }
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : isEdit
                    ? 'Actualizar'
                    : 'Guardar suscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  )
}
