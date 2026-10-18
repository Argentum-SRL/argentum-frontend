import { useMemo, useEffect, useReducer, useRef, useCallback } from 'react'
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
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria, TarjetaCredito } from '@/types'
import transaccionService from '@/services/transaccion.service'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import styles from './TransaccionModal.module.css'
import SegmentedControl from '@/components/ui/SegmentedControl'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { DateInput, SelectableSurface } from '@/components/ui'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { sortBilleteras, getBankById, findBankByNombre } from '@/lib/utils/billeteras.utils'
import { useMemoriaComercio } from './useMemoriaComercio'
import MemoriaComercioDialog from './MemoriaComercioDialog'
import memoriaStyles from './MemoriaComercioDialog.module.css'
import { useResumenDeCompra, formatDDMM } from '@/hooks/useResumenDeCompra'
import DebitoEnDolares from './DebitoEnDolares'
import CalculoCuotasResumen from './CalculoCuotasResumen'
import AvisoSaldoAnterior from './AvisoSaldoAnterior'

function isBankLight(b: Billetera): boolean {
  const bank = b.bank_id ? getBankById(b.bank_id) : findBankByNombre(b.nombre)
  return !bank || bank.colorTexto === 'white'
}

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
  step: 1 | 2 | 3 | 4
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
  montoPesosDebito: number | null
}

type FormAction =
  | {
      type: 'RESET'
      transaccion: Transaccion | null
      billeteras: Billetera[]
      billeteraInicialId?: string
      tipoInicial?: 'egreso' | 'ingreso'
    }
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4; direction: 'forward' | 'back' }
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
  montoPesosDebito: null,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      if (action.transaccion) {
        const wallet = action.billeteras.find(b => b.id === action.transaccion?.billetera_id)
        let metodoDeducido: 'debito' | 'efectivo' | 'credito' | 'transferencia' = 
          action.transaccion.metodo_pago || (
            action.transaccion.tarjeta_id
              ? 'credito'
              : wallet?.es_efectivo
                ? 'efectivo'
                : (action.transaccion.tipo === 'ingreso' ? 'transferencia' : 'debito')
          )
        if (action.transaccion.tipo === 'ingreso' && (metodoDeducido === 'debito' || metodoDeducido === 'credito')) {
          metodoDeducido = wallet?.es_efectivo ? 'efectivo' : 'transferencia'
        }
        const esDebitoOriginalUSD = action.transaccion.moneda === 'ARS' && action.transaccion.moneda_original === 'USD' && Number(action.transaccion.monto_original) > 0
        const monedaInicial = esDebitoOriginalUSD ? 'USD' : action.transaccion.moneda
        const montoInicial = esDebitoOriginalUSD ? Number(action.transaccion.monto_original) : action.transaccion.monto
        const pesosInicial = esDebitoOriginalUSD ? Number(action.transaccion.monto) : null
        return {
          ...initialState,
          tipo: action.transaccion.tipo,
          monto: montoInicial,
          moneda: monedaInicial,
          descripcion: action.transaccion.descripcion || '',
          categoriaId: action.transaccion.categoria_id || '',
          subcategoriaId: action.transaccion.subcategoria_id || '',
          billeteraId: action.transaccion.billetera_id,
          tarjetaId: action.transaccion.tarjeta_id || '',
          fecha: action.transaccion.fecha.split('T')[0],
          metodoPago: metodoDeducido,
          montoPesosDebito: pesosInicial,
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
        const tipoInicialVal = action.tipoInicial || 'egreso'
        const metodoInicial: 'debito' | 'efectivo' | 'credito' | 'transferencia' = 
          tipoInicialVal === 'ingreso'
            ? ((!hasBancosInMoneda || bestForCurrency?.es_efectivo) ? 'efectivo' : 'transferencia')
            : ((!hasBancosInMoneda || bestForCurrency?.es_efectivo) ? 'efectivo' : 'debito')

        return {
          ...initialState,
          tipo: tipoInicialVal,
          fecha: todayLocal(),
          billeteraId: bestForCurrency?.id || '',
          moneda: monedaInicial,
          metodoPago: metodoInicial,
        }
      }
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      if (action.field === 'tarjetaId') {
        return { ...state, tarjetaId: action.value, proximoResumen: false }
      }
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
  const slidesContainerRef = useRef<HTMLDivElement>(null)
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
    montoPesosDebito,
  } = state

  const billeteraSeleccionada = billeteras.find(b => b.id === billeteraId)
  const esDebitoUsdEnPesos = moneda === 'USD' && tipo === 'egreso' && (metodoPago === 'debito' || metodoPago === 'transferencia') && billeteraSeleccionada?.moneda === 'ARS'

  const { resumen: resumenCompra, loading: loadingResumenCompra, error: errorResumenCompra } = useResumenDeCompra(
    metodoPago === 'credito' ? tarjetaId : null,
    fecha,
    proximoResumen
  )
  const vencimientoDDMM = resumenCompra?.fecha_vencimiento ? formatDDMM(resumenCompra.fecha_vencimiento) : ''

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

  // Billeteras activas para la moneda seleccionada
  const billeterasMoneda = useMemo(() => {
    return billeteras.filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId))
  }, [billeteras, moneda, billeteraId])

  const hasBancos = useMemo(() => {
    if (billeterasMoneda.some(b => !b.es_efectivo)) return true
    if (tipo === 'egreso' && moneda === 'USD') {
      return billeteras.some(b => b.moneda === 'ARS' && !b.es_efectivo && (b.estado === 'activa' || b.id === billeteraId))
    }
    return false
  }, [billeterasMoneda, tipo, moneda, billeteras, billeteraId])

  const hasEfectivo = useMemo(() => {
    return billeterasMoneda.some(b => b.es_efectivo)
  }, [billeterasMoneda])

  const hasCredito = useMemo(() => {
    return tipo === 'egreso' && tarjetas.some(t => t.estado === 'activa' || t.id === tarjetaId)
  }, [tipo, tarjetas, tarjetaId])

  // Métodos de pago disponibles según tipo y billeteras existentes en la moneda
  const availableMethods = useMemo(() => {
    const methods: Array<{
      key: 'debito' | 'transferencia' | 'credito' | 'efectivo'
      icon: React.ReactNode
      label: string
    }> = []

    if (tipo === 'ingreso') {
      if (hasBancos) {
        methods.push({ key: 'transferencia', icon: <ArrowRightLeft size={18} strokeWidth={2.2} />, label: 'Transferencia' })
      }

      if (hasEfectivo) {
        methods.push({ key: 'efectivo', icon: <Banknote size={18} strokeWidth={2.2} />, label: 'Efectivo' })
      }

      // Si el usuario no tiene ninguna billetera registrada
      if (methods.length === 0) {
        methods.push({ key: 'transferencia', icon: <ArrowRightLeft size={18} strokeWidth={2.2} />, label: 'Transferencia' })
      }

      return methods
    }

    // Para egresos:
    if (hasBancos) {
      methods.push({ key: 'debito', icon: <CreditCard size={18} strokeWidth={2.2} />, label: 'Débito' })
      methods.push({ key: 'transferencia', icon: <ArrowRightLeft size={18} strokeWidth={2.2} />, label: 'Transferencia' })
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
  }, [tipo, hasBancos, hasCredito, hasEfectivo])

  // Auto-ajuste de método de pago cuando cambia moneda, tipo o billeteras disponibles
  useEffect(() => {
    if (!open) return
    const isCurrentValid = availableMethods.some(m => m.key === metodoPago)
    if (!isCurrentValid) {
      const bestWallet = billeterasMoneda.find(b => b.es_principal) || billeterasMoneda[0]
      const preferred = (bestWallet?.es_efectivo || !hasBancos)
        ? (availableMethods.find(m => m.key === 'efectivo')?.key || availableMethods[0]?.key)
        : (availableMethods.find(m => m.key !== 'efectivo')?.key || availableMethods[0]?.key)

      dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: preferred || (tipo === 'ingreso' ? 'transferencia' : 'debito') })
    }
  }, [open, availableMethods, metodoPago, billeterasMoneda, hasBancos, tipo])

  // Billeteras ordenadas: La cuenta principal primero, luego de mayor a menor saldo
  const billeterasCarousel = useMemo(() => {
    let filtered = billeterasMoneda

    // Luego filtramos por tipo según el método de pago
    if (metodoPago === 'efectivo') {
      filtered = filtered.filter(b => b.es_efectivo)
    } else if (metodoPago === 'debito' || metodoPago === 'transferencia') {
      filtered = filtered.filter(b => !b.es_efectivo)
      if (tipo === 'egreso' && moneda === 'USD') {
        const enPesos = billeteras.filter(b => b.moneda === 'ARS' && !b.es_efectivo && (b.estado === 'activa' || b.id === billeteraId))
        filtered = [...filtered, ...enPesos]
      }
    }

    return sortBilleteras(filtered, moneda)
  }, [billeterasMoneda, metodoPago, moneda, tipo, billeteras, billeteraId])

  const handleSelectTipo = (nuevoTipo: 'egreso' | 'ingreso') => {
    if (isCuotaHija) return
    if (nuevoTipo === 'egreso') {
      dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'egreso' })
      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
    } else if (nuevoTipo === 'ingreso') {
      dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'ingreso' })
      dispatch({ type: 'SET_FIELD', field: 'subcategoriaId', value: '' })
      // En ingresos no aplican crédito ni débito: migrar a transferencia o efectivo
      if (metodoPago === 'credito' || metodoPago === 'debito') {
        const nextMethod = hasBancos ? 'transferencia' : 'efectivo'
        dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: nextMethod })
        const firstWallet = billeteras.find(b => (nextMethod === 'efectivo' ? b.es_efectivo : !b.es_efectivo) && b.moneda === moneda && b.estado === 'activa')
        if (firstWallet) dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: firstWallet.id })
      }
    }
  }

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
    // Con crédito la billetera la define siempre la tarjeta
    if (metodoPago === 'credito') return

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
  }, [moneda, open, billeteraId, billeterasCarousel, isEdit, metodoPago])

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

  useEffect(() => {
    if (slidesContainerRef.current) {
      slidesContainerRef.current.scrollLeft = 0
      slidesContainerRef.current.scrollTop = 0
    }
  }, [step, moneda])

  const goNext = () => {
    if (!monto || (metodoPago === 'credito' ? !tarjetaId : !billeteraId)) {
      sileo.error({ title: metodoPago === 'credito' ? 'Seleccioná una tarjeta' : 'Seleccioná una billetera' })
      return
    }

    let nextStep: 1 | 2 | 3 | 4 = 2
    if (step === 1) {
      nextStep = metodoPago === 'credito' ? 2 : 3
    } else if (step === 2) {
      nextStep = 3
    } else if (step === 3) {
      if (esDebitoUsdEnPesos) {
        nextStep = 4
      }
    }

    dispatch({ type: 'SET_STEP', step: nextStep, direction: 'forward' })
  }

  const goBack = () => {
    let prevStep: 1 | 2 | 3 | 4 = 1
    if (step === 4) {
      prevStep = 3
    } else if (step === 3) {
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

    if (esDebitoUsdEnPesos && (!montoPesosDebito || montoPesosDebito <= 0)) {
      sileo.error({ title: 'Ingresá el monto que te cobró el banco en pesos' })
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
            monto: esDebitoUsdEnPesos ? Number(montoPesosDebito) : Number(monto),
            moneda: esDebitoUsdEnPesos ? ('ARS' as const) : moneda,
            moneda_original: esDebitoUsdEnPesos ? ('USD' as const) : undefined,
            monto_original: esDebitoUsdEnPesos ? Number(monto) : undefined,
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
          {(metodoPago === 'credito' || esDebitoUsdEnPesos) && (
            <div
              className={`${styles.dot} ${
                (metodoPago === 'credito' ? step === 2 : step === 3)
                  ? styles.dotActive
                  : styles.dotInactive
              }`}
            />
          )}
          <div
            className={`${styles.dot} ${
              (metodoPago === 'credito'
                ? step === 3
                : esDebitoUsdEnPesos
                ? step === 4
                : step === 3)
                ? styles.dotActive
                : styles.dotInactive
            }`}
          />
        </div>

        <div
          ref={slidesContainerRef}
          className={styles.slidesContainer}
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

                  {/* 0. Tipo Ingreso/Egreso (SegmentedControl cápsula oficial) */}
                  <SegmentedControl<'egreso' | 'ingreso'>
                    ariaLabel="Tipo de transacción"
                    fullWidth
                    value={tipo}
                    onChange={handleSelectTipo}
                    options={[
                      {
                        value: 'egreso',
                        label: 'Egreso',
                        icon: <ArrowUpRight size={15} strokeWidth={2.2} />,
                        disabled: isCuotaHija,
                      },
                      {
                        value: 'ingreso',
                        label: 'Ingreso',
                        icon: <ArrowDownLeft size={15} strokeWidth={2.2} />,
                        disabled: isCuotaHija,
                      },
                    ]}
                  />

                  {/* Hero monto */}
                  <MontoInput
                    value={monto}
                    onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
                    moneda={moneda}
                    onMonedaChange={(m) => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                    disabled={isCuotaHija}
                    autoFocus={step === 1}
                    allowDecimals
                  />

                  {/* 1. Método de Pago (se oculta automáticamente si solo hay 1 método disponible) */}
                  {availableMethods.length > 1 && (
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>{tipo === 'ingreso' ? '¿Cómo recibiste?' : '¿Cómo pagaste?'}</label>
                      <SegmentedControl<'debito' | 'transferencia' | 'credito' | 'efectivo'>
                        layout="stacked"
                        fullWidth
                        ariaLabel="Método de pago"
                        options={availableMethods.map(({ key, icon, label }) => ({
                          value: key,
                          label,
                          icon,
                          disabled: isCuotaHija,
                        }))}
                        value={metodoPago}
                        onChange={handleSelectMetodo}
                      />
                    </div>
                  )}

                  {/* 2. Origen Dinámico */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      {metodoPago === 'credito'
                        ? 'Seleccioná tu tarjeta'
                        : (tipo === 'ingreso' ? '¿A qué billetera?' : '¿De qué billetera?')}
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
                              <SelectableSurface
                                key={t.id}
                                selected={tarjetaId === t.id}
                                context="modal"
                                className={`${styles.billeteraSelectWrap} ${styles.tarjetaSelectWrap}`}
                                data-active={tarjetaId === t.id}
                                ref={(el) => setCardNode(t.id, el as HTMLDivElement | null)}
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
                                  className={styles.fullHeightCard}
                                />
                                <button
                                  type="button"
                                  className={styles.billeteraOverlay}
                                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                                  title={`Seleccionar tarjeta ${t.nombre}`}
                                  aria-label={`Seleccionar tarjeta ${t.nombre}`}
                                />
                              </SelectableSurface>
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
                              <SelectableSurface
                                key={b.id}
                                selected={billeteraId === b.id}
                                context="modal"
                                className={styles.billeteraSelectWrap}
                                data-active={billeteraId === b.id}
                                ref={(el) => setCardNode(b.id, el as HTMLDivElement | null)}
                              >
                                <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} hideCurrencyChip={true} />
                                {moneda === 'USD' && b.moneda === 'ARS' && (
                                  <span className={`${styles.cuentaEnPesosChip} ${isBankLight(b) ? '' : styles.cuentaEnPesosChipDark}`}>
                                    Cuenta en pesos
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={styles.billeteraOverlay}
                                  onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                                  disabled={isCuotaHija}
                                  title={`Seleccionar billetera ${b.nombre}`}
                                  aria-label={`Seleccionar billetera ${b.nombre}`}
                                />
                              </SelectableSurface>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
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
                  className={`${styles.formBody} ${styles.formBodyWithHeader}`}
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

                  <CalculoCuotasResumen
                    cantidadCuotas={cantidadCuotas}
                    cuotaInicial={cuotaInicial}
                    tasaInteres={tasaInteres}
                    proximoResumen={proximoResumen}
                    monto={monto}
                    moneda={moneda}
                    resumenCompra={resumenCompra}
                    loadingResumenCompra={loadingResumenCompra}
                    errorResumenCompra={errorResumenCompra}
                    vencimientoDDMM={vencimientoDDMM}
                    onFieldChange={(field, value) => {
                      if (field === 'proximoResumen') {
                        dispatch({ type: 'SET_FIELD', field: 'proximoResumen', value: Boolean(value) })
                      } else if (field === 'cantidadCuotas') {
                        dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: Number(value) })
                      } else if (field === 'cuotaInicial') {
                        dispatch({ type: 'SET_FIELD', field: 'cuotaInicial', value: Number(value) })
                      } else if (field === 'tasaInteres') {
                        dispatch({ type: 'SET_FIELD', field: 'tasaInteres', value: Number(value) })
                      }
                    }}
                  />
                </div>

                <div className={styles.formFooter}>
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
                : step < 3
                ? (slideDirection === 'forward' ? styles.slideEnterRight : styles.slideEnterLeft)
                : (slideDirection === 'forward' ? styles.slideExitLeft : styles.slideExitRight)
            }`}
          >
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                if (esDebitoUsdEnPesos) {
                  goNext()
                } else {
                  handleSubmit()
                }
              }}
            >
              <div
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
                  {/* Descripción + Fecha y aviso de saldo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
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

                    <AvisoSaldoAnterior
                      billetera={billeteraSeleccionada}
                      fecha={fecha}
                      metodoPago={metodoPago}
                    />
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

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {esDebitoUsdEnPesos
                    ? 'Continuar'
                    : isSubmitting
                    ? 'Guardando...'
                    : isPendienteIA
                    ? 'Confirmar transacción'
                    : isEdit
                    ? 'Guardar cambios'
                    : 'Guardar transacción'}
                </button>
              </div>
            </form>
          </div>

          {/* ════════════════════ PASO 4: Resumen de Cobro (Débito USD en pesos) ════════════════════ */}
          {esDebitoUsdEnPesos && (
            <div
              className={`${styles.slide} ${
                step === 4
                  ? styles.slideVisible
                  : slideDirection === 'forward'
                  ? styles.slideEnterRight
                  : styles.slideEnterLeft
              }`}
            >
              {(step === 4 || step === 3) && (
                <form 
                  className={styles.formContainer}
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                  }}
                >
                  <div
                    className={`${styles.formBody} ${styles.formBodyWithHeader}`}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                          <ChevronLeft size={18} strokeWidth={2} />
                        </button>
                        <div>
                          <h2 className={styles.headerTitle}>Resumen de cobro</h2>
                        </div>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFields}>
                      <DebitoEnDolares
                        montoUsd={monto}
                        montoPesos={montoPesosDebito}
                        billeteraNombre={billeteraSeleccionada?.nombre}
                        descripcion={descripcion}
                        categoriaNombre={categorias.find(c => c.id === categoriaId)?.nombre}
                        onChangeMontoPesos={(val) => dispatch({ type: 'SET_FIELD', field: 'montoPesosDebito', value: val })}
                        autoFocus={step === 4}
                      />
                    </div>
                  </div>

                  <div className={styles.formFooter}>
                    <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting
                        ? 'Guardando...'
                        : isPendienteIA
                        ? 'Confirmar transacción'
                        : isEdit
                        ? 'Guardar cambios'
                        : 'Guardar transacción'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
