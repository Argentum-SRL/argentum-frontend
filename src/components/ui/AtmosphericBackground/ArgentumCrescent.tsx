import React, { useId } from 'react'

export interface ArgentumCrescentProps {
  /** Tamaño en píxeles del icono/símbolo */
  size?: number
  /** Color de relleno (por defecto currentColor) */
  color?: string
  /** Activar suave respiración luminosa autónoma */
  breathe?: boolean
  /** Clase CSS adicional */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
}

/**
 * Medialuna icónica oficial de Argentum.
 * Reutiliza la geometría de marca existente en el repositorio:
 * Círculo exterior (r=24) sustraído por círculo interior desplazado (cx=58, r=19).
 */
export function ArgentumCrescent({
  size = 40,
  color = 'currentColor',
  breathe = false,
  className = '',
  style,
}: ArgentumCrescentProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const maskId = `arg-crescent-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        overflow: 'visible',
        shapeRendering: 'geometricPrecision',
        ...(breathe
          ? {
              animation: 'argentumBreathe 9s ease-in-out infinite',
            }
          : {}),
        ...style,
      }}
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="black" />
          {/* Círculo base iluminado */}
          <circle cx="50" cy="50" r="24" fill="white" />
          {/* Círculo de sombra interior que crea la medialuna clásica de Argentum */}
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="24"
        fill={color}
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

export default ArgentumCrescent
