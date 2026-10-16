import { useState, useEffect, useRef } from 'react'
import transaccionService from '@/services/transaccion.service'

export interface UseDebitoEnDolaresOptions {
  montoUsd: number | null
  enabled: boolean
  onMontoPesosCalculado?: (monto: number | null) => void
}

export function useDebitoEnDolares({
  montoUsd,
  enabled,
  onMontoPesosCalculado,
}: UseDebitoEnDolaresOptions) {
  const [cotizacion, setCotizacion] = useState<number | null>(null)
  const [percepcion, setPercepcion] = useState<number>(30)
  const [montoPesosSugerido, setMontoPesosSugerido] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [sinCotizacion, setSinCotizacion] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const onMontoPesosCalculadoRef = useRef(onMontoPesosCalculado)
  useEffect(() => {
    onMontoPesosCalculadoRef.current = onMontoPesosCalculado
  })

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const timeoutId = setTimeout(async () => {
      if (!enabled || !montoUsd || montoUsd <= 0) {
        setCotizacion(null)
        setMontoPesosSugerido(null)
        setSinCotizacion(false)
        setLoading(false)
        onMontoPesosCalculadoRef.current?.(null)
        return
      }

      setLoading(true)
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const data = await transaccionService.getSugerenciaPesos(montoUsd, controller.signal)
        setPercepcion(data.percepcion ?? 30)

        if (data.cotizacion != null && data.monto_pesos != null) {
          setCotizacion(data.cotizacion)
          setMontoPesosSugerido(data.monto_pesos)
          setSinCotizacion(false)
          onMontoPesosCalculadoRef.current?.(data.monto_pesos)
        } else {
          setCotizacion(null)
          setMontoPesosSugerido(null)
          setSinCotizacion(true)
          onMontoPesosCalculadoRef.current?.(null)
        }
      } catch (err: unknown) {
        const isAbort = err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')
        if (!isAbort) {
          setCotizacion(null)
          setMontoPesosSugerido(null)
          setSinCotizacion(true)
          onMontoPesosCalculadoRef.current?.(null)
        }
      } finally {
        setLoading(false)
      }
    }, (!enabled || !montoUsd || montoUsd <= 0) ? 0 : 400)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [montoUsd, enabled])

  return {
    cotizacion,
    percepcion,
    montoPesosSugerido,
    loading,
    sinCotizacion,
  }
}
