import React from 'react'
import { getMoonPhasePath } from './lunarMath'

export interface LunarPhaseProps {
  /** Progreso continuo del ciclo lunar [0, 1): 0 = Nueva, 0.5 = Llena, 1 = Nueva */
  progress: number
  /** Tamaño total en píxeles (ancho y alto) */
  size?: number
  /** Color de la porción iluminada (por defecto currentColor) */
  color?: string
  /** Color de la porción en sombra / cuerpo lunar */
  shadowColor?: string
  /** Opacidad del cuerpo lunar no iluminado */
  shadowOpacity?: number
  /** Si debe mostrar un fino borde celestial exterior */
  showRim?: boolean
  /** Opacidad del borde exterior */
  rimOpacity?: number
  /** Color del borde exterior (por defecto color) */
  rimColor?: string
  /** Intensidad del halo de eclipse (0 = normal, >0 = corona activa) */
  eclipseIntensity?: number
  /** Color del tono del eclipse (cobre/ámbar o plata) */
  eclipseColor?: string
  /** Clase CSS adicional */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
}

/**
 * Componente atómico para renderizar cualquier fase lunar en SVG puro.
 * Puede representar tanto una fase fija (0..1) como una transformación continua,
 * con soporte para corona y matiz de eclipse lunar.
 */
export function LunarPhase({
  progress,
  size = 48,
  color = 'currentColor',
  shadowColor = 'currentColor',
  shadowOpacity = 0.08,
  showRim = true,
  rimOpacity = 0.18,
  rimColor,
  eclipseIntensity = 0,
  eclipseColor,
  className = '',
  style,
}: LunarPhaseProps) {
  const cx = 50
  const cy = 50
  const R = 38 // Radio proporcionado al viewBox 100x100
  const illuminatedPath = getMoonPhasePath(progress, cx, cy, R)

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
        ...style,
      }}
    >
      {/* 0. Corona de eclipse suave */}
      {eclipseIntensity > 0 && eclipseColor && (
        <circle
          cx={cx}
          cy={cy}
          r={R + 3}
          fill="none"
          stroke={eclipseColor}
          strokeWidth="1.5"
          opacity={0.55 * eclipseIntensity}
        />
      )}

      {/* 1. Cuerpo físico de la luna en sombra */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill={shadowColor}
        opacity={shadowOpacity}
      />

      {/* 2. Borde celestial tenue que delimita la esfera en la noche */}
      {showRim && (
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={rimColor || color}
          strokeWidth="0.85"
          opacity={rimOpacity}
        />
      )}

      {/* 3. Porción físicamente iluminada por la luz solar */}
      {illuminatedPath && (
        <path
          d={illuminatedPath}
          fill={color}
          shapeRendering="geometricPrecision"
        />
      )}
    </svg>
  )
}

export default LunarPhase
