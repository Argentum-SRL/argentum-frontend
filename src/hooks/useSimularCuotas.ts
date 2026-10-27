import { useState, useEffect, useRef } from 'react'
import grupoCuotasService from '@/services/grupoCuotas.service'
import type { SimularCuotasResponse } from '@/types'

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
  const [simulacion, setSimulacion] = useState<SimularCuotasResponse | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const reqIdRef = useRef(0)

  const cantidadesKey = cantidades && cantidades.length > 0 ? cantidades.join(',') : ''

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const currentReqId = ++reqIdRef.current
    const esInvalido = !enabled || !montoTotal || montoTotal <= 0 || !cantidadesKey

    const timeoutId = setTimeout(async () => {
      if (esInvalido) {
        setSimulacion(null)
        setCargando(false)
        setError(null)
        return
      }

      setCargando(true)
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const cantidadesList = cantidadesKey.split(',').map(Number)
        const data = await grupoCuotasService.simularCuotas(
          {
            monto_total: montoTotal,
            cantidades: cantidadesList,
            tasa_tna: tasaTna !== undefined && tasaTna !== null && tasaTna > 0 ? tasaTna : null,
            precio_contado: precioContado !== undefined && precioContado !== null && precioContado > 0 ? precioContado : null,
          },
          controller.signal
        )

        // Evitar que una respuesta vieja pise a una nueva
        if (currentReqId === reqIdRef.current) {
          setSimulacion(data)
          setError(null)
          setCargando(false)
        }
      } catch (err: unknown) {
        const isAbort =
          err instanceof Error &&
          (err.name === 'CanceledError' || err.name === 'AbortError' || err.message === 'canceled')

        if (!isAbort && currentReqId === reqIdRef.current) {
          setSimulacion(null)
          setError(err instanceof Error ? err : new Error(String(err)))
          setCargando(false)
        }
      }
    }, esInvalido ? 0 : 400)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [montoTotal, cantidadesKey, tasaTna, precioContado, enabled])

  return {
    simulacion,
    cargando,
    error,
  }
}

export default useSimularCuotas
