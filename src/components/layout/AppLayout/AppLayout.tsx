import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Billeteras', path: '/app/billeteras', icon: Wallet },
    { name: 'Mi Perfil', path: '/app/perfil', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={styles.root}>
      {/* Sidebar Desktop */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>
            <span className={styles.sidebarBadge}>A</span>
            Argentum
          </h1>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            const linkCls = [styles.navLink, active ? styles.navLinkActive : '']
              .filter(Boolean)
              .join(' ')

            return (
              <Link key={item.path} to={item.path} className={linkCls}>
                <div className={styles.navLinkInner}>
                  <Icon size={20} className={styles.navIcon} />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight size={16} />}
              </Link>
            )
          })}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {usuario?.nombre?.charAt(0) || 'U'}
            </div>
            <div className={styles.userMeta}>
              <p className={styles.userName}>{usuario?.nombre} {usuario?.apellido}</p>
              <p className={styles.userEmail}>{usuario?.email}</p>
            </div>
          </div>
          <button onClick={() => logout()} className={styles.logoutBtn}>
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <h1 className={styles.mobileTitle}>Argentum</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={styles.menuBtn}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={e => e.stopPropagation()}>
            <nav className={styles.mobileNav}>
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                const linkCls = [styles.mobileNavLink, active ? styles.mobileNavLinkActive : '']
                  .filter(Boolean)
                  .join(' ')

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={linkCls}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                }}
                className={styles.mobileLogoutBtn}
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
