import { useRef, useState, type FC, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Target,
  RefreshCw,
  Repeat,
  Calculator,
  Shield,
  User,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
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
  Icon: LucideIcon | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; isHovered?: boolean }>
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
  const [pressedId, setPressedId] = useState<string | null>(null)

  // Item touch tracking refs
  const itemTouchStartXRef = useRef(0)
  const itemTouchStartYRef = useRef(0)

  // ── Item interaction handlers (Tactile feedback + reliable selection) ───

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

  const handleItemPointerUp = () => {
    setPressedId(null)
  }

  const handleItemPointerCancel = () => {
    setPressedId(null)
  }

  const handleItemSelect = (item: MenuItemConfig) => {
    setPressedId(null)
    onClose()

    setTimeout(() => {
      if (item.path) {
        if (currentPath !== item.path) {
          navigate(item.path)
        }
      } else if (item.action) {
        item.action()
      }
    }, 120)
  }

  // Financial and tool modules
  const mainItems: MenuItemConfig[] = [
    { id: 'metas', label: 'Metas', Icon: Target, path: '/app/metas' },
    { id: 'suscripciones', label: 'Suscripciones', Icon: RefreshCw, path: '/app/suscripciones' },
    { id: 'herramientas', label: 'Herramientas', Icon: Calculator, path: '/app/herramientas' },
    { id: 'analisis', label: 'Análisis', Icon: Activity, path: '/app/analisis' },
    ...(isAdmin ? [
      { id: 'lo-que-se-repite', label: 'Lo que se repite', Icon: Repeat, path: '/app/lo-que-se-repite' },
      { id: 'admin', label: 'Módulo Admin', Icon: Shield, path: '/admin' },
    ] : []),
  ]

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
        onPointerUp={handleItemPointerUp}
        onPointerCancel={handleItemPointerCancel}
        onClick={() => handleItemSelect(item)}
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
    <Modal
      variant="sheet"
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      ariaLabel="Más opciones"
    >
      <div className={styles.sheetInner} data-modal-frame>
        {/* Header */}
        <div className={styles.sheetHeader}>
          <p className={styles.sheetTitle}>Más opciones</p>
        </div>

        {/* Main navigation options */}
        <div className={styles.itemsList} data-modal-options>
          {mainItems.map(renderItem)}
        </div>

        {/* Separator */}
        <div className={styles.separator} />

        {/* Utility / Account options */}
        <div className={styles.itemsList} data-modal-options>
          {utilityItems.map(renderItem)}
        </div>
      </div>
    </Modal>
  )
}

export default MobileMoreSheet
