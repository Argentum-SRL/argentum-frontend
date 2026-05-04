import api from './api'
import type { Transaccion } from '@/types'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'

export interface TransaccionFilters {
  billetera_id?: string
  tipo?: 'ingreso' | 'egreso'
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  subcategoria_id?: string
  moneda?: string
  estado_verificacion?: string
  busqueda?: string
  es_cuota_hija?: boolean
  skip?: number
  limit?: number
}

const transaccionService = {
  getTransacciones: async (filters: TransaccionFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    const response = await api.get<Transaccion[]>(`/transacciones?${params.toString()}`)
    return response.data
  },

  getTransaccion: async (id: string) => {
    const response = await api.get<Transaccion>(`/transacciones/${id}`)
    return response.data
  },

  getPendientesIA: async () => {
    const response = await api.get<Transaccion[]>('/transacciones/pendientes')
    return response.data
  },

  createTransaccion: async (data: Partial<Transaccion>) => {
    const response = await api.post<Transaccion>('/transacciones', data)
    invalidateBilleteras()
    invalidateResumen()
    return response.data
  },

  updateTransaccion: async (id: string, data: Partial<Transaccion>) => {
    const response = await api.patch<Transaccion>(`/transacciones/${id}`, data)
    invalidateBilleteras()
    invalidateResumen()
    return response.data
  },

  deleteTransaccion: async (id: string) => {
    await api.delete(`/transacciones/${id}`)
    invalidateBilleteras()
    invalidateResumen()
  },

  confirmarIA: async (id: string) => {
    const response = await api.post<Transaccion>(`/transacciones/${id}/confirmar`)
    invalidateBilleteras()
    invalidateResumen()
    return response.data
  }
}

export default transaccionService
