import { useId, useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, ArrowUpDown, PieChart, Target, RefreshCw,
  Bell, Search, Sun, Moon, LogOut, ChevronDown, User,
  Calculator, Shield
} from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import NotificacionesDrawer from '@/components/notificaciones/NotificacionesDrawer'
import SearchModal from './SearchModal'
import MobileBottomNav from '@/components/layout/MobileBottomNav/MobileBottomNav'
import MobileMoreSheet from '@/components/layout/MobileBottomNav/MobileMoreSheet'
import { getFotoUrl } from '@/utils/fotoUrl'
import styles from './AppLayout.module.css'

// ── Icons ──────────────────────────────────────────────────────────────────

const SIDEBAR_ICON_PROPS = { size: 18, strokeWidth: 1.75 }

function MoonIcon({ size = 28, color = 'rgba(255,255,255,0.85)' }: { size?: number, color?: string } = {}) {
  const maskId = `moon-${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill={color} mask={`url(#${maskId})`} />
    </svg>
  )
}

// ── Nav config ─────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { label: 'Dashboard',      path: '/app/dashboard',      Icon: LayoutDashboard },
  { label: 'Billeteras',     path: '/app/billeteras',     Icon: Wallet          },
  { label: 'Transacciones',  path: '/app/transacciones',  Icon: ArrowUpDown     },
]

const NAV_FINANCIAL = [
  { label: 'Presupuestos',   path: '/app/presupuestos',   Icon: PieChart  },
  { label: 'Metas',          path: '/app/metas',           Icon: Target    },
  { label: 'Suscripciones',  path: '/app/suscripciones',  Icon: RefreshCw },
]


// ── AppLayout ──────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { usuario, logout, is_admin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotificaciones()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const location = useLocation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [prevPath, setPrevPath] = useState(location.pathname)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname)
    setIsMoreOpen(false)
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  const inicial = usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'U'

  const fotoUrl = getFotoUrl(usuario?.foto_url)
  const [fotoError, setFotoError] = useState(false)

  const [prevFotoUrl, setPrevFotoUrl] = useState(fotoUrl)
  if (fotoUrl !== prevFotoUrl) {
    setPrevFotoUrl(fotoUrl)
    setFotoError(false)
  }

  const desktopNavItems = [...NAV_MAIN, ...NAV_FINANCIAL]
  if (is_admin) {
    desktopNavItems.push({ label: 'Herramientas', path: '/app/herramientas', Icon: Calculator })
    desktopNavItems.push({ label: 'Admin', path: '/admin', Icon: Shield })
  }

  return (
    <div className={styles.root}>

      {/* ── Top Header Desktop & Tablet ─────────────────── */}
      <header className={styles.desktopHeader}>
        {/* Left: Brand Logo */}
        <div className={styles.headerLeft}>
          <Link to="/app/dashboard" className={styles.standaloneLogo} aria-label="Ir al dashboard" title="Argentum">
            <MoonIcon size={24} color="currentColor" />
            <span className={styles.logoTitle}>Argentum</span>
          </Link>
        </div>

        {/* Center: Top Navigation */}
        <nav className={styles.headerCenter} aria-label="Navegación principal">
          <div className={styles.topNavPill}>
            {desktopNavItems.map(({ label, path, Icon }) => (
              <Link
                key={path}
                to={path}
                className={[styles.navItem, isActive(path) ? styles.navItemActive : ''].filter(Boolean).join(' ')}
                onMouseEnter={() => setHoveredNav(path)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <span className={styles.navIcon}>
                  <Icon {...SIDEBAR_ICON_PROPS} isHovered={hoveredNav === path} />
                </span>
                <span className={styles.navLabel}>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Right: Actions and Profile */}
        <div className={styles.headerRight}>
          {/* Pill 1: Controls */}
          <div className={styles.actionPill}>
            <button
              className={styles.topBarBtn}
              onClick={() => setIsSearchOpen(true)}
              title="Buscar"
              onMouseEnter={() => setHoveredBtn('search')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <Search size={18} strokeWidth={1.75} isHovered={hoveredBtn === 'search'} />
            </button>
            <button
              className={styles.topBarBtn}
              onClick={() => setIsDrawerOpen(true)}
              title="Notificaciones"
              onMouseEnter={() => setHoveredBtn('bell')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <Bell size={18} strokeWidth={1.75} isHovered={hoveredBtn === 'bell'} />
              {unreadCount > 0 && <span className={styles.notifDot} />}
            </button>
            <button
              className={styles.topBarBtn}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              onMouseEnter={() => setHoveredBtn('theme')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.75} isHovered={hoveredBtn === 'theme'} />
              ) : (
                <Moon size={18} strokeWidth={1.75} isHovered={hoveredBtn === 'theme'} />
              )}
            </button>
          </div>

          {/* Pill 2: User Profile */}
          <div className={styles.profileWrapper}>
            <button
              className={styles.profilePill}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title={usuario?.nombre ? `${usuario.nombre} (${usuario.email || ''})` : 'Perfil'}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              onMouseEnter={() => setHoveredBtn('profile')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <div className={styles.topBarAvatar}>
                {fotoUrl && !fotoError
                  ? <img src={fotoUrl} alt="avatar" referrerPolicy="no-referrer" onError={() => setFotoError(true)} />
                  : <span>{inicial}</span>
                }
              </div>
              <div className={styles.topBarUserInfo}>
                <span className={styles.topBarUserName}>{usuario?.nombre}</span>
                {usuario?.email && <span className={styles.topBarUserEmail}>{usuario.email}</span>}
              </div>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={styles.profileChevron}
                isHovered={hoveredBtn === 'profile'}
              />
            </button>
            
            {isProfileOpen && (
              <>
                <div className={styles.profileOverlay} onClick={() => setIsProfileOpen(false)} />
                <div className={styles.profileDropdown}>
                  <Link to="/app/perfil" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <User size={16} />
                    <span>Mi perfil</span>
                  </Link>
                  <button className={styles.dropdownItem} onClick={() => { setIsProfileOpen(false); void logout(); }}>
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile header ────────────────────────── */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>
          <MoonIcon />
          <span className={styles.mobileLogoText}>Argentum</span>
        </div>
        <div className={styles.mobileActions}>
          <button className={styles.mobileIconBtn} onClick={() => setIsDrawerOpen(true)} aria-label="Notificaciones">
            <Bell size={22} strokeWidth={1.75} />
            {unreadCount > 0 && <span className={styles.notifDot} />}
          </button>
          <button
            className={styles.mobileIconBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={22} strokeWidth={1.75} /> : <Moon size={22} strokeWidth={1.75} />}
          </button>
          <button className={styles.mobileIconBtn} onClick={() => setIsSearchOpen(true)} aria-label="Buscar">
            <Search size={22} strokeWidth={1.75} />
          </button>
          <div className={styles.mobileAvatar}>
            {fotoUrl && !fotoError ? (
              <img src={fotoUrl} alt="Foto de perfil" className={styles.mobileAvatarImage} referrerPolicy="no-referrer" onError={() => setFotoError(true)} />
            ) : (
              inicial
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ────────────────────── */}
      <MobileBottomNav isMoreOpen={isMoreOpen} onToggleMore={() => setIsMoreOpen((v) => !v)} />

      {/* ── Mobile More Options Sheet ─────────────── */}
      <MobileMoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        isAdmin={!!is_admin}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={() => void logout()}
        currentPath={location.pathname}
      />

      {/* ── Main content ─────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificacionesDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

    </div>
  )
}
