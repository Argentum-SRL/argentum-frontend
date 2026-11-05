import api from './api'
import type { Consejo, RespuestaConsejo } from '@/types'

export const consejosService = {
  getActual: async (signal?: AbortSignal): Promise<{ consejo: Consejo | null }> => {
    const { data } = await api.get<{ consejo: Consejo | null }>('/consejos/actual', { signal })
    return data
  },

  responder: async (id: string, respuesta: RespuestaConsejo): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>(`/consejos/${id}/respuesta`, { respuesta })
    return data
  },
}

export default consejosService

