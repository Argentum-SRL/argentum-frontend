import { useState, useEffect } from 'react'
import tarjetaService from '@/services/tarjeta.service'
import type { ResumenDeCompraResponse } from '@/types'

export function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const parts = fechaIso.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
}

export function useResumenDeCompra(
  tarjetaId?: string | null,
  fecha?: string | null,
  proximoResumen: boolean = false
) {
  const [state, setState] = useState<{
    key: string
    resumen: ResumenDeCompraResponse | null
    error: boolean
  }>({
    key: '',
    resumen: null,
    error: false,
  })

  const queryKey = tarjetaId && fecha ? `${tarjetaId}:${fecha}:${proximoResumen}` : ''

  useEffect(() => {
    if (!queryKey || !tarjetaId || !fecha) {
      return
    }

    const controller = new AbortController()

    tarjetaService
      .getResumenDeCompra(tarjetaId, fecha, proximoResumen, controller.signal)
      .then((data) => {
        setState({
          key: queryKey,
          resumen: data,
          error: false,
        })
      })
      .catch((err) => {
        // Ignorar cancelaciones por cambios rápidos
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
          return
        }
        setState({
          key: queryKey,
          resumen: null,
          error: true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [queryKey, tarjetaId, fecha, proximoResumen])

  const tieneParametros = Boolean(queryKey)
  const loading = tieneParametros && state.key !== queryKey
  const resumen = tieneParametros && state.key === queryKey ? state.resumen : null
  const error = tieneParametros && state.key === queryKey ? state.error : false

  return { resumen, loading, error }
}

export default useResumenDeCompra
