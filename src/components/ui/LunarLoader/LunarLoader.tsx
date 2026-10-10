import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useId,
  useContext,
  memo,
} from 'react'
import { ThemeContext } from '@/context/ThemeContext'
import { getMoonPhasePath } from '@/components/ui/AtmosphericBackground/lunarMath'
import styles from './LunarLoader.module.css'

export interface LunarLoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tamaño del loader en píxeles (ancho y alto). Por defecto 18. */
  size?: number | string
  /**
   * Color personalizado de la porción iluminada.
   * Si no se especifica, utiliza la paleta oficial de Argentum (Eclipse en light, Plata 925 en dark).
   */
  color?: string
  /**
   * Variante cromática:
   * - 'brand' (por defecto): replica la estética de alta relojería del Hero Loader (Naranja/Cobre vibrante en Claro, Plata/Azul glacial en Oscuro).
   * - 'current': hereda currentColor manteniendo volumen esférico 3D.
   */
  variant?: 'brand' | 'current'
  /** Modo cromático explícito o 'auto' para sincronizar con el sistema/tema (por defecto 'auto') */
  themeMode?: 'auto' | 'light' | 'dark'
  /** Duración en segundos de un ciclo de fases completo [0 -> 1]. Por defecto 3.2s. */
  cycleDuration?: number
  /** Si debe mostrar el halo atmosférico de luz exterior. Por defecto activo siempre para máxima calidad visual. */
  showGlow?: boolean
  /** Clase CSS adicional */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
  /** Etiqueta de accesibilidad (por defecto 'Cargando...') */
  'aria-label'?: string
}

export const LunarLoader = memo(
  forwardRef<HTMLSpanElement, LunarLoaderProps>(function LunarLoader(
    {
      size = 18,
      color,
      variant = 'brand',
      themeMode = 'auto',
      cycleDuration = 3.2,
      showGlow = true,
      className = '',
      style,
      'aria-label': ariaLabel = 'Cargando...',
      'aria-hidden': ariaHidden,
      ...restProps
    },
    ref
  ) {
    const rawId = useId()
    const uid = 'lunar-' + rawId.replace(/[^a-zA-Z0-9]/g, '')

    const themeCtx = useContext(ThemeContext)

    // Escucha activa del modo de color del sistema operativo / navegador
    const [systemIsDark, setSystemIsDark] = useState(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
      if (typeof window === 'undefined') return
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }, [])

    // Resolución cromática idéntica a la del Hero Loader:
    // En Modo Claro: Eclipse Naranja/Terracota
    // En Modo Oscuro: Noche Lunar Fría (Plata 925 y Azul Glacial)
    const isDark =
      themeMode === 'dark'
        ? true
        : themeMode === 'light'
        ? false
        : themeCtx?.theme
        ? themeCtx.theme === 'dark'
        : typeof document !== 'undefined' &&
          (document.documentElement.getAttribute('data-theme') === 'dark' ||
            document.documentElement.classList.contains('dark'))
        ? true
        : systemIsDark

    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    // Fase inicial: creciente emblemática de Argentum (p = 0.15)
    const [progress, setProgress] = useState(0.15)

    const animRef = useRef<number | null>(null)
    const startTimeRef = useRef<number | null>(null)

    // Escuchar preferencia de movimiento reducido
    useEffect(() => {
      if (typeof window === 'undefined') return
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }, [])

    // Bucle continuo de animación por requestAnimationFrame
    useEffect(() => {
      if (prefersReducedMotion) return

      const durationMs = Math.max(800, cycleDuration * 1000)

      const step = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }
        const elapsed = timestamp - startTimeRef.current
        const current = (elapsed / durationMs) % 1
        setProgress(current)
        animRef.current = requestAnimationFrame(step)
      }

      animRef.current = requestAnimationFrame(step)

      return () => {
        if (animRef.current !== null) {
          cancelAnimationFrame(animRef.current)
        }
      }
    }, [cycleDuration, prefersReducedMotion])

    // Geometría del SVG (viewBox 100x100, radio proporcionado R = 41)
    const cx = 50
    const cy = 50
    const R = 41

    // Evitar que la luna desaparezca al 100% (blackout total que hace parecer un círculo vacío)
    const pRaw = ((progress % 1) + 1) % 1
    const pEffective = pRaw < 0.05 ? 0.05 : pRaw > 0.95 ? 0.95 : pRaw
    const illuminatedPath = getMoonPhasePath(pEffective, cx, cy, R)

    // Cálculo del factor de eclipse (pico en plenitud p ~ 0.5)
    const distFromFull = Math.abs(pRaw - 0.5)
    const eclipseWindow = 0.18
    const eclipseFactor = distFromFull < eclipseWindow
      ? Math.cos((distFromFull / eclipseWindow) * Math.PI * 0.5)
      : 0

    // Parsear tamaño numérico para calibrar trazos y proporciones
    const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 18

    // Trazo fino y ultra nítido
    const strokeWidth = numSize <= 20 ? 2.6 : numSize <= 32 ? 2.0 : 1.5

    // Configuración cromática y halos
    const isBrand = variant === 'brand' && !color
    const haloBackground = isBrand
      ? isDark
        ? `radial-gradient(circle, rgba(148, 163, 184, ${0.30 + eclipseFactor * 0.35}) 0%, rgba(96, 165, 250, ${0.15 + eclipseFactor * 0.20}) 42%, transparent 72%)`
        : `radial-gradient(circle, rgba(224, 98, 36, ${0.40 + eclipseFactor * 0.35}) 0%, rgba(255, 163, 51, ${0.22 + eclipseFactor * 0.22}) 42%, transparent 72%)`
      : `radial-gradient(circle, currentColor 0%, transparent 68%)`

    const glowClass = isBrand
      ? isDark
        ? styles.brandGlowDark
        : styles.brandGlowLight
      : styles.currentGlow

    // Limpieza defensiva de className
    const sanitizedClassName = className
      .replace(/\banimate-spin\b/g, '')
      .trim()

    const containerStyle: React.CSSProperties = {
      width: size,
      height: size,
      minWidth: size,
      minHeight: size,
      ...style,
    }

    return (
      <span
        ref={ref}
        className={`${styles.lunarLoader} ${sanitizedClassName}`}
        style={containerStyle}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
        {...restProps}
      >
        {/* Halo atmosférico exterior con respiración óptica */}
        {showGlow && (
          <span
            className={styles.halo}
            style={{
              background: haloBackground,
              opacity: isBrand ? 0.75 + eclipseFactor * 0.25 : 0.25,
              transform: `scale(${0.96 + eclipseFactor * 0.16})`,
            }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${styles.svg} ${glowClass}`}
          aria-hidden="true"
          data-no-animate="true"
        >
          <defs>
            {/* 1. Gradiente volumétrico de la porción iluminada */}
            {isBrand ? (
              isDark ? (
                // Noche Lunar (Plata líquida 925 y Azul glacial)
                <linearGradient id={`${uid}-illuminated`} x1="20%" y1="15%" x2="85%" y2="85%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#F1F5F9" />
                  <stop offset="75%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor={eclipseFactor > 0 ? '#93C5FD' : '#A5B4FC'} />
                </linearGradient>
              ) : (
                // Eclipse Argentum (Luz solar ámbar, cobre y terracota profundo)
                <linearGradient id={`${uid}-illuminated`} x1="15%" y1="15%" x2="85%" y2="85%">
                  <stop offset="0%" stopColor="#FFF2D6" />
                  <stop offset="30%" stopColor="#FFA439" />
                  <stop offset="70%" stopColor="#E06224" />
                  <stop offset="100%" stopColor={eclipseFactor > 0.4 ? '#CC4D14' : '#B83E0A'} />
                </linearGradient>
              )
            ) : (
              // Modo Monocromo / CurrentColor volumétrico
              <linearGradient id={`${uid}-illuminated`} x1="20%" y1="15%" x2="85%" y2="85%">
                <stop offset="0%" stopColor={color || 'currentColor'} stopOpacity="1" />
                <stop offset="100%" stopColor={color || 'currentColor'} stopOpacity="0.82" />
              </linearGradient>
            )}

            {/* 2. Gradiente esférico del cuerpo en penumbra / sombra física */}
            {isBrand ? (
              isDark ? (
                <radialGradient id={`${uid}-shadow`} cx="42%" cy="42%" r="58%">
                  <stop offset="0%" stopColor="#0B132B" stopOpacity="0.82" />
                  <stop offset="70%" stopColor="#060B14" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#020610" stopOpacity="0.98" />
                </radialGradient>
              ) : (
                <radialGradient id={`${uid}-shadow`} cx="42%" cy="42%" r="58%">
                  <stop offset="0%" stopColor="#FCE7D6" stopOpacity="0.25" />
                  <stop offset="65%" stopColor="#E06224" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#9C2F04" stopOpacity="0.48" />
                </radialGradient>
              )
            ) : (
              <radialGradient id={`${uid}-shadow`} cx="42%" cy="42%" r="58%">
                <stop offset="0%" stopColor={color || 'currentColor'} stopOpacity="0.10" />
                <stop offset="100%" stopColor={color || 'currentColor'} stopOpacity="0.24" />
              </radialGradient>
            )}

            {/* 3. Borde celestial Fresnel con contraste óptico */}
            {isBrand ? (
              isDark ? (
                <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.45" />
                </linearGradient>
              ) : (
                <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFC875" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#E06224" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#CC4D14" stopOpacity="0.55" />
                </linearGradient>
              )
            ) : (
              <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color || 'currentColor'} stopOpacity="0.75" />
                <stop offset="100%" stopColor={color || 'currentColor'} stopOpacity="0.35" />
              </linearGradient>
            )}
          </defs>

          {/* 1. Destello exterior de corona durante plenitud / eclipse */}
          {eclipseFactor > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={R + 3}
              fill="none"
              stroke={isBrand ? (isDark ? '#93C5FD' : '#FFA439') : (color || 'currentColor')}
              strokeWidth={strokeWidth * 1.25}
              opacity={0.65 * eclipseFactor}
            />
          )}

          {/* 2. Cuerpo esférico tridimensional en penumbra (sin discos grises planos) */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill={`url(#${uid}-shadow)`}
          />

          {/* 3. Porción celestial iluminada por la luz solar */}
          {illuminatedPath && (
            <path
              d={illuminatedPath}
              fill={`url(#${uid}-illuminated)`}
              shapeRendering="geometricPrecision"
            />
          )}

          {/* 4. Borde celestial nítido que define la esfera física */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth={strokeWidth}
          />
        </svg>
      </span>
    )
  })
)

LunarLoader.displayName = 'LunarLoader'

export default LunarLoader
