import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/hooks/useTheme'
import {
  CONSTELLATIONS,
  CONSTELLATION_TIMINGS,
  CONSTELLATION_PALETTE,
  STARFIELD_PRESETS,
  type ConstellationPhase,
  type StaticStar,
} from './constellations.config'
import styles from './ConstellationCanvas.module.css'

export interface ConstellationCanvasProps {
  /** Nivel de intensidad: 'ambient' para fondo sutil, 'hero' para loading */
  intensity?: 'ambient' | 'hero'
  /** Selección de constelación a mostrar: alternar ambas o una fija */
  constellationSelect?: 'both' | 'capricorn' | 'leo'
  /** Multiplicador de velocidad para pruebas (por defecto 1) */
  speedMultiplier?: number
  /** Pausar la animación de trazado */
  isPaused?: boolean
  /** Densidad del campo estelar */
  starDensity?: 'low' | 'medium' | 'high'
  /** Clave opcional para forzar reinicio del ciclo */
  resetKey?: number
  /** Callback para notificar cambios de constelación y fase (útil en playground) */
  onCycleUpdate?: (info: { constellation: string; phase: ConstellationPhase }) => void
}

export function ConstellationCanvas({
  intensity = 'ambient',
  constellationSelect = 'both',
  speedMultiplier = 1,
  isPaused = false,
  starDensity,
  resetKey = 0,
  onCycleUpdate,
}: ConstellationCanvasProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const palette = isDark ? CONSTELLATION_PALETTE.dark : CONSTELLATION_PALETTE.light

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 640
  })

  // Escuchar preferencia de accesibilidad y tamaño de pantalla
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mqMotion.addEventListener('change', handleMotion)

    const handleResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', handleResize)

    return () => {
      mqMotion.removeEventListener('change', handleMotion)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Selección de estrellas estáticas según densidad y dispositivo
  const resolvedStarDensity = starDensity ?? (isMobile ? 'low' : 'medium')
  const backgroundStars = useMemo<readonly StaticStar[]>(() => {
    return STARFIELD_PRESETS[resolvedStarDensity] || STARFIELD_PRESETS.medium
  }, [resolvedStarDensity])

  // Constelación de ciclo alternante
  const [cycleId, setCycleId] = useState<'capricorn' | 'leo'>('capricorn')

  // Identificador activo resuelto (si se especifica uno fijo, toma precedencia)
  const activeId =
    constellationSelect === 'capricorn' || constellationSelect === 'leo'
      ? constellationSelect
      : cycleId

  const activeDef = CONSTELLATIONS[activeId]

  const [phase, setPhase] = useState<ConstellationPhase>('draw')
  const [phaseProgress, setPhaseProgress] = useState(0) // 0 a 1
  const [pathLength, setPathLength] = useState<number>(1000)
  const [guidePos, setGuidePos] = useState<{ x: number; y: number }>(() => ({
    x: activeDef.stars[0].x,
    y: activeDef.stars[0].y,
  }))

  // Referencias para el loop de animación sin lecturas durante el render
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const elapsedInPhaseRef = useRef<number>(0)
  const phaseRef = useRef<ConstellationPhase>('draw')
  const pathRef = useRef<SVGPathElement | null>(null)
  const lastResetKeyRef = useRef(resetKey)

  // Sincronizar referencia de fase fuera del render
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Estado resuelto con soporte para prefers-reduced-motion
  const resolvedPhase = prefersReducedMotion ? 'hold' : phase
  const resolvedProgress = prefersReducedMotion ? 1 : phaseProgress

  // Notificar al callback si existe
  useEffect(() => {
    onCycleUpdate?.({ constellation: activeId, phase: resolvedPhase })
  }, [activeId, resolvedPhase, onCycleUpdate])

  // Loop de animación rAF continuo
  useEffect(() => {
    if (prefersReducedMotion) return

    let isTabVisible = true
    const handleVisibility = () => {
      isTabVisible = !document.hidden
      if (document.hidden) {
        lastTimeRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const step = (timestamp: number) => {
      // Manejar reinicio forzado desde props
      if (lastResetKeyRef.current !== resetKey) {
        lastResetKeyRef.current = resetKey
        elapsedInPhaseRef.current = 0
        phaseRef.current = 'draw'
        setPhase('draw')
        setPhaseProgress(0)
      }

      if (!isTabVisible || isPaused) {
        lastTimeRef.current = timestamp
        animFrameRef.current = requestAnimationFrame(step)
        return
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Calcular duraciones escaladas
      const currentPhase = phaseRef.current
      const baseDuration =
        currentPhase === 'draw'
          ? CONSTELLATION_TIMINGS.drawDuration
          : currentPhase === 'hold'
            ? CONSTELLATION_TIMINGS.holdDuration
            : currentPhase === 'fade'
              ? CONSTELLATION_TIMINGS.fadeDuration
              : CONSTELLATION_TIMINGS.pauseDuration

      const safeMultiplier = Math.max(0.2, Math.min(5, speedMultiplier))
      const duration = baseDuration / safeMultiplier

      elapsedInPhaseRef.current += delta
      const progressNorm = Math.min(1, elapsedInPhaseRef.current / duration)
      setPhaseProgress(progressNorm)

      // Leer longitud y posición de la estrella guía de forma segura fuera de render
      if (pathRef.current) {
        try {
          const totalLen = pathRef.current.getTotalLength()
          if (totalLen > 0) {
            setPathLength(totalLen)
            const currentDist = currentPhase === 'draw' ? progressNorm * totalLen : totalLen
            const pt = pathRef.current.getPointAtLength(Math.min(currentDist, totalLen))
            setGuidePos({ x: pt.x, y: pt.y })
          }
        } catch {
          // Ignorar excepciones temporales de SVG
        }
      }

      // Transición entre fases
      if (elapsedInPhaseRef.current >= duration) {
        elapsedInPhaseRef.current = 0
        if (currentPhase === 'draw') {
          phaseRef.current = 'hold'
          setPhase('hold')
        } else if (currentPhase === 'hold') {
          phaseRef.current = 'fade'
          setPhase('fade')
        } else if (currentPhase === 'fade') {
          phaseRef.current = 'pause'
          setPhase('pause')
        } else if (currentPhase === 'pause') {
          if (constellationSelect === 'both') {
            setCycleId((prev) => (prev === 'capricorn' ? 'leo' : 'capricorn'))
          }
          phaseRef.current = 'draw'
          setPhase('draw')
        }
      }

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isPaused, prefersReducedMotion, constellationSelect, speedMultiplier, resetKey])

  // Coordenadas calculadas de trazado
  const currentDrawDist = resolvedPhase === 'draw' ? resolvedProgress * pathLength : pathLength
  const dashOffset =
    resolvedPhase === 'draw'
      ? Math.max(0, pathLength - currentDrawDist)
      : resolvedPhase === 'pause'
        ? pathLength
        : 0

  // Opacidad del trazado según la fase
  const lineOpacity =
    resolvedPhase === 'draw'
      ? intensity === 'hero' ? 0.95 : 0.82
      : resolvedPhase === 'hold'
        ? intensity === 'hero' ? 1.0 : 0.90
        : resolvedPhase === 'fade'
          ? Math.max(0, (1 - resolvedProgress) * (intensity === 'hero' ? 1.0 : 0.90))
          : 0

  // Opacidad de la estrella guía (desaparece suavemente al inicio del hold)
  const guideOpacity =
    resolvedPhase === 'draw'
      ? 1
      : resolvedPhase === 'hold'
        ? Math.max(0, 1 - resolvedProgress * 2.5)
        : 0

  // Radio de estrella según magnitud visual astronómica (escala óptica contenida)
  const getStarRadius = (mag: number) => {
    if (mag < 2.0) return 3.0 // Estrellas muy brillantes (Regulus)
    if (mag < 3.0) return 2.4 // Brillantes (Denebola, Algieba, Deneb Algedi)
    if (mag < 3.8) return 1.9 // Medias
    return 1.4 // Menores
  }

  return (
    <div className={styles.container} aria-hidden="true">
      {/* 1. Resplandor Difuso Ambiental Fuera de Cuadro (Zenith-East) */}
      <div
        className={`${styles.ambientGlow} ${intensity === 'hero' ? styles.ambientGlowHero : ''}`}
        style={{ background: palette.ambientGlow }}
      />

      {/* 2. Lienzo Vectorial de Cielo y Constelaciones */}
      <svg
        className={styles.skySvg}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Filtro tenue para el halo de la estrella guía */}
          <radialGradient id="argGuideGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.guideStarCore} stopOpacity="0.9" />
            <stop offset="45%" stopColor={palette.guideStarHalo} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.guideStarBlur} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── A. Campo Estelar Discreto Permanente ────────────────────────── */}
        <g id="arg-starfield" opacity={intensity === 'hero' ? 0.95 : 0.78}>
          {backgroundStars.map((star) => {
            const starFill =
              star.colorType === 'cool'
                ? palette.starCool
                : star.colorType === 'base'
                  ? palette.starBase
                  : palette.starMuted

            return (
              <circle
                key={star.id}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill={starFill}
                opacity={star.baseOpacity}
                className={star.twinkleDelay > 0 ? styles.twinkleStar : undefined}
                style={
                  star.twinkleDelay > 0
                    ? ({
                        '--base-opacity': star.baseOpacity,
                        animationDelay: `${star.twinkleDelay}s`,
                        animationDuration: `${star.twinkleDuration}s`,
                      } as React.CSSProperties)
                    : undefined
                }
              />
            )
          })}
        </g>

        {/* ── B. Trazo Vectorial Progresivo de la Constelación Activa ──────── */}
        <g id="arg-constellation-lines" opacity={lineOpacity}>
          {/* Path medible */}
          <path
            ref={pathRef}
            d={activeDef.svgPath}
            stroke="transparent"
            fill="none"
            strokeWidth="1"
          />

          {/* Línea nítida de plata esterlina 925 */}
          <path
            d={activeDef.svgPath}
            stroke={palette.lineColor}
            strokeWidth={isDark ? '1.15' : '1.3'}
            strokeDasharray={`${pathLength} ${pathLength}`}
            strokeDashoffset={dashOffset}
            className={`${styles.constellationLine} ${intensity === 'hero' ? styles.heroLineGlow : ''}`}
            fill="none"
          />
        </g>

        {/* ── C. Estrellas de la Constelación Activa ───────────────────────── */}
        <g id="arg-constellation-stars" opacity={lineOpacity}>
          {activeDef.stars.map((star) => {
            const radius = getStarRadius(star.mag)
            const isPrimary = Boolean(star.isPrimary)

            return (
              <g key={star.id} className={styles.constellationStar}>
                {/* Halo sutil para estrellas principales (Regulus, Algieba, Denebola, etc.) */}
                {isPrimary && (
                  <circle
                    cx={star.x}
                    cy={star.y}
                    r={radius * 2.6}
                    fill={palette.primaryStarHalo}
                    className={resolvedPhase === 'hold' ? styles.primaryStarPulse : undefined}
                  />
                )}

                {/* Núcleo de la estrella de la constelación */}
                <circle
                  cx={star.x}
                  cy={star.y}
                  r={radius}
                  fill={isDark ? '#F8FAFC' : '#0D2045'}
                  stroke={palette.lineColor}
                  strokeWidth="0.5"
                  opacity={isDark ? 0.95 : 0.85}
                />
              </g>
            )
          })}
        </g>

        {/* ── D. Estrella Guía (Puntero de Alta Relojería en Trazado) ──────── */}
        {!prefersReducedMotion && guideOpacity > 0 && (
          <g
            id="arg-guide-star"
            opacity={guideOpacity}
            transform={`translate(${guidePos.x}, ${guidePos.y})`}
            className={styles.guideStarCore}
          >
            {/* Halo sutil contenido */}
            <circle cx="0" cy="0" r="7" fill="url(#argGuideGlow)" />
            {/* Anillo de precisión de grabado */}
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill="none"
              stroke={palette.guideStarCore}
              strokeWidth="0.75"
              opacity="0.6"
            />
            {/* Núcleo central blanco/plateado */}
            <circle
              cx="0"
              cy="0"
              r="2.2"
              fill={palette.guideStarCore}
              opacity="0.95"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

export default ConstellationCanvas
