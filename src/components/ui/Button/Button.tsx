import { memo, type ReactNode } from 'react'
import { LunarLoader } from '@/components/ui/LunarLoader'
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
      data-loading={loading ? 'true' : undefined}
      className={cls}
    >
      {loading ? (
        <>
          <LunarLoader size={20} />
          <span className={styles.btnText}>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
