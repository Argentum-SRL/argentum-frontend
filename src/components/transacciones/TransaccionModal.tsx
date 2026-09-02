import { useMemo, useEffect, useReducer, useRef, useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ArrowRightLeft,
  Layers,
  Banknote,
  GripHorizontal,
  ChevronLeft,
  X,
  Hash,
  Percent,
  Trash2,
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria, Subcategoria, TarjetaCredito } from '@/types'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { DateInput } from '@/components/ui'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'

interface TransaccionModalProps {
  open: boolean
  onClose: () => void
  transaccion?: Transaccion | null
  billeteras: Billetera[]
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2 | 3
  slideDirection: 'forward' | 'back'
  tipo: 'ingreso' | 'egreso'
  monto: number | null
  moneda: 'ARS' | 'USD'
  descripcion: string
  categoriaId: string
  subcategoriaId: string
  billeteraId: string
  tarjetaId: string
  fecha: string
  metodoPago: 'debito' | 'efectivo' | 'credito' | 'transferencia'
  showAllCats: boolean
  cantidadCuotas: number
  cuotaInicial: number
  proximoResumen: boolean
  tasaInteres: number
  isSubmitting: boolean
}

type FormAction =
  | { type: 'RESET'; transaccion: Transaccion | null; billeteras: Billetera[] }
  | { type: 'SET_STEP'; step: 1 | 2 | 3; direction: 'forward' | 'back' }
  | { [K in keyof FormState]: { type: 'SET_FIELD'; field: K; value: FormState[K] } }[keyof FormState]

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
  tarjetaId: '',
  fecha: todayLocal(),
  metodoPago: 'debito',
  showAllCats: false,
  cantidadCuotas: 2,
  cuotaInicial: 1,
  proximoResumen: false,
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
          tarjetaId: action.transaccion.tarjeta_id || '',
          fecha: action.transaccion.fecha.split('T')[0],
          metodoPago: action.transaccion.metodo_pago,
        }
      } else {
        const activas = action.billeteras.filter(b => b.estado === 'activa')

        // Prioridad:
        // 1. Principal con saldo > 0
        // 2. Cualquier otra con saldo > 0
        // 3. Principal (aunque sea 0)
        // 4. La primera activa que haya
        const best = activas.find(b => b.es_principal && b.saldo_actual > 0) ||
          activas.find(b => b.saldo_actual > 0) ||
          activas.find(b => b.es_principal) ||
          activas[0]

        return {
          ...initialState,
          fecha: todayLocal(),
          billeteraId: best?.id || '',
          moneda: best?.moneda || 'ARS',
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

export default function TransaccionModal({
  open, onClose, transaccion, billeteras, categorias, tarjetas, onSuccess,
}: TransaccionModalProps) {
  const isEdit = !!transaccion
  const { showToast } = useToast()
  const { confirm } = useModal()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingSubcats, setLoadingSubcats] = useState(false)

  const handleDeleteTransaction = () => {
    if (!transaccion) return
    confirm({
      title: '¿Eliminar transacción?',
      description: 'Esta acción no se puede deshacer y restaurará el saldo correspondiente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(transaccion.id)
          showToast('Transacción eliminada correctamente', 'success')
          onSuccess()
          onClose()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No se pudo eliminar la transacción'), 'error')
        }
      }
    })
  }

  const {
    step, tipo, monto, moneda, descripcion, categoriaId, subcategoriaId,
    billeteraId, tarjetaId, fecha, metodoPago, showAllCats, cantidadCuotas, cuotaInicial, proximoResumen, tasaInteres, isSubmitting,
  } = state

  // Cargar subcategorías cuando cambia la categoría
  const [prevCategoriaId, setPrevCategoriaId] = useState(categoriaId)
  if (categoriaId !== prevCategoriaId) {
    setPrevCategoriaId(categoriaId)
    setSubcategorias([])
  }

  useEffect(() => {
    if (!categoriaId) return

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

    const currentCat = useMemo(() => categorias.find(c => c.id === categoriaId), [categorias, categoriaId])
    const currentCatNorm = useMemo(() => currentCat ? currentCat.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '', [currentCat])
    const hideGeneralSubcat = currentCatNorm === 'empleo' || currentCatNorm === 'trabajo independiente' || currentCatNorm === 'inversiones y rentas'

    const sortedSubcategorias = useMemo(() => {
      // Mapa de orden de probabilidad canónico por categoría para consistencia inmediata
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

        // "Otros" siempre al final absoluto
        if (isAOtros && !isBOtros) return 1
        if (!isAOtros && isBOtros) return -1
        if (isAOtros && isBOtros) return 0

        // Si coincide con la lista de prioridad canónica por probabilidad
        const ai = priorityList.indexOf(aNorm)
        const bi = priorityList.indexOf(bNorm)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1

        // Si vienen con campo orden explícito del backend y son diferentes
        if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
          return a.orden - b.orden
        }

        return aNorm.localeCompare(bNorm)
      })
    }, [subcategorias, currentCatNorm])

    // Si hideGeneralSubcat es true y no hay subcategoriaId seleccionada, preseleccionar la primera (ej. Sueldo)
    useEffect(() => {
      if (hideGeneralSubcat && !subcategoriaId && sortedSubcategorias.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: sortedSubcategorias[0].id })
      }
    }, [hideGeneralSubcat, subcategoriaId, sortedSubcategorias])

  useEffect(() => {
    if (open) dispatch({ type: 'RESET', transaccion: transaccion || null, billeteras })
  }, [open, transaccion, billeteras, isEdit])

  const isCuotaHija = isEdit && transaccion?.es_cuota_hija


  // Si cambia la tarjeta seleccionada, actualizar la billeteraId automáticamente
  useEffect(() => {
    if (metodoPago === 'credito' && tarjetaId) {
      const t = tarjetas.find(x => x.id === tarjetaId)
      if (t && t.billetera_id !== billeteraId) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: t.billetera_id })
      }
    }
  }, [tarjetaId, metodoPago, tarjetas, billeteraId])

  const billeterasCarousel = useMemo(() => {
    // Primero filtramos por moneda y estado
    let filtered = billeteras.filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId))

    // Luego filtramos por tipo según el método de pago
    if (metodoPago === 'efectivo') {
      filtered = filtered.filter(b => b.es_efectivo)
    } else if (metodoPago === 'debito' || metodoPago === 'transferencia') {
      filtered = filtered.filter(b => !b.es_efectivo)
    }

    // Finalmente ordenamos: principal primero, luego por saldo
    return filtered.sort((a, b) => {
      if (a.es_principal && !b.es_principal) return -1
      if (!a.es_principal && b.es_principal) return 1
      return b.saldo_actual - a.saldo_actual
    })
  }, [billeteras, moneda, billeteraId, metodoPago])

  useEffect(() => {
    if (!open || !billeteraId) return

    const actualEsValida = billeteras.some(b => b.id === billeteraId && b.moneda === moneda)

    if (!actualEsValida && billeterasCarousel.length > 0) {
      dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: billeterasCarousel[0].id })
    }
  }, [moneda, open, billeteraId, billeteras, billeterasCarousel])

  useEffect(() => {
    if (!open) return
    const idToScroll = metodoPago === 'credito' ? tarjetaId : billeteraId
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [billeteraId, tarjetaId, open, metodoPago])

  const activeCategorias = useMemo(() => {
    const filtered = categorias.filter((c) => c.tipo === tipo)
    const mainCats = [
      'alimentacion',
      'transporte',
      'restaurante',
      'restaurantes',
      'restaurantes y delivery',
      'salud',
      'servicios',
      'entretenimiento',
      'recreativo',
      'indumentaria',
      'educacion',
      'hogar',
      'comunicacion',
      'banco',
      'empleo',
      'trabajo independiente',
      'inversiones y rentas'
    ]
    return filtered.sort((a, b) => {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const aNorm = norm(a.nombre)
      const bNorm = norm(b.nombre)

      const isAOtros = aNorm === 'otros' || aNorm === 'otro' || aNorm === 'otras' || aNorm === 'otros gastos' || aNorm === 'otros ingresos'
      const isBOtros = bNorm === 'otros' || bNorm === 'otro' || bNorm === 'otras' || bNorm === 'otros gastos' || bNorm === 'otros ingresos'

      // "Otros" siempre al final absoluto
      if (isAOtros && !isBOtros) return 1
      if (!isAOtros && isBOtros) return -1
      if (isAOtros && isBOtros) return 0

      const ai = mainCats.indexOf(aNorm), bi = mainCats.indexOf(bNorm)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return aNorm.localeCompare(bNorm)
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
    if (!monto || (metodoPago === 'credito' ? !tarjetaId : !billeteraId)) {
      showToast(metodoPago === 'credito' ? 'Seleccioná una tarjeta' : 'Seleccioná una billetera', 'error')
      return
    }

    let nextStep: 1 | 2 | 3 = 2
    if (step === 1) {
      nextStep = metodoPago === 'credito' ? 2 : 3
    } else if (step === 2) {
      nextStep = 3
    }

    setAnimClass(styles.slideForward)
    dispatch({ type: 'SET_STEP', step: nextStep, direction: 'forward' })
  }

  const goBack = () => {
    let prevStep: 1 | 2 | 3 = 1
    if (step === 3) {
      prevStep = metodoPago === 'credito' ? 2 : 1
    } else if (step === 2) {
      prevStep = 1
    }

    setAnimClass(styles.slideBack)
    dispatch({ type: 'SET_STEP', step: prevStep, direction: 'back' })
  }

  const isPendienteIA = isEdit &&
    transaccion?.estado_verificacion === 'pendiente' &&
    ['ia_wpp', 'ia_chat', 'ia_pdf'].includes(transaccion?.origen ?? '')

  const handleSubmit = async () => {
    // Validaciones estrictas
    if (!monto || Number(monto) <= 0 || !Number.isFinite(Number(monto))) {
      showToast('El monto debe ser mayor a cero', 'error')
      return
    }

    if (!categoriaId) {
      showToast('Seleccioná una categoría', 'error')
      return
    }

    let resolvedBilleteraId = billeteraId
    if (metodoPago === 'credito') {
      if (!tarjetaId) {
        showToast('Seleccioná una tarjeta de crédito', 'error')
        return
      }
      const tarjetaSel = tarjetas.find(t => t.id === tarjetaId)
      if (tarjetaSel?.billetera_id) {
        resolvedBilleteraId = tarjetaSel.billetera_id
      }
      if (!isEdit) {
        if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 120) {
          showToast('La cantidad de cuotas debe ser un número entero entre 1 y 120', 'error')
          return
        }
        if (!Number.isInteger(cuotaInicial) || cuotaInicial < 1 || cuotaInicial > cantidadCuotas) {
          showToast('La cuota inicial debe estar entre 1 y la cantidad total', 'error')
          return
        }
        if (!Number.isFinite(tasaInteres) || tasaInteres < 0 || tasaInteres > 1000) {
          showToast('La tasa de interés debe estar entre 0% y 1000% anual o mensual según la operación.', 'error')
          return
        }
      }
    } else {
      if (!resolvedBilleteraId) {
        showToast('Seleccioná una billetera', 'error')
        return
      }
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      // Sanitización de cuotas para el envío
      const cant = Math.max(1, Math.min(120, cantidadCuotas || 1))
      const inicial = Math.max(1, Math.min(cant, cuotaInicial || 1))

      const payload = isCuotaHija
        ? {
            descripcion: descripcion.trim(),
            categoria_id: categoriaId,
            subcategoria_id: subcategoriaId || null,
          }
        : {
            tipo,
            monto: Number(monto),
            moneda,
            descripcion: descripcion.trim(),
            categoria_id: categoriaId,
            subcategoria_id: subcategoriaId || null,
            billetera_id: resolvedBilleteraId,
            fecha,
            metodo_pago: metodoPago,
            tarjeta_id: (metodoPago === 'credito' && tarjetaId) ? tarjetaId : null,
            origen: isEdit ? undefined : ('manual' as const),
            es_padre_cuotas: !isEdit && metodoPago === 'credito' ? true : undefined,
            info_cuotas: !isEdit && metodoPago === 'credito'
              ? {
                cantidad_cuotas: cant,
                cuota_inicial: inicial,
                tiene_interes: tasaInteres > 0,
                tasa_interes: tasaInteres,
                monto_total: Number(monto),
                proximo_resumen: proximoResumen
              }
              : undefined,
          }
      if (!isEdit) {
        await transaccionService.createTransaccion(payload)
        showToast('Transacción creada', 'success')
      } else if (transaccion) {
        await transaccionService.updateTransaccion(transaccion.id, payload)
        if (isPendienteIA) {
          await transaccionService.confirmarIA(transaccion.id)
          showToast('Transacción confirmada', 'success')
        } else {
          showToast('Transacción actualizada', 'success')
        }
      }
      onSuccess(); onClose()
    } catch (e) {
      console.error(e)
      showToast(getErrorMessage(e, 'Error al guardar la transacción'), 'error')
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding ariaLabel="Nueva transacción">
      <div className={styles.slidesContainer}>

        {/* ── Step Indicator Dots ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          {metodoPago === 'credito' && (
            <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
          )}
          <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1: Monto y Origen ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>{isEdit ? 'Editar transacción' : 'Nueva transacción'}</h2>
                <div className={styles.headerRightActions}>
                  {isEdit && (
                    <button
                      type="button"
                      className={styles.deleteHeaderBtn}
                      onClick={handleDeleteTransaction}
                      title="Eliminar transacción"
                      aria-label="Eliminar transacción"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
                </div>
              </div>

              <div className={styles.formBody}>
                {isCuotaHija && (
                  <div className={styles.cuotaHijaWarning}>
                    Monto, moneda, tipo y billetera no se pueden cambiar porque esta transacción es parte de una compra en cuotas.
                  </div>
                )}

                {/* Hero monto */}
                <MontoInput
                  value={monto}
                  onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                  moneda={moneda}
                  onMonedaChange={(m) => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                  disabled={isCuotaHija}
                  autoFocus
                  allowDecimals
                />

                {/* 1. Método de Pago */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>¿Cómo pagaste?</label>
                  <div className={styles.methodGrid}>
                    {([
                      { key: 'debito', icon: <CreditCard size={16} />, label: 'Débito' },
                      { key: 'transferencia', icon: <ArrowRightLeft size={16} />, label: 'Transfer' },
                      { key: 'credito', icon: <Layers size={16} />, label: 'Crédito' },
                      { key: 'efectivo', icon: <Banknote size={16} />, label: 'Efectivo' },
                    ] as const).map(({ key, icon, label }) => (
                      <button
                        type="button"
                        key={key}
                        className={`${styles.methodBtn} ${metodoPago === key ? styles.methodBtnActive : ''}`}
                        onClick={() => {
                          if (isCuotaHija) return
                          dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: key })

                          if (key === 'efectivo') {
                            const cashWallet = billeteras.find(b => b.es_efectivo && b.moneda === moneda && b.estado === 'activa')
                            if (cashWallet) dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: cashWallet.id })
                          } else if (key === 'debito' || key === 'transferencia') {
                            const firstWallet = billeteras.find(b => !b.es_efectivo && b.moneda === moneda && b.estado === 'activa')
                            if (firstWallet) dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: firstWallet.id })
                          } else if (key === 'credito') {
                            const firstCard = tarjetas.filter(t => t.moneda === moneda && t.estado === 'activa')[0]
                            if (firstCard) dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: firstCard.id })
                          }
                        }}
                        disabled={isCuotaHija}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Origen Dinámico */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {metodoPago === 'credito' ? 'Seleccioná tu tarjeta' : '¿De qué billetera?'}
                  </label>

                  {metodoPago === 'credito' ? (
                    <div className={styles.billeterasCarouselScroller}>
                      <div className={styles.billeterasCarousel} ref={carouselRef}>
                        {tarjetas.filter(t => t.moneda === moneda && t.estado === 'activa').length === 0 ? (
                          <p className={styles.noTarjetas}>No tenés tarjetas en {moneda}.</p>
                        ) : (
                          tarjetas.filter(t => t.moneda === moneda && t.estado === 'activa').map(t => (
                            <div
                              key={t.id}
                              className={styles.billeteraSelectWrap}
                              data-active={tarjetaId === t.id}
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
                                onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                                title={`Seleccionar tarjeta ${t.nombre}`}
                                aria-label={`Seleccionar tarjeta ${t.nombre}`}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.billeterasCarouselScroller}>
                      <div className={styles.billeterasCarousel} ref={carouselRef}>
                        {(() => {
                          if (billeterasCarousel.length === 0) return <p className={styles.noTarjetas}>No hay billeteras.</p>

                          return billeterasCarousel.map(b => (
                            <div
                              key={b.id}
                              className={styles.billeteraSelectWrap}
                              data-active={billeteraId === b.id}
                              ref={(el) => {
                                if (el) cardRefs.current.set(b.id, el)
                                else cardRefs.current.delete(b.id)
                              }}
                            >
                              <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} />
                              <button
                                type="button"
                                className={styles.billeteraOverlay}
                                onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                                disabled={isCuotaHija}
                                title={`Seleccionar billetera ${b.nombre}`}
                                aria-label={`Seleccionar billetera ${b.nombre}`}
                              />
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                {isEdit ? (
                  <button type="button" className={styles.btnDelete} onClick={handleDeleteTransaction}>
                    Eliminar
                  </button>
                ) : (
                  <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                )}
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 2: Configuración de Cuotas (Solo Crédito) ════════════════════ */}
        {step === 2 && metodoPago === 'credito' && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Financiación</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                <div className={styles.cuotasSection}>
                  <div className={styles.cuotasGrid}>
                    <div className={styles.cuotasInputGroup}>
                      <label className={styles.fieldLabel} htmlFor="tx-cuota-actual">¿Por qué cuota vas?</label>
                      <div className={styles.inputWrapper}>
                        <Hash size={16} />
                        <input id="tx-cuota-actual" type="number" className={styles.fieldInput}
                          value={cuotaInicial || ''} min={1} max={cantidadCuotas}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                            dispatch({ type: 'SET_FIELD', field: 'cuotaInicial', value: val })
                          }} />
                      </div>
                    </div>
                    <div className={styles.cuotasInputGroup}>
                      <label className={styles.fieldLabel} htmlFor="tx-cuotas-total">Cuotas totales</label>
                      <div className={styles.inputWrapper}>
                        <Layers size={16} />
                        <input id="tx-cuotas-total" type="number" className={styles.fieldInput}
                          value={cantidadCuotas || ''} min={1}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                            dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: val })
                          }} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.cuotasGrid}>
                    <div className={styles.cuotasInputGroup}>
                      <label className={styles.fieldLabel} htmlFor="tx-interes">Interés % mensual</label>
                      <div className={styles.inputWrapper}>
                        <Percent size={16} />
                        <input id="tx-interes" type="number" step="0.1" className={styles.fieldInput}
                          value={tasaInteres === 0 ? '0' : (tasaInteres || '')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            dispatch({ type: 'SET_FIELD', field: 'tasaInteres', value: val })
                          }} />
                      </div>
                    </div>
                    <div className={styles.cuotasInputGroup}>
                      <label className={styles.fieldLabel}>Impacto en resumen</label>
                      <div className={styles.resumenToggle}>
                        <button
                          type="button"
                          className={`${styles.resumenBtn} ${!proximoResumen ? styles.resumenBtnActive : ''}`}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'proximoResumen', value: false })}
                        >
                          Actual
                        </button>
                        <button
                          type="button"
                          className={`${styles.resumenBtn} ${proximoResumen ? styles.resumenBtnActive : ''}`}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'proximoResumen', value: true })}
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cuotasSummary}>
                    <div className={styles.summaryHeader}>
                      <span className={styles.summaryHint}>
                        {cuotaInicial > 1
                          ? `Se generarán ${Math.max(0, cantidadCuotas - cuotaInicial + 1)} cuotas (de la ${cuotaInicial} a la ${cantidadCuotas}).`
                          : `Se generarán ${cantidadCuotas || 0} cuotas.`
                        }
                        {proximoResumen && ` Primera cuota en resumen próximo.`}
                      </span>
                    </div>
                    <div className={styles.summaryBody}>
                      <div className={styles.summaryCol}>
                        <span className={styles.summaryLbl}>Cuota mensual</span>
                        <span className={styles.summaryVal}>{formatMonto(calculoCuotas.cuota, moneda)}</span>
                      </div>
                      <div className={`${styles.summaryCol} ${styles.summaryColRight}`}>
                        <span className={styles.summaryLbl}>Total financiado</span>
                        <span className={styles.summaryVal}>{formatMonto(calculoCuotas.total, moneda)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 3: Detalles y Categoría ════════════════════ */}
        {step === 3 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Detalles</h2>
                <div className={styles.headerRightActions}>
                  {isEdit && (
                    <button
                      type="button"
                      className={styles.deleteHeaderBtn}
                      onClick={handleDeleteTransaction}
                      title="Eliminar transacción"
                      aria-label="Eliminar transacción"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
                </div>
              </div>

              <div className={styles.formBody}>
                {/* Tipo Ingreso/Egreso */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Tipo</label>
                  <div className={styles.radioGroup}>
                    <button
                      type="button"
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
                      type="button"
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

                {/* Descripción + Fecha */}
                <div className={styles.descFechaRow}>
                  <div className={`${styles.formField} ${styles.flex2}`}>
                    <label className={styles.fieldLabel} htmlFor="tx-desc">Descripción <span className={styles.fieldOptional}>(opcional)</span></label>
                    <input id="tx-desc" type="text" className={styles.fieldInput} value={descripcion}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'descripcion', value: e.target.value })}
                      placeholder="Ej: Supermercado" />
                  </div>
                  <div className={`${styles.formField} ${styles.flex1}`}>
                    <label className={styles.fieldLabel} htmlFor="tx-fecha">Fecha</label>
                    <DateInput id="tx-fecha" value={fecha}
                      onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'fecha', value: val })}
                      disabled={isCuotaHija} className={styles.fieldInput} />
                  </div>
                </div>

                {/* Categoría y Subcategoría */}
                {!categoriaId ? (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Categoría</label>
                    <div className={styles.catGrid}>
                      {displayCategorias.map((cat) => (
                        <button type="button" key={cat.id} className={`${styles.catBtn} ${categoriaId === cat.id ? styles.catBtnActive : ''}`}
                          onClick={() => {
                            dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: cat.id })
                            dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                          }}>
                          <CategoriaIcon nombre={cat.nombre} size={36} />
                          <span className={styles.catName}>{cat.nombre}</span>
                        </button>
                      ))}
                      {!showAllCats && hasMoreCats && (
                        <button type="button" className={styles.catBtn} onClick={() => dispatch({ type: 'SET_FIELD', field: 'showAllCats', value: true })}>
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
                        <CategoriaIcon nombre={categorias.find(c => c.id === categoriaId)?.nombre} size={32} />
                        <div className={styles.selectedCatText}>
                          <span className={styles.selectedCatLabel}>Categoría</span>
                          <span className={styles.selectedCatName}>{categorias.find(c => c.id === categoriaId)?.nombre}</span>
                        </div>
                      </div>
                      <button type="button" className={styles.changeCatBtn} onClick={() => {
                        dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: '' })
                        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                      }}>Cambiar</button>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Subcategoría</label>
                      <div className={styles.subcatGrid}>
                        {loadingSubcats ? <div className={styles.subcatLoading}>Cargando...</div> : (
                          <>
                            {!hideGeneralSubcat && (
                              <button type="button" className={`${styles.subcatChip} ${!subcategoriaId ? styles.subcatChipActive : ''}`}
                                onClick={() => dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })}>
                                <SubcategoriaIcon nombre="general" parentCategory={categorias.find(c => c.id === categoriaId)?.nombre} size={32} />
                                General
                              </button>
                            )}
                            {sortedSubcategorias.map((sub) => (
                              <button type="button" key={sub.id} className={`${styles.subcatChip} ${subcategoriaId === sub.id ? styles.subcatChipActive : ''}`}
                                onClick={() => dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: sub.id })}>
                                <SubcategoriaIcon nombre={sub.nombre} parentCategory={categorias.find(c => c.id === categoriaId)?.nombre} size={32} />
                                {sub.nombre}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.formFooter}>
                {isEdit ? (
                  <button type="button" className={styles.btnDelete} onClick={handleDeleteTransaction}>
                    Eliminar
                  </button>
                ) : (
                  <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isPendienteIA ? 'Confirmar transacción' : 'Guardar transacción'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </Modal>
  )
}
