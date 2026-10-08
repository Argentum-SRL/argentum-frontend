import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { updateSystemBars } from '@/utils/systemTheme'
import { LunarPhase } from './LunarPhase'
import { DEFAULT_LUNAR_PHRASES } from './lunarConstants'
import styles from './LunarLoading.module.css'

let memoryPhraseCounter = 0

function getNextUniformIndex(total: number): number {
  if (typeof window === 'undefined' || total <= 0) return 0
  try {
    const raw = sessionStorage.getItem('arg_lunar_phrase_idx')
    const current = raw !== null ? (parseInt(raw, 10) + 1) % total : 0
    sessionStorage.setItem('arg_lunar_phrase_idx', String(current))
    return current
  } catch {
    memoryPhraseCounter = (memoryPhraseCounter + 1) % total
    return memoryPhraseCounter
  }
}

export interface LunarLoadingProps {
  /** Texto descriptivo fijo o personalizado (si se omite o es el default, rota frases) */
  text?: string
  /** Lista opcional de frases para rotar */
  phrases?: string[]
  /** Rotar frases automáticamente durante la carga (por defecto true) */
  autoRotate?: boolean
  /** Intervalo en milisegundos entre rotaciones (por defecto 3600ms) */
  rotationInterval?: number
  /** Ocupar pantalla completa (100vw × 100vh) */
  fullScreen?: boolean
  /** Nivel de z-index del contenedor */
  zIndex?: number
  /** Clase CSS adicional */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
}

/**
 * Duración del ciclo lunar completo: 6 segundos.
 * Diseñado para la velocidad real de carga de Argentum, permitiendo
 * percibir la transformación continua sin demoras artificiales.
 */
const CYCLE_SECONDS = 6

export function LunarLoading({
  text,
  phrases,
  autoRotate = true,
  rotationInterval = 3600,
  fullScreen = true,
  zIndex = 50,
  className = '',
  style,
}: LunarLoadingProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Inicia en la fase creciente de Argentum (p = 0.15)
  const [progress, setProgress] = useState(0.15)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 640
  })

  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Escucha cambios de accesibilidad y tamaño de pantalla
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mqMotion.addEventListener('change', handler)

    const handleResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', handleResize)

    return () => {
      mqMotion.removeEventListener('change', handler)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Sincronizar barras del sistema (iOS Safari y Android Chrome) con el tono del loader
  useEffect(() => {
    if (!fullScreen) return

    const lunarBg = isDark ? '#0C172B' : '#FAF7F2'
    updateSystemBars(lunarBg, isDark)

    return () => {
      const defaultBg = isDark ? '#0E1117' : '#FAF7F2'
      updateSystemBars(defaultBg, isDark)
    }
  }, [fullScreen, isDark])

  // Movimiento continuo de las fases a 6 segundos (sin interacción con mouse)
  useEffect(() => {
    if (prefersReducedMotion) return

    const durationMs = CYCLE_SECONDS * 1000

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
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [prefersReducedMotion])

  // Cálculo del evento de Eclipse (transición visible en la plenitud: p ~ 0.32 a 0.68)
  const distFromFull = Math.abs(progress - 0.5)
  const eclipseWindow = 0.18
  const eclipseFactor = distFromFull < eclipseWindow
    ? Math.cos((distFromFull / eclipseWindow) * Math.PI * 0.5)
    : 0

  // Paleta dinámica según modo y momento de eclipse
  let moonColor: string
  let haloBackground: string
  let shadowColor: string
  let rimColor: string

  if (isDark) {
    // Modo Oscuro: Noche Lunar fría (Plata y silencio)
    moonColor = eclipseFactor > 0 ? '#93C5FD' : '#E2E8F0'
    shadowColor = 'rgba(6, 11, 20, 0.75)'
    rimColor = '#E2E8F0'
    haloBackground = `radial-gradient(circle, rgba(148, 163, 184, ${0.15 + eclipseFactor * 0.22}) 0%, rgba(96, 165, 250, ${0.06 + eclipseFactor * 0.10}) 45%, transparent 72%)`
  } else {
    // Modo Claro: Eclipse Lunar — SIEMPRE NARANJA, NUNCA NEGRA NI AZUL
    // Durante la plenitud adopta un naranja terracota profundo; en crecientes y cuartos un naranja cobrizo vibrante
    moonColor = eclipseFactor > 0.4 ? '#CC4D14' : '#E06224'
    shadowColor = 'rgba(224, 98, 36, 0.12)'
    rimColor = '#E06224'
    haloBackground = `radial-gradient(circle, rgba(224, 98, 36, ${0.28 + eclipseFactor * 0.25}) 0%, rgba(217, 130, 43, ${0.14 + eclipseFactor * 0.16}) 45%, transparent 72%)`
  }

  // Gestión de frases rotativas dinámicas
  const phrasePool = phrases && phrases.length > 0 ? phrases : DEFAULT_LUNAR_PHRASES
  const isFixedCustomText = Boolean(text && text !== 'Cada ciclo cuenta.' && !phrases)

  const [phraseIndex, setPhraseIndex] = useState(() => {
    return getNextUniformIndex(phrasePool.length)
  })
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (isFixedCustomText || !autoRotate || prefersReducedMotion) return

    const interval = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrasePool.length)
        setIsFading(false)
      }, 320)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [isFixedCustomText, autoRotate, prefersReducedMotion, rotationInterval, phrasePool.length])

  const currentDisplayPhrase = isFixedCustomText ? (text ?? '') : phrasePool[phraseIndex]

  const centerMoonSize = isMobile ? 72 : 86

  const containerStyle: React.CSSProperties = {
    ...(zIndex !== undefined ? { zIndex } : {}),
    ...(fullScreen ? {} : { position: 'relative', height: '100%' }),
    ...style,
  }

  return (
    <div
      className={`${styles.container} ${className}`}
      style={containerStyle}
      role="status"
      aria-live="polite"
      aria-label={`${currentDisplayPhrase} — Argentum`}
    >
      {/* Viñetas sutiles para muestreo y transición perfecta en Status Bar y Home Bar */}
      <div className={styles.topSafeBlend} aria-hidden="true" />
      <div className={styles.bottomSafeBlend} aria-hidden="true" />

      <div className={styles.compositionStage}>
        {/* Marco de la Luna sin diagramas ni líneas planetarias */}
        <div className={styles.moonFrame}>
          {/* Corona de eclipse / halo de luz que respira con la temperatura */}
          <div
            className={styles.coronaHalo}
            style={{
              background: haloBackground,
              opacity: 0.7 + eclipseFactor * 0.3,
              transform: `scale(${0.92 + eclipseFactor * 0.18})`,
            }}
          />

          {/* Luna Central en Transformación Continua */}
          <div className={styles.moonWrapper}>
            <LunarPhase
              progress={progress}
              size={centerMoonSize}
              color={moonColor}
              shadowColor={shadowColor}
              shadowOpacity={isDark ? 0.22 : 0.35}
              rimColor={rimColor}
              rimOpacity={isDark ? 0.35 : 0.55}
              eclipseIntensity={eclipseFactor}
              eclipseColor={isDark ? '#93C5FD' : '#E06224'}
            />
          </div>
        </div>

        {/* Jerarquía tipográfica editorial */}
        <div className={styles.typographyGroup}>
          <span className={styles.brandSignature}>Argentum</span>
          <span className={`${styles.tagline} ${isFading ? styles.taglineFading : ''}`}>
            {currentDisplayPhrase}
          </span>
        </div>
      </div>
    </div>
  )
}

export default LunarLoading
