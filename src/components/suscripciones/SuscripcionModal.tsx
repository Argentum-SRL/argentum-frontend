import React, { useReducer, useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { esPunteroFino } from '@/utils/foco'
import { Plus, ChevronLeft, X, CreditCard, Wallet, Search, Check, Pencil } from '@/components/ui/icons'
import { nombreInicial, preseleccionCategoria } from '@/lib/utils/sugerirCategoriaSuscripcion'
import { ICONOS_GENERICOS } from '@/lib/constants/suscripciones'
import Modal from '@/components/ui/Modal/Modal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { DateInput } from '@/components/ui'
import { CATALOGO_SUSCRIPCIONES, CATEGORIAS_CATALOGO } from '@/lib/constants/suscripciones'
import type { ServicioCatalogo } from '@/lib/constants/suscripciones'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import categoriaService from '@/services/categoria.service'
import { dashboardService } from '@/services/dashboard.service'
import type { Billetera, TarjetaCredito, Categoria, Suscripcion, CotizacionDolar } from '@/types'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import SelectableSurface from '@/components/ui/SelectableSurface'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import SegmentedControl from '@/components/ui/SegmentedControl'
import styles from './SuscripcionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { setCachedSuscripciones } from '@/lib/utils/movimientoVisual.utils'

interface SuscripcionModalProps {
  open: boolean
  onClose: () => void
  suscripcion?: Suscripcion | null
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2 | 3
  slideDirection: 'forward' | 'back'
  servicioId: string | null
  nombrePersonalizado: string
  monto: number | null
  moneda: 'ARS' | 'USD'
  frecuencia: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  proximo_cobro: string
  metodoCobro: 'tarjeta' | 'debito'
  billeteraId: string
  tarjetaId: string
  categoriaId: string
  subcategoriaId: string
  categoriaModificadaManualmente?: boolean
  isEdit: boolean
  isSubmitting: boolean
}

type FormAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | number | boolean | null }
  | { type: 'RESET'; data?: Suscripcion | null; defaultBilleteraId?: string; defaultTarjetaId?: string }
  | { type: 'SET_DEFAULT_PAYMENT_METHODS'; defaultBilleteraId?: string; defaultTarjetaId?: string }

const getHoyLocal = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  servicioId: null,
  nombrePersonalizado: '',
  monto: null,
  moneda: 'ARS',
  frecuencia: 'mensual',
  proximo_cobro: getHoyLocal(),
  metodoCobro: 'debito',
  billeteraId: '',
  tarjetaId: '',
  categoriaId: '',
  subcategoriaId: '',
  categoriaModificadaManualmente: false,
  isEdit: false,
  isSubmitting: false,
}

const getInitialFormState = (suscripcion?: Suscripcion | null): FormState => {
  if (suscripcion) {
    return {
      ...initialState,
      isEdit: true,
      step: 2,
      nombrePersonalizado: suscripcion.nombre,
      monto: suscripcion.precio_actual?.monto || null,
      moneda: suscripcion.precio_actual?.moneda || 'ARS',
      frecuencia: suscripcion.frecuencia,
      proximo_cobro: suscripcion.proximo_cobro,
      metodoCobro: suscripcion.tarjeta_id ? 'tarjeta' : 'debito',
      tarjetaId: suscripcion.tarjeta_id || '',
      billeteraId: suscripcion.billetera_id || '',
      categoriaId: suscripcion.categoria_id || '',
      subcategoriaId: suscripcion.subcategoria_id || ''
    }
  }
  return initialState
}

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_DEFAULT_PAYMENT_METHODS':
      return {
        ...state,
        billeteraId: state.billeteraId || action.defaultBilleteraId || '',
        tarjetaId: state.tarjetaId || action.defaultTarjetaId || '',
      }
    case 'RESET':
      if (action.data) {
        const s = action.data as Suscripcion
        return {
          ...initialState,
          isEdit: true,
          step: 2,
          nombrePersonalizado: s.nombre,
          monto: s.precio_actual?.monto || null,
          moneda: s.precio_actual?.moneda || 'ARS',
          frecuencia: s.frecuencia,
          proximo_cobro: s.proximo_cobro,
          metodoCobro: s.tarjeta_id ? 'tarjeta' : 'debito',
          tarjetaId: s.tarjeta_id || action.defaultTarjetaId || '',
          billeteraId: s.billetera_id || action.defaultBilleteraId || '',
          categoriaId: s.categoria_id || '',
          subcategoriaId: s.subcategoria_id || ''
        }
      }
      return {
        ...initialState,
        billeteraId: action.defaultBilleteraId || '',
        tarjetaId: action.defaultTarjetaId || '',
      }
    default:
      return state
  }
}

const SuscripcionModal: React.FC<SuscripcionModalProps> = ({ open, onClose, suscripcion, onSuccess }) => {
  const [state, dispatch] = useReducer(reducer, suscripcion, getInitialFormState)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({})
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevSuscripcion, setPrevSuscripcion] = useState(suscripcion)

  if (open !== prevOpen || suscripcion !== prevSuscripcion) {
    setPrevOpen(open)
    setPrevSuscripcion(suscripcion)
    if (open) {
      dispatch({ type: 'RESET', data: suscripcion })
      setSearchTerm('')
      setIsEditingName(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const loadInitialData = async () => {
      try {
        const [b, t, c, cotiz] = (await Promise.all([
          billeteraService.list(),
          tarjetaService.getTarjetas(),
          categoriaService.getCategorias(),
          dashboardService.getCotizacion().catch(() => null)
        ])) as [Billetera[], TarjetaCredito[], Categoria[], CotizacionDolar | null]
        if (!isMounted) return
        const validBilleteras = sortBilleteras(b.filter(x => !x.es_efectivo && x.estado === 'activa'))
        const validTarjetas = t.filter(x => x.estado === 'activa')
        setBilleteras(validBilleteras)
        setTarjetas(validTarjetas)
        setCategorias(c)
        if (cotiz) {
          setCotizacion(cotiz)
        }

        const defB = validBilleteras.find(x => x.es_principal)?.id || validBilleteras[0]?.id || ''
        const defT = validTarjetas[0]?.id || ''
        
        dispatch({ 
          type: 'SET_DEFAULT_PAYMENT_METHODS', 
          defaultBilleteraId: defB, 
          defaultTarjetaId: defT 
        })
      } catch (error) {
        console.error(error)
      }
    }

    if (open) {
      loadInitialData()
    }
    return () => { isMounted = false }
  }, [open, suscripcion])

  const selectedMedio = useMemo(() => {
    if (state.metodoCobro === 'tarjeta') {
      return tarjetas.find(t => t.id === state.tarjetaId)
    }
    return billeteras.find(b => b.id === state.billeteraId)
  }, [state.metodoCobro, state.tarjetaId, state.billeteraId, tarjetas, billeteras])

  const equivalenteEstimado = useMemo(() => {
    if (!state.monto || !selectedMedio || !cotizacion) return null
    const medioMoneda = selectedMedio.moneda
    if (state.moneda === medioMoneda) return null

    const cotizValor = cotizacion.venta || cotizacion.promedio || cotizacion.compra || 0
    if (cotizValor <= 0) return null

    if (state.moneda === 'USD' && medioMoneda === 'ARS') {
      const totalArs = state.monto * cotizValor
      return `≈ $ ${totalArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pesos (cotiz. ${cotizValor.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
    }
    if (state.moneda === 'ARS' && medioMoneda === 'USD') {
      const totalUsd = state.monto / cotizValor
      return `≈ US$ ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dólares (cotiz. ${cotizValor.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
    }
    return null
  }, [state.monto, state.moneda, selectedMedio, cotizacion])

  // Scroll to selected card
  useEffect(() => {
    if (!open || state.step !== 2) return
    const idToScroll = state.metodoCobro === 'tarjeta' ? state.tarjetaId : state.billeteraId
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
  }, [state.billeteraId, state.tarjetaId, state.metodoCobro, state.step, open])

  const filteredCatalogo = useMemo(() => {
    if (!searchTerm) return CATALOGO_SUSCRIPCIONES
    return CATALOGO_SUSCRIPCIONES.filter(s =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const costoMensual = useMemo(() => {
    if (!state.monto) return null
    const DIVISORES: Record<string, number> = { mensual: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 }
    const val = (state.monto / DIVISORES[state.frecuencia])
    return val % 1 === 0 ? val.toString() : val.toFixed(2)
  }, [state.monto, state.frecuencia])

  const serv = useMemo(() => CATALOGO_SUSCRIPCIONES.find(s => s.id === state.servicioId), [state.servicioId])

  const resolverIdsCategoria = useCallback(async (catNombre: string, subcatNombre?: string | null) => {
    let cats = categorias
    if (cats.length === 0) {
      try { cats = await categoriaService.getCategorias(); setCategorias(cats) } catch { return { catId: '', subId: '' } }
    }
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const egresoCats = cats.filter(c => c.tipo === 'egreso')
    const cat = egresoCats.find(c => norm(c.nombre) === norm(catNombre)) || egresoCats.find(c => norm(c.nombre) === 'otros')
    if (!cat) return { catId: '', subId: '' }

    let subId = ''
    if (subcatNombre) {
      try {
        const subcats = await categoriaService.getSubcategorias(cat.id)
        const sub = subcats.find(s => norm(s.nombre) === norm(subcatNombre))
        if (sub) subId = sub.id
      } catch { /* ignore */ }
    }
    return { catId: cat.id, subId }
  }, [categorias])

  // Sugerencia automática de categoría según nombre mientras no se toque manualmente
  useEffect(() => {
    if (state.isEdit || state.categoriaModificadaManualmente || (!serv && state.servicioId !== 'other')) return
    const nombre = state.nombrePersonalizado.trim()
    if (!nombre) return

    let active = true
    const actualizar = async () => {
      const targetServ = serv || 'other'
      const pre = preseleccionCategoria(targetServ, nombre)
      if (pre.categoria) {
        const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
        if (active) {
          dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
          dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
        }
      }
    }

    void actualizar()
    return () => { active = false }
  }, [state.nombrePersonalizado, state.servicioId, state.isEdit, state.categoriaModificadaManualmente, categorias, serv, resolverIdsCategoria])

  const handleSelectServicio = async (s: ServicioCatalogo) => {
    const nInicial = nombreInicial(s)
    dispatch({ type: 'SET_FIELD', field: 'servicioId', value: s.id })
    dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: nInicial })
    dispatch({ type: 'SET_FIELD', field: 'frecuencia', value: s.frecuenciaDefault })
    dispatch({ type: 'SET_FIELD', field: 'categoriaModificadaManualmente', value: false })

    const pre = preseleccionCategoria(s, nInicial)
    const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
    dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
    dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
    goNext()
  }

  const handleSelectOther = async () => {
    dispatch({ type: 'SET_FIELD', field: 'servicioId', value: 'other' })
    dispatch({ type: 'SET_FIELD', field: 'categoriaModificadaManualmente', value: false })
    const nombre = state.nombrePersonalizado.trim()
    if (nombre) {
      const pre = preseleccionCategoria('other', nombre)
      const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
      dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
    }
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombre = state.nombrePersonalizado.trim()
    if (!nombre) return
    if (!state.categoriaModificadaManualmente) {
      const targetServ = serv || (state.servicioId === 'other' ? 'other' : null)
      if (targetServ) {
        const pre = preseleccionCategoria(targetServ, nombre)
        const res = await resolverIdsCategoria(pre.categoria, pre.subcategoria)
        dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: res.catId })
        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: res.subId })
      }
    }
    goNext()
  }

  const goNext = () => dispatch({ type: 'SET_STEP', step: 2, direction: 'forward' })

  const goNextFromStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!state.monto) {
      sileo.error({ title: 'Completá los campos obligatorios' })
      return
    }
    dispatch({ type: 'SET_STEP', step: 3, direction: 'forward' })
  }

  const goBack = () => {
    if (state.step > 1) {
      const prevStep = (state.step - 1) as 1 | 2
      dispatch({ type: 'SET_STEP', step: prevStep, direction: 'back' })
    }
  }

  const handleSave = async () => {
    if (!state.monto || !state.nombrePersonalizado.trim()) {
      sileo.error({ title: 'Completá los campos obligatorios' })
      return
    }

    const hoyLocal = getHoyLocal()
    if (state.proximo_cobro < hoyLocal) {
      sileo.error({ title: 'Tiene que ser hoy o una fecha futura.' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload = {
        nombre: state.nombrePersonalizado.trim(),
        categoria_id: state.categoriaId || null,
        subcategoria_id: state.subcategoriaId || null,
        frecuencia: state.frecuencia,
        proximo_cobro: state.proximo_cobro,
        monto: state.monto,
        moneda: state.moneda,
        billetera_id: state.metodoCobro === 'debito' && state.billeteraId ? state.billeteraId : null,
        tarjeta_id: state.metodoCobro === 'tarjeta' && state.tarjetaId ? state.tarjetaId : null
      }

      if (state.isEdit && suscripcion) {
        await suscripcionService.updateSuscripcion(suscripcion.id, payload)
        sileo.success({ title: 'Suscripción actualizada' })
      } else {
        await suscripcionService.createSuscripcion(payload)
        sileo.success({ title: 'Suscripción creada' })
      }
      void suscripcionService.getSuscripciones().then(setCachedSuscripciones)
      onSuccess()
      onClose()
    } catch (error: unknown) {
      sileo.error({ title: getErrorMessage(error, 'No pudimos guardar la suscripción. Intentá de nuevo.') })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const animClass = state.slideDirection === 'forward' ? styles.slideForward : styles.slideBack

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      showHeader={false} 
      noPadding 
      autoHeight 
      ariaLabel={state.isEdit ? "Editar suscripción" : "Nueva suscripción"} 
      className={styles.modalCustom}
      stepDots={{ total: state.isEdit ? 2 : 3, current: state.isEdit ? state.step - 2 : state.step - 1 }}
    >
      <div className={styles.slidesContainer}>

        {/* PASO 1: Selección de Servicio */}
        {state.step === 1 && (
          <div className={`${styles.slide} ${animClass}`} data-modal-frame>
            <form 
              className={styles.formContainer}
              onSubmit={handleStep1Submit}
            >
              <div className={styles.stepHeaderRow}>
                <h2 className={styles.headerTitle}>¿Qué suscripción querés agregar?</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody} data-modal-stack>

                <div className={styles.searchWrapper}>
                  <div className={styles.inputWrapperIcon}>
                    <Search size={18} className={styles.inputIconLeft} />
                    <input 
                      id="search-suscripcion"
                      className={styles.fieldInputIcon} 
                      placeholder="Buscar servicio (Netflix, Spotify...)"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.catalogScroll}>
                  {CATEGORIAS_CATALOGO.map(cat => {
                    const items = filteredCatalogo.filter(s => cat.ids.includes(s.id))
                    if (items.length === 0) return null
                    return (
                      <div key={cat.label} className={styles.catalogGroup}>
                        <h3 className={styles.groupLabel}>{cat.label}</h3>
                        <div className={styles.catalogGrid}>
                          {items.map(s => (
                            <div
                              key={s.id}
                              className={`${styles.catalogItem} ${state.servicioId === s.id ? styles.catalogItemActive : ''}`}
                              onClick={() => handleSelectServicio(s)}
                            >
                              <div className={styles.logoWrapper}>
                                {s.icono && ICONOS_GENERICOS[s.icono] ? (
                                  React.createElement(ICONOS_GENERICOS[s.icono], { size: 24 })
                                ) : s.logoPath && !failedLogos[s.id] ? (
                                  <img
                                    src={s.logoPath}
                                    alt={s.nombre}
                                    className={styles.logo}
                                    onError={() => setFailedLogos(prev => ({ ...prev, [s.id]: true }))}
                                  />
                                ) : (
                                  <div className={styles.logoFallback}>{s.nombre[0]}</div>
                                )}
                              </div>
                              <span className={styles.serviceName}>{s.nombre}</span>
                              {state.servicioId === s.id && <div className={styles.checkBadge}><Check size={10} color="white" /></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <div
                    className={`${styles.otherOption} ${state.servicioId === 'other' ? styles.otherOptionActive : ''}`}
                    onClick={handleSelectOther}
                  >
                    <div className={`${styles.logoFallback} ${styles.otherOptionLogo}`}><Plus size={20} /></div>
                    <div className={styles.flex1}>
                      <span className={styles.otherOptionText}>Otra suscripción</span>
                    </div>
                  </div>

                  {state.servicioId === 'other' && (
                    <div className={styles.customInputWrap}>
                      <input
                        className={`${styles.fieldInput} ${styles.fullWidthInput}`}
                        placeholder="Nombre de la suscripción"
                        value={state.nombrePersonalizado}
                        maxLength={100}
                        onChange={e => dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: e.target.value })}
                        autoFocus={esPunteroFino()}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                <button 
                  type="submit"
                  className={styles.submitBtn} 
                  disabled={!state.nombrePersonalizado.trim()} 
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 2: Monto y Método de Cobro */}
        {state.step === 2 && (
          <div className={`${styles.slide} ${animClass}`} data-modal-frame>
            <form 
              className={styles.formContainer}
              onSubmit={goNextFromStep2}
            >
              <div className={styles.stepHeaderRow}>
                {!state.isEdit ? (
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                ) : <div style={{ width: 32 }} />}
                <div className={styles.headerTitleRow}>
                  <span className={styles.headerTitleStatic}>Configuración de</span>
                  {isEditingName ? (
                    <div className={styles.bankPreviewInputWrapper}>
                      <input
                        className={styles.bankPreviewNombreInput}
                        value={state.nombrePersonalizado}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: e.target.value })}
                        onBlur={() => {
                          if (!state.nombrePersonalizado.trim()) {
                            dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: suscripcion?.nombre || serv?.nombre || 'Suscripción' })
                          }
                          setIsEditingName(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (!state.nombrePersonalizado.trim()) {
                              dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: suscripcion?.nombre || serv?.nombre || 'Suscripción' })
                            }
                            setIsEditingName(false)
                          } else if (e.key === 'Escape') {
                            dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: suscripcion?.nombre || serv?.nombre || 'Suscripción' })
                            setIsEditingName(false)
                          }
                        }}
                        placeholder={suscripcion?.nombre || serv?.nombre || 'Nombre'}
                        maxLength={40}
                        autoFocus={esPunteroFino()}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.bankPreviewNombreBtn}
                      onClick={() => setIsEditingName(true)}
                      title="Editar nombre"
                    >
                      <span className={styles.bankPreviewNombreText}>
                        {state.nombrePersonalizado.trim() || suscripcion?.nombre || serv?.nombre || 'Suscripción'}
                      </span>
                      <span className={styles.pencilIconWrapper} aria-hidden="true">
                        <Pencil size={13} strokeWidth={2} />
                      </span>
                    </button>
                  )}
                </div>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody} data-modal-stack>
                <div data-modal-block>

                <MontoInput
                  value={state.monto}
                  onChange={(v: number | null) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                  moneda={state.moneda}
                  onMonedaChange={(m: 'ARS' | 'USD') => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                />

                {equivalenteEstimado && (
                  <div className={styles.equivalenteEstimado}>
                    <span className={styles.equivalenteLabel}>Equivalente estimado:</span>
                    <span className={styles.equivalenteMonto}>{equivalenteEstimado}</span>
                  </div>
                )}

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
                    value={state.metodoCobro}
                    onChange={value => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value })}
                    fullWidth
                    ariaLabel="Método de cobro"
                  />
                </div>

                <div className={styles.formField} data-modal-field>
                  <label className={styles.fieldLabel}>
                    {state.metodoCobro === 'tarjeta' ? 'Seleccioná tu tarjeta' : '¿De qué billetera?'}
                  </label>
                  
                  <div data-modal-carousel>
                    <div data-modal-carousel-track>
                      {state.metodoCobro === 'tarjeta' ? (
                        tarjetas.map(t => (
                          <SelectableSurface
                            key={t.id}
                            selected={state.tarjetaId === t.id}
                            context="modal"
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                            ref={(el) => { if (el) cardRefs.current.set(t.id, el as HTMLDivElement); else cardRefs.current.delete(t.id) }}
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
                              billeteraNombre={billeteras.find(b => b.id === t.billetera_id)?.nombre || RED_LABEL[t.red]}
                            />
                          </SelectableSurface>
                        ))
                      ) : (
                        billeteras.map(b => (
                          <SelectableSurface
                            key={b.id}
                            selected={state.billeteraId === b.id}
                            context="modal"
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                            ref={(el) => { if (el) cardRefs.current.set(b.id, el as HTMLDivElement); else cardRefs.current.delete(b.id) }}
                            title={`Seleccionar billetera ${b.nombre}`}
                            aria-label={`Seleccionar billetera ${b.nombre}`}
                          >
                            <BilleteraCard
                              billetera={b}
                              variant="select"
                            />
                          </SelectableSurface>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={state.isEdit ? onClose : goBack}>
                  {state.isEdit ? 'Cancelar' : 'Atrás'}
                </button>
                <button 
                  type="submit"
                  className={styles.submitBtn} 
                  disabled={!state.monto}
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: Frecuencia y Fecha */}
        {state.step === 3 && (
          <div className={`${styles.slide} ${animClass}`} data-modal-frame>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <div className={styles.stepHeaderRow}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <div className={styles.headerTitleRow}>
                  <span className={styles.headerTitleStatic}>Configuración de</span>
                  <span className={styles.bankPreviewNombreText}>
                    {state.nombrePersonalizado.trim() || suscripcion?.nombre || serv?.nombre || 'Suscripción'}
                  </span>
                </div>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody} data-modal-stack>
                <div data-modal-block>
                <div className={styles.formField} data-modal-field>
                  <label className={styles.fieldLabel}>Frecuencia de cobro</label>
                  <SegmentedControl<typeof state.frecuencia>
                    options={[
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'bimestral', label: 'Bimestral' },
                      { value: 'trimestral', label: 'Trimestral' },
                      { value: 'semestral', label: 'Semestral' },
                      { value: 'anual', label: 'Anual' },
                    ]}
                    value={state.frecuencia}
                    onChange={value => dispatch({ type: 'SET_FIELD', field: 'frecuencia', value })}
                    fullWidth
                    layout="wrap"
                    ariaLabel="Frecuencia de cobro"
                  />
                  {costoMensual && state.frecuencia !== 'mensual' && (
                    <p className={styles.previewCosto}>Equivale a {state.moneda === 'ARS' ? '$' : 'US$'} {costoMensual} por mes</p>
                  )}
                </div>

                <div className={styles.formField} data-modal-field>
                  <DateInput
                    id="proximo-cobro"
                    variant="compact"
                    label="Próximo cobro"
                    min={getHoyLocal()}
                    value={state.proximo_cobro}
                    onChange={val => dispatch({ type: 'SET_FIELD', field: 'proximo_cobro', value: val })}
                    error={state.proximo_cobro && state.proximo_cobro < getHoyLocal() ? 'Tiene que ser hoy o una fecha futura.' : undefined}
                  />
                </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button 
                  type="submit"
                  className={styles.submitBtn} 
                  disabled={state.isSubmitting || (!!state.proximo_cobro && state.proximo_cobro < getHoyLocal())}
                >
                  {state.isSubmitting ? 'Guardando...' : (state.isEdit ? 'Actualizar' : 'Guardar suscripción')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SuscripcionModal
