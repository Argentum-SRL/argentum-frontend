import api from './api'
import type { AnalisisIA, GenerarAnalisisParams, ExportacionResponse } from '@/types'

export const generarAnalisis = async (params: GenerarAnalisisParams): Promise<AnalisisIA> => {
  const { data } = await api.post<AnalisisIA>('/analisis-ia/generar', params)
  return data
}

export const obtenerHistorial = async (limit?: number): Promise<AnalisisIA[]> => {
  const { data } = await api.get<AnalisisIA[]>('/analisis-ia/historial', {
    params: limit !== undefined ? { limit } : undefined
  })
  return data
}

export const obtenerPorId = async (id: string): Promise<AnalisisIA> => {
  const { data } = await api.get<AnalisisIA>(`/analisis-ia/${id}`)
  return data
}

export const exportarTexto = async (ciclos?: number): Promise<ExportacionResponse> => {
  const { data } = await api.get<ExportacionResponse>('/analisis-ia/exportar/texto', {
    params: ciclos !== undefined ? { ciclos } : undefined
  })
  return data
}

const analisisIAService = {
  generarAnalisis,
  obtenerHistorial,
  obtenerPorId,
  exportarTexto
}

export default analisisIAService
