import React from 'react'
import { X } from 'lucide-react'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}

const Drawer: React.FC<DrawerProps> = ({ 
  open, 
  onClose, 
  title, 
  children,
  footer,
  width
}) => {
  const drawerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      if (drawerRef.current && width) {
        drawerRef.current.style.setProperty('--drawer-width', `${width}px`)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open, width])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        ref={drawerRef}
        className={styles.drawer} 
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

export default Drawer
