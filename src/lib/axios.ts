import axios from 'axios'
import { clearTokens, getRefreshToken, getToken, setRefreshToken, setToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Flag para evitar bucles infinitos de refresh
let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si no es 401, ya se reintentó, o es un endpoint de auth (evitar loops)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()

    // Sin refresh token → ir al login
    if (!refreshToken) {
      clearTokens()
      window.location.replace('/login')
      return Promise.reject(error)
    }

    // Si ya hay un refresh en curso, encolar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/refresh`,
        { refresh_token: refreshToken },
      )

      setToken(data.access_token)
      setRefreshToken(data.refresh_token)

      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`

      processQueue(null, data.access_token)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      window.location.replace('/login')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
