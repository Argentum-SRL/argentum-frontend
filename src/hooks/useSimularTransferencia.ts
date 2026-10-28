import transferenciaService from '@/services/transferencia.service'
import type { SimularTransferenciaResponse } from '@/types'
import { useSimulacionBackend } from './useSimulacionBackend'

export interface UseSimularTransferenciaOptions {
  monto: number | null | undefined
  cotizacion: number | null | undefined
  monedaOrigen: 'ARS' | 'USD' | null | undefined
  monedaDestino: 'ARS' | 'USD' | null | undefined
  enabled?: boolean
}

export function useSimularTransferencia({
  monto,
  cotizacion,
  monedaOrigen,
  monedaDestino,
  enabled = true,
}: UseSimularTransferenciaOptions) {
  const esInvalido =
    !enabled ||
    monto === undefined ||
    monto === null ||
    monto <= 0 ||
    cotizacion === undefined ||
    cotizacion === null ||
    cotizacion <= 0 ||
    !monedaOrigen ||
    !monedaDestino ||
    monedaOrigen === monedaDestino

  const clave = esInvalido
    ? null
    : `${monto}:${cotizacion}:${monedaOrigen}:${monedaDestino}`

  const { datos: simulacion, cargando, error } = useSimulacionBackend<SimularTransferenciaResponse>(
    clave,
    (signal) =>
      transferenciaService.simularTransferencia(
        {
          monto: monto as number,
          cotizacion: cotizacion as number,
          moneda_origen: monedaOrigen as 'ARS' | 'USD',
          moneda_destino: monedaDestino as 'ARS' | 'USD',
        },
        signal
      )
  )

  return {
    simulacion,
    cargando,
    error,
  }
}

export default useSimularTransferencia

