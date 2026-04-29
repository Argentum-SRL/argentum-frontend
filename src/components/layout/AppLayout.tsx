import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Billeteras', path: '/app/billeteras', icon: Wallet },
    { name: 'Mi Perfil', path: '/app/perfil', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[var(--page)] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--surface)] border-r border-[var(--surface-alt)] shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[var(--primary)] flex items-center gap-2">
            <span className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white text-sm">A</span>
            Argentum
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-alt)] hover:text-[var(--primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {isActive(item.path) && <ChevronRight size={16} />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--surface-alt)]">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--gold)] flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {usuario?.nombre?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text)] truncate">{usuario?.nombre} {usuario?.apellido}</p>
              <p className="text-xs text-[var(--text-3)] truncate">{usuario?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-2)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--surface)] border-b border-[var(--surface-alt)] px-4 flex items-center justify-between z-50">
        <h1 className="text-xl font-bold text-[var(--primary)]">Argentum</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[var(--text-2)]"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-[var(--surface)] p-4 shadow-xl animate-in slide-in-from-top duration-300" onClick={e => e.stopPropagation()}>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl ${
                      isActive(item.path)
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-2)]'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-red-500 font-medium"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 md:pt-0 overflow-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
