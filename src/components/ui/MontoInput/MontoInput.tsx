import { useRef, useCallback, useState, memo } from 'react'
import { formatMonto } from '@/utils/format'
import styles from './MontoInput.module.css'

export const BanderaArgentina: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 20 14"
    width="20"
    height="14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    style={{ borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}
  >
    {/* Franja superior celeste */}
    <rect width="20" height="4.66" fill="#75AADB" />
    {/* Franja media blanca */}
    <rect y="4.66" width="20" height="4.68" fill="#FFFFFF" />
    {/* Franja inferior celeste */}
    <rect y="9.34" width="20" height="4.66" fill="#75AADB" />
    {/* Sol de Mayo en el centro */}
    <circle cx="10" cy="7" r="1.75" fill="#F6B40E" stroke="#B87B00" strokeWidth="0.3" />
    <circle cx="10" cy="7" r="2.3" stroke="#F6B40E" strokeWidth="0.4" strokeDasharray="0.6 0.6" />
    <circle cx="10" cy="7" r="0.6" fill="#B87B00" opacity="0.8" />
  </svg>
)

export const BanderaUSA: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 20 14"
    width="20"
    height="14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    style={{ borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}
  >
    <rect width="20" height="14" fill="#B22234" />
    <path d="M0 1.55h20M0 3.65h20M0 5.75h20M0 7.85h20M0 9.95h20M0 12.05h20" stroke="#FFFFFF" strokeWidth="1.08" />
    <rect width="8" height="7.5" fill="#3C3B6E" />
    <circle cx="2.5" cy="2.2" r="0.5" fill="#FFFFFF" />
    <circle cx="5.5" cy="2.2" r="0.5" fill="#FFFFFF" />
    <circle cx="4" cy="3.75" r="0.5" fill="#FFFFFF" />
    <circle cx="2.5" cy="5.3" r="0.5" fill="#FFFFFF" />
    <circle cx="5.5" cy="5.3" r="0.5" fill="#FFFFFF" />
  </svg>
)

interface MontoInputProps {
  id?: string
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
  variant?: 'hero' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
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
  id,
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
  hideCurrency = false,
  compact = false,
  variant = 'hero',
  size = 'md',
}: MontoInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExceedingMax, setIsExceedingMax] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [prevValue, setPrevValue] = useState(value)
  const [inputValue, setInputValue] = useState(() => {
    if (value === null || value === undefined) return ''
    return formatearParaMostrar(value.toString().replace('.', ','))
  })

  if (value !== prevValue) {
    setPrevValue(value)
    if (value === null || value === undefined) {
      if (!isExceedingMax) {
        setInputValue('')
        setInternalError(null)
      }
    } else {
      setIsExceedingMax(false)
      setInternalError(null)
      const valorActualLimpio = limpiarParaNumero(inputValue)
      const valorActualNum = parseFloat(valorActualLimpio)
      if (valorActualNum !== value) {
        const formatted = formatearParaMostrar(value.toString().replace('.', ','))
        setInputValue(formatted)
      }
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (!raw) {
      setInputValue('')
      setIsExceedingMax(false)
      setInternalError(null)
      onChange(null)
      return
    }
    // Normalizar punto como decimal → coma (estilo argentino)
    if (raw.endsWith('.') && !raw.includes(',')) raw = raw.slice(0, -1) + ','
    // Siempre permitir coma (separador decimal argentino) y punto (separador de miles)
    let cleaned = raw.replace(/[^0-9.,]/g, '')
    // Solo una coma permitida
    const parts = cleaned.split(',')
    if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    const formatted = formatearParaMostrar(cleaned)
    const start = e.target.selectionStart || 0
    const oldLen = e.target.value.length
    setInputValue(formatted)
    const paraPadre = limpiarParaNumero(formatted)

    let num: number | null
    if (paraPadre.endsWith('.')) {
      const parsed = parseFloat(paraPadre.slice(0, -1))
      num = isNaN(parsed) ? null : parsed
    } else {
      const parsed = allowDecimals ? parseFloat(paraPadre) : parseInt(paraPadre, 10)
      num = isNaN(parsed) ? null : parsed
    }

    if (num !== null && max !== undefined && num > max) {
      setIsExceedingMax(true)
      setInternalError(`No puede superar ${formatMonto(max, moneda)}.`)
      onChange(null)
    } else {
      setIsExceedingMax(false)
      setInternalError(null)
      onChange(num)
    }

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newLen = inputRef.current.value.length
        const newPos = Math.max(0, start + (newLen - oldLen))
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }, [onChange, allowDecimals, max, moneda])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End']
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) return
    // Aceptar coma y punto como separador decimal siempre (handleChange lo sanitiza)
    if (e.key === ',' || e.key === '.') {
      if (inputValue.includes(',')) e.preventDefault()
      return
    }
    if (!/[0-9]/.test(e.key)) e.preventDefault()
  }, [inputValue])

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
    const parsed = allowDecimals ? parseFloat(numStr) : parseInt(numStr, 10)
    const num = isNaN(parsed) ? null : parsed

    if (num !== null && max !== undefined && num > max) {
      setIsExceedingMax(true)
      setInternalError(`No puede superar ${formatMonto(max, moneda)}.`)
      onChange(null)
    } else {
      setIsExceedingMax(false)
      setInternalError(null)
      onChange(num)
    }
  }, [onChange, allowDecimals, max, moneda])

  const effectiveError = error || internalError

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={[
        styles.montoHero,
        variant === 'outlined' ? styles.montoOutlined : '',
        variant === 'outlined' && size === 'lg' ? styles.montoOutlinedLg : '',
        compact ? styles.montoHeroCompact : '',
        effectiveError ? styles.montoHeroError : '',
        disabled ? styles.montoHeroDisabled : ''
      ].filter(Boolean).join(' ')}>
        {/* Chip de moneda — bandera nacional y etiqueta legible, accesible */}
        {!hideCurrency && (
          <>
            <button
              type="button"
              className={styles.monedaToggleChip}
              onClick={() => onMonedaChange && !disabled && onMonedaChange(moneda === 'ARS' ? 'USD' : 'ARS')}
              disabled={disabled || !onMonedaChange}
              aria-label={
                onMonedaChange
                  ? `Moneda actual: ${moneda === 'ARS' ? 'Pesos argentinos (ARS)' : 'Dólares estadounidenses (USD)'}. Click para cambiar.`
                  : `Moneda: ${moneda === 'ARS' ? 'Pesos argentinos (ARS)' : 'Dólares estadounidenses (USD)'}`
              }
              title={onMonedaChange ? 'Cambiar moneda' : undefined}
            >
              {moneda === 'ARS' ? (
                <BanderaArgentina className={styles.monedaFlag} />
              ) : (
                <BanderaUSA className={styles.monedaFlag} />
              )}
              <span className={styles.monedaChipLabel}>{moneda === 'ARS' ? 'Pesos' : 'Dólares'}</span>
            </button>
            <div className={styles.montoDivider} />
          </>
        )}
        <div className={styles.montoHeroInput}>
          <span className={styles.montoHeroPrefix}>{moneda === 'USD' ? 'US$' : '$'}</span>
          <input
            id={id}
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
      {effectiveError && <p className={styles.error}>{effectiveError}</p>}
    </div>
  )
})

MontoInput.displayName = 'MontoInput'
export default MontoInput
