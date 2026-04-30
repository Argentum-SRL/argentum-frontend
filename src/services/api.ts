import axios from 'axios'

const ACCESS_KEY = 'argentum_access_token'
const REFRESH_KEY = 'argentum_refresh_token'

export const getToken = (): string | null => localStorage.getItem(ACCESS_KEY)
export const setToken = (token: string): void => localStorage.setItem(ACCESS_KEY, token)
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY)
export const setRefreshToken = (token: string): void => localStorage.setItem(REFRESH_KEY, token)
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
/** @deprecated usá clearTokens() */
export const clearToken = clearTokens

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

if (import.meta.env.DEV) {
  console.log('[API] baseURL configurada:', import.meta.env.VITE_API_URL ?? '/api')
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      clearTokens()
      window.location.replace('/login')
      return Promise.reject(error)
    }

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
