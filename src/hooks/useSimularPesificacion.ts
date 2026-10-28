import tarjetaService from '@/services/tarjeta.service'
import type { SimularPesificacionResponse } from '@/types'
import { useSimulacionBackend } from './useSimulacionBackend'

export interface UseSimularPesificacionOptions {
  tarjetaId?: string | null
  fechaResumen?: string
  montoUsd?: number | null
  cotizacion?: number | null
  montoPesos?: number | null
  montoPercepcion?: number | null
  enabled?: boolean
}

export function useSimularPesificacion({
  tarjetaId,
  fechaResumen,
  montoUsd,
  cotizacion,
  montoPesos,
  montoPercepcion,
  enabled = true,
}: UseSimularPesificacionOptions) {
  const esInvalido =
    !enabled ||
    !tarjetaId ||
    montoUsd === undefined ||
    montoUsd === null ||
    montoUsd <= 0

  const cotizacionValida = cotizacion !== undefined && cotizacion !== null && cotizacion > 0 ? cotizacion : undefined
  const montoPesosValido = montoPesos !== undefined && montoPesos !== null && montoPesos > 0 ? montoPesos : undefined
  const montoPercepcionValido =
    montoPercepcion !== undefined && montoPercepcion !== null && montoPercepcion >= 0
      ? montoPercepcion
      : undefined

  const clave = esInvalido
    ? null
    : `${tarjetaId}:${fechaResumen ?? ''}:${montoUsd}:${cotizacionValida ?? ''}:${montoPesosValido ?? ''}:${montoPercepcionValido ?? ''}`

  const { datos: simulacion, cargando, error } = useSimulacionBackend<SimularPesificacionResponse>(
    clave,
    (signal) =>
      tarjetaService.simularPesificacion(
        tarjetaId as string,
        fechaResumen,
        montoUsd as number,
        cotizacionValida,
        montoPesosValido,
        montoPercepcionValido,
        signal
      )
  )

  return {
    simulacion,
    cargando,
    error,
  }
}

export default useSimularPesificacion

