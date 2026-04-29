const ACCESS_KEY = 'argentum_access_token'
const REFRESH_KEY = 'argentum_refresh_token'

// Access token
export const getToken = (): string | null => localStorage.getItem(ACCESS_KEY)
export const setToken = (token: string): void => localStorage.setItem(ACCESS_KEY, token)

// Refresh token
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY)
export const setRefreshToken = (token: string): void => localStorage.setItem(REFRESH_KEY, token)

// Limpiar ambos
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** @deprecated usá clearTokens() */
export const clearToken = clearTokens
