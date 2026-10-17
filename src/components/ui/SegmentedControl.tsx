import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption<T extends string = string> {
  value: T
  label: string
  /* Línea secundaria opcional para mostrar información complementaria */
  description?: string
  /* Indicador numérico o texto breve opcional junto a la etiqueta */
  badge?: number | string
  icon?: ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
  fullWidth?: boolean
  layout?: 'inline' | 'stacked' | 'wrap'
}

/**
 * Componente SegmentedControl oficial de Argentum (Selector Cápsula).
 * Implementa el patrón accesibilidad WAI-ARIA radiogroup completo con
 * navegación táctil y por teclado (flechas, Home y End).
 */
export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = 'Opciones de selección',
  fullWidth = false,
  layout = 'inline',
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Buscar el índice activo entre las opciones habilitadas
  const currentIndex = options.findIndex((opt) => opt.value === value)

  const selectOptionByIndex = (targetIndex: number) => {
    const targetOption = options[targetIndex]
    if (targetOption && !targetOption.disabled) {
      onChange(targetOption.value)
      buttonRefs.current[targetIndex]?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = options.length
    if (total === 0) return

    let nextIndex = -1

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault()
        // Buscar el siguiente elemento no deshabilitado
        for (let i = 1; i <= total; i++) {
          const candidate = (index + i) % total
          if (!options[candidate]?.disabled) {
            nextIndex = candidate
            break
          }
        }
        break
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault()
        // Buscar el anterior elemento no deshabilitado
        for (let i = 1; i <= total; i++) {
          const candidate = (index - i + total) % total
          if (!options[candidate]?.disabled) {
            nextIndex = candidate
            break
          }
        }
        break
      }
      case 'Home': {
        e.preventDefault()
        // Buscar el primer elemento habilitado
        for (let i = 0; i < total; i++) {
          if (!options[i]?.disabled) {
            nextIndex = i
            break
          }
        }
        break
      }
      case 'End': {
        e.preventDefault()
        // Buscar el último elemento habilitado
        for (let i = total - 1; i >= 0; i--) {
          if (!options[i]?.disabled) {
            nextIndex = i
            break
          }
        }
        break
      }
      default:
        break
    }

    if (nextIndex !== -1 && nextIndex !== index) {
      selectOptionByIndex(nextIndex)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        styles.track,
        layout === 'wrap' ? styles.trackWrap : '',
        fullWidth ? styles.fullWidth : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {options.map((option, idx) => {
        const isActive = option.value === value
        const isDisabled = Boolean(option.disabled)

        // En radiogroup el tabIndex es 0 para el activo, o para el primero si ninguno está activo
        const isFocusable = isActive || (currentIndex === -1 && idx === 0 && !isDisabled)

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[idx] = el
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isDisabled ? 'true' : undefined}
            tabIndex={isFocusable ? 0 : -1}
            disabled={isDisabled}
            className={[
              styles.pill,
              layout === 'stacked' ? styles.pillStacked : '',
              layout === 'wrap' ? styles.pillWrap : '',
              isActive ? styles.pillActive : '',
              isDisabled ? styles.pillDisabled : '',
            ].filter(Boolean).join(' ')}
            onClick={() => {
              if (!isDisabled && !isActive) {
                onChange(option.value)
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {option.icon ? <span className={styles.icon}>{option.icon}</span> : null}
            {option.description ? (
              /* Contenedor en columna para etiqueta y descripción secundaria */
              <span className={styles.text}>
                <span className={styles.label}>{option.label}</span>
                <span className={styles.description}>{option.description}</span>
              </span>
            ) : (
              <span className={styles.label}>{option.label}</span>
            )}
            {option.badge !== undefined && (
              <span className={styles.badge}>{option.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
