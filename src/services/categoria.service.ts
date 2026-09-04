import api from './api'
import type { Categoria, Subcategoria } from '@/types'
import { createUserCache } from '@/utils/sessionCleanup'

const CATEGORIES_TTL = 5 * 60 * 1000 // 5 minutes, as they rarely change
const categoriesCache = createUserCache<Categoria[]>(CATEGORIES_TTL)
let categoriesPromise: Promise<Categoria[]> | null = null

export const invalidateCategorias = () => {
  categoriesCache.clear()
  categoriesPromise = null
}

const categoriaService = {
  getCategorias: async () => {
    if (categoriesPromise) return categoriesPromise

    const cached = categoriesCache.get()
    if (cached) {
      return cached
    }

    categoriesPromise = (async () => {
      try {
        const response = await api.get<Categoria[]>('/categorias')
        categoriesCache.set(response.data)
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
