let navigateFn: ((path: string, options?: { replace?: boolean }) => void) | null = null

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
