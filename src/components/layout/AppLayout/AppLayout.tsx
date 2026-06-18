import { useId, useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, ArrowUpDown, PieChart, Target, RefreshCw,
  Bell, Search, MoreHorizontal, Sun, Moon, LogOut, ChevronDown, User,
  Calculator, Shield
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import NotificacionesDrawer from '@/components/notificaciones/NotificacionesDrawer'
import SearchModal from './SearchModal'
import styles from './AppLayout.module.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
  { label: 'Herramientas',   path: '/app/herramientas',   Icon: Calculator },
]

const MOBILE_NAV = [
  { label: 'Inicio',         path: '/app/dashboard',      Icon: LayoutDashboard },
  { label: 'Billeteras',     path: '/app/billeteras',     Icon: Wallet          },
  { label: 'Gastos',         path: '/app/transacciones',  Icon: ArrowUpDown     },
  { label: 'Presupuestos',   path: '/app/presupuestos',   Icon: PieChart        },
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

  const getFotoUrl = () => {
    if (!usuario?.foto_url) return null
    if (usuario.foto_url.startsWith('http')) return usuario.foto_url
    return `${API_URL}${usuario.foto_url}`
  }

  const fotoUrl = getFotoUrl()
  const [fotoError, setFotoError] = useState(false)

  const [prevFotoUrl, setPrevFotoUrl] = useState(fotoUrl)
  if (fotoUrl !== prevFotoUrl) {
    setPrevFotoUrl(fotoUrl)
    setFotoError(false)
  }

  const desktopNavItems = [...NAV_MAIN, ...NAV_FINANCIAL]
  if (is_admin) {
    desktopNavItems.push({ label: 'Admin', path: '/admin', Icon: Shield })
  }

  return (
    <div className={styles.root}>

      {/* ── Standalone Logo ──────────────────────── */}
      <Link to="/app/dashboard" className={styles.standaloneLogo} aria-label="Ir al dashboard" title="Argentum">
        <MoonIcon size={24} color="currentColor" />
        <span className={styles.logoTitle}>Argentum</span>
      </Link>

      {/* ── Top Navigation Desktop ──────────────────────── */}
      <div className={styles.topNav}>
        <div className={styles.topNavPill}>
          {desktopNavItems.map(({ label, path, Icon }) => (
            <Link
              key={path}
              to={path}
              className={[styles.navItem, isActive(path) ? styles.navItemActive : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.navIcon}>
                <Icon {...SIDEBAR_ICON_PROPS} />
              </span>
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top Bar Desktop ──────────────────────── */}
      <div className={styles.topBar}>
        
        <div className={styles.topBarActions}>
          {/* Pill 1: Controls */}
          <div className={styles.actionPill}>
            <button className={styles.topBarBtn} onClick={() => setIsSearchOpen(true)} title="Buscar">
              <Search size={18} strokeWidth={1.75} />
            </button>
            <button className={styles.topBarBtn} onClick={() => setIsDrawerOpen(true)} title="Notificaciones">
              <Bell size={18} strokeWidth={1.75} />
              {unreadCount > 0 && <span className={styles.notifDot} />}
            </button>
            <button className={styles.topBarBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
            </button>
          </div>

          {/* Pill 2: User Profile */}
          <div className={styles.profileWrapper}>
            <button className={styles.profilePill} onClick={() => setIsProfileOpen(!isProfileOpen)}>
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
              <ChevronDown size={16} strokeWidth={1.75} className={styles.profileChevron} />
            </button>
            
            {isProfileOpen && (
              <>
                <div className={styles.profileOverlay} onClick={() => setIsProfileOpen(false)} />
                <div className={styles.profileDropdown}>
                  <Link to="/app/perfil" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <User size={16} />
                    <span>Ver perfil</span>
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
      </div>

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
      <nav className={styles.mobileNav}>
        {MOBILE_NAV.map(({ path, Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={[styles.mobileNavItem, active ? styles.mobileNavItemActive : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.mobileNavIcon}>
                <Icon size={24} strokeWidth={1.75} />
              </span>
            </Link>
          )
        })}

        <button
          className={[styles.mobileNavItem, isMoreOpen ? styles.mobileNavItemActive : ''].filter(Boolean).join(' ')}
          onClick={() => setIsMoreOpen((v) => !v)}
          aria-label="Más opciones"
        >
          <span className={styles.mobileNavIcon}>
            <MoreHorizontal size={24} strokeWidth={1.75} />
          </span>
        </button>
      </nav>

      {/* ── Bottom sheet "Más" ───────────────────── */}
      {isMoreOpen && (
        <>
          <div className={styles.moreOverlay} onClick={() => setIsMoreOpen(false)} />
          <div className={styles.moreSheet}>
            <p className={styles.moreSheetTitle}>Más opciones</p>
            {NAV_FINANCIAL.slice(1).map(({ label, path, Icon }) => (
              <Link
                key={path}
                to={path}
                className={[styles.moreItem, isActive(path) ? styles.moreItemActive : ''].filter(Boolean).join(' ')}
              >
                <Icon size={22} strokeWidth={1.75} />
                <span>{label}</span>
              </Link>
            ))}

            {is_admin && (
              <Link
                to="/admin"
                className={[styles.moreItem, isActive('/admin') ? styles.moreItemActive : ''].filter(Boolean).join(' ')}
              >
                <Shield size={22} strokeWidth={1.75} />
                <span>Módulo Admin</span>
              </Link>
            )}

            <div className={styles.moreSeparator} />
            
            <Link 
              to="/app/perfil" 
              className={[styles.moreItem, isActive('/app/perfil') ? styles.moreItemActive : ''].filter(Boolean).join(' ')}
            >
              <User size={22} strokeWidth={1.75} />
              <span>Ver/Editar Perfil</span>
            </Link>

            <button className={styles.moreItem} onClick={() => toggleTheme()}>
              {theme === 'dark' ? <Sun size={22} strokeWidth={1.75} /> : <Moon size={22} strokeWidth={1.75} />}
              <span>Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </button>

            <button 
              className={`${styles.moreItem} ${styles.moreItemDanger}`}
              onClick={() => {
                setIsMoreOpen(false);
                void logout();
              }}
            >
              <LogOut size={22} strokeWidth={1.75} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </>
      )}

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
