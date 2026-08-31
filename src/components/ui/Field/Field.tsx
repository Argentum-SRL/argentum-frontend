import { memo, type ReactNode } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  name?: string
  autoComplete?: string
  autoFocus?: boolean
  error?: string | null
  rightSlot?: ReactNode
  placeholder?: string
  hint?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'search' | 'url' | 'none' | 'decimal'
  maxLength?: number
  id?: string
}

const Field = memo(({
  label,
  value,
  onChange,
  type = 'text',
  name,
  autoComplete,
  autoFocus,
  error,
  rightSlot,
  placeholder,
  hint,
  inputMode,
  maxLength,
  id,
}: FieldProps) => {
  const inputCls = [
    styles.input,
    error ? styles.inputError : '',
    rightSlot ? styles.inputWithSlot : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={inputCls}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
        />
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
})

Field.displayName = 'Field'

export default Field
