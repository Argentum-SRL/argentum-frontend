import React, { useReducer, useEffect, useState, useMemo, useRef } from 'react'
import { Plus, ChevronLeft, X, CreditCard, Wallet, Search, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { useToast } from '@/hooks/useToast'
import { DateInput } from '@/components/ui'
import { CATALOGO_SUSCRIPCIONES, CATEGORIAS_CATALOGO } from '@/lib/constants/suscripciones'
import type { ServicioCatalogo } from '@/lib/constants/suscripciones'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import categoriaService from '@/services/categoria.service'
import type { Billetera, TarjetaCredito, Categoria, Suscripcion } from '@/types'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import styles from './SuscripcionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

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
  isEdit: boolean
  isSubmitting: boolean
}

type FormAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | number | boolean | null }
  | { type: 'RESET'; data?: Suscripcion | null; defaultBilleteraId?: string; defaultTarjetaId?: string }

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  servicioId: null,
  nombrePersonalizado: '',
  monto: null,
  moneda: 'ARS',
  frecuencia: 'mensual',
  proximo_cobro: new Date().toISOString().split('T')[0],
  metodoCobro: 'debito',
  billeteraId: '',
  tarjetaId: '',
  categoriaId: '',
  subcategoriaId: '',
  isEdit: false,
  isSubmitting: false,
}

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
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
  const [state, dispatch] = useReducer(reducer, initialState)
  const { showToast } = useToast()
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [b, t, c] = await Promise.all([
          billeteraService.list(),
          tarjetaService.getTarjetas(),
          categoriaService.getCategorias()
        ])
        const validBilleteras = b.filter(x => !x.es_efectivo && x.estado === 'activa')
        const validTarjetas = t.filter(x => x.estado === 'activa')
        setBilleteras(validBilleteras)
        setTarjetas(validTarjetas)
        setCategorias(c)

        const defB = validBilleteras.find(x => x.es_principal)?.id || validBilleteras[0]?.id || ''
        const defT = validTarjetas[0]?.id || ''
        
        dispatch({ 
          type: 'RESET', 
          data: suscripcion, 
          defaultBilleteraId: defB, 
          defaultTarjetaId: defT 
        })
        setSearchTerm('')
      } catch (error) {
        console.error(error)
      }
    }

    if (open) {
      loadInitialData()
    }
  }, [open, suscripcion])

  // Scroll to selected card
  useEffect(() => {
    if (!open || state.step !== 2) return
    const idToScroll = state.metodoCobro === 'tarjeta' ? state.tarjetaId : state.billeteraId
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
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

  const resolveCategoryAndSubcategory = async (catName: string, subcatName?: string) => {
    try {
      let catsList = categorias
      if (catsList.length === 0) {
        catsList = await categoriaService.getCategorias()
        setCategorias(catsList)
      }

      // 1. Buscar categoría por nombre (case-insensitive)
      let cat = catsList.find(c => c.nombre.toLowerCase() === catName.toLowerCase())
      // Fallback a "Otros" si no existe
      if (!cat) {
        cat = catsList.find(c => c.nombre.toLowerCase() === 'otros')
      }

      if (cat) {
        dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: cat.id })

        // 2. Buscar subcategoría por nombre (case-insensitive)
        const subcats = await categoriaService.getSubcategorias(cat.id)
        let subcat = subcatName
          ? subcats.find(sc => sc.nombre.toLowerCase() === subcatName.toLowerCase())
          : undefined

        // Fallback a "Otros" dentro de la categoría si no encuentra la subcategoría
        if (!subcat) {
          subcat = subcats.find(sc => sc.nombre.toLowerCase() === 'otros')
        }

        if (subcat) {
          dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: subcat.id })
        } else {
          dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
        }
      } else {
        dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: '' })
        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
      }
    } catch (error) {
      console.error('Error al resolver categoría/subcategoría:', error)
    }
  }

  const handleSelectServicio = async (s: ServicioCatalogo) => {
    dispatch({ type: 'SET_FIELD', field: 'servicioId', value: s.id })
    dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: s.nombre })
    dispatch({ type: 'SET_FIELD', field: 'frecuencia', value: s.frecuenciaDefault })

    await resolveCategoryAndSubcategory(s.categoria, s.subcategoria)
    goNext()
  }

  const handleSelectOther = () => {
    dispatch({ type: 'SET_FIELD', field: 'servicioId', value: 'other' })
    resolveCategoryAndSubcategory('Otros', 'Otros')
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.nombrePersonalizado) return
    if (!state.categoriaId) {
      await resolveCategoryAndSubcategory('Otros', 'Otros')
    }
    goNext()
  }

  const goNext = () => dispatch({ type: 'SET_STEP', step: 2, direction: 'forward' })

  const goNextFromStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!state.monto) {
      showToast('Completá los campos obligatorios', 'error')
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
    if (!state.monto || !state.nombrePersonalizado) {
      showToast('Completá los campos obligatorios', 'error')
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload = {
        nombre: state.nombrePersonalizado,
        categoria_id: state.categoriaId || undefined,
        subcategoria_id: state.subcategoriaId || undefined,
        frecuencia: state.frecuencia,
        proximo_cobro: state.proximo_cobro,
        monto: state.monto,
        moneda: state.moneda,
        billetera_id: state.metodoCobro === 'debito' ? state.billeteraId : undefined,
        tarjeta_id: state.metodoCobro === 'tarjeta' ? state.tarjetaId : undefined
      }

      if (state.isEdit && suscripcion) {
        await suscripcionService.updateSuscripcion(suscripcion.id, payload)
        showToast('Suscripción actualizada', 'success')
      } else {
        await suscripcionService.createSuscripcion(payload)
        showToast('Suscripción creada', 'success')
      }
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } }
      const msg = axiosError.response?.data?.detail || 'Error al guardar'
      showToast(msg, 'error')
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const animClass = state.slideDirection === 'forward' ? styles.slideForward : styles.slideBack

  const currentItemsCount = state.metodoCobro === 'tarjeta' ? tarjetas.length : billeteras.length

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding ariaLabel="Nueva suscripción" className={styles.modalCustom}>
      <div className={styles.slidesContainer}>
        {/* Step Indicators */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${state.step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${state.step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${state.step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* PASO 1: Selección de Servicio */}
        {state.step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={handleStep1Submit}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>¿Qué suscripción querés agregar?</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
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
                                {s.logoPath ? (
                                  <img
                                    src={s.logoPath}
                                    alt={s.nombre}
                                    className={styles.logo}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
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
                        onChange={e => dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: e.target.value })}
                        autoFocus
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
                  disabled={!state.nombrePersonalizado} 
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 2: Monto y Método de Cobro */}
        {state.step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={goNextFromStep2}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Configuración de {state.nombrePersonalizado}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                <MontoInput
                  value={state.monto}
                  onChange={(v: number | null) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                  moneda={state.moneda}
                  onMonedaChange={(m: 'ARS' | 'USD') => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                />

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>¿Cómo se cobra?</label>
                  <div className={styles.radioPills}>
                    <button
                      type="button"
                      className={`${styles.pill} ${state.metodoCobro === 'tarjeta' ? styles.pillActive : ''}`}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value: 'tarjeta' })}
                    >
                      <CreditCard size={14} /> Tarjeta de crédito
                    </button>
                    <button
                      type="button"
                      className={`${styles.pill} ${state.metodoCobro === 'debito' ? styles.pillActive : ''}`}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value: 'debito' })}
                    >
                      <Wallet size={14} /> Cuenta / Billetera
                    </button>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {state.metodoCobro === 'tarjeta' ? 'Seleccioná tu tarjeta' : '¿De qué billetera?'}
                  </label>
                  
                  <div className={styles.billeterasCarouselScroller}>
                    <div 
                      className={`${styles.billeterasCarousel} ${currentItemsCount === 1 ? styles.carouselCenter : styles.carouselStart}`}
                    >
                      {state.metodoCobro === 'tarjeta' ? (
                        tarjetas.map(t => (
                          <div
                            key={t.id}
                            className={styles.billeteraSelectWrap}
                            data-active={state.tarjetaId === t.id}
                            ref={(el) => { if (el) cardRefs.current.set(t.id, el); else cardRefs.current.delete(t.id) }}
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
                              onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                              aria-label={`Seleccionar tarjeta ${t.nombre}`}
                            />
                          </div>
                        ))
                      ) : (
                        billeteras.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={state.billeteraId === b.id}
                            ref={(el) => { if (el) cardRefs.current.set(b.id, el); else cardRefs.current.delete(b.id) }}
                          >
                            <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                              aria-label={`Seleccionar billetera ${b.nombre}`}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
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
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Configuración de {state.nombrePersonalizado}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Frecuencia de cobro</label>
                  <div className={styles.radioPills}>
                    {['mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].map(f => (
                      <button
                        key={f}
                        type="button"
                        className={`${styles.pill} ${state.frecuencia === f ? styles.pillActive : ''}`}
                        onClick={() => dispatch({ type: 'SET_FIELD', field: 'frecuencia', value: f })}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  {costoMensual && state.frecuencia !== 'mensual' && (
                    <p className={styles.previewCosto}>Equivale a {state.moneda === 'ARS' ? '$' : 'u$s'} {costoMensual} por mes</p>
                  )}
                </div>

                <DateInput
                  id="proximo-cobro"
                  variant="compact"
                  label="Primer cobro"
                  value={state.proximo_cobro}
                  onChange={val => dispatch({ type: 'SET_FIELD', field: 'proximo_cobro', value: val })}
                />
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button 
                  type="submit"
                  className={styles.submitBtn} 
                  disabled={state.isSubmitting}
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
