import api from './api'

const billeteraService = {
  list: async () => {
    const { data } = await api.get('/billeteras')
    return data
  },

  create: async (payload: { nombre: string; moneda: string; saldo_inicial?: number; es_principal?: boolean; es_efectivo?: boolean; bank_id?: string | null }) => {
    const { data } = await api.post('/billeteras', payload)
    return data
  },

  update: async (id: string, payload: { nombre?: string; moneda?: string; saldo_inicial?: number; es_principal?: boolean; estado?: string }) => {
    const { data } = await api.put(`/billeteras/${id}`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/billeteras/${id}`)
    return true
  },

  archivar: async (id: string) => {
    const { data } = await api.post(`/billeteras/${id}/archivar`)
    return data
  },

  desarchivar: async (id: string) => {
    const { data } = await api.post(`/billeteras/${id}/desarchivar`)
    return data
  }
}

export default billeteraService

