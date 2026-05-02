import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Drawer.module.css'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number // ancho en desktop, default 400px
}

export function Drawer({ isOpen, onClose, title, children, width = 400 }: DrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div
        className={[
          styles.drawer, 
          isOpen ? styles.drawerOpen : '',
          width === 480 ? styles.w480 : ''
        ].filter(Boolean).join(' ')}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </>
  )
}
