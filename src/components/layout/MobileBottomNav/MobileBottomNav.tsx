import { useRef, useMemo, useLayoutEffect, useEffect, useCallback, type FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  PieChart,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import styles from './MobileBottomNav.module.css'

interface NavItemConfig {
  label: string
  path: string
  Icon: LucideIcon
}

const MOBILE_NAV: NavItemConfig[] = [
  { label: 'Inicio',       path: '/app/dashboard',     Icon: LayoutDashboard },
  { label: 'Billeteras',   path: '/app/billeteras',    Icon: Wallet          },
  { label: 'Gastos',       path: '/app/transacciones', Icon: ArrowUpDown     },
  { label: 'Presupuestos', path: '/app/presupuestos',  Icon: PieChart        },
]

interface MobileBottomNavProps {
  isMoreOpen: boolean
  onToggleMore: () => void
}

export const MobileBottomNav: FC<MobileBottomNavProps> = ({ isMoreOpen, onToggleMore }) => {
  const location = useLocation()

  const navRef = useRef<HTMLElement | null>(null)
  const itemsWrapperRef = useRef<HTMLDivElement | null>(null)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  // Determine active slot index based on router path or "Más" state
  const activeIndex = useMemo(() => {
    if (isMoreOpen) return 4
    return MOBILE_NAV.findIndex(item => location.pathname === item.path)
  }, [isMoreOpen, location.pathname])

  // Synchronize the physical indicator position when activeIndex changes
  useLayoutEffect(() => {
    const indicator = indicatorRef.current
    if (!indicator) return

    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      const targetItem = itemRefs.current[activeIndex]!
      indicator.style.opacity = '1'
      indicator.style.transform = `translate3d(${targetItem.offsetLeft}px, 0, 0)`
    } else {
      indicator.style.opacity = '0'
    }
  }, [activeIndex])

  // Handle window resize or orientation change to adjust indicator position
  useEffect(() => {
    const handleResize = () => {
      const indicator = indicatorRef.current
      if (indicator && activeIndex >= 0 && itemRefs.current[activeIndex]) {
        indicator.style.transform = `translate3d(${itemRefs.current[activeIndex]!.offsetLeft}px, 0, 0)`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIndex])

  // Direct toggle for the 3-dots button without artificial debounce or event suppression
  const handleToggleMore = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8)
      } catch {
        // Ignore
      }
    }

    onToggleMore()
  }, [onToggleMore])

  return (
    <nav
      ref={navRef}
      className={styles.mobileNav}
      aria-label="Navegación principal inferior"
    >
      <div ref={itemsWrapperRef} className={styles.itemsWrapper}>
        {/* Physical sliding pill indicator */}
        <div ref={indicatorRef} className={styles.indicator} aria-hidden="true" />

        {/* Navigation items */}
        {MOBILE_NAV.map(({ label, path, Icon }, idx) => {
          const isActive = activeIndex === idx

          return (
            <Link
              key={path}
              to={path}
              ref={(el) => { itemRefs.current[idx] = el }}
              className={[
                styles.mobileNavItem,
                isActive ? styles.mobileNavItemActive : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (isMoreOpen) {
                  onToggleMore()
                }
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.mobileNavIcon}>
                <Icon size={24} strokeWidth={1.75} />
              </span>
            </Link>
          )
        })}

        {/* 5th slot: Más opciones */}
        <button
          ref={(el) => { itemRefs.current[4] = el }}
          className={[
            styles.mobileNavItem,
            activeIndex === 4 ? styles.mobileNavItemActive : '',
          ].filter(Boolean).join(' ')}
          onClick={handleToggleMore}
          aria-label="Más opciones"
          aria-expanded={isMoreOpen}
          type="button"
        >
          <span className={styles.mobileNavIcon}>
            <MoreHorizontal size={24} strokeWidth={1.75} />
          </span>
        </button>
      </div>
    </nav>
  )
}

export default MobileBottomNav
