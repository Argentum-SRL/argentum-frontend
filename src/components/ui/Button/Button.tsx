import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import styles from './Button.module.css'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
}

export default function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  variant = 'primary',
  className,
}: ButtonProps) {
  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(' ')

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
}
