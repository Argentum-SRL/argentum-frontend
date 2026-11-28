import api from './api'
import type { PerfilResumen } from '@/types'

export const getPerfilFinanciero = async (signal?: AbortSignal): Promise<PerfilResumen> => {
  const { data } = await api.get<PerfilResumen>('/api/v1/perfil-financiero', { signal })
  return data
}
