import { montoDesdePorcentaje } from './ayudasEscritura'

export interface EntradaArmarPayloadReintegro {
  tieneReintegro: boolean
  teniaReintegroInicial: boolean
  isCompraRecibidaInicial: boolean
  modoMonto: 'monto' | 'porcentaje' | 'todo'
  montoManual: number | null
  porcentaje: number | null
  montoCompra: number | null
  yaRecibido: boolean
  isEdit: boolean
  fechaCompra: string
  fechaRecibido: string
  hoy: string
}

export type ResultadoArmarPayloadReintegro =
  | { accion: 'quitar' }
  | { accion: 'nada' }
  | {
      accion: 'guardar'
      payload: {
        monto: number
        recibido: boolean
        fecha_recibido?: string
      }
    }

/**
 * Determina la acción a tomar y construye el payload para el reintegro de una transacción.
 * Esta función pura replica las reglas de negocio del formulario sin dependencias de React ni servicios.
 */
export function armarPayloadReintegro(
  entrada: EntradaArmarPayloadReintegro
): ResultadoArmarPayloadReintegro {
  const {
    tieneReintegro,
    teniaReintegroInicial,
    isCompraRecibidaInicial,
    modoMonto,
    montoManual,
    porcentaje,
    montoCompra,
    yaRecibido,
    isEdit,
    fechaCompra,
    fechaRecibido,
    hoy,
  } = entrada

  if (!tieneReintegro) {
    if (teniaReintegroInicial) {
      return { accion: 'quitar' }
    }
    return { accion: 'nada' }
  }

  // Si ya era una compra recibida y no se quitó, permanece intacto
  if (isCompraRecibidaInicial) {
    return { accion: 'nada' }
  }

  const monto =
    modoMonto === 'todo'
      ? montoCompra
      : modoMonto === 'monto'
        ? montoManual
        : montoCompra && porcentaje && porcentaje > 0
          ? montoDesdePorcentaje(montoCompra, porcentaje)
          : null

  if (!monto || monto <= 0) {
    return { accion: 'nada' }
  }

  let fRecibido: string | undefined = undefined
  if (yaRecibido) {
    if (!isEdit) {
      // Al CREAR con "Sí": fecha_recibido = fecha de la compra (no se muestra campo de fecha)
      fRecibido = fechaCompra
    } else {
      // Al EDITAR una compra pendiente y elegir "Sí": fecha_recibido del DateInput
      fRecibido = fechaRecibido || hoy
    }
  }

  const payload: {
    monto: number
    recibido: boolean
    fecha_recibido?: string
  } = {
    monto,
    recibido: yaRecibido,
  }

  if (fRecibido !== undefined) {
    payload.fecha_recibido = fRecibido
  }

  return {
    accion: 'guardar',
    payload,
  }
}

