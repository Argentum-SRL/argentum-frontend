import { Toaster } from 'sileo'
import { useTheme } from '@/hooks/useTheme'
import { useViewport } from '@/hooks/useViewport'

/**
 * Componente Toaster de Sileo adaptado al ecosistema de Argentum.
 * Toaster principal y único del sistema de notificaciones de la aplicación.
 */
export function SileoToaster() {
  const { theme } = useTheme()
  const { esCelular } = useViewport()
  const isDesktop = !esCelular

  return (
    <Toaster
      theme={theme}
      position={isDesktop ? 'bottom-right' : 'top-center'}
      offset={
        isDesktop
          ? { bottom: 32, right: 32 }
          : { top: 'calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))' }
      }
      options={{
        duration: 3500,
        roundness: 12,
      }}
    />
  )
}

export default SileoToaster
