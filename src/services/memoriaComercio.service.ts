import api from './api'
import type {
  MemoriaSugerenciaResponse,
  MemoriaComercioGuardarPayload,
  MemoriaComercioGuardarResponse,
  MemoriaComercioAplicarPayload,
  MemoriaComercioAplicarResponse,
} from '@/types'

const memoriaComercioService = {
  getSugerencia: async (
    descripcion: string,
    tipo: 'egreso' | 'ingreso',
    signal?: AbortSignal
  ): Promise<MemoriaSugerenciaResponse> => {
    const { data } = await api.get<MemoriaSugerenciaResponse>('/memoria-comercios/sugerencia', {
      params: { descripcion, tipo },
      signal,
    })
    return data
  },

  guardar: async (
    payload: MemoriaComercioGuardarPayload,
    signal?: AbortSignal
  ): Promise<MemoriaComercioGuardarResponse> => {
    const { data } = await api.post<MemoriaComercioGuardarResponse>('/memoria-comercios', payload, { signal })
    return data
  },

  aplicar: async (
    payload: MemoriaComercioAplicarPayload,
    signal?: AbortSignal
  ): Promise<MemoriaComercioAplicarResponse> => {
    const { data } = await api.post<MemoriaComercioAplicarResponse>('/memoria-comercios/aplicar', payload, { signal })
    return data
  },
}

export default memoriaComercioService
