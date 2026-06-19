import axios from 'axios'
import { logoutGlobal } from '../utils/browserHistory'



// Estado en memoria como fallback temporal durante la transición
let _tokenMemory: string | null = null
let _refreshMemory: string | null = null

export const getToken = (): string | null => {
  // Intentar localStorage por compatibilidad, luego memoria
  return localStorage.getItem('argentum_access_token') || _tokenMemory
}

export const setToken = (token: string): void => {
  _tokenMemory = token
  // También guardar en localStorage temporalmente para rehidratación
  localStorage.setItem('argentum_access_token', token)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('argentum_refresh_token') || _refreshMemory
}

export const setRefreshToken = (token: string): void => {
  _refreshMemory = token
  localStorage.setItem('argentum_refresh_token', token)
}

export const clearTokens = (): void => {
  _tokenMemory = null
  _refreshMemory = null
  localStorage.removeItem('argentum_access_token')
  localStorage.removeItem('argentum_refresh_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
/** @deprecated usá clearTokens() */
export const clearToken = clearTokens

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  withCredentials: true,
})


api.interceptors.request.use((config) => {
  return config
})

let isRefreshing = false
let pendingQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint = originalRequest.url?.includes('/auth/') && !originalRequest.url?.includes('/auth/me')
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => {
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await api.post('/auth/refresh')

      setToken(data.access_token)
      setRefreshToken(data.refresh_token)

      processQueue(null)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      const errorWithResponse = refreshError as { response?: { status?: number } }
      if (errorWithResponse?.response?.status === 401) {
        logoutGlobal()
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
