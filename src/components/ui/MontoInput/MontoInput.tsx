import { useRef, useCallback, useState, memo } from 'react'
import styles from './MontoInput.module.css'

interface MontoInputProps {
  value: number | null
  onChange: (value: number | null) => void
  moneda?: 'ARS' | 'USD'
  onMonedaChange?: (moneda: 'ARS' | 'USD') => void
  placeholder?: string
  disabled?: boolean
  error?: string | null
  label?: string
  autoFocus?: boolean
  className?: string
  max?: number
  allowDecimals?: boolean
  optional?: boolean
  hideCurrency?: boolean
  compact?: boolean
}

function formatearParaMostrar(str: string): string {
  const num = str.replace(/\./g, '')
  const partes = num.split(',')
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return partes.join(',')
}

function limpiarParaNumero(str: string): string {
  return str.replace(/\./g, '').replace(',', '.')
}

const MontoInput = memo(({
  value,
  onChange,
  moneda = 'ARS',
  onMonedaChange,
  placeholder = '0',
  disabled = false,
  error = null,
  label,
  autoFocus = false,
  className,
  max,
  allowDecimals = false,
  optional = false,
  hideCurrency = false,
  compact = false,
}: MontoInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [prevValue, setPrevValue] = useState(value)
  const [inputValue, setInputValue] = useState(() => {
    if (value === null || value === undefined) return ''
    return value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  })

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
    if (!raw) { setInputValue(''); onChange(null); return }
    if (allowDecimals && raw.endsWith('.') && !raw.includes(',')) raw = raw.slice(0, -1) + ','
    const regex = allowDecimals ? /[^0-9.,]/g : /[^0-9.]/g
    let cleaned = raw.replace(regex, '')
    if (allowDecimals) {
      const parts = cleaned.split(',')
      if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    }
    const formatted = formatearParaMostrar(cleaned)
    const start = e.target.selectionStart || 0
    const oldLen = e.target.value.length
    setInputValue(formatted)
    const paraPadre = limpiarParaNumero(formatted)
    if (paraPadre.endsWith('.')) {
      const num = parseFloat(paraPadre.slice(0, -1))
      onChange(isNaN(num) ? null : num)
    } else {
      const num = allowDecimals ? parseFloat(paraPadre) : parseInt(paraPadre, 10)
      if (!isNaN(num)) { if (max === undefined || num <= max) onChange(num) }
      else onChange(null)
    }
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newLen = inputRef.current.value.length
        const newPos = Math.max(0, start + (newLen - oldLen))
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }, [onChange, allowDecimals, max])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End']
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) return
    if (allowDecimals && (e.key === ',' || e.key === '.')) {
      if (inputValue.includes(',')) e.preventDefault()
      return
    }
    if (!/[0-9]/.test(e.key)) e.preventDefault()
  }, [allowDecimals, inputValue])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
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
    if (!isNaN(num) && (max === undefined || num <= max)) onChange(num)
  }, [onChange, allowDecimals, max])

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label}>
          {label}
          {optional && <span className={styles.fieldOptional}> (opcional)</span>}
        </label>
      )}
      <div className={[
        styles.montoHero,
        compact ? styles.montoHeroCompact : '',
        error ? styles.montoHeroError : '',
        disabled ? styles.montoHeroDisabled : ''
      ].filter(Boolean).join(' ')}>
        {/* Chip de moneda — clickeable solo si onMonedaChange está definido */}
        {!hideCurrency && (
          <>
            <button
              type="button"
              className={styles.monedaToggleChip}
              onClick={() => onMonedaChange && !disabled && onMonedaChange(moneda === 'ARS' ? 'USD' : 'ARS')}
              disabled={disabled || !onMonedaChange}
              aria-label={onMonedaChange ? `Moneda actual: ${moneda}. Click para cambiar.` : `Moneda: ${moneda}`}
              title={onMonedaChange ? 'Cambiar moneda' : undefined}
            >
              <span className={styles.monedaChipFlag}>{moneda === 'ARS' ? '🇦🇷' : '🇺🇸'}</span>
              <span className={styles.monedaChipLabel}>{moneda}</span>
            </button>
            <div className={styles.montoDivider} />
          </>
        )}
        <div className={styles.montoHeroInput}>
          <span className={styles.montoHeroPrefix}>$</span>
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
            className={styles.montoHeroField}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
})

MontoInput.displayName = 'MontoInput'
export default MontoInput
