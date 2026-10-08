import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { type Theme, ThemeContext } from './ThemeContext'
import { updateSystemBars } from '@/utils/systemTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('argentum_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      // Fallback si localStorage no está disponible
    }
    return 'light'
  })

  const applyTheme = useCallback((newTheme: Theme) => {
    const isDark = newTheme === 'dark'
    const themeColor = isDark ? '#0E1117' : '#FAF7F2'

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

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('argentum_theme', newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('argentum_theme', nextTheme)
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
