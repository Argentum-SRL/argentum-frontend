import { useRef, useState, useEffect, useCallback, type FC, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target,
  RefreshCw,
  Calculator,
  Shield,
  User,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import styles from './MobileMoreSheet.module.css'

interface MobileMoreSheetProps {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
  theme: string
  toggleTheme: () => void
  onLogout: () => void
  currentPath: string
}

interface MenuItemConfig {
  id: string
  label: string
  Icon: LucideIcon
  path?: string
  action?: () => void
  isDanger?: boolean
}

export const MobileMoreSheet: FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  isAdmin,
  theme,
  toggleTheme,
  onLogout,
  currentPath,
}) => {
  const navigate = useNavigate()
  const sheetRef = useRef<HTMLDivElement | null>(null)

  // Mounting state to allow smooth enter/exit transitions
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const [pressedId, setPressedId] = useState<string | null>(null)

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setShouldRender(true)
    } else {
      setIsVisible(false)
    }
  }

  // Drag-to-dismiss refs
  const dragStartYRef = useRef(0)
  const isDraggingSheetRef = useRef(false)
  const sheetDeltaYRef = useRef(0)

  // Item touch tracking refs
  const itemTouchStartXRef = useRef(0)
  const itemTouchStartYRef = useRef(0)

  // Trigger open/close animations
  useEffect(() => {
    let animId: number
    let timeout: ReturnType<typeof setTimeout>
    if (isOpen) {
      animId = requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      timeout = setTimeout(() => {
        setShouldRender(false)
      }, 240)
    }
    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(timeout)
    }
  }, [isOpen])

  // Graceful animated close
  const triggerClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 220)
  }, [onClose])

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, triggerClose])

  // ── Drag to dismiss handlers ──────────────────────────────────────────────

  const handleHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return
    isDraggingSheetRef.current = true
    dragStartYRef.current = e.clientY
    sheetDeltaYRef.current = 0

    if (sheetRef.current) {
      sheetRef.current.classList.add(styles.sheetDragging)
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handleHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheetRef.current || !sheetRef.current) return
    const deltaY = e.clientY - dragStartYRef.current
    if (deltaY < 0) return // Don't allow upward pull beyond bounds

    sheetDeltaYRef.current = deltaY
    sheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`
  }

  const handleHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheetRef.current) return
    isDraggingSheetRef.current = false

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    if (!sheetRef.current) return
    sheetRef.current.classList.remove(styles.sheetDragging)

    const finalDelta = sheetDeltaYRef.current
    sheetDeltaYRef.current = 0

    if (finalDelta > 65) {
      // Dismiss
      triggerClose()
    } else {
      // Snap back smoothly
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)'
    }
  }

  const handleHandlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSheetRef.current = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }
    if (sheetRef.current) {
      sheetRef.current.classList.remove(styles.sheetDragging)
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)'
    }
  }

  // ── Item interaction handlers (Press and Hold -> Feedback -> Release -> Execute) ───

  const handleItemPointerDown = (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    itemTouchStartXRef.current = e.clientX
    itemTouchStartYRef.current = e.clientY
    setPressedId(id)

    // Immediate tactile pulse on press
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8)
      } catch {
        // Ignore
      }
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handleItemPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pressedId) return
    const deltaX = Math.abs(e.clientX - itemTouchStartXRef.current)
    const deltaY = Math.abs(e.clientY - itemTouchStartYRef.current)
    // Cancel press if finger moves more than 14px in any direction (scrolling / dismiss)
    if (deltaX > 14 || deltaY > 14) {
      setPressedId(null)
    }
  }

  const handleItemPointerUp = (item: MenuItemConfig, e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    if (pressedId === item.id) {
      handleItemSelect(item)
    }
  }

  const handleItemPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }
    setPressedId(null)
  }

  const handleItemSelect = (item: MenuItemConfig) => {
    // Release visual confirmation before action and transition
    setTimeout(() => {
      setPressedId(null)
      triggerClose()

      if (item.path) {
        if (currentPath !== item.path) {
          navigate(item.path)
        }
      } else if (item.action) {
        item.action()
      }
    }, 90)
  }

  if (!shouldRender) return null

  // Financial and tool modules
  const mainItems: MenuItemConfig[] = [
    { id: 'metas', label: 'Metas', Icon: Target, path: '/app/metas' },
    { id: 'suscripciones', label: 'Suscripciones', Icon: RefreshCw, path: '/app/suscripciones' },
  ]

  if (isAdmin) {
    mainItems.push({ id: 'herramientas', label: 'Herramientas', Icon: Calculator, path: '/app/herramientas' })
    mainItems.push({ id: 'admin', label: 'Módulo Admin', Icon: Shield, path: '/admin' })
  }

  // Utility and account actions
  const utilityItems: MenuItemConfig[] = [
    { id: 'perfil', label: 'Mi perfil', Icon: User, path: '/app/perfil' },
    {
      id: 'theme',
      label: `Modo ${theme === 'dark' ? 'Claro' : 'Oscuro'}`,
      Icon: theme === 'dark' ? Sun : Moon,
      action: toggleTheme,
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      Icon: LogOut,
      action: onLogout,
      isDanger: true,
    },
  ]

  const renderItem = (item: MenuItemConfig): ReactNode => {
    const isCurrentActive = item.path ? currentPath === item.path : false
    const isPressed = pressedId === item.id

    const itemClasses = [
      styles.item,
      isCurrentActive ? styles.itemActive : '',
      isPressed ? styles.itemPressed : '',
      item.isDanger ? styles.itemDanger : '',
    ].filter(Boolean).join(' ')

    return (
      <button
        key={item.id}
        type="button"
        className={itemClasses}
        onPointerDown={(e) => handleItemPointerDown(item.id, e)}
        onPointerMove={handleItemPointerMove}
        onPointerUp={(e) => handleItemPointerUp(item, e)}
        onPointerCancel={handleItemPointerCancel}
        aria-label={item.label}
        aria-current={isCurrentActive ? 'page' : undefined}
      >
        <span className={styles.iconWrapper}>
          <item.Icon size={20} strokeWidth={1.75} />
        </span>
        <span className={styles.itemLabel}>{item.label}</span>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ''}`}
        onClick={triggerClose}
        aria-hidden="true"
      />

      {/* Floating Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Más opciones"
        className={`${styles.sheet} ${isVisible ? styles.sheetVisible : ''}`}
      >
        {/* Drag handle */}
        <div
          className={styles.handleContainer}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerUp}
          onPointerCancel={handleHandlePointerCancel}
          aria-hidden="true"
        >
          <div className={styles.handle} />
        </div>

        {/* Header */}
        <div className={styles.sheetHeader}>
          <p className={styles.sheetTitle}>Más opciones</p>
        </div>

        {/* Main navigation options */}
        <div className={styles.itemsList}>
          {mainItems.map(renderItem)}
        </div>

        {/* Separator */}
        <div className={styles.separator} />

        {/* Utility / Account options */}
        <div className={styles.itemsList}>
          {utilityItems.map(renderItem)}
        </div>
      </div>
    </>
  )
}

export default MobileMoreSheet
