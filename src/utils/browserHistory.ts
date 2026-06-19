let navigateFn: ((path: string, options?: { replace?: boolean }) => void) | null = null
let logoutFn: (() => void) | null = null

export function setNavigate(fn: typeof navigateFn) {
  navigateFn = fn
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (navigateFn) {
    navigateFn(path, options)
  } else {
    // fallback si el navigate todavía no fue registrado
    window.location.replace(path)
  }
}

export function setLogoutFn(fn: () => void) {
  logoutFn = fn
}

export function logoutGlobal() {
  if (logoutFn) {
    logoutFn()
  } else {
    // fallback: limpiar storage manualmente
    localStorage.removeItem('argentum_access_token')
    localStorage.removeItem('argentum_refresh_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.replace('/login')
  }
}
