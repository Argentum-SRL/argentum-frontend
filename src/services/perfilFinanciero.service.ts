import api from './api'
import type { PerfilFinancieroConInterpretaciones } from '@/types'

export const getPerfilFinanciero = async (signal?: AbortSignal): Promise<PerfilFinancieroConInterpretaciones> => {
  const { data } = await api.get<PerfilFinancieroConInterpretaciones>('/api/v1/perfil-financiero', { signal })
  return data
}

export const recalcularPerfilFinanciero = async (): Promise<PerfilFinancieroConInterpretaciones> => {
  const { data } = await api.post<PerfilFinancieroConInterpretaciones>('/api/v1/perfil-financiero/recalcular')
  return data
}
