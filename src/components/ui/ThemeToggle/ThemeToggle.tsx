import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import styles from './ThemeToggle.module.css'

export interface ThemeToggleProps {
  variant?: 'floating' | 'inline'
  className?: string
  style?: React.CSSProperties
  size?: number
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'floating',
  className = '',
  style,
  size = 20,
}) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={[
        styles.toggleBtn,
        variant === 'floating' ? styles.floating : styles.inline,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className={styles.iconWrap}>
        {isDark ? (
          <Sun size={size} strokeWidth={1.8} className={styles.iconSun} />
        ) : (
          <Moon size={size} strokeWidth={1.8} className={styles.iconMoon} />
        )}
      </span>
    </button>
  )
}

export default ThemeToggle
