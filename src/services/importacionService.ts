import api from './api'
import type {
  ProcesarResumenResponse,
  PreviewImportacionResponse,
  ConfirmarImportacionRequest,
  ConfirmarImportacionResponse,
} from '@/types'

const importacionService = {
  procesarResumen: async (archivo: File): Promise<ProcesarResumenResponse> => {
    const formData = new FormData()
    formData.append('archivo', archivo)
    const { data } = await api.post<{ success: boolean; data: ProcesarResumenResponse }>(
      '/importacion/procesar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 90000, // Timeout específico de 90 segundos para LLM
      }
    )
    return data.data
  },

  obtenerPreview: async (importacionId: string, tarjetaId?: string): Promise<PreviewImportacionResponse> => {
    const { data } = await api.get<{ success: boolean; data: PreviewImportacionResponse }>(
      `/importacion/${importacionId}/preview`,
      {
        params: tarjetaId ? { tarjeta_id: tarjetaId } : undefined,
      }
    )
    return data.data
  },

  confirmarImportacion: async (
    importacionId: string,
    payload: ConfirmarImportacionRequest
  ): Promise<ConfirmarImportacionResponse> => {
    const { data } = await api.post<{ success: boolean; data: ConfirmarImportacionResponse }>(
      `/importacion/${importacionId}/confirmar`,
      payload
    )
    return data.data
  },
}

export default importacionService
