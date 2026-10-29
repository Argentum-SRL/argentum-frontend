import { useState, useMemo, useEffect, useReducer, useRef, useCallback } from 'react'
import { esPunteroFino } from '@/utils/foco'
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
import type { Transaccion, Billetera, Categoria, TarjetaCredito, Subcategoria } from '@/types'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { nuevaClaveOperacion } from '@/services/api'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import styles from './TransaccionModal.module.css'
import SegmentedControl from '@/components/ui/SegmentedControl'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { sileo } from 'sileo'
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
import { ReintegroSwitchCard } from './ReintegroBloque'
import ReintegroPaso from './ReintegroPaso'
import { initialState, formReducer, calcularPasosConClaves } from './pasosTransaccion'
import { useReintegro } from './useReintegro'
import QueEsEstaPlataBloque from './QueEsEstaPlataBloque'
import { useQueEsEstaPlata } from './useQueEsEstaPlata'
import { useEliminarTransaccion } from './useEliminarTransaccion'

function isBankLight(b: Billetera): boolean {
  const bank = b.bank_id ? getBankById(b.bank_id) : findBankByNombre(b.nombre)
  return !bank || bank.colorTexto === 'white'
}

export interface TransaccionModalProps {
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


export default function TransaccionModal({
  open, onClose, transaccion, billeteraInicialId, tipoInicial, billeteras, categorias, tarjetas, onSuccess,
}: TransaccionModalProps) {
  const isEdit = !!transaccion
  const isCuotaHija = isEdit && !!transaccion?.es_cuota_hija
  const [state, dispatch] = useReducer(formReducer, initialState)
  const carouselRef = useRef<HTMLDivElement>(null)
  const slidesContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const submittingRef = useRef(false)
  const claveOperacionRef = useRef<string>('')
  const claveQueEsRef = useRef<string>('')

  useEffect(() => {
    if (open) {
      claveOperacionRef.current = nuevaClaveOperacion()
      claveQueEsRef.current = nuevaClaveOperacion()
    }
  }, [open])

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

  const { handleDeleteTransaction } = useEliminarTransaccion({
    transaccion,
    isCuotaHija,
    onSuccess,
    onClose,
  })

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

  const reintegroHook = useReintegro({
    transaccion,
    montoCompra: monto,
    fechaCompra: fecha,
    moneda,
    isEdit,
    onReintegroQuitado: () => onSuccess(transaccion),
  })

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])

  useEffect(() => {
    if (!categoriaId) return
    let active = true
    categoriaService
      .getSubcategorias(categoriaId)
      .then((data) => {
        if (active) setSubcategorias(data)
      })
      .catch(console.error)
    return () => {
      active = false
    }
  }, [categoriaId])

  const subcategoriaNombre = useMemo(() => {
    if (!subcategoriaId) return ''
    const found = subcategorias.find((s) => s.id === subcategoriaId)
    if (found) return found.nombre
    if (transaccion?.subcategoria_id === subcategoriaId && transaccion?.subcategoria?.nombre) {
      return transaccion.subcategoria.nombre
    }
    return ''
  }, [subcategoriaId, subcategorias, transaccion])

  const mostrarQueEsEstaPlata = useMemo(() => {
    if (tipo !== 'ingreso') return false
    const nom = subcategoriaNombre.trim().toLowerCase()
    return nom === 'cobros de personas' || nom === 'pasó por mi cuenta' || nom === 'paso por mi cuenta'
  }, [tipo, subcategoriaNombre])

  const queEsPlataHook = useQueEsEstaPlata({
    subcategoriaNombre: mostrarQueEsEstaPlata ? subcategoriaNombre : null,
    moneda,
    fecha,
    monto: monto ? Number(monto) : null,
  })

  // Secuencia dinámica de pasos según tipo, método de pago y reintegros
  const activeSteps = useMemo(() => {
    return calcularPasosConClaves({
      metodoPago,
      tipo,
      isCuotaHija,
      tieneReintegro: reintegroHook.tieneReintegro,
      esDebitoUsdEnPesos,
    })
  }, [metodoPago, tipo, isCuotaHija, reintegroHook.tieneReintegro, esDebitoUsdEnPesos])

  const currentStepIndex = activeSteps.findIndex(s => s.step === step)
  const isStep3Last = !activeSteps.some(s => s.step > 3)

  const handleToggleReintegroFromStep3 = () => {
    if (!reintegroHook.tieneReintegro) {
      if (!categoriaId) {
        sileo.error({ title: 'Seleccioná una categoría primero' })
        return
      }
      reintegroHook.setTieneReintegro(true)
      dispatch({ type: 'SET_STEP', step: 4, direction: 'forward' })
    } else {
      reintegroHook.setTieneReintegro(false)
    }
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
    }, 100)

    return () => clearTimeout(timer)
  }, [billeteraId, tarjetaId, open, metodoPago])

  useEffect(() => {
    if (slidesContainerRef.current) {
      slidesContainerRef.current.scrollLeft = 0
      slidesContainerRef.current.scrollTop = 0
    }
  }, [step, moneda])

  // Asegurar que si cambian opciones (tipo, método), el paso actual exista en activeSteps
  useEffect(() => {
    if (!open) return
    const isValid = activeSteps.some(s => s.step === step)
    if (!isValid) {
      const fallback = activeSteps[0]?.step ?? 1
      dispatch({ type: 'SET_STEP', step: fallback, direction: 'back' })
    }
  }, [open, activeSteps, step])

  const goNext = () => {
    if (step === 1) {
      if (!monto || Number(monto) <= 0 || !Number.isFinite(Number(monto))) {
        sileo.error({ title: 'El monto debe ser mayor a cero' })
        return
      }
      if (metodoPago === 'credito' ? !tarjetaId : !billeteraId) {
        sileo.error({ title: metodoPago === 'credito' ? 'Seleccioná una tarjeta' : 'Seleccioná una billetera' })
        return
      }
    } else if (step === 2) {
      if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 120) {
        sileo.error({ title: 'La cantidad de cuotas debe ser un número entero entre 1 y 120' })
        return
      }
    } else if (step === 3) {
      if (!categoriaId) {
        sileo.error({ title: 'Seleccioná una categoría' })
        return
      }
    } else if (step === 4) {
      if (reintegroHook.tieneReintegro) {
        const montoReintegro = reintegroHook.montoFinal
        if (!montoReintegro || montoReintegro <= 0) {
          sileo.error({ title: 'Ingresá el monto o porcentaje del reintegro' })
          return
        }
        if (monto && montoReintegro > Number(monto)) {
          sileo.error({ title: 'El reintegro no puede ser mayor al total de la compra' })
          return
        }
      }
    }

    if (currentStepIndex >= 0 && currentStepIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentStepIndex + 1].step
      dispatch({ type: 'SET_STEP', step: nextStep, direction: 'forward' })
    }
  }

  const goBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = activeSteps[currentStepIndex - 1].step
      dispatch({ type: 'SET_STEP', step: prevStep, direction: 'back' })
    }
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

    if (tipo === 'ingreso' && mostrarQueEsEstaPlata) {
      const val = queEsPlataHook.validar()
      if (!val.valido) {
        sileo.error({ title: val.mensaje || 'Completá los datos requeridos' })
        return
      }
    }

    if (tipo === 'egreso' && !isCuotaHija && reintegroHook.tieneReintegro) {
      const montoReintegro = reintegroHook.montoFinal
      if (!montoReintegro || montoReintegro <= 0) {
        sileo.error({ title: 'Ingresá el monto o porcentaje del reintegro' })
        return
      }
      if (monto && montoReintegro > Number(monto)) {
        sileo.error({ title: 'El reintegro no puede ser mayor al total de la compra' })
        return
      }
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
        if (!Number.isFinite(tasaInteres) || tasaInteres < 0 || tasaInteres > 3000) {
          sileo.error({ title: 'La tasa de interés (TNA) debe estar entre 0% y 3000%.' })
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
        savedTx = await transaccionService.createTransaccion(payload, claveOperacionRef.current)
        claveOperacionRef.current = nuevaClaveOperacion()
        if (savedTx && tipo === 'egreso' && !isCuotaHija && reintegroHook.debeGuardarReintegro) {
          try {
            await reintegroHook.guardarReintegro(savedTx.id)
          } catch (err) {
            console.error(err)
            sileo.error({ title: getErrorMessage(err, 'No se pudo guardar el reintegro') })
          }
        }
        if (savedTx && tipo === 'ingreso' && mostrarQueEsEstaPlata) {
          try {
            await queEsPlataHook.responderQueEs(savedTx.id, claveQueEsRef.current)
          } catch (err) {
            console.error(err)
            sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar el motivo del ingreso') })
          }
        }
        sileo.success({
          title: metodoPago === 'credito' ? 'Compra en cuotas registrada' : 'Transacción creada'
        })
        onSuccess(savedTx)
        onClose()
      } else if (transaccion) {
        savedTx = await transaccionService.updateTransaccion(transaccion.id, payload)
        if (savedTx && tipo === 'egreso' && !isCuotaHija && reintegroHook.debeGuardarReintegro) {
          try {
            await reintegroHook.guardarReintegro(transaccion.id)
          } catch (err) {
            console.error(err)
            sileo.error({ title: getErrorMessage(err, 'No se pudo guardar el reintegro') })
          }
        }
        if (savedTx && tipo === 'ingreso' && mostrarQueEsEstaPlata) {
          try {
            await queEsPlataHook.responderQueEs(transaccion.id, claveQueEsRef.current)
          } catch (err) {
            console.error(err)
            sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar el motivo del ingreso') })
          }
        }
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
        {activeSteps.length > 1 && (
          <div className={styles.stepIndicator} aria-hidden="true">
            {activeSteps.map((s) => (
              <div
                key={s.key}
                className={`${styles.dot} ${step === s.step ? styles.dotActive : styles.dotInactive}`}
              />
            ))}
          </div>
        )}

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
            data-modal-frame
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
                        data-modal-delete
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                      <X size={18} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className={styles.formFields} data-modal-stack>
                  {/* Bloque 1: Tipo + Monto */}
                  <div data-modal-block>
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
                      autoFocus={step === 1 && esPunteroFino()}
                      allowDecimals
                    />
                  </div>

                  {/* Bloque 2: Método de Pago (se oculta automáticamente si solo hay 1 método disponible) */}
                  {availableMethods.length > 1 && (
                    <div data-modal-block>
                      <div data-modal-field>
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
                    </div>
                  )}

                  {/* Bloque 3: Origen Dinámico */}
                  <div data-modal-block>
                    <div data-modal-field>
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
                          <div data-modal-carousel>
                            <div data-modal-carousel-track ref={carouselRef}>
                              {tarjetasCarousel.map(t => (
                                <SelectableSurface
                                  key={t.id}
                                  selected={tarjetaId === t.id}
                                  context="modal"
                                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'tarjetaId', value: t.id })}
                                  ref={(el) => setCardNode(t.id, el as HTMLDivElement | null)}
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
                          <div data-modal-carousel>
                            <div data-modal-carousel-track ref={carouselRef}>
                              {billeterasCarousel.map(b => (
                                <SelectableSurface
                                  key={b.id}
                                  selected={billeteraId === b.id}
                                  context="modal"
                                  onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })}
                                  disabled={isCuotaHija}
                                  ref={(el) => setCardNode(b.id, el as HTMLDivElement | null)}
                                  title={`Seleccionar billetera ${b.nombre}`}
                                  aria-label={`Seleccionar billetera ${b.nombre}`}
                                >
                                  <BilleteraCard
                                    billetera={b}
                                    variant="select"
                                    slotBadge={moneda === 'USD' && b.moneda === 'ARS' ? (
                                      <span className={`${styles.cuentaEnPesosChip} ${isBankLight(b) ? '' : styles.cuentaEnPesosChipDark}`}>
                                        Cuenta en pesos
                                      </span>
                                    ) : undefined}
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
              </div>

              <div className={styles.formFooter}>
                {isEdit ? (
                  <button type="button" className={styles.btnDelete} onClick={handleDeleteTransaction} data-modal-delete>
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
              data-modal-frame
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
                  data-modal-block
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
            data-modal-frame
          >
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                if (isStep3Last) {
                  handleSubmit()
                } else {
                  goNext()
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
                        data-modal-delete
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                      <X size={18} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className={styles.formFields} data-modal-stack>
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

                  {/* ¿Qué es esta plata? para ingresos */}
                  {mostrarQueEsEstaPlata && (
                    <QueEsEstaPlataBloque
                      hook={queEsPlataHook}
                      moneda={moneda}
                      categorias={categorias}
                    />
                  )}

                  {/* En egresos: botón switch para habilitar reintegro */}
                  {tipo === 'egreso' && !isCuotaHija && (
                    <ReintegroSwitchCard
                      tieneReintegro={reintegroHook.tieneReintegro}
                      onToggle={handleToggleReintegroFromStep3}
                    />
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {!isStep3Last
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

          {/* ════════════════════ PASO 4: Reintegro ════════════════════ */}
          {tipo === 'egreso' && !isCuotaHija && (
            <ReintegroPaso
              step={step}
              slideDirection={slideDirection}
              isEdit={isEdit}
              isCuotaHija={isCuotaHija}
              isSubmitting={isSubmitting}
              isPendienteIA={isPendienteIA}
              esDebitoUsdEnPesos={esDebitoUsdEnPesos}
              reintegroHook={reintegroHook}
              onGoBack={goBack}
              onGoNext={goNext}
              onSubmit={handleSubmit}
              onClose={onClose}
              onDelete={handleDeleteTransaction}
              onToggleOff={() => {
                dispatch({ type: 'SET_STEP', step: 3, direction: 'back' })
              }}
            />
          )}

          {/* ════════════════════ PASO 5: Resumen de Cobro (Débito USD en pesos) ════════════════════ */}
          {esDebitoUsdEnPesos && (
            <div
              className={`${styles.slide} ${
                step === 5
                  ? styles.slideVisible
                  : slideDirection === 'forward'
                  ? styles.slideEnterRight
                  : styles.slideEnterLeft
              }`}
              data-modal-frame
            >
              {(step === 5 || step === 4) && (
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

                    <div className={styles.formFields} data-modal-stack>
                      <DebitoEnDolares
                        montoUsd={monto}
                        montoPesos={montoPesosDebito}
                        billeteraNombre={billeteraSeleccionada?.nombre}
                        descripcion={descripcion}
                        categoriaNombre={categorias.find(c => c.id === categoriaId)?.nombre}
                        onChangeMontoPesos={(val) => dispatch({ type: 'SET_FIELD', field: 'montoPesosDebito', value: val })}
                        autoFocus={step === 5 && esPunteroFino()}
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
