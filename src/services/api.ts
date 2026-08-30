import axios from 'axios'
import { logoutGlobal } from '../utils/browserHistory'



// Estado en memoria
let _tokenMemory: string | null = null

export const getToken = (): string | null => {
  return _tokenMemory
}

export const setToken = (token: string | null): void => {
  _tokenMemory = token
}

export const clearTokens = (): void => {
  _tokenMemory = null
}
/** @deprecated usá clearTokens() */
export const clearToken = clearTokens


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
})


api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
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
    if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.name === 'AbortError') {
      return Promise.reject(error)
    }

    if (error.response) {
      console.error("[API Error]", error.response.status, error.response.data?.detail || error.response.statusText);
    } else if (error.code === 'ECONNABORTED') {
      console.error("[API Error] Tiempo de espera agotado (Timeout)");
    } else {
      console.error("[API Error] Error de conexión o red:", error.message);
    }

    const originalRequest = error.config
    if (!originalRequest) {
      return Promise.reject(error)
    }

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
