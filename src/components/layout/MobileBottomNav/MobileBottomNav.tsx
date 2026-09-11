import { useRef, useState, useMemo, useLayoutEffect, useEffect, type FC } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const navRef = useRef<HTMLElement | null>(null)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  // Touch & gesture tracking refs (direct manipulation, no react state per pixel)
  const isPointerDownRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isCancelledRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const previewIndexRef = useRef<number>(-1)

  // React state for preview feedback on icons (only changes when crossing slot boundary)
  const [previewIndex, setPreviewIndex] = useState<number>(-1)

  // Determine active slot index based on router path or "Más" state
  const activeIndex = useMemo(() => {
    if (isMoreOpen) return 4
    return MOBILE_NAV.findIndex(item => location.pathname === item.path)
  }, [isMoreOpen, location.pathname])

  // Synchronize the physical indicator position when activeIndex changes and not dragging
  useLayoutEffect(() => {
    if (isDraggingRef.current) return
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
      if (isDraggingRef.current) return
      const indicator = indicatorRef.current
      if (indicator && activeIndex >= 0 && itemRefs.current[activeIndex]) {
        indicator.style.transform = `translate3d(${itemRefs.current[activeIndex]!.offsetLeft}px, 0, 0)`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIndex])

  // ── Pointer Event Handlers ────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return

    isPointerDownRef.current = true
    isDraggingRef.current = false
    isCancelledRef.current = false
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    pointerIdRef.current = e.pointerId
    previewIndexRef.current = activeIndex

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignored for environments with restricted pointer capture
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current || isCancelledRef.current) return

    const deltaX = Math.abs(e.clientX - startXRef.current)
    const deltaY = e.clientY - startYRef.current

    // Vertical threshold check: if dragged > 70px away from the bar, cancel gesture
    if (Math.abs(deltaY) > 70) {
      isCancelledRef.current = true
      isDraggingRef.current = false
      previewIndexRef.current = -1
      setPreviewIndex(-1)

      if (indicatorRef.current) {
        indicatorRef.current.classList.remove(styles.indicatorDragging)
        if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
          indicatorRef.current.style.opacity = '1'
          indicatorRef.current.style.transform = `translate3d(${itemRefs.current[activeIndex]!.offsetLeft}px, 0, 0)`
        } else {
          indicatorRef.current.style.opacity = '0'
        }
      }
      return
    }

    // Horizontal threshold to differentiate tap from drag
    if (!isDraggingRef.current) {
      if (deltaX >= 6) {
        isDraggingRef.current = true
        suppressClickRef.current = true
        if (indicatorRef.current) {
          indicatorRef.current.classList.add(styles.indicatorDragging)
          indicatorRef.current.style.opacity = '1'
        }
      } else {
        return
      }
    }

    // Direct continuous indicator movement (zero React re-renders for translation)
    const navEl = navRef.current
    const indicatorEl = indicatorRef.current
    if (!navEl || !indicatorEl) return

    const navRect = navEl.getBoundingClientRect()
    const fingerX = e.clientX - navRect.left
    const indicatorWidth = indicatorEl.offsetWidth || 52
    const targetX = fingerX - indicatorWidth / 2

    const firstItem = itemRefs.current[0]
    const lastItem = itemRefs.current[4]
    const minX = firstItem ? firstItem.offsetLeft : 4
    const maxX = lastItem ? lastItem.offsetLeft : 228

    const clampedX = Math.max(minX, Math.min(maxX, targetX))
    indicatorEl.style.transform = `translate3d(${clampedX}px, 0, 0)`

    // Find nearest slot for preview feedback
    let closest = 0
    let minDiff = Infinity
    for (let i = 0; i < 5; i++) {
      const item = itemRefs.current[i]
      if (item) {
        const center = item.offsetLeft + item.offsetWidth / 2
        const diff = Math.abs(fingerX - center)
        if (diff < minDiff) {
          minDiff = diff
          closest = i
        }
      }
    }

    if (closest !== previewIndexRef.current) {
      previewIndexRef.current = closest
      setPreviewIndex(closest)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8)
        } catch {
          // Ignore
        }
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    const wasDragging = isDraggingRef.current
    const wasCancelled = isCancelledRef.current
    const finalSlot = previewIndexRef.current

    isDraggingRef.current = false
    isCancelledRef.current = false
    pointerIdRef.current = null
    previewIndexRef.current = -1
    setPreviewIndex(-1)

    const indicatorEl = indicatorRef.current
    if (indicatorEl) {
      indicatorEl.classList.remove(styles.indicatorDragging)
    }

    if (wasCancelled) {
      if (indicatorEl && activeIndex >= 0 && itemRefs.current[activeIndex]) {
        indicatorEl.style.opacity = '1'
        indicatorEl.style.transform = `translate3d(${itemRefs.current[activeIndex]!.offsetLeft}px, 0, 0)`
      }
      setTimeout(() => {
        suppressClickRef.current = false
      }, 50)
      return
    }

    if (wasDragging) {
      // Snap smoothly to the final selected slot
      const targetItem = itemRefs.current[finalSlot]
      if (indicatorEl && targetItem) {
        indicatorEl.style.opacity = '1'
        indicatorEl.style.transform = `translate3d(${targetItem.offsetLeft}px, 0, 0)`
      }

      // Execute definitive navigation or modal toggle only on release
      if (finalSlot === 4) {
        onToggleMore()
      } else if (finalSlot >= 0 && finalSlot < 4) {
        const destPath = MOBILE_NAV[finalSlot].path
        if (location.pathname !== destPath) {
          navigate(destPath)
        }
      }

      setTimeout(() => {
        suppressClickRef.current = false
      }, 100)
    } else {
      suppressClickRef.current = false
    }
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLElement>) => {
    isPointerDownRef.current = false
    isDraggingRef.current = false
    isCancelledRef.current = false
    pointerIdRef.current = null
    previewIndexRef.current = -1
    setPreviewIndex(-1)

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    const indicatorEl = indicatorRef.current
    if (indicatorEl) {
      indicatorEl.classList.remove(styles.indicatorDragging)
      if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
        indicatorEl.style.opacity = '1'
        indicatorEl.style.transform = `translate3d(${itemRefs.current[activeIndex]!.offsetLeft}px, 0, 0)`
      } else {
        indicatorEl.style.opacity = '0'
      }
    }

    setTimeout(() => {
      suppressClickRef.current = false
    }, 50)
  }

  const handleClick = (e: React.MouseEvent, index: number) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (index === 4) {
      onToggleMore()
    }
  }

  return (
    <nav
      ref={navRef}
      className={styles.mobileNav}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label="Navegación principal inferior"
    >
      {/* Physical sliding pill indicator */}
      <div ref={indicatorRef} className={styles.indicator} aria-hidden="true" />

      {/* Navigation items */}
      <div className={styles.itemsWrapper}>
        {MOBILE_NAV.map(({ label, path, Icon }, idx) => {
          const isActive = activeIndex === idx
          const isPreview = previewIndex === idx

          return (
            <Link
              key={path}
              to={path}
              ref={(el) => { itemRefs.current[idx] = el }}
              className={[
                styles.mobileNavItem,
                isActive ? styles.mobileNavItemActive : '',
                isPreview ? styles.mobileNavItemPreview : '',
              ].filter(Boolean).join(' ')}
              onClick={(e) => handleClick(e, idx)}
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
            previewIndex === 4 ? styles.mobileNavItemPreview : '',
          ].filter(Boolean).join(' ')}
          onClick={(e) => handleClick(e, 4)}
          aria-label="Más opciones"
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
