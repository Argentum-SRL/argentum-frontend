import { useState, useEffect, useRef } from 'react'

export interface UseSimulacionBackendResult<T> {
  datos: T | null
  cargando: boolean
  error: Error | null
}

/**
 * Hook genérico para simulaciones con el backend con debounce de 400ms.
 * Garantiza que nunca se muestren datos o errores viejos de claves anteriores.
 */
export function useSimulacionBackend<T>(
  clave: string | null,
  pedir: (signal: AbortSignal) => Promise<T>
): UseSimulacionBackendResult<T> {
  const pedirRef = useRef(pedir)
  useEffect(() => {
    pedirRef.current = pedir
  })

  const [estado, setEstado] = useState<{
    clave: string | null
    datos: T | null
    error: Error | null
  }>({
    clave: null,
    datos: null,
    error: null,
  })

  useEffect(() => {
    if (!clave) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await pedirRef.current(controller.signal)
        if (!controller.signal.aborted) {
          setEstado({ clave, datos: res, error: null })
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        const error = err instanceof Error ? err : new Error(String(err))
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return
        }
        setEstado({ clave, datos: null, error })
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [clave])

  const esMismaClave = clave !== null && estado.clave === clave

  return {
    datos: esMismaClave ? estado.datos : null,
    cargando: clave !== null ? !esMismaClave : false,
    error: esMismaClave ? estado.error : null,
  }
}
