import { useEffect, useState } from 'react'
import { Toaster } from 'sileo'
import { useTheme } from '@/hooks/useTheme'

/**
 * Componente Toaster de Sileo adaptado al ecosistema de Argentum.
 * Toaster principal y único del sistema de notificaciones de la aplicación.
 */
export function SileoToaster() {
  const { theme } = useTheme()
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <Toaster
      theme={theme}
      position={isDesktop ? 'bottom-right' : 'top-center'}
      offset={
        isDesktop
          ? { bottom: 32, right: 32 }
          : { top: 'calc(16px + env(safe-area-inset-top, 0px))' }
      }
      options={{
        duration: 3500,
        roundness: 12,
      }}
    />
  )
}

export default SileoToaster
