import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    const docTheme =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'light'
    return {
      theme: docTheme as 'light' | 'dark',
      toggleTheme: () => {},
    }
  }
  return ctx
}
