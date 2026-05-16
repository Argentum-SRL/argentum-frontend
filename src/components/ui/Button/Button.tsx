import { memo, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import styles from './Button.module.css'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  className?: string
  fullWidth?: boolean
}

const Button = memo(({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  variant = 'primary',
  className,
  fullWidth = false,
}: ButtonProps) => {
  const cls = [
    styles.btn, 
    styles[variant], 
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cls}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
