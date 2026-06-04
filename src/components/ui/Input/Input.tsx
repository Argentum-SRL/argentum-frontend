import React from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <input 
        className={`${styles.input} ${icon ? styles.withIcon : ''}`} 
        {...props} 
      />
    </div>
  )
}
