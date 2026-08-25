import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption<T extends string = string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}

export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = 'Opciones de visualización'
}: SegmentedControlProps<T>) {
  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
