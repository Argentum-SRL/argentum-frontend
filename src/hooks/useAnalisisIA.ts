import { useState, useEffect, useCallback } from 'react'
import type { AnalisisIA, TipoAnalisis, ExportacionResponse } from '@/types'
import { generarAnalisis as apiGenerar, obtenerHistorial as apiHistorial, exportarTexto as apiExportar } from '@/services/analisisIA.service'

export function useAnalisisIA() {
  const [historial, setHistorial] = useState<AnalisisIA[]>([])
  const [analisisActual, setAnalisisActual] = useState<AnalisisIA | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [cargandoExport, setCargandoExport] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const parseError = (err: unknown): string => {
    const axiosErr = err as {
      response?: {
        status?: number;
        data?: {
          detail?: {
            code?: string;
            message?: string;
          } | string;
        };
      };
    }
    const detail = axiosErr.response?.data?.detail
    if (axiosErr.response?.status === 422) {
      if (typeof detail === 'object' && detail?.code === 'DATOS_INSUFICIENTES') {
        return 'Necesitás al menos 2 ciclos completos registrados para generar un análisis.'
      }
      if (typeof detail === 'string' && detail.includes('DATOS_INSUFICIENTES')) {
        return 'Necesitás al menos 2 ciclos completos registrados para generar un análisis.'
      }
    }
    return 'Ocurrió un error. Intentá de nuevo.'
  }

  const cargarHistorial = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await apiHistorial()
      setHistorial(data)
    } catch (err) {
      setError(parseError(err))
    } finally {
      setCargando(false)
    }
  }, [])

  const generarAnalisis = useCallback(async (tipo: TipoAnalisis, ciclos: number) => {
    setCargando(true)
    setError(null)
    try {
      const nuevo = await apiGenerar({ tipo_analisis: tipo, ciclos })
      setHistorial(prev => [nuevo, ...prev.filter(item => item.id !== nuevo.id)])
      setAnalisisActual(nuevo)
      return nuevo
    } catch (err) {
      setError(parseError(err))
      throw err
    } finally {
      setCargando(false)
    }
  }, [])

  const exportar = useCallback(async (ciclos?: number): Promise<ExportacionResponse | null> => {
    setCargandoExport(true)
    setError(null)
    try {
      const res = await apiExportar(ciclos)
      return res
    } catch (err) {
      setError(parseError(err))
      return null
    } finally {
      setCargandoExport(false)
    }
  }, [])

  const seleccionar = useCallback((analisis: AnalisisIA) => {
    setAnalisisActual(analisis)
  }, [])

  const limpiarError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) {
        void cargarHistorial()
      }
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [cargarHistorial])

  return {
    historial,
    analisisActual,
    cargando,
    cargandoExport,
    error,
    cargarHistorial,
    generarAnalisis,
    exportar,
    seleccionar,
    limpiarError
  }
}
