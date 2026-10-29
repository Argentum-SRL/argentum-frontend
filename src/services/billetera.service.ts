import api, { encabezadoClave } from './api'
import type {
  Billetera,
  RendimientoEstimadoResponse,
  ControlSaldoPreview,
  ActualizarSaldoPayload,
  AjustesBilleteraResponse,
  EntidadTasa,
  EstimacionRendimiento,
  PrevisualizarFechaSaldoResponse,
} from '@/types'
import { createUserCache } from '@/utils/sessionCleanup'

// Cache storage con validación automática por usuario autenticado
const BILLETERAS_TTL = 30 * 1000 // 30 seconds for wallets
const billeterasCache = createUserCache<Billetera[]>(BILLETERAS_TTL)
let billeterasPromise: Promise<Billetera[]> | null = null

/**
 * Invalidates the wallets cache.
 * Exported to allow manual invalidation if needed.
 */
export const invalidateBilleteras = () => {
  billeterasCache.clear()
  billeterasPromise = null
}

const billeteraService = {
  list: async (signal?: AbortSignal): Promise<Billetera[]> => {
    // If there's a request in progress, reuse the promise
    if (billeterasPromise) return billeterasPromise

    // If cache is valid for current user, return cached data
    const cached = billeterasCache.get()
    if (cached) {
      return cached
    }

    // Otherwise, fetch and store in cache
    billeterasPromise = (async () => {
      try {
        const { data } = await api.get<Billetera[]>('/billeteras', { signal })
        billeterasCache.set(data)
        return data
      } finally {
        billeterasPromise = null
      }
    })()

    return billeterasPromise
  },

  getById: async (id: string, signal?: AbortSignal): Promise<Billetera> => {
    const { data } = await api.get<Billetera>(`/billeteras/${id}`, { signal })
    return data
  },

  getEntidades: async (signal?: AbortSignal): Promise<EntidadTasa[]> => {
    const { data } = await api.get<EntidadTasa[]>('/billeteras/entidades', { signal })
    return data
  },

  estimarRendimiento: async (
    params: { saldo: number; entidad_id?: string | null; nivel?: string | null; tna?: number | null },
    signal?: AbortSignal
  ): Promise<EstimacionRendimiento> => {
    const { data } = await api.get<EstimacionRendimiento>('/billeteras/estimar-rendimiento', {
      params,
      signal,
    })
    return data
  },

  create: async (payload: {
    nombre: string
    moneda: string
    saldo_inicial?: number
    es_principal?: boolean
    es_efectivo?: boolean
    es_inversion?: boolean
    tna?: number | null
    bank_id?: string | null
    fecha_saldo?: string | null
  }) => {
    const { data } = await api.post<Billetera>('/billeteras', payload)
    invalidateBilleteras()
    return data
  },

  update: async (
    id: string,
    payload: {
      nombre?: string
      moneda?: string
      es_principal?: boolean
      es_efectivo?: boolean
      es_inversion?: boolean
      tna?: number | null
      estado?: string
      bank_id?: string | null
      nivel_tasa?: string | null
    }
  ) => {
    const { data } = await api.put<Billetera>(`/billeteras/${id}`, payload)
    invalidateBilleteras()
    return data
  },

  getRendimientoEstimado: async (id: string, signal?: AbortSignal): Promise<RendimientoEstimadoResponse> => {
    const { data } = await api.get<RendimientoEstimadoResponse>(`/billeteras/${id}/rendimiento-estimado`, { signal })
    return data
  },

  confirmarRendimiento: async (id: string, payload: { monto: number; fecha?: string }, clave?: string): Promise<Billetera> => {
    const { data } = await api.post<Billetera>(`/billeteras/${id}/rendimiento`, payload, encabezadoClave(clave))
    invalidateBilleteras()
    return data
  },


  getControlSaldo: async (billeteraId: string, saldo: number, signal?: AbortSignal): Promise<ControlSaldoPreview> => {
    const { data } = await api.get<ControlSaldoPreview>(`/billeteras/${billeteraId}/control-saldo`, {
      params: { saldo },
      signal,
    })
    return data
  },

  actualizarSaldo: async (billeteraId: string, payload: ActualizarSaldoPayload, clave?: string): Promise<Billetera> => {
    const { data } = await api.post<Billetera>(`/billeteras/${billeteraId}/ajustes`, payload, encabezadoClave(clave))
    invalidateBilleteras()
    return data
  },

  getAjustes: async (billeteraId: string, signal?: AbortSignal): Promise<AjustesBilleteraResponse> => {
    const { data } = await api.get<AjustesBilleteraResponse>(`/billeteras/${billeteraId}/ajustes`, { signal })
    return data
  },

  eliminarAjuste: async (billeteraId: string, ajusteId: string): Promise<boolean> => {
    await api.delete(`/billeteras/${billeteraId}/ajustes/${ajusteId}`)
    invalidateBilleteras()
    return true
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
  },

  previsualizarFechaSaldo: async (
    id: string,
    fecha_saldo: string,
    signal?: AbortSignal
  ): Promise<PrevisualizarFechaSaldoResponse> => {
    const { data } = await api.post<PrevisualizarFechaSaldoResponse>(
      `/billeteras/${id}/fecha-saldo/previsualizar`,
      { fecha_saldo },
      { signal }
    )
    return data
  },

  cambiarFechaSaldo: async (
    id: string,
    fecha_saldo: string
  ): Promise<Billetera> => {
    const { data } = await api.patch<Billetera>(
      `/billeteras/${id}/fecha-saldo`,
      { fecha_saldo }
    )
    invalidateBilleteras()
    return data
  },

  getPreguntaSaldo: async (signal?: AbortSignal): Promise<{ billetera: Billetera | null }> => {
    const { data } = await api.get<{ billetera: Billetera | null }>('/billeteras/pregunta-saldo', { signal })
    return data
  },

  saltearPreguntaSaldo: async (id: string): Promise<void> => {
    await api.post(`/billeteras/${id}/pregunta-saldo/saltear`)
  }
}

export default billeteraService

