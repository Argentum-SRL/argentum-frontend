import api from './api'
import type { Billetera } from '@/types'

// Cache storage
let billeterasCache: { data: Billetera[]; timestamp: number } | null = null
let billeterasPromise: Promise<Billetera[]> | null = null
const BILLETERAS_TTL = 30 * 1000 // 30 seconds for wallets

/**
 * Invalidates the wallets cache.
 * Exported to allow manual invalidation if needed.
 */
export const invalidateBilleteras = () => {
  billeterasCache = null
}

const billeteraService = {
  list: async (): Promise<Billetera[]> => {
    // If there's a request in progress, reuse the promise
    if (billeterasPromise) return billeterasPromise

    // If cache is valid, return cached data
    if (billeterasCache && Date.now() - billeterasCache.timestamp < BILLETERAS_TTL) {
      return billeterasCache.data
    }

    // Otherwise, fetch and store in cache
    billeterasPromise = (async () => {
      try {
        const { data } = await api.get<Billetera[]>('/billeteras')
        billeterasCache = { data, timestamp: Date.now() }
        return data
      } finally {
        billeterasPromise = null
      }
    })()

    return billeterasPromise
  },

  getById: async (id: string): Promise<Billetera> => {
    const { data } = await api.get<Billetera>(`/billeteras/${id}`)
    return data
  },

  create: async (payload: { nombre: string; moneda: string; saldo_inicial?: number; es_principal?: boolean; es_efectivo?: boolean; bank_id?: string | null }) => {
    const { data } = await api.post<Billetera>('/billeteras', payload)
    invalidateBilleteras()
    return data
  },

  update: async (id: string, payload: { nombre?: string; moneda?: string; saldo_inicial?: number; es_principal?: boolean; estado?: string }) => {
    const { data } = await api.put<Billetera>(`/billeteras/${id}`, payload)
    invalidateBilleteras()
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/billeteras/${id}`)
    invalidateBilleteras()
    return true
  },

  archivar: async (id: string) => {
    const { data } = await api.post<Billetera>(`/billeteras/${id}/archivar`)
    invalidateBilleteras()
    return data
  },

  desarchivar: async (id: string) => {
    const { data } = await api.post<Billetera>(`/billeteras/${id}/desarchivar`)
    invalidateBilleteras()
    return data
  }
}

export default billeteraService
