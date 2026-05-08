import React, { useReducer, useEffect, useState, useMemo } from 'react'
import { Plus, ChevronLeft, X, CreditCard, Wallet, Bell, Search, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { Button, Input, Select } from '@/components/ui'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import { CATALOGO_SUSCRIPCIONES, CATEGORIAS_CATALOGO } from '@/lib/constants/suscripciones'
import type { ServicioCatalogo } from '@/lib/constants/suscripciones'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import categoriaService from '@/services/categoria.service'
import type { Billetera, TarjetaCredito, Categoria, Suscripcion } from '@/types'
import { formatMonto } from '@/utils/format'
import styles from './SuscripcionModal.module.css'

interface SuscripcionModalProps {
  open: boolean
  onClose: () => void
  suscripcion?: Suscripcion | null
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2
  slideDirection: 'forward' | 'back'
  servicioId: string | null
  nombrePersonalizado: string
  monto: number | null
  moneda: 'ARS' | 'USD'
  frecuencia: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  proximo_cobro: string
  metodoCobro: 'tarjeta' | 'debito' | 'recordatorio'
  billeteraId: string
  tarjetaId: string
  categoriaId: string
  isEdit: boolean
}

type FormAction = 
  | { type: 'SET_STEP'; step: 1 | 2; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'RESET'; data?: any }

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  servicioId: null,
  nombrePersonalizado: '',
  monto: null,
  moneda: 'ARS',
  frecuencia: 'mensual',
  proximo_cobro: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  metodoCobro: 'debito',
  billeteraId: '',
  tarjetaId: '',
  categoriaId: '',
  isEdit: false
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
          metodoCobro: s.tarjeta_id ? 'tarjeta' : s.billetera_id ? 'debito' : 'recordatorio',
          tarjetaId: s.tarjeta_id || '',
          billeteraId: s.billetera_id || '',
          categoriaId: s.categoria_id || ''
        }
      }
      return initialState
    default:
      return state
  }
}

// ── Componente MontoHero ──
function MontoHero({ value, onChange, moneda, onMonedaChange }: any) {
  const [inputVal, setInputVal] = useState(value ? value.toString() : '')

  useEffect(() => {
    if (value === null) setInputVal('')
    else setInputVal(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setInputVal(val)
    const num = parseFloat(val)
    onChange(isNaN(num) ? null : num)
  }

  return (
    <div className={styles.montoHero}>
      <div className={styles.montoInputWrapper}>
        <span className={styles.montoCurrency}>{moneda === 'ARS' ? '$' : 'u$s'}</span>
        <input
          type="text"
          className={styles.montoInput}
          value={inputVal}
          onChange={handleInputChange}
          placeholder="0"
          autoFocus
        />
      </div>
      <div className={styles.monedaToggle}>
        <button 
          className={`${styles.monedaBtn} ${moneda === 'ARS' ? styles.monedaBtnActive : ''}`}
          onClick={() => onMonedaChange('ARS')}
        >ARS</button>
        <button 
          className={`${styles.monedaBtn} ${moneda === 'USD' ? styles.monedaBtnActive : ''}`}
          onClick={() => onMonedaChange('USD')}
        >USD</button>
      </div>
    </div>
  )
}

const SuscripcionModal: React.FC<SuscripcionModalProps> = ({ open, onClose, suscripcion, onSuccess }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { showToast } = useToast()
  
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET', data: suscripcion })
      loadData()
    }
  }, [open, suscripcion])

  const loadData = async () => {
    try {
      const [b, t, c] = await Promise.all([
        billeteraService.list(),
        tarjetaService.getTarjetas(),
        categoriaService.getCategorias()
      ])
      setBilleteras(b.filter(x => !x.es_efectivo && x.estado === 'activa'))
      setTarjetas(t.filter(x => x.estado === 'activa'))
      setCategorias(c)
      
      if (!state.billeteraId && b.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.find(x => x.es_principal)?.id || b[0].id })
      }
      if (!state.tarjetaId && t.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t[0].id })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const filteredCatalogo = useMemo(() => {
    if (!searchTerm) return CATALOGO_SUSCRIPCIONES
    return CATALOGO_SUSCRIPCIONES.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const costoMensual = useMemo(() => {
    if (!state.monto) return null
    const DIVISORES: any = { mensual: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 }
    return (state.monto / DIVISORES[state.frecuencia]).toFixed(2)
  }, [state.monto, state.frecuencia])

  const handleSelectServicio = (s: ServicioCatalogo) => {
    dispatch({ type: 'SET_FIELD', field: 'servicioId', value: s.id })
    dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: s.nombre })
    dispatch({ type: 'SET_FIELD', field: 'frecuencia', value: s.frecuenciaDefault })
    
    // Autoseleccionar categoría si existe
    if (s.categoria) {
      const cat = categorias.find(c => c.nombre.toLowerCase() === s.categoria.toLowerCase())
      if (cat) dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: cat.id })
    }
  }

  const goNext = () => dispatch({ type: 'SET_STEP', step: 2, direction: 'forward' })
  const goBack = () => dispatch({ type: 'SET_STEP', step: 1, direction: 'back' })

  const handleSave = async () => {
    if (!state.monto || !state.nombrePersonalizado) {
      showToast('Completá los campos obligatorios', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        nombre: state.nombrePersonalizado,
        categoria_id: state.categoriaId || undefined,
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
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const animClass = state.slideDirection === 'forward' ? 'slide-in-right' : 'slide-in-left'

  return (
    <Modal open={open} onClose={onClose} side="right" width={450}>
      <div className={styles.modal}>
        {/* PASO 1 */}
        {state.step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <div className={styles.header}>
              <h2 className={styles.title}>¿Qué suscripción querés agregar?</h2>
              <div className={styles.steps}>
                <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
                <div className={styles.stepDot} />
              </div>
              <div style={{ marginTop: 16 }}>
                <Input 
                  placeholder="Buscar servicio..." 
                  icon={<Search size={18} />} 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.content}>
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
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'servicioId', value: 'other' })}
              >
                <div className={styles.logoFallback} style={{ background: 'var(--text-3)' }}><Plus size={20} /></div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Otra suscripción</span>
                </div>
              </div>

              {state.servicioId === 'other' && (
                <Input 
                  placeholder="Nombre de la suscripción" 
                  value={state.nombrePersonalizado}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'nombrePersonalizado', value: e.target.value })}
                  autoFocus
                />
              )}
            </div>

            <div className={styles.footer}>
              <Button 
                className={styles.btnNext} 
                disabled={!state.nombrePersonalizado}
                onClick={goNext}
              >Siguiente</Button>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {state.step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <div className={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className={styles.backArrow} onClick={goBack}><ChevronLeft size={20} /></button>
                <h2 className={styles.title}>Configuración</h2>
              </div>
              <div className={styles.steps}>
                <div className={styles.stepDot} />
                <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
              </div>
            </div>

            <div className={styles.content}>
              <MontoHero 
                value={state.monto}
                onChange={(v: any) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                moneda={state.moneda}
                onMonedaChange={(m: any) => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
              />

              <div>
                <h4 className={styles.sectionLabel}>Frecuencia de cobro</h4>
                <div className={styles.pillsRow}>
                  {['mensual', 'bimestral', 'trimestral', 'semestral', 'anual'].map(f => (
                    <button 
                      key={f}
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

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 className={styles.sectionLabel}>Próximo cobro</h4>
                  <Input 
                    type="date" 
                    value={state.proximo_cobro} 
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'proximo_cobro', value: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className={styles.sectionLabel}>Categoría</h4>
                  <Select 
                    value={state.categoriaId}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </Select>
                </div>
              </div>

              <div>
                <h4 className={styles.sectionLabel}>¿Cómo se cobra?</h4>
                <div className={styles.pillsRow} style={{ marginBottom: 16 }}>
                  <button 
                    className={`${styles.pill} ${state.metodoCobro === 'tarjeta' ? styles.pillActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value: 'tarjeta' })}
                  ><CreditCard size={14} style={{ marginRight: 6 }} /> Tarjeta</button>
                  <button 
                    className={`${styles.pill} ${state.metodoCobro === 'debito' ? styles.pillActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value: 'debito' })}
                  ><Wallet size={14} style={{ marginRight: 6 }} /> Débito</button>
                  <button 
                    className={`${styles.pill} ${state.metodoCobro === 'recordatorio' ? styles.pillActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'metodoCobro', value: 'recordatorio' })}
                  ><Bell size={14} style={{ marginRight: 6 }} /> Solo recordatorio</button>
                </div>

                {state.metodoCobro === 'tarjeta' && (
                  <Select 
                    value={state.tarjetaId}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: e.target.value })}
                  >
                    {tarjetas.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.red})</option>)}
                  </Select>
                )}

                {state.metodoCobro === 'debito' && (
                  <Select 
                    value={state.billeteraId}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: e.target.value })}
                  >
                    {billeteras.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </Select>
                )}
              </div>
            </div>

            <div className={styles.footer}>
              <Button variant="outline" className={styles.btnBack} onClick={goBack}>Atrás</Button>
              <Button 
                className={styles.btnNext} 
                loading={loading}
                onClick={handleSave}
              >{state.isEdit ? 'Actualizar' : 'Guardar suscripción'}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SuscripcionModal
