import { useMemo, useEffect, useReducer, useRef, useCallback, useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ArrowRightLeft,
  Layers,
  Banknote,
  GripHorizontal,
  ChevronLeft,
  X
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria, Subcategoria } from '@/types'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionModal.module.css'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import BilleteraCard from '@/components/billeteras/BilleteraCard'

interface TransaccionModalProps {
  open: boolean
  onClose: () => void
  transaccion?: Transaccion | null
  billeteras: Billetera[]
  categorias: Categoria[]
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2
  slideDirection: 'forward' | 'back'
  tipo: 'ingreso' | 'egreso'
  monto: number | null
  moneda: 'ARS' | 'USD'
  descripcion: string
  categoriaId: string
  subcategoriaId: string
  billeteraId: string
  fecha: string
  metodoPago: 'debito' | 'efectivo' | 'credito' | 'transferencia'
  showAllCats: boolean
  cantidadCuotas: number
  tasaInteres: number
  isSubmitting: boolean
}

type FormAction =
  | { type: 'RESET'; transaccion: Transaccion | null; billeteras: Billetera[] }
  | { type: 'SET_STEP'; step: 1 | 2; direction: 'forward' | 'back' }
  | { [K in keyof FormState]: { type: 'SET_FIELD'; field: K; value: FormState[K] } }[keyof FormState]

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  tipo: 'egreso',
  monto: null,
  moneda: 'ARS',
  descripcion: '',
  categoriaId: '',
  subcategoriaId: '',
  billeteraId: '',
  fecha: new Date().toISOString().split('T')[0],
  metodoPago: 'debito',
  showAllCats: false,
  cantidadCuotas: 2,
  tasaInteres: 0,
  isSubmitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      if (action.transaccion) {
        return {
          ...initialState,
          tipo: action.transaccion.tipo,
          monto: action.transaccion.monto,
          moneda: action.transaccion.moneda,
          descripcion: action.transaccion.descripcion || '',
          categoriaId: action.transaccion.categoria_id || '',
          subcategoriaId: action.transaccion.subcategoria_id || '',
          billeteraId: action.transaccion.billetera_id,
          fecha: action.transaccion.fecha.split('T')[0],
          metodoPago: action.transaccion.metodo_pago,
        }
      } else {
        const principal = action.billeteras.find((b) => b.es_principal && b.estado === 'activa')
        const firstActive = action.billeteras.find((b) => b.estado === 'activa')
        return {
          ...initialState,
          billeteraId: principal?.id || firstActive?.id || '',
          moneda: principal?.moneda || firstActive?.moneda || 'ARS',
        }
      }
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

// ── Inline MontoHero (no usa el componente MontoInput para tener control total) ──
function formatParaMostrar(str: string): string {
  const num = str.replace(/\./g, '')
  const partes = num.split(',')
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return partes.join(',')
}

function MontoHero({
  value, onChange, moneda, onMonedaChange, disabled,
}: {
  value: number | null
  onChange: (v: number | null) => void
  moneda: 'ARS' | 'USD'
  onMonedaChange: (m: 'ARS' | 'USD') => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(() =>
    value !== null ? value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  )
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (value === null) { setInputValue('') }
    else {
      const cleaned = inputValue.replace(/\./g, '').replace(',', '.')
      if (parseFloat(cleaned) !== value) {
        setInputValue(value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
      }
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (!raw) { setInputValue(''); onChange(null); return }
    if (raw.endsWith('.') && !raw.includes(',')) raw = raw.slice(0, -1) + ','
    let cleaned = raw.replace(/[^0-9.,]/g, '')
    const parts = cleaned.split(',')
    if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    const formatted = formatParaMostrar(cleaned)
    const start = e.target.selectionStart || 0
    const oldLen = e.target.value.length
    setInputValue(formatted)
    const numStr = formatted.replace(/\./g, '').replace(',', '.')
    if (numStr.endsWith('.')) { onChange(parseFloat(numStr.slice(0, -1)) || null) }
    else { const n = parseFloat(numStr); onChange(isNaN(n) ? null : n) }
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = Math.max(0, start + (inputRef.current.value.length - oldLen))
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const navKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','Home','End']
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) return
    if (e.key === ',' || e.key === '.') { if (inputValue.includes(',')) e.preventDefault(); return }
    if (!/[0-9]/.test(e.key)) e.preventDefault()
  }, [inputValue])

  return (
    <div className={styles.montoHero}>
      {/* Toggle chip: un solo botón que alterna la moneda al hacer click */}
      <button
        type="button"
        className={styles.monedaToggleChip}
        onClick={() => !disabled && onMonedaChange(moneda === 'ARS' ? 'USD' : 'ARS')}
        disabled={disabled}
        aria-label={`Moneda actual: ${moneda}. Click para cambiar.`}
        title="Cambiar moneda"
      >
        <span className={styles.monedaChipFlag}>
          {moneda === 'ARS' ? '🇦🇷' : '🇺🇸'}
        </span>
        <span className={styles.monedaChipLabel}>{moneda}</span>
      </button>

      <div className={styles.montoDivider} />

      {/* Input grande */}
      <div className={styles.montoHeroInput}>
        <span className={styles.montoHeroPrefix}>$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={styles.montoHeroField}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          disabled={disabled}
          autoComplete="off"
          autoFocus
        />
      </div>
    </div>
  )
}

export default function TransaccionModal({
  open, onClose, transaccion, billeteras, categorias, onSuccess,
}: TransaccionModalProps) {
  const isEdit = !!transaccion
  const { showToast } = useToast()
  const { confirm } = useModal()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingSubcats, setLoadingSubcats] = useState(false)

  const {
    step, slideDirection, tipo, monto, moneda, descripcion, categoriaId, subcategoriaId,
    billeteraId, fecha, metodoPago, showAllCats, cantidadCuotas, tasaInteres, isSubmitting,
  } = state

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (!categoriaId) {
      setSubcategorias([])
      return
    }

    const fetchSubcats = async () => {
      setLoadingSubcats(true)
      try {
        const data = await categoriaService.getSubcategorias(categoriaId)
        setSubcategorias(data)
      } catch (e) {
        console.error('Error fetching subcategorias:', e)
      } finally {
        setLoadingSubcats(false)
      }
    }

    fetchSubcats()
  }, [categoriaId])

  useEffect(() => {
    if (open) dispatch({ type: 'RESET', transaccion: transaccion || null, billeteras })
  }, [open, transaccion, billeteras, isEdit])

  const isCuotaHija = isEdit && transaccion?.es_cuota_hija

  const billeterasCarousel = useMemo(() =>
    billeteras.filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId)),
    [billeteras, moneda, billeteraId]
  )

  useEffect(() => {
    if (!open) return
    if (billeterasCarousel.length > 0 && !billeterasCarousel.find(b => b.id === billeteraId)) {
      dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: billeterasCarousel[0].id })
    } else if (billeterasCarousel.length === 0) {
      dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: '' })
    }
  }, [moneda, billeterasCarousel, billeteraId, open])

  // Auto-scroll al card seleccionado cuando cambia billeteraId
  useEffect(() => {
    if (!billeteraId) return
    const card = cardRefs.current.get(billeteraId)
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [billeteraId])

  const activeCategorias = useMemo(() => {
    const filtered = categorias.filter((c) => c.tipo === tipo)
    const mainCats = ['alimentacion','transporte','salud','entretenimiento','servicios','ropa','ropa e indumentaria','educacion','vivienda']
    return filtered.sort((a, b) => {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const ai = mainCats.indexOf(norm(a.nombre)), bi = mainCats.indexOf(norm(b.nombre))
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return norm(a.nombre).localeCompare(norm(b.nombre))
    })
  }, [categorias, tipo])

  const displayCategorias = showAllCats ? activeCategorias : activeCategorias.slice(0, 7)
  const hasMoreCats = activeCategorias.length > 7

  const calculoCuotas = useMemo(() => {
    const cant = cantidadCuotas || 1
    const tasa = tasaInteres ? tasaInteres / 100 : 0
    const m = monto || 0
    const valorCuota = tasa > 0
      ? (m * tasa * Math.pow(1 + tasa, cant)) / (Math.pow(1 + tasa, cant) - 1)
      : m / cant
    return { total: valorCuota * cant, cuota: valorCuota }
  }, [monto, cantidadCuotas, tasaInteres])

  const [animClass, setAnimClass] = useState('')

  const goNext = () => {
    if (!monto || !billeteraId) { showToast('Completá el monto y seleccioná una billetera', 'error'); return }
    setAnimClass(styles.slideForward)
    dispatch({ type: 'SET_STEP', step: 2, direction: 'forward' })
  }
  const goBack = () => {
    setAnimClass(styles.slideBack)
    dispatch({ type: 'SET_STEP', step: 1, direction: 'back' })
  }

  const handleSubmit = async () => {
    if (!monto || !billeteraId) { showToast('Completá los campos obligatorios', 'error'); return }
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload = {
        tipo, monto, moneda, descripcion,
        categoria_id: categoriaId || null,
        subcategoria_id: subcategoriaId || null,
        billetera_id: billeteraId, fecha, metodo_pago: metodoPago,
        origen: isEdit ? undefined : ('manual' as const),
        es_padre_cuotas: !isEdit && metodoPago === 'credito' ? true : undefined,
        info_cuotas: !isEdit && metodoPago === 'credito'
          ? { cantidad_cuotas: cantidadCuotas, tiene_interes: tasaInteres > 0, tasa_interes: tasaInteres, monto_total: monto }
          : undefined,
      }
      if (!isEdit) { await transaccionService.createTransaccion(payload); showToast('Transacción creada', 'success') }
      else if (transaccion) { await transaccionService.updateTransaccion(transaccion.id, payload); showToast('Transacción actualizada', 'success') }
      onSuccess(); onClose()
    } catch (e) { console.error(e); showToast('Error al guardar la transacción', 'error') }
    finally { dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false }) }
  }

  const handleDelete = async () => {
    if (!transaccion) return
    confirm({
      title: 'Eliminar transacción',
      description: '¿Estás seguro de que querés eliminar esta transacción? Esta acción no se puede deshacer.',
      variant: 'danger', confirmLabel: 'Eliminar',
      onConfirm: async () => {
        dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
        try {
          await transaccionService.deleteTransaccion(transaccion.id)
          showToast('Transacción eliminada', 'success'); onSuccess(); onClose()
        } catch (e) { console.error(e); showToast('Error al eliminar la transacción', 'error') }
        finally { dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false }) }
      },
    })
  }

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding ariaLabel="Nueva transacción">
      <div className={styles.slidesContainer}>

        {/* ── Step Indicator Dots ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1 ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.headerTitle}>{isEdit ? 'Editar transacción' : 'Nueva transacción'}</h2>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
            </div>

            <div className={styles.formBody}>
              {isCuotaHija && (
                <div className={styles.cuotaHijaWarning}>
                  Monto, moneda, tipo y billetera no se pueden cambiar porque esta transacción es parte de una compra en cuotas.
                </div>
              )}

              {/* Hero monto */}
              <MontoHero
                value={monto}
                onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                moneda={moneda}
                onMonedaChange={(m) => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                disabled={isCuotaHija}
              />

              {/* Billetera (Carrusel) */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Billetera</label>
                {billeterasCarousel.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>No hay billeteras en esta moneda.</p>
                  : (
                  <div className={styles.billeterasCarouselScroller}>
                    <div className={styles.billeterasCarousel} ref={carouselRef}>
                      {billeterasCarousel.map(b => (
                        <div
                          key={b.id}
                          className={styles.billeteraSelectWrap}
                          data-active={billeteraId === b.id}
                          ref={(el) => {
                            if (el) cardRefs.current.set(b.id, el)
                            else cardRefs.current.delete(b.id)
                          }}
                        >
                          <BilleteraCard billetera={b} />
                          <button
                            type="button"
                            className={styles.billeteraOverlay}
                            onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                            disabled={isCuotaHija}
                            aria-label={`Seleccionar ${b.nombre}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
              </div>

              {/* Método de Pago */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Método de pago</label>
                <div className={styles.methodGrid}>
                  {([
                    { key: 'debito', icon: <CreditCard size={16} />, label: 'Débito' },
                    { key: 'transferencia', icon: <ArrowRightLeft size={16} />, label: 'Transfer' },
                    { key: 'credito', icon: <Layers size={16} />, label: 'Crédito' },
                    { key: 'efectivo', icon: <Banknote size={16} />, label: 'Efectivo' },
                  ] as const).map(({ key, icon, label }) => (
                    <button
                      key={key}
                      className={`${styles.methodBtn} ${metodoPago === key ? styles.methodBtnActive : ''}`}
                      onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: key })}
                      disabled={isCuotaHija}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formFooter}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
              <button className={styles.submitBtn} onClick={goNext} disabled={!monto || !billeteraId}>
                Siguiente
              </button>
            </div>
          </div>
          </div>
        )}

        {/* ════════════════════ PASO 2 ════════════════════ */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <button className={styles.backBtn} onClick={goBack} aria-label="Volver"><ChevronLeft size={18} /></button>
              <h2 className={styles.headerTitle}>Detalles</h2>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
            </div>

            <div className={styles.formBody}>
              {/* Tipo Ingreso / Egreso */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Tipo</label>
                <div className={styles.radioPills}>
                  <button
                    className={`${styles.radioPill} ${tipo === 'egreso' ? styles.pillActiveEgreso : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'egreso' })
                      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                    }}
                    disabled={isCuotaHija}
                  >
                    <ArrowUpRight size={15} strokeWidth={2} /> Egreso
                  </button>
                  <button
                    className={`${styles.radioPill} ${tipo === 'ingreso' ? styles.pillActiveIngreso : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'ingreso' })
                      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                    }}
                    disabled={isCuotaHija}
                  >
                    <ArrowDownLeft size={15} strokeWidth={2} /> Ingreso
                  </button>
                </div>
              </div>

              {/* Descripción + Fecha en fila */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div className={styles.formField} style={{ flex: 2 }}>
                  <label className={styles.fieldLabel} htmlFor="tx-desc">
                    Descripción <span className={styles.fieldOptional}>(opcional)</span>
                  </label>
                  <input
                    id="tx-desc"
                    type="text"
                    className={styles.fieldInput}
                    value={descripcion}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'descripcion', value: e.target.value })}
                    placeholder="Ej: Supermercado"
                  />
                </div>
                <div className={styles.formField} style={{ flex: 1 }}>
                  <label className={styles.fieldLabel} htmlFor="tx-fecha">Fecha</label>
                  <input
                    id="tx-fecha"
                    type="date"
                    className={styles.fieldInput}
                    value={fecha}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'fecha', value: e.target.value })}
                    disabled={isCuotaHija}
                  />
                </div>
              </div>

              {/* Selección de Categoría y Subcategoría */}
              {!categoriaId ? (
                /* ── PASO: Elegir Categoría ── */
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Categoría</label>
                  <div className={styles.catGrid}>
                    {displayCategorias.map((cat) => (
                      <button
                        key={cat.id}
                        className={`${styles.catBtn} ${categoriaId === cat.id ? styles.catBtnActive : ''}`}
                        onClick={() => {
                          dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: cat.id })
                          dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                        }}
                      >
                        <CategoriaIcon nombre={cat.nombre} size={36} />
                        <span className={styles.catName}>{cat.nombre}</span>
                      </button>
                    ))}
                    {!showAllCats && hasMoreCats && (
                      <button className={styles.catBtn} onClick={() => dispatch({ type: 'SET_FIELD', field: 'showAllCats', value: true })}>
                        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                          <GripHorizontal size={22} strokeWidth={1.5} />
                        </div>
                        <span className={styles.catName}>Más</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ── PASO: Elegir Subcategoría (con categoría minimizada) ── */
                <>
                  <div className={styles.selectedCatBanner}>
                    <div className={styles.selectedCatInfo}>
                      <CategoriaIcon nombre={categorias.find(c => c.id === categoriaId)?.nombre} size={32} />
                      <div className={styles.selectedCatText}>
                        <span className={styles.selectedCatLabel}>Categoría</span>
                        <span className={styles.selectedCatName}>{categorias.find(c => c.id === categoriaId)?.nombre}</span>
                      </div>
                    </div>
                    <button 
                      className={styles.changeCatBtn}
                      onClick={() => {
                        dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: '' })
                        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                      }}
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Subcategoría <span className={styles.fieldOptional}>(opcional)</span></label>
                    <div className={styles.subcatGrid}>
                      {loadingSubcats ? (
                        <div className={styles.subcatLoading}>Cargando...</div>
                      ) : (
                        <>
                          <button
                            className={`${styles.subcatChip} ${!subcategoriaId ? styles.subcatChipActive : ''}`}
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })}
                          >
                            <SubcategoriaIcon nombre="general" size={32} />
                            General
                          </button>
                          {subcategorias.map((sub) => (
                            <button
                              key={sub.id}
                              className={`${styles.subcatChip} ${subcategoriaId === sub.id ? styles.subcatChipActive : ''}`}
                              onClick={() => dispatch({
                                type: 'SET_FIELD',
                                field: 'subcategoriaId',
                                value: subcategoriaId === sub.id ? '' : sub.id
                              })}
                            >
                              <SubcategoriaIcon nombre={sub.nombre} size={32} />
                              {sub.nombre}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Cuotas (solo credito, nueva tx) */}
              {!isEdit && metodoPago === 'credito' && (
                <div className={styles.cuotasSection}>
                  <div className={styles.cuotasInputs}>
                    <div className={styles.cuotaField}>
                      <label className={styles.fieldLabel} htmlFor="tx-cuotas">Cuotas</label>
                      <input id="tx-cuotas" type="number" className={`${styles.fieldInput} ${styles.cuotaInput}`}
                        value={cantidadCuotas} min={1}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className={styles.cuotaField}>
                      <label className={styles.fieldLabel} htmlFor="tx-interes">Interés % mensual</label>
                      <input id="tx-interes" type="number" step="0.1" className={`${styles.fieldInput} ${styles.cuotaInput}`}
                        value={tasaInteres} min={0}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'tasaInteres', value: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className={styles.cuotasSummary}>
                    <div className={styles.summaryCol}>
                      <span className={styles.summaryLbl}>Cuota</span>
                      <span className={styles.summaryVal}>{formatMonto(calculoCuotas.cuota, moneda)}</span>
                    </div>
                    <div className={`${styles.summaryCol} ${styles.summaryColRight}`}>
                      <span className={styles.summaryLbl}>Total</span>
                      <span className={styles.summaryVal}>{formatMonto(calculoCuotas.total, moneda)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formFooter}>
              {isEdit
                ? <button className={styles.btnDelete} onClick={handleDelete} disabled={isSubmitting}>Eliminar</button>
                : <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              }
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...'
                  : metodoPago === 'credito' && !isEdit && cantidadCuotas > 1
                    ? `Guardar · ${cantidadCuotas} cuotas`
                    : 'Guardar transacción'}
              </button>
            </div>
          </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
