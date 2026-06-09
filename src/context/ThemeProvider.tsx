import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { type Theme, ThemeContext } from './ThemeContext'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('argentum_theme') as Theme
    if (saved) return saved
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const applyTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
    }

    // Actualizar la etiqueta meta theme-color dinámicamente para Safari/iOS
    const themeColor = newTheme === 'dark' ? '#0E1117' : '#0D2045'
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]')
    existingMetas.forEach(meta => meta.remove())

    const newMeta = document.createElement('meta')
    newMeta.setAttribute('name', 'theme-color')
    newMeta.setAttribute('content', themeColor)
    document.head.appendChild(newMeta)
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
