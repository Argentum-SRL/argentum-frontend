import { useMemo, useEffect, useReducer, useRef, useState, useCallback } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ArrowRightLeft,
  Layers,
  Banknote,
  ChevronLeft,
  X,
  Trash2,
  Wallet,
  SlidersHorizontal,
  Plus,
  Minus,
  Lightbulb,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria, TarjetaCredito } from '@/types'
import transaccionService from '@/services/transaccion.service'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import { getErrorMessage } from '@/utils/errorMessages'
import { DateInput } from '@/components/ui'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import { useMemoriaComercio } from './useMemoriaComercio'
import MemoriaComercioDialog from './MemoriaComercioDialog'
import memoriaStyles from './MemoriaComercioDialog.module.css'

interface TransaccionModalProps {
  open: boolean
  onClose: () => void
  transaccion?: Transaccion | null
  billeteraInicialId?: string
  tipoInicial?: 'egreso' | 'ingreso'
  billeteras: Billetera[]
  categorias: Categoria[]
  tarjetas: TarjetaCredito[]
  onSuccess: (tx?: Transaccion | null) => void
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
  cantidadCuotas: number
  cuotaInicial: number
  proximoResumen: boolean
  tasaInteres: number
  isSubmitting: boolean
}

type FormAction =
  | {
      type: 'RESET'
      transaccion: Transaccion | null
      billeteras: Billetera[]
      billeteraInicialId?: string
      tipoInicial?: 'egreso' | 'ingreso'
    }
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
        const wallet = action.billeteras.find(b => b.id === action.transaccion?.billetera_id)
        const metodoDeducido: 'debito' | 'efectivo' | 'credito' | 'transferencia' = 
          action.transaccion.metodo_pago || (
            action.transaccion.tarjeta_id
              ? 'credito'
              : wallet?.es_efectivo
                ? 'efectivo'
                : 'debito'
          )
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
          metodoPago: metodoDeducido,
        }
      } else {
        const activas = action.billeteras.filter(b => b.estado === 'activa')
        const sorted = sortBilleteras(activas)

        const chosenWallet = action.billeteraInicialId
          ? action.billeteras.find(b => b.id === action.billeteraInicialId)
          : undefined

        const best = chosenWallet || sorted[0]
        const monedaInicial = best?.moneda || 'ARS'
        const bestForCurrency = chosenWallet || sorted.find(b => b.moneda === monedaInicial) || best
        const hasBancosInMoneda = sorted.some(b => !b.es_efectivo && b.moneda === monedaInicial)
        const metodoInicial: 'debito' | 'efectivo' | 'credito' | 'transferencia' = 
          (!hasBancosInMoneda || bestForCurrency?.es_efectivo) ? 'efectivo' : 'debito'

        return {
          ...initialState,
          tipo: action.tipoInicial || 'egreso',
          fecha: todayLocal(),
          billeteraId: bestForCurrency?.id || '',
          moneda: monedaInicial,
          metodoPago: metodoInicial,
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
  open, onClose, transaccion, billeteraInicialId, tipoInicial, billeteras, categorias, tarjetas, onSuccess,
}: TransaccionModalProps) {
  const isEdit = !!transaccion
  const isCuotaHija = isEdit && !!transaccion?.es_cuota_hija
  const { confirm } = useModal()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const submittingRef = useRef(false)

  const {
    sugerenciaClave,
    marcarCategoriaManual,
    evaluarMemoriaPostGuardado,
    showMemoriaDialog,
    memoriaDialogData,
    cerrarMemoriaDialog,
  } = useMemoriaComercio({
    open,
    isEdit,
    descripcion: state.descripcion,
    tipo: state.tipo,
    categoriaId: state.categoriaId,
    subcategoriaId: state.subcategoriaId,
    categorias,
    onAutoSelectCategoria: (catId: string, subcatId: string) => {
      dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: catId })
      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: subcatId })
    },
    onClose,
  })

  const setCardNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el)
    } else {
      cardRefs.current.delete(id)
    }
  }, [])

  const handleDeleteTransaction = () => {
    if (!transaccion) return

    if (isCuotaHija) {
      confirm({
        title: '¿Eliminar esta cuota?',
        description: 'Se eliminará únicamente esta cuota pendiente. El resto de las cuotas y la compra se mantendrán intactas.',
        variant: 'danger',
        confirmLabel: 'Eliminar cuota',
        onConfirm: async () => {
          try {
            await transaccionService.deleteCuotaIndividual(transaccion.id)
            sileo.success({ title: 'Cuota eliminada correctamente' })
            onSuccess()
            onClose()
          } catch (e) {
            console.error(e)
            sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar la cuota') })
          }
        }
      })
      return
    }

    confirm({
      title: '¿Eliminar transacción?',
      description: 'Esta acción no se puede deshacer y restaurará el saldo correspondiente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(transaccion.id)
          sileo.success({ title: 'Transacción eliminada correctamente' })
          onSuccess()
          onClose()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar la transacción') })
        }
      }
    })
  }

  const {
    step, slideDirection, tipo, monto, moneda, descripcion, categoriaId, subcategoriaId,
    billeteraId, tarjetaId, fecha, metodoPago, cantidadCuotas, cuotaInicial, proximoResumen, tasaInteres, isSubmitting,
  } = state

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isCustomOverride, setIsCustomOverride] = useState(false)
  const isCustomCuotas = isCustomOverride || ![1, 3, 6, 12].includes(cantidadCuotas)

  const getCuotaPreview = (n: number) => {
    const m = Number(monto) || 0
    if (!m) return ''
    return `${formatMonto(m / n, moneda)}/mes`
  }

  useEffect(() => {
    submittingRef.current = false
    if (open) {
      dispatch({
        type: 'RESET',
        transaccion: transaccion || null,
        billeteras,
        billeteraInicialId,
        tipoInicial,
      })
    }
  }, [open, transaccion, billeteras, billeteraInicialId, tipoInicial, isEdit])


  // Si cambia la tarjeta seleccionada, actualizar la billeteraId automáticamente
  useEffect(() => {
    if (metodoPago === 'credito' && tarjetaId) {
      const t = tarjetas.find(x => x.id === tarjetaId)
      if (t && t.billetera_id !== billeteraId) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: t.billetera_id })
      }
    }
  }, [tarjetaId, metodoPago, tarjetas, billeteraId])

  // Tarjetas de crédito ordenadas: La tarjeta asociada a la cuenta principal primero, luego de mayor a menor saldo
  const tarjetasCarousel = useMemo(() => {
    const activas = tarjetas.filter(t => t.estado === 'activa' || t.id === tarjetaId)
    return activas.sort((a, b) => {
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
  }, [tarjetas, tarjetaId, billeteras])

  const selectedTarjeta = useMemo(() => tarjetas.find(t => t.id === tarjetaId), [tarjetas, tarjetaId])

  // Billeteras activas para la moneda seleccionada
  const billeterasMoneda = useMemo(() => {
    return billeteras.filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId))
  }, [billeteras, moneda, billeteraId])

  const hasBancos = useMemo(() => {
    return billeterasMoneda.some(b => !b.es_efectivo)
  }, [billeterasMoneda])

  const hasEfectivo = useMemo(() => {
    return billeterasMoneda.some(b => b.es_efectivo)
  }, [billeterasMoneda])

  const hasCredito = useMemo(() => {
    return tipo === 'egreso' && tarjetas.some(t => t.estado === 'activa' || t.id === tarjetaId)
  }, [tipo, tarjetas, tarjetaId])

  // Métodos de pago disponibles según billeteras existentes en la moneda
  const availableMethods = useMemo(() => {
    const methods: Array<{
      key: 'debito' | 'transferencia' | 'credito' | 'efectivo'
      icon: React.ReactNode
      label: string
    }> = []

    if (hasBancos) {
      methods.push({ key: 'debito', icon: <CreditCard size={18} strokeWidth={2.2} />, label: 'Débito' })
      methods.push({ key: 'transferencia', icon: <ArrowRightLeft size={18} strokeWidth={2.2} />, label: 'Transfer' })
    }

    if (hasCredito) {
      methods.push({ key: 'credito', icon: <Layers size={18} strokeWidth={2.2} />, label: 'Crédito' })
    }

    if (hasEfectivo) {
      methods.push({ key: 'efectivo', icon: <Banknote size={18} strokeWidth={2.2} />, label: 'Efectivo' })
    }

    // Si el usuario no tiene ninguna billetera ni tarjeta registrada
    if (methods.length === 0) {
      methods.push({ key: 'efectivo', icon: <Banknote size={18} strokeWidth={2.2} />, label: 'Efectivo' })
    }

    return methods
  }, [hasBancos, hasCredito, hasEfectivo])

  // Auto-ajuste de método de pago cuando cambia moneda, tipo o billeteras disponibles
  useEffect(() => {
    if (!open) return
    const isCurrentValid = availableMethods.some(m => m.key === metodoPago)
    if (!isCurrentValid) {
      const bestWallet = billeterasMoneda.find(b => b.es_principal) || billeterasMoneda[0]
      const preferred = (bestWallet?.es_efectivo || !hasBancos)
        ? (availableMethods.find(m => m.key === 'efectivo')?.key || availableMethods[0]?.key)
        : (availableMethods.find(m => m.key !== 'efectivo')?.key || availableMethods[0]?.key)

      dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: preferred || 'efectivo' })
    }
  }, [open, availableMethods, metodoPago, billeterasMoneda, hasBancos])

  // Billeteras ordenadas: La cuenta principal primero, luego de mayor a menor saldo
  const billeterasCarousel = useMemo(() => {
    let filtered = billeterasMoneda

    // Luego filtramos por tipo según el método de pago
    if (metodoPago === 'efectivo') {
      filtered = filtered.filter(b => b.es_efectivo)
    } else if (metodoPago === 'debito' || metodoPago === 'transferencia') {
      filtered = filtered.filter(b => !b.es_efectivo)
    }

    return sortBilleteras(filtered, moneda)
  }, [billeterasMoneda, metodoPago, moneda])

  const {
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: open,
    deps: [step, tipo, metodoPago, tarjetaId, billeteraId, isEdit, isCuotaHija, monto, moneda, descripcion, categoriaId, subcategoriaId, cantidadCuotas, proximoResumen, showAdvanced, isCustomCuotas, availableMethods.length, billeterasCarousel.length, tarjetasCarousel.length],
    extraPadding: 22,
    maxHeightRatio: 0.90,
  })

  const handleSelectMetodo = (key: 'debito' | 'transferencia' | 'credito' | 'efectivo') => {
    if (isCuotaHija) return
    dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: key })

    if (key === 'efectivo') {
      const cashWallets = sortBilleteras(
        billeteras.filter(b => b.es_efectivo && b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId)),
        moneda
      )
      if (cashWallets.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: cashWallets[0].id })
      }
    } else if (key === 'debito' || key === 'transferencia') {
      const debitWallets = sortBilleteras(
        billeteras.filter(b => !b.es_efectivo && b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId)),
        moneda
      )
      if (debitWallets.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: debitWallets[0].id })
      }
    } else if (key === 'credito') {
      if (tarjetasCarousel.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: tarjetasCarousel[0].id })
        if (tarjetasCarousel[0].billetera_id) {
          dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: tarjetasCarousel[0].billetera_id })
        }
      }
    }
  }

  // Auto-selección de billetera (principal primero, luego mayor saldo)
  useEffect(() => {
    if (!open) return

    if (isEdit) {
      const actualEsValida = billeterasCarousel.some(b => b.id === billeteraId)
      if (!actualEsValida && billeterasCarousel.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: billeterasCarousel[0].id })
      }
    } else {
      const currentInCarousel = billeterasCarousel.some(b => b.id === billeteraId)
      if ((!billeteraId || !currentInCarousel) && billeterasCarousel.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: billeterasCarousel[0].id })
      }
    }
  }, [moneda, open, billeteraId, billeterasCarousel, isEdit])

  // Auto-selección de tarjeta de crédito (asociada a cuenta principal primero, luego mayor saldo)
  useEffect(() => {
    if (!open || metodoPago !== 'credito') return

    if (isEdit && tarjetaId) {
      const actualEsValida = tarjetasCarousel.some(t => t.id === tarjetaId)
      if (!actualEsValida && tarjetasCarousel.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: tarjetasCarousel[0].id })
      }
    } else {
      const currentInCarousel = tarjetasCarousel.some(t => t.id === tarjetaId)
      if ((!tarjetaId || !currentInCarousel) && tarjetasCarousel.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: tarjetasCarousel[0].id })
      }
    }
  }, [open, metodoPago, tarjetaId, tarjetasCarousel, isEdit])

  useEffect(() => {
    if (!open) return
    const idToScroll = metodoPago === 'credito' ? tarjetaId : billeteraId
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        const scroller = card.closest(`.${styles.billeterasCarouselScroller}`) as HTMLElement | null
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
    }, 100)

    return () => clearTimeout(timer)
  }, [billeteraId, tarjetaId, open, metodoPago])


  const calculoCuotas = useMemo(() => {
    const cant = cantidadCuotas || 1
    const tasa = tasaInteres ? tasaInteres / 100 : 0
    const m = monto || 0
    const valorCuota = tasa > 0
      ? (m * tasa * Math.pow(1 + tasa, cant)) / (Math.pow(1 + tasa, cant) - 1)
      : m / cant
    return { total: valorCuota * cant, cuota: valorCuota }
  }, [monto, cantidadCuotas, tasaInteres])

  const goNext = () => {
    if (!monto || (metodoPago === 'credito' ? !tarjetaId : !billeteraId)) {
      sileo.error({ title: metodoPago === 'credito' ? 'Seleccioná una tarjeta' : 'Seleccioná una billetera' })
      return
    }

    let nextStep: 1 | 2 | 3 = 2
    if (step === 1) {
      nextStep = metodoPago === 'credito' ? 2 : 3
    } else if (step === 2) {
      nextStep = 3
    }

    dispatch({ type: 'SET_STEP', step: nextStep, direction: 'forward' })
  }

  const goBack = () => {
    let prevStep: 1 | 2 | 3 = 1
    if (step === 3) {
      prevStep = metodoPago === 'credito' ? 2 : 1
    } else if (step === 2) {
      prevStep = 1
    }

    dispatch({ type: 'SET_STEP', step: prevStep, direction: 'back' })
  }

  const isPendienteIA = isEdit &&
    transaccion?.estado_verificacion === 'pendiente' &&
    ['ia_wpp', 'ia_pdf'].includes(transaccion?.origen ?? '')

  const handleSubmit = async () => {
    if (isSubmitting || submittingRef.current) return

    // Validaciones estrictas
    if (!monto || Number(monto) <= 0 || !Number.isFinite(Number(monto))) {
      sileo.error({ title: 'El monto debe ser mayor a cero' })
      return
    }

    if (!categoriaId) {
      sileo.error({ title: 'Seleccioná una categoría' })
      return
    }

    if (!subcategoriaId) {
      sileo.error({ title: 'Seleccioná una subcategoría' })
      return
    }

    let resolvedBilleteraId = billeteraId
    if (metodoPago === 'credito') {
      if (!tarjetaId) {
        sileo.error({ title: 'Seleccioná una tarjeta de crédito' })
        return
      }
      const tarjetaSel = tarjetas.find(t => t.id === tarjetaId)
      if (tarjetaSel?.billetera_id) {
        resolvedBilleteraId = tarjetaSel.billetera_id
      }
      if (!isEdit) {
        if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 120) {
          sileo.error({ title: 'La cantidad de cuotas debe ser un número entero entre 1 y 120' })
          return
        }
        if (!Number.isInteger(cuotaInicial) || cuotaInicial < 1 || cuotaInicial > cantidadCuotas) {
          sileo.error({ title: 'La cuota inicial debe estar entre 1 y la cantidad total' })
          return
        }
        if (!Number.isFinite(tasaInteres) || tasaInteres < 0 || tasaInteres > 1000) {
          sileo.error({ title: 'La tasa de interés debe estar entre 0% y 1000% anual o mensual según la operación.' })
          return
        }
      }
    } else {
      if (!resolvedBilleteraId) {
        sileo.error({ title: 'Seleccioná una billetera' })
        return
      }
    }

    submittingRef.current = true
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
      let savedTx: Transaccion | null = null
      if (!isEdit) {
        savedTx = await transaccionService.createTransaccion(payload)
        sileo.success({
          title: metodoPago === 'credito' ? 'Compra en cuotas registrada' : 'Transacción creada'
        })
        onSuccess(savedTx)
        onClose()
      } else if (transaccion) {
        savedTx = await transaccionService.updateTransaccion(transaccion.id, payload)
        if (isPendienteIA) {
          await transaccionService.confirmarIA(transaccion.id)
          sileo.success({ title: 'Transacción confirmada' })
        } else {
          sileo.success({ title: 'Transacción actualizada' })
        }
        onSuccess(savedTx)
        await evaluarMemoriaPostGuardado(transaccion)
      }
    } catch (e) {
      console.error(e)
      sileo.error({ title: getErrorMessage(e, 'Error al guardar la transacción') })
    } finally {
      submittingRef.current = false
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <>
    <Modal isOpen={open && !showMemoriaDialog} onClose={onClose} showHeader={false} noPadding autoHeight ariaLabel="Nueva transacción">
      <div className={styles.modalRoot}>
        {/* Indicador de pasos superior centrado (estilo Nueva Billetera / BankPickerModal) */}
        <div className={styles.stepIndicator} aria-hidden="true">
          <div className={`${styles.dot} ${step === 1 ? styles.dotActive : styles.dotInactive}`} />
          {metodoPago === 'credito' && (
            <div className={`${styles.dot} ${step === 2 ? styles.dotActive : styles.dotInactive}`} />
          )}
          <div className={`${styles.dot} ${step === 3 ? styles.dotActive : styles.dotInactive}`} />
        </div>

        <div
          className={`${styles.slidesContainer} ${
            step === 1
              ? availableMethods.length <= 1
                ? styles.step1Compact
                : styles.step1
              : step === 2
              ? styles.step2
              : styles.step3
          }`}
          style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
        >

          {/* ════════════════════ PASO 1: Monto y Origen ════════════════════ */}
          <div
            className={`${styles.slide} ${
              step === 1
                ? styles.slideVisible
                : slideDirection === 'forward'
                ? styles.slideExitLeft
                : styles.slideExitRight
            }`}
          >
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div
                ref={step === 1 ? formBodyRef : undefined}
                className={`${styles.formBody} ${styles.formBodyWithHeader} ${styles.formBodyStep1}`}
              >
                <div className={styles.formHeader}>
                  <div className={styles.headerLeft}>
                    <div>
                      <h2 className={styles.headerTitle}>{isEdit ? (isCuotaHija ? 'Detalle de cuota' : 'Editar transacción') : 'Nueva transacción'}</h2>
                    </div>
                  </div>
                  <div className={styles.headerRightActions}>
                    {isEdit && (
                      <button
                        type="button"
                        className={styles.deleteHeaderBtn}
                        onClick={handleDeleteTransaction}
                        title={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                        aria-label={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                      <X size={18} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className={styles.formFields}>
                  {isCuotaHija && (
                    <div className={styles.cuotaHijaWarning}>
                      Monto, moneda, tipo y billetera no se pueden cambiar porque esta transacción es parte de una compra en cuotas.
                    </div>
                  )}

                  {/* 0. Tipo Ingreso/Egreso (Segmented Bar Apple Style arriba del monto) */}
                  <div className={styles.segmentedBar} role="radiogroup" aria-label="Tipo de transacción">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tipo === 'egreso'}
                      className={`${styles.segmentedPill} ${tipo === 'egreso' ? styles.segmentedPillActive : ''}`}
                      onClick={() => {
                        if (isCuotaHija) return
                        dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'egreso' })
                        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                      }}
                      disabled={isCuotaHija}
                    >
                      <ArrowUpRight size={14} strokeWidth={2.2} />
                      <span>Egreso</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tipo === 'ingreso'}
                      className={`${styles.segmentedPill} ${tipo === 'ingreso' ? styles.segmentedPillActive : ''}`}
                      onClick={() => {
                        if (isCuotaHija) return
                        dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'ingreso' })
                        dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                        // Crédito no aplica a ingresos: resetear a débito o efectivo
                        if (metodoPago === 'credito') {
                          const nextMethod = hasBancos ? 'debito' : 'efectivo'
                          dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: nextMethod })
                          const firstWallet = billeteras.find(b => (nextMethod === 'efectivo' ? b.es_efectivo : !b.es_efectivo) && b.moneda === moneda && b.estado === 'activa')
                          if (firstWallet) dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: firstWallet.id })
                        }
                      }}
                      disabled={isCuotaHija}
                    >
                      <ArrowDownLeft size={14} strokeWidth={2.2} />
                      <span>Ingreso</span>
                    </button>
                  </div>

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

                  {/* 1. Método de Pago (se oculta automáticamente si solo hay 1 método disponible) */}
                  {availableMethods.length > 1 && (
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>{tipo === 'ingreso' ? '¿Cómo recibiste?' : '¿Cómo pagaste?'}</label>
                      <div className={styles.methodGrid}>
                        {availableMethods.map(({ key, icon, label }) => {
                          const isActive = metodoPago === key
                          return (
                            <button
                              type="button"
                              key={key}
                              data-active={isActive}
                              className={`${styles.methodBtn} ${isActive ? styles.methodBtnActive : ''}`}
                              title={`Método de pago ${label}`}
                              aria-label={`Seleccionar método ${label}`}
                              onClick={() => handleSelectMetodo(key)}
                              disabled={isCuotaHija}
                            >
                              <div className={styles.methodIconWrapper}>
                                {icon}
                              </div>
                              <span className={styles.methodBtnLabel}>{label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Origen Dinámico */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      {metodoPago === 'credito' ? 'Seleccioná tu tarjeta' : '¿De qué billetera?'}
                    </label>

                    {metodoPago === 'credito' ? (
                      tarjetasCarousel.length === 0 ? (
                        <div className={styles.emptyWalletBox}>
                          <div className={styles.emptyWalletIcon}>
                            <CreditCard size={22} strokeWidth={1.75} />
                          </div>
                          <p className={styles.emptyWalletTitle}>No tenés tarjetas de crédito activas</p>
                          <p className={styles.emptyWalletSub}>
                            Agregá una tarjeta desde la sección de Tarjetas para poder financiar en cuotas.
                          </p>
                        </div>
                      ) : (
                        <div className={styles.billeterasCarouselScroller}>
                          <div className={styles.billeterasCarousel} ref={carouselRef}>
                            {tarjetasCarousel.map(t => (
                              <div
                                key={t.id}
                                className={`${styles.billeteraSelectWrap} ${styles.tarjetaSelectWrap}`}
                                data-active={tarjetaId === t.id}
                                ref={(el) => setCardNode(t.id, el)}
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
                                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                                  title={`Seleccionar tarjeta ${t.nombre}`}
                                  aria-label={`Seleccionar tarjeta ${t.nombre}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      billeterasCarousel.length === 0 ? (
                        <div className={styles.emptyWalletBox}>
                          <div className={styles.emptyWalletIcon}>
                            <Wallet size={22} strokeWidth={1.75} />
                          </div>
                          <p className={styles.emptyWalletTitle}>
                            {hasBancos || hasEfectivo
                              ? `No tenés billeteras para este método en ${moneda}`
                              : `No tenés billeteras en ${moneda}`}
                          </p>
                          <p className={styles.emptyWalletSub}>
                            {hasBancos || hasEfectivo
                              ? 'Probá cambiando el método de pago o creá una nueva billetera.'
                              : `Creá una billetera en ${moneda} desde la sección de Billeteras para registrar tus movimientos.`}
                          </p>
                        </div>
                      ) : (
                        <div className={styles.billeterasCarouselScroller}>
                          <div className={styles.billeterasCarousel} ref={carouselRef}>
                            {billeterasCarousel.map(b => (
                              <div
                                key={b.id}
                                className={styles.billeteraSelectWrap}
                                data-active={billeteraId === b.id}
                                ref={(el) => setCardNode(b.id, el)}
                              >
                                <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} hideCurrencyChip={true} />
                                <button
                                  type="button"
                                  className={styles.billeteraOverlay}
                                  onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                                  disabled={isCuotaHija}
                                  title={`Seleccionar billetera ${b.nombre}`}
                                  aria-label={`Seleccionar billetera ${b.nombre}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div ref={step === 1 ? formFooterRef : undefined} className={styles.formFooter}>
                {isEdit ? (
                  <button type="button" className={styles.btnDelete} onClick={handleDeleteTransaction}>
                    {isCuotaHija ? 'Eliminar cuota' : 'Eliminar'}
                  </button>
                ) : (
                  <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                )}
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>

          {/* ════════════════════ PASO 2: Configuración de Cuotas (Solo Crédito) ════════════════════ */}
          {metodoPago === 'credito' && (
            <div
              className={`${styles.slide} ${
                step === 2
                  ? styles.slideVisible
                  : step < 2
                  ? styles.slideEnterRight
                  : styles.slideExitLeft
              }`}
            >
              <form 
                className={styles.formContainer}
                onSubmit={(e) => {
                  e.preventDefault()
                  goNext()
                }}
              >
                <div
                  ref={step === 2 ? formBodyRef : undefined}
                  className={`${styles.formBody} ${styles.formBodyWithHeader} ${styles.formBodyStep2}`}
                >
                  <div className={styles.formHeader}>
                    <div className={styles.headerLeft}>
                      <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                        <ChevronLeft size={18} strokeWidth={2} />
                      </button>
                      <div>
                        <h2 className={styles.headerTitle}>Plan de cuotas</h2>
                      </div>
                    </div>
                    <div className={styles.headerRightActions}>
                      <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                        <X size={18} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  <div className={`${styles.formFields} ${styles.financiacionContainer}`}>
                    {/* 1. Selector de Cantidad de Cuotas (Presets primarios + Otra) */}
                    <div className={styles.planSelectorSection}>
                      <label className={styles.fieldLabel}>¿En cuántas cuotas?</label>
                      <div className={styles.planGrid}>
                        {[1, 3, 6, 12].map((n) => {
                          const isSelected = !isCustomCuotas && cantidadCuotas === n
                          return (
                            <button
                              type="button"
                              key={n}
                              className={`${styles.planOptionCard} ${isSelected ? styles.planOptionCardActive : ''}`}
                              onClick={() => {
                                setIsCustomOverride(false)
                                dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: n })
                                if (cuotaInicial > n) {
                                  dispatch({ type: 'SET_FIELD', field: 'cuotaInicial', value: 1 })
                                }
                              }}
                            >
                              <span className={styles.planCuotasNum}>{n}</span>
                              <span className={styles.planCuotasLbl}>{n === 1 ? 'pago' : 'cuotas'}</span>
                              {n > 1 && monto ? (
                                <span className={styles.planCuotasAmt}>{getCuotaPreview(n)}</span>
                              ) : null}
                            </button>
                          )
                        })}

                        <button
                          type="button"
                          className={`${styles.planCustomBtn} ${isCustomCuotas ? styles.planCustomBtnActive : ''}`}
                          onClick={() => {
                            if (!isCustomCuotas) {
                              setIsCustomOverride(true)
                              const nextVal = [1, 3, 6, 12].includes(cantidadCuotas) ? 18 : cantidadCuotas
                              dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: nextVal })
                            }
                          }}
                        >
                          <span className={styles.planCustomBtnLabel}>
                            {isCustomCuotas ? `${cantidadCuotas} cuotas` : 'Otra...'}
                          </span>
                        </button>
                      </div>

                      {/* Stepper inline al elegir cantidad personalizada */}
                      {isCustomCuotas && (
                        <div className={styles.customStepperRow}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => {
                              const val = Math.max(1, cantidadCuotas - 1)
                              dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: val })
                              if (cuotaInicial > val) dispatch({ type: 'SET_FIELD', field: 'cuotaInicial', value: 1 })
                            }}
                            disabled={cantidadCuotas <= 1}
                            aria-label="Menos cuotas"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={styles.stepperValue}>
                            {cantidadCuotas} {cantidadCuotas === 1 ? 'pago' : 'cuotas'}
                          </span>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => {
                              const val = Math.min(120, cantidadCuotas + 1)
                              dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: val })
                            }}
                            disabled={cantidadCuotas >= 120}
                            aria-label="Más cuotas"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. ¿Cuándo entra la 1ª cuota? (Toggle claro) */}
                    <div className={styles.timingSection}>
                      <label className={styles.fieldLabel}>¿Cuándo entra la 1ª cuota?</label>
                      <div className={styles.timingToggle}>
                        <button
                          type="button"
                          className={`${styles.timingBtn} ${!proximoResumen ? styles.timingBtnActive : ''}`}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'proximoResumen', value: false })}
                        >
                          <span className={styles.timingBtnTitle}>Este mes</span>
                          <span className={styles.timingBtnSub}>Resumen actual</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.timingBtn} ${proximoResumen ? styles.timingBtnActive : ''}`}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'proximoResumen', value: true })}
                        >
                          <span className={styles.timingBtnTitle}>Próximo mes</span>
                          <span className={styles.timingBtnSub}>Resumen siguiente</span>
                        </button>
                      </div>
                      {selectedTarjeta && selectedTarjeta.dia_cierre > 0 && (
                        <p className={styles.timingCardHint}>
                          <Lightbulb size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5, color: '#C9A227' }} />
                          Tu <strong>{selectedTarjeta.nombre || 'tarjeta'}</strong> cierra el día <strong>{selectedTarjeta.dia_cierre}</strong> de cada mes.
                        </p>
                      )}
                    </div>

                    {/* 3. Opciones avanzadas (Progressive disclosure: Interés y cuotas ya pagadas) */}
                    {cantidadCuotas > 1 && (
                      <>
                        <button
                          type="button"
                          className={styles.advancedToggleBtn}
                          onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                          <SlidersHorizontal size={13} />
                          <span>{showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (interés o cuota actual)'}</span>
                        </button>

                        {showAdvanced && (
                          <div className={styles.advancedDrawer}>
                            <div className={styles.advField}>
                              <label className={styles.advLabel}>Interés % mensual</label>
                              <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={100}
                                placeholder="0% (Sin interés)"
                                value={tasaInteres === 0 ? '' : tasaInteres}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  dispatch({ type: 'SET_FIELD', field: 'tasaInteres', value: val })
                                }}
                                className={styles.advInput}
                              />
                            </div>
                            <div className={styles.advField}>
                              <label className={styles.advLabel}>Voy por la cuota</label>
                              <input
                                type="number"
                                min={1}
                                max={cantidadCuotas}
                                value={cuotaInicial || 1}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 1 : Math.max(1, Math.min(cantidadCuotas, parseInt(e.target.value) || 1))
                                  dispatch({ type: 'SET_FIELD', field: 'cuotaInicial', value: val })
                                }}
                                className={styles.advInput}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* 4. Tarjeta Hero de Resumen */}
                    <div className={styles.heroFinancingCard}>
                      <div className={styles.heroFinancingTop}>
                        <div>
                          <span className={styles.heroInstallmentAmount}>
                            {formatMonto(calculoCuotas.cuota, moneda)}
                          </span>
                          <span className={styles.heroInstallmentSuffix}>
                            {cantidadCuotas === 1 ? ' pago único' : '/mes'}
                          </span>
                        </div>
                        {cantidadCuotas > 1 && (
                          <div className={styles.heroTotalBadge}>
                            Total: {formatMonto(calculoCuotas.total, moneda)}
                          </div>
                        )}
                      </div>

                      <p className={styles.heroFinancingNarrative}>
                        {cantidadCuotas === 1 ? (
                          <>
                            Se cargará en el resumen de <strong>{proximoResumen ? 'el próximo mes' : 'este mes'}</strong>.
                          </>
                        ) : cuotaInicial > 1 ? (
                          <>
                            Pagarás <strong>{cantidadCuotas - cuotaInicial + 1} de {cantidadCuotas} cuotas</strong> a partir de <strong>{proximoResumen ? 'el próximo mes' : 'este mes'}</strong>.
                          </>
                        ) : (
                          <>
                            Pagarás <strong>{cantidadCuotas} cuotas</strong> {tasaInteres > 0 ? `(con ${tasaInteres}% int.)` : '(sin interés)'}, comenzando en el resumen de <strong>{proximoResumen ? 'el próximo mes' : 'este mes'}</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div ref={step === 2 ? formFooterRef : undefined} className={styles.formFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                  <button type="submit" className={styles.submitBtn}>Continuar</button>
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════ PASO 3: Detalles y Categoría ════════════════════ */}
          <div
            className={`${styles.slide} ${
              step === 3
                ? styles.slideVisible
                : slideDirection === 'forward'
                ? styles.slideEnterRight
                : styles.slideEnterLeft
            }`}
          >
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div
                ref={step === 3 ? formBodyRef : undefined}
                className={`${styles.formBody} ${styles.formBodyWithHeader}`}
              >
                <div className={styles.formHeader}>
                  <div className={styles.headerLeft}>
                    <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                      <ChevronLeft size={18} strokeWidth={2} />
                    </button>
                    <div>
                      <h2 className={styles.headerTitle}>Detalles</h2>
                    </div>
                  </div>
                  <div className={styles.headerRightActions}>
                    {isEdit && (
                      <button
                        type="button"
                        className={styles.deleteHeaderBtn}
                        onClick={handleDeleteTransaction}
                        title={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                        aria-label={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                      <X size={18} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className={styles.formFields}>
                  {/* Descripción + Fecha */}
                  <div className={styles.descFechaRow}>
                    <div className={`${styles.formField} ${styles.descCol}`}>
                      <label className={styles.fieldLabel} htmlFor="tx-desc">Descripción</label>
                      <input id="tx-desc" type="text" className={styles.fieldInput} value={descripcion}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'descripcion', value: e.target.value })}
                        placeholder="Ej: Supermercado" />
                    </div>
                    <div className={`${styles.formField} ${styles.fechaCol}`}>
                      <label className={styles.fieldLabel} htmlFor="tx-fecha">Fecha</label>
                      <DateInput id="tx-fecha" value={fecha}
                        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'fecha', value: val })}
                        disabled={isCuotaHija} className={styles.fieldInput} />
                    </div>
                  </div>

                  {/* Categoría y Subcategoría (reusado CategoriaSelector) */}
                  <CategoriaSelector
                    categorias={categorias}
                    categoriaId={categoriaId}
                    subcategoriaId={subcategoriaId}
                    tipo={tipo}
                    autoseleccionarPrimeraSubcategoria={true}
                    onSelectCategoria={(id) => {
                      marcarCategoriaManual()
                      dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: id })
                      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
                    }}
                    onSelectSubcategoria={(id) => {
                      marcarCategoriaManual()
                      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: id })
                    }}
                  />
                  {!isEdit && sugerenciaClave && descripcion.trim() && (
                    <p className={memoriaStyles.sugerenciaText}>
                      Categoría que usaste antes para &quot;{sugerenciaClave}&quot;.
                    </p>
                  )}
                </div>
              </div>

              <div ref={step === 3 ? formFooterRef : undefined} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isPendienteIA ? 'Confirmar transacción' : isEdit ? 'Guardar cambios' : 'Guardar transacción'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </Modal>

    {showMemoriaDialog && memoriaDialogData && (
      <MemoriaComercioDialog
        isOpen={showMemoriaDialog}
        onClose={cerrarMemoriaDialog}
        clave={memoriaDialogData.clave}
        descripcion={memoriaDialogData.descripcion}
        tipo={memoriaDialogData.tipo}
        categoriaId={memoriaDialogData.categoriaId}
        subcategoriaId={memoriaDialogData.subcategoriaId}
        categoriaNombre={memoriaDialogData.categoriaNombre}
        subcategoriaNombre={memoriaDialogData.subcategoriaNombre}
        onSuccess={() => onSuccess()}
      />
    )}
    </>
  )
}
