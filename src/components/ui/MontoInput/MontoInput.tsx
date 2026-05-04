import { useRef, useCallback, useState } from 'react'
import styles from './MontoInput.module.css'

interface MontoInputProps {
  value: number | null
  onChange: (value: number | null) => void
  moneda?: 'ARS' | 'USD'
  placeholder?: string
  disabled?: boolean
  error?: string | null
  label?: string
  autoFocus?: boolean
  className?: string
  inputClassName?: string
  max?: number
  allowDecimals?: boolean
  ghost?: boolean
  optional?: boolean
  prefixClassName?: string
}

function formatearParaMostrar(str: string): string {
  // Quitar todos los puntos de miles actuales
  const num = str.replace(/\./g, '')
  
  // Separar por la coma decimal
  const partes = num.split(',')
  
  // Formatear la parte entera con puntos de miles
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  // Unir de nuevo
  return partes.join(',')
}

function limpiarParaNumero(str: string): string {
  // Quitar puntos de miles y cambiar coma por punto decimal
  return str.replace(/\./g, '').replace(',', '.')
}

export default function MontoInput({
  value,
  onChange,
  moneda = 'ARS',
  placeholder = '0',
  disabled = false,
  error = null,
  label,
  autoFocus = false,
  className,
  inputClassName,
  max,
  allowDecimals = false,
  ghost = false,
  optional = false,
  prefixClassName,
}: MontoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Sincronizar el estado local con el prop value
  const [prevValue, setPrevValue] = useState(value)
  const [inputValue, setInputValue] = useState(() => {
    if (value === null || value === undefined) return ''
    return value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  })

  // Patrón de React: Ajustar estado durante el renderizado cuando las props cambian
  if (value !== prevValue) {
    setPrevValue(value)
    if (value === null || value === undefined) {
      setInputValue('')
    } else {
      const valorActualLimpio = limpiarParaNumero(inputValue)
      const valorActualNum = parseFloat(valorActualLimpio)
      if (valorActualNum !== value) {
        const formatted = value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        setInputValue(formatted)
      }
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    
    // Si está vacío
    if (!raw) {
      setInputValue('')
      onChange(null)
      return
    }

    // Solo permitir números, puntos (que ignoraremos) y una sola coma
    // Si el usuario escribió un punto, lo tratamos como una coma si no hay coma aún
    if (allowDecimals && raw.endsWith('.') && !raw.includes(',')) {
      raw = raw.slice(0, -1) + ','
    }

    // Filtrar caracteres no deseados (solo dígitos, puntos de miles y una coma)
    const regex = allowDecimals ? /[^0-9.,]/g : /[^0-9.]/g
    let cleaned = raw.replace(regex, '')
    
    // Asegurar que solo haya una coma
    if (allowDecimals) {
      const parts = cleaned.split(',')
      if (parts.length > 2) {
        cleaned = parts[0] + ',' + parts.slice(1).join('')
      }
    }

    // Formatear con puntos de miles
    const formatted = formatearParaMostrar(cleaned)
    
    // Guardar posición del cursor antes del cambio
    const input = e.target
    const start = input.selectionStart || 0
    const oldLen = input.value.length
    
    setInputValue(formatted)

    // Parsear a número para el padre
    const paraPadre = limpiarParaNumero(formatted)
    
    // Si termina en coma, no podemos parsear a número todavía, 
    // pero guardamos el valor entero para el estado del padre
    if (paraPadre.endsWith('.')) {
      const num = parseFloat(paraPadre.slice(0, -1))
      onChange(isNaN(num) ? null : num)
    } else {
      const num = allowDecimals ? parseFloat(paraPadre) : parseInt(paraPadre, 10)
      if (!isNaN(num)) {
        if (max === undefined || num <= max) {
          onChange(num)
        }
      } else {
        onChange(null)
      }
    }

    // Ajustar posición del cursor tras el renderizado
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newLen = inputRef.current.value.length
        const newPos = Math.max(0, start + (newLen - oldLen))
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }, [onChange, allowDecimals, max])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegación y edición
    const navKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'
    ]
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) return

    // Si es coma o punto (decimal)
    if (allowDecimals && (e.key === ',' || e.key === '.')) {
      if (inputValue.includes(',')) {
        e.preventDefault()
      }
      return
    }

    // Si no es un dígito, bloquear
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }, [allowDecimals, inputValue])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    // Limpiar el texto pegado: permitir una coma/punto y dígitos
    let cleaned = text.replace(allowDecimals ? /[^0-9,.]/g : /[^0-9]/g, '')
    if (allowDecimals) {
      cleaned = cleaned.replace('.', ',')
      const parts = cleaned.split(',')
      if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    }
    
    const formatted = formatearParaMostrar(cleaned)
    setInputValue(formatted)
    
    const numStr = limpiarParaNumero(formatted)
    const num = parseFloat(numStr)
    if (!isNaN(num)) {
      if (max === undefined || num <= max) {
        onChange(num)
      }
    }
  }, [onChange, allowDecimals, max])

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label}>
          {label}
          {optional && <span className={styles.fieldOptional}>(opcional)</span>}
        </label>
      )}
      <div className={[
        styles.inputWrap,
        ghost ? styles.inputWrapGhost : '',
        error ? styles.inputWrapError : '',
        disabled ? styles.inputWrapDisabled : ''
      ].filter(Boolean).join(' ')}>
        <span className={[styles.prefix, prefixClassName].filter(Boolean).join(' ')}>
          {moneda === 'ARS' ? '$' : 'USD'}
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={[styles.input, inputClassName].filter(Boolean).join(' ')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {error && (
        <p className={styles.error}>{error}</p>
      )}
    </div>
  )
}
