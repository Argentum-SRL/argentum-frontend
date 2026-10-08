import React, { type ReactNode } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { ArgentumCrescent } from './ArgentumCrescent'
import { LunarLoading, type LunarLoadingProps } from './LunarLoading'
import styles from './AtmosphericBackground.module.css'

export interface DecoMoonDef {
  id: string
  top: string
  left?: string
  right?: string
  size: number
  opacity: number
  anim?: string
}

/**
 * Escena de Mareas de Luz y Filigrana de Argentum.
 * Cero planetarios, cero diagramas astronómicos y cero órbitas.
 * Concepto de alta relojería y acuñación de metales:
 * - Mareas armónicas de luz y liquidez (caustics de Bézier)
 * - Sello de filigrana/garantía de plata Argentum 925 en el cuadrante inferior
 * - Micro-destellos de polvo de plata que aportan profundidad óptica
 */
function TidalAtmosphereScene() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Paleta de gradientes dinámicos según el modo
  const primaryLightColor = isDark ? '#E2E8F0' : '#C25E2E'
  const secondaryLightColor = isDark ? '#60A5FA' : '#D9822B'
  const tertiarySilverColor = isDark ? '#94A3B8' : '#B88258'
  const dustColor = isDark ? '#CBD5E1' : '#D9822B'

  return (
    <div className={styles.decorationsLayer} aria-hidden="true">
      {/* 1. Fuente de luz volumétrica (zenith-east) */}
      <div className={styles.lightSourceGlow} />

      {/* 2. Contraluz tenue de equilibrio (south-west) */}
      <div className={styles.ambientCounterGlow} />

      {/* 3. Escena vectorial de Mareas Armónicas y Filigrana */}
      <svg
        className={styles.causticsSvg}
        viewBox="0 0 1440 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Gradiente principal de las Mareas de Luz */}
          <linearGradient id="argTideGrad1" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor={secondaryLightColor} stopOpacity={isDark ? '0.22' : '0.28'} />
            <stop offset="45%" stopColor={primaryLightColor} stopOpacity={isDark ? '0.14' : '0.18'} />
            <stop offset="100%" stopColor={tertiarySilverColor} stopOpacity="0" />
          </linearGradient>

          {/* Gradiente secundario de Marea profunda */}
          <linearGradient id="argTideGrad2" x1="100%" y1="20%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryLightColor} stopOpacity={isDark ? '0.18' : '0.24'} />
            <stop offset="55%" stopColor={secondaryLightColor} stopOpacity={isDark ? '0.10' : '0.14'} />
            <stop offset="100%" stopColor={secondaryLightColor} stopOpacity="0" />
          </linearGradient>

          {/* Gradiente del Sello de Filigrana */}
          <linearGradient id="argSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryLightColor} stopOpacity={isDark ? '0.45' : '0.55'} />
            <stop offset="100%" stopColor={secondaryLightColor} stopOpacity={isDark ? '0.20' : '0.25'} />
          </linearGradient>
        </defs>

        {/* ── A. Primera Marea Armónica: Marea Superior de Claroscuro ───── */}
        <g opacity={isDark ? '0.85' : '0.90'}>
          {/* Filamento difuso de penumbra */}
          <path
            d="M -120 280 C 260 160, 680 380, 1560 220"
            stroke="url(#argTideGrad1)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity={isDark ? '0.10' : '0.15'}
            style={{ filter: 'blur(10px)' }}
          />
          {/* Filamentos nítidos de marea (haces de líquido y luz) */}
          <path
            d="M -120 280 C 260 160, 680 380, 1560 220"
            stroke="url(#argTideGrad1)"
            strokeWidth="1.2"
          />
          <path
            d="M -120 315 C 270 195, 690 415, 1560 255"
            stroke="url(#argTideGrad1)"
            strokeWidth="0.8"
            opacity="0.75"
          />
          <path
            d="M -120 350 C 280 230, 700 450, 1560 290"
            stroke="url(#argTideGrad1)"
            strokeWidth="0.5"
            opacity="0.50"
          />
        </g>

        {/* ── B. Segunda Marea Armónica: Gran Oleaje Diagonal de Horizonte ─ */}
        <g opacity={isDark ? '0.80' : '0.85'}>
          {/* Filamento difuso de soporte */}
          <path
            d="M -80 620 C 420 740, 940 500, 1540 680"
            stroke="url(#argTideGrad2)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={isDark ? '0.08' : '0.12'}
            style={{ filter: 'blur(12px)' }}
          />
          {/* Filamentos de flujo financiero y temporal */}
          <path
            d="M -80 620 C 420 740, 940 500, 1540 680"
            stroke="url(#argTideGrad2)"
            strokeWidth="1.2"
          />
          <path
            d="M -80 660 C 435 780, 955 540, 1540 720"
            stroke="url(#argTideGrad2)"
            strokeWidth="0.8"
            opacity="0.75"
          />
          <path
            d="M -80 700 C 450 820, 970 580, 1540 760"
            stroke="url(#argTideGrad2)"
            strokeWidth="0.5"
            opacity="0.45"
          />
        </g>

        {/* ── C. Tercera Marea: Susurro Transversal de Refracción ────────── */}
        <path
          d="M 220 -80 C 480 360, 1060 520, 1380 1040"
          stroke="url(#argTideGrad1)"
          strokeWidth="0.75"
          strokeDasharray="4 8"
          opacity={isDark ? '0.18' : '0.22'}
        />

        {/* ── D. Micro-destellos de Polvo de Plata (Still Atmospheric Air) ─ */}
        <g opacity={isDark ? '0.45' : '0.35'}>
          <circle cx="180" cy="220" r="1.2" fill={dustColor} />
          <circle cx="340" cy="460" r="1" fill={dustColor} />
          <circle cx="560" cy="180" r="1.4" fill={dustColor} />
          <circle cx="890" cy="320" r="1" fill={dustColor} />
          <circle cx="1120" cy="190" r="1.5" fill={dustColor} />
          <circle cx="1280" cy="440" r="1.2" fill={dustColor} />
          <circle cx="420" cy="740" r="1" fill={dustColor} />
          <circle cx="780" cy="790" r="1.2" fill={dustColor} />
          <circle cx="1060" cy="670" r="1.4" fill={dustColor} />
          <circle cx="1320" cy="780" r="1" fill={dustColor} />
        </g>

        {/* ── E. Sello de Filigrana Argentum 925 (Acuñación y Garantía) ──── */}
        <g
          className={styles.hallmarkGroup}
          transform="translate(130, 810)"
          opacity={isDark ? '0.30' : '0.38'}
        >
          {/* Anillo exterior micro-calibrado */}
          <circle
            cx="0"
            cy="0"
            r="44"
            stroke="url(#argSealGrad)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />
          {/* Anillo de contención interior */}
          <circle
            cx="0"
            cy="0"
            r="35"
            stroke="url(#argSealGrad)"
            strokeWidth="0.5"
          />

          {/* Medialuna emblemática en el centro del sello */}
          <g transform="translate(-14, -14)">
            <ArgentumCrescent size={28} color={primaryLightColor} />
          </g>

          {/* Micro-leyenda de acuñación */}
          <text
            x="0"
            y="59"
            textAnchor="middle"
            fill={primaryLightColor}
            fontSize="8"
            letterSpacing="0.26em"
            fontFamily="inherit"
            fontWeight="500"
            opacity="0.9"
          >
            ARGENTUM · 925
          </text>
          <text
            x="0"
            y="70"
            textAnchor="middle"
            fill={tertiarySilverColor}
            fontSize="6.5"
            letterSpacing="0.18em"
            fontFamily="inherit"
            fontWeight="400"
            opacity="0.75"
          >
            EQUILIBRIO DE CICLOS
          </text>
        </g>
      </svg>
    </div>
  )
}

export interface AtmosphericBackgroundProps {
  children?: ReactNode
  /** Nivel de intensidad visual: 'ambient' para módulos y modales, 'hero' para loading */
  intensity?: 'ambient' | 'hero'
  fullScreen?: boolean
  centered?: boolean
  compensateBottomNav?: boolean
  zIndex?: number
  className?: string
  style?: React.CSSProperties
  role?: string
  ariaLive?: 'off' | 'assertive' | 'polite'
  moons?: DecoMoonDef[]
}

export function AtmosphericBackground({
  children,
  intensity = 'ambient',
  fullScreen = true,
  centered = true,
  compensateBottomNav = true,
  zIndex,
  className = '',
  style,
  role,
  ariaLive,
}: AtmosphericBackgroundProps) {
  const { theme } = useTheme()

  React.useEffect(() => {
    const isDark = theme === 'dark'
    const targetBg = isDark ? '#020408' : '#FAF4EC'
    const targetColorScheme = isDark ? 'dark' : 'light'

    const prevHtmlBg = document.documentElement.style.backgroundColor
    const prevBodyBg = document.body.style.backgroundColor
    const prevColorScheme = document.documentElement.style.colorScheme

    document.documentElement.style.backgroundColor = targetBg
    document.body.style.backgroundColor = targetBg
    document.documentElement.style.colorScheme = targetColorScheme

    const metas = document.querySelectorAll('meta[name="theme-color"]')
    const prevMetas: { el: Element; content: string }[] = []
    metas.forEach((m) => {
      const content = m.getAttribute('content') || ''
      prevMetas.push({ el: m, content })
      m.setAttribute('content', targetBg)
    })

    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg
      document.body.style.backgroundColor = prevBodyBg
      document.documentElement.style.colorScheme = prevColorScheme
      prevMetas.forEach(({ el, content }) => {
        el.setAttribute('content', content)
      })
    }
  }, [theme])

  const containerClasses = [
    styles.container,
    fullScreen ? styles.fixed : styles.relative,
    centered ? styles.centered : '',
    compensateBottomNav ? styles.compensateBottomNav : '',
    className,
  ].filter(Boolean).join(' ')

  const inlineStyles: React.CSSProperties = {
    ...(zIndex !== undefined ? { zIndex } : {}),
    ...style,
  }

  return (
    <div
      className={containerClasses}
      style={inlineStyles}
      role={role}
      aria-live={ariaLive}
    >
      {/* Atmósfera Editorial: Mareas de Luz, Claroscuro y Filigrana */}
      <div className={styles.decorationsLayer} aria-hidden="true">
        {/* Viñeta de protección para iOS status bar y Dynamic Island */}
        <div className={styles.topVignette} />

        {/* Escena de Mareas y Luz */}
        {intensity === 'ambient' && <TidalAtmosphereScene />}

        {/* Viñeta de protección para home bar y barra inferior */}
        <div className={styles.bottomVignette} />
      </div>

      {children}
    </div>
  )
}

export interface AtmosphericCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  maxWidth?: number | string
}

export function AtmosphericCard({
  children,
  className = '',
  style,
  maxWidth,
}: AtmosphericCardProps) {
  const inlineStyles: React.CSSProperties = {
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...style,
  }

  return (
    <div className={`${styles.card} ${className}`} style={inlineStyles}>
      {children}
    </div>
  )
}

/** Icono oficial de la medialuna de Argentum para cabeceras y logotipos */
export function AtmosphericMoonIcon({
  size = 32,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return <ArgentumCrescent size={size} color={color} />
}

export type AtmosphericLoadingProps = LunarLoadingProps

/** Pantalla de carga fullscreen editorial con el símbolo oficial y ciclo del tiempo */
export function AtmosphericLoading({
  text = 'Cada ciclo cuenta.',
  fullScreen = true,
  zIndex = 50,
  className,
  style,
}: AtmosphericLoadingProps) {
  return (
    <LunarLoading
      text={text}
      fullScreen={fullScreen}
      zIndex={zIndex}
      className={className}
      style={style}
    />
  )
}

// Aliases canónicos para nueva semántica
export const LunarBackground = AtmosphericBackground
export const LunarMoonIcon = AtmosphericMoonIcon

export default AtmosphericBackground
