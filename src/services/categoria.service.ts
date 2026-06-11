import api from './api'
import type { Categoria, Subcategoria } from '@/types'

let categoriesCache: { data: Categoria[]; timestamp: number } | null = null
let categoriesPromise: Promise<Categoria[]> | null = null
const CATEGORIES_TTL = 5 * 60 * 1000 // 5 minutes, as they rarely change

export const invalidateCategorias = () => {
  categoriesCache = null
}

const categoriaService = {
  getCategorias: async () => {
    if (categoriesPromise) return categoriesPromise

    if (categoriesCache && Date.now() - categoriesCache.timestamp < CATEGORIES_TTL) {
      return categoriesCache.data
    }

    categoriesPromise = (async () => {
      try {
        const response = await api.get<Categoria[]>('/categorias')
        categoriesCache = { data: response.data, timestamp: Date.now() }
        return response.data
      } finally {
        categoriesPromise = null
      }
    })()

    return categoriesPromise
  },

  getSubcategorias: async (categoriaId: string, signal?: AbortSignal) => {
    const response = await api.get<Subcategoria[]>(`/categorias/${categoriaId}/subcategorias`, { signal })
    return response.data
  },

  getAllSubcategorias: async (signal?: AbortSignal) => {
    const response = await api.get<Subcategoria[]>('/categorias/subcategorias', { signal })
    return response.data
  }
}

export default categoriaService
