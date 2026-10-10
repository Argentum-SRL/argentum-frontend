import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { type Theme, ThemeContext } from './ThemeContext'
import { updateSystemBars } from '@/utils/systemTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

function getSystemTheme(): Theme {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('argentum_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      // Fallback si localStorage no está disponible
    }
    return getSystemTheme()
  })

  const applyTheme = useCallback((newTheme: Theme) => {
    const isDark = newTheme === 'dark'
    const themeColor = isDark ? '#060B14' : '#FAF7F2'

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
    }

    updateSystemBars(themeColor, isDark)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  // Escuchar activamente el modo de color del sistema si el usuario no ha guardado una preferencia manual
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem('argentum_theme')
        if (!saved) {
          setThemeState(e.matches ? 'dark' : 'light')
        }
      } catch {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('argentum_theme', newTheme)
    } catch {
      // Fallback silencioso
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem('argentum_theme', nextTheme)
      } catch {
        // Fallback silencioso
      }
      return nextTheme
    })
  }, [])

  const contextValue = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
