import type { Transaccion, Billetera } from '@/types'

export type PasoNumero = 1 | 2 | 3 | 4 | 5

export interface ParametrosPasos {
  metodoPago: 'debito' | 'efectivo' | 'credito' | 'transferencia'
  tipo: 'ingreso' | 'egreso'
  isCuotaHija?: boolean
  tieneReintegro?: boolean
  esDebitoUsdEnPesos?: boolean
}

export interface PasoItem {
  step: PasoNumero
  key: string
}

export const PASO_KEYS: Record<number, string> = {
  1: 'origen',
  2: 'cuotas',
  3: 'detalles',
  4: 'reintegro',
  5: 'usd_debito',
}

/**
 * Función pura que calcula la secuencia ordenada de números de paso activos
 * según método de pago, tipo, condición de cuota hija, reintegro y débito USD en pesos.
 */
export function calcularPasos({
  metodoPago,
  tipo,
  isCuotaHija = false,
  tieneReintegro = false,
  esDebitoUsdEnPesos = false,
}: ParametrosPasos): number[] {
  const pasos: number[] = [1]
  if (metodoPago === 'credito') {
    pasos.push(2)
  }
  pasos.push(3)
  if (tipo === 'egreso' && !isCuotaHija && tieneReintegro) {
    pasos.push(4)
  }
  if (esDebitoUsdEnPesos) {
    pasos.push(5)
  }
  return pasos
}

export function calcularPasosConClaves(params: ParametrosPasos): PasoItem[] {
  const pasos = calcularPasos(params)
  return pasos.map((s) => ({
    step: s as PasoNumero,
    key: PASO_KEYS[s] || `step_${s}`,
  }))
}

export interface FormState {
  step: 1 | 2 | 3 | 4 | 5
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

export type FormAction =
  | {
      type: 'RESET'
      transaccion: Transaccion | null
      billeteras: Billetera[]
      billeteraInicialId?: string
      tipoInicial?: 'egreso' | 'ingreso'
    }
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 | 5; direction: 'forward' | 'back' }
  | { [K in keyof FormState]: { type: 'SET_FIELD'; field: K; value: FormState[K] } }[keyof FormState]

export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const initialState: FormState = {
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
  cantidadCuotas: 1,
  cuotaInicial: 1,
  proximoResumen: false,
  tasaInteres: 0,
  isSubmitting: false,
  montoPesosDebito: null,
}

export function sortBilleterasLocal(
  billeteras: Billetera[],
  monedaUsuarioFallback: string = 'ARS'
): Billetera[] {
  if (!billeteras || billeteras.length <= 1) return billeteras ? [...billeteras] : []
  const principal = billeteras.find((b) => b.es_principal)
  const monedaBase = principal?.moneda ?? monedaUsuarioFallback

  return [...billeteras].sort((a, b) => {
    if (a.es_principal && !b.es_principal) return -1
    if (!a.es_principal && b.es_principal) return 1

    const aPrioridad = a.moneda === monedaBase ? 0 : 1
    const bPrioridad = b.moneda === monedaBase ? 0 : 1
    if (aPrioridad !== bPrioridad) {
      return aPrioridad - bPrioridad
    }
    if (a.moneda !== b.moneda) {
      return a.moneda.localeCompare(b.moneda)
    }

    const saldoA = Number(a.saldo_actual) || 0
    const saldoB = Number(b.saldo_actual) || 0
    const diffSaldo = saldoB - saldoA
    if (diffSaldo !== 0) {
      return diffSaldo
    }

    return a.nombre.localeCompare(b.nombre)
  })
}

export function formReducer(state: FormState, action: FormAction): FormState {
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
        const sorted = sortBilleterasLocal(activas)

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
