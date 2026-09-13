import React, { type ReactNode } from 'react'
import styles from './AtmosphericBackground.module.css'

export interface DecoMoonDef {
  id: string
  top: string
  left?: string
  right?: string
  size: number
  opacity: number
  anim: string
}

const DEFAULT_DECO_MOONS: DecoMoonDef[] = [
  { id: 'atm-bg1', top: '8%', right: '10%', size: 90, opacity: 0.08, anim: 'floatSlow 10s ease-in-out infinite' },
  { id: 'atm-bg2', top: '68%', left: '5%', size: 56, opacity: 0.10, anim: 'floatMedium 8s ease-in-out infinite 1s' },
  { id: 'atm-bg3', top: '78%', right: '12%', size: 120, opacity: 0.05, anim: 'floatSlow 12s ease-in-out infinite 2s' },
  { id: 'atm-bg4', top: '20%', left: '6%', size: 44, opacity: 0.12, anim: 'floatMedium 9s ease-in-out infinite 0.5s' },
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function DecoMoonItem({ id, top, left, right, size, opacity, anim }: DecoMoonDef) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={styles.decoMoon}
      style={{
        '--top': top,
        '--left': left,
        '--right': right,
        '--opacity': opacity,
        '--anim': reducedMotion ? 'none' : anim,
      } as React.CSSProperties}
    >
      <defs>
        <mask id={`atm-deco-${id}`}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver, #cbd5e1)" mask={`url(#atm-deco-${id})`} />
    </svg>
  )
}

export interface AtmosphericBackgroundProps {
  children?: ReactNode
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
  fullScreen = true,
  centered = true,
  compensateBottomNav = true,
  zIndex,
  className = '',
  style,
  role,
  ariaLive,
  moons = DEFAULT_DECO_MOONS,
}: AtmosphericBackgroundProps) {
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
      {/* Resplandores ambientales de Argentum */}
      <div className={styles.ambientGlowTop} aria-hidden="true" />
      <div className={styles.ambientGlowBottom} aria-hidden="true" />

      {/* Lunas flotantes decorativas */}
      {moons.map((moon) => (
        <DecoMoonItem key={moon.id} {...moon} />
      ))}

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

export function AtmosphericMoonIcon({ size = 32 }: { size?: number }) {
  const maskId = `atm-m-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver, #cbd5e1)" mask={`url(#${maskId})`} />
    </svg>
  )
}

export interface AtmosphericLoadingProps {
  text?: string
  fullScreen?: boolean
  zIndex?: number
}

export function AtmosphericLoading({
  text = 'Cargando...',
  fullScreen = true,
  zIndex = 50,
}: AtmosphericLoadingProps) {
  return (
    <AtmosphericBackground
      fullScreen={fullScreen}
      centered
      compensateBottomNav={false}
      zIndex={zIndex}
      role="status"
      ariaLive="polite"
    >
      <div className={styles.loadingWrap}>
        <AtmosphericMoonIcon size={44} />
        <div className={styles.spinner} />
        {text && <span className={styles.loadingText}>{text}</span>}
      </div>
    </AtmosphericBackground>
  )
}

export default AtmosphericBackground

