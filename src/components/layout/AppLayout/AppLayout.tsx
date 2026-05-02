import { useId, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, ArrowUpDown, PieChart, Target, RefreshCw,
  Bell, Search, MoreHorizontal, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import styles from './AppLayout.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Icons ──────────────────────────────────────────────────────────────────

const ICON_PROPS = { size: 20, strokeWidth: 1.75 }

function MoonIcon() {
  const maskId = `moon-${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={28} height={28} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="rgba(255,255,255,0.85)" mask={`url(#${maskId})`} />
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
  const { usuario, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Reset mobile menu on navigation
  const [prevPath, setPrevPath] = useState(location.pathname)
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

  return (
    <div className={styles.root}>

      {/* ── Desktop sidebar ──────────────────────── */}
      <aside className={styles.sidebar}>
        {/* Decorative circles */}
        <div className={styles.decoTop} aria-hidden="true" />
        <div className={styles.decoBottom} aria-hidden="true" />

        {/* Logo */}
        <Link to="/app/dashboard" className={styles.logo} aria-label="Ir al dashboard">
          <MoonIcon />
          <span className={styles.logoText}>Argentum</span>
        </Link>

        {/* Nav main */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {NAV_MAIN.map(({ label, path, Icon }) => (
              <Link
                key={path}
                to={path}
                className={[styles.navItem, isActive(path) ? styles.navItemActive : ''].filter(Boolean).join(' ')}
              >
                <Icon {...ICON_PROPS} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navSeparator} />

          <div className={styles.navSection}>
            {NAV_FINANCIAL.map(({ label, path, Icon }) => (
              <Link
                key={path}
                to={path}
                className={[styles.navItem, isActive(path) ? styles.navItemActive : ''].filter(Boolean).join(' ')}
              >
                <Icon {...ICON_PROPS} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* User block */}
        <div className={styles.userBlock}>
          <Link to="/app/perfil" className={styles.userInner} aria-label="Ir al perfil">
            <div className={styles.avatar}>
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto de perfil" className={styles.avatarImage} />
              ) : (
                inicial
              )}
            </div>
            <div className={styles.userMeta}>
              <p className={styles.userName}>
                {usuario?.nombre ?? ''} {usuario?.apellido ?? ''}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun {...ICON_PROPS} /> : <Moon {...ICON_PROPS} />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            type="button"
            className={styles.logoutQuickAction}
            onClick={() => { void logout() }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────── */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>
          <MoonIcon />
          <span className={styles.mobileLogoText}>Argentum</span>
        </div>
        <div className={styles.mobileActions}>
          <button className={styles.mobileIconBtn} aria-label="Notificaciones">
            <Bell size={22} strokeWidth={1.75} />
          </button>
          <button
            className={styles.mobileIconBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={22} strokeWidth={1.75} /> : <Moon size={22} strokeWidth={1.75} />}
          </button>
          <button className={styles.mobileIconBtn} aria-label="Buscar">
            <Search size={22} strokeWidth={1.75} />
          </button>
          <div className={styles.mobileAvatar}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto de perfil" className={styles.mobileAvatarImage} />
            ) : (
              inicial
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ────────────────────── */}
      <nav className={styles.mobileNav}>
        {MOBILE_NAV.map(({ label, path, Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={[styles.mobileNavItem, active ? styles.mobileNavItemActive : ''].filter(Boolean).join(' ')}
            >
              <Icon {...ICON_PROPS} />
              <span className={styles.mobileNavLabel}>{label}</span>
              {active && <span className={styles.mobileNavDot} />}
            </Link>
          )
        })}

        <button
          className={[styles.mobileNavItem, isMoreOpen ? styles.mobileNavItemActive : ''].filter(Boolean).join(' ')}
          onClick={() => setIsMoreOpen((v) => !v)}
          aria-label="Más opciones"
        >
          <MoreHorizontal {...ICON_PROPS} />
          <span className={styles.mobileNavLabel}>Más</span>
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
          </div>
        </>
      )}

      {/* ── Main content ─────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

    </div>
  )
}
