import grupoCuotasService from '@/services/grupoCuotas.service'
import type { SimularCuotasResponse } from '@/types'
import { useSimulacionBackend } from './useSimulacionBackend'

export interface UseSimularCuotasOptions {
  montoTotal: number | null | undefined
  cantidades: number[]
  tasaTna?: number | null | undefined
  precioContado?: number | null | undefined
  enabled?: boolean
}

export function useSimularCuotas({
  montoTotal,
  cantidades,
  tasaTna,
  precioContado,
  enabled = true,
}: UseSimularCuotasOptions) {
  const cantidadesKey = cantidades && cantidades.length > 0 ? cantidades.join(',') : ''
  const esInvalido = !enabled || !montoTotal || montoTotal <= 0 || !cantidadesKey

  const clave = esInvalido
    ? null
    : `${montoTotal}:${cantidadesKey}:${tasaTna ?? ''}:${precioContado ?? ''}`

  const { datos: simulacion, cargando, error } = useSimulacionBackend<SimularCuotasResponse>(
    clave,
    (signal) =>
      grupoCuotasService.simularCuotas(
        {
          monto_total: montoTotal as number,
          cantidades,
          tasa_tna: tasaTna !== undefined && tasaTna !== null && tasaTna > 0 ? tasaTna : null,
          precio_contado:
            precioContado !== undefined && precioContado !== null && precioContado > 0
              ? precioContado
              : null,
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

export default useSimularCuotas
