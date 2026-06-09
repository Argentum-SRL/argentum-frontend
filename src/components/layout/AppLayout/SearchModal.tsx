import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Moon, Sun, User, LogOut, Wallet, Target, 
  PieChart, RefreshCw, LayoutDashboard, ArrowUpDown, 
  Plus, X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useModal } from '@/hooks/useModal'
import Modal from '@/components/ui/Modal/Modal'
import transaccionService from '@/services/transaccion.service'
import billeteraService from '@/services/billetera.service'
import goalsService from '@/services/goals.service'
import presupuestoService from '@/services/presupuesto.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import type { Billetera, Categoria, TarjetaCredito, Transaccion, Presupuesto } from '@/types'
import type { Goal } from '@/types/goals'
import styles from './SearchModal.module.css'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResultItem {
  type: 'nav' | 'action' | 'billetera' | 'meta' | 'presupuesto' | 'transaccion'
  id: string
  title: string
  subtitle: string
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  path?: string
  action?: () => void
  extra?: string
  extraSub?: string
}

const normalizeStr = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { open } = useModal()

  const [query, setQuery] = useState('')
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [metas, setMetas] = useState<Goal[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on open and clean state on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Defer state updates to avoid synchronous setState inside effect body
      const timer = setTimeout(() => {
        setQuery('')
        setTransacciones([])
        setSelectedIndex(0)
        setLoadingTransactions(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Load contextual data for searching client-side and modal trigger payloads
  useEffect(() => {
    if (!isOpen) return

    let active = true

    const loadData = async () => {
      try {
        const [resBilleteras, resCategorias, resTarjetas, resMetas, resPresupuestos] = await Promise.all([
          billeteraService.list(),
          categoriaService.getCategorias(),
          tarjetaService.getTarjetas(),
          goalsService.getGoals(),
          presupuestoService.getPresupuestos()
        ])
        
        if (active) {
          setBilleteras(resBilleteras)
          setCategorias(resCategorias)
          setTarjetas(resTarjetas)
          setMetas(resMetas)
          setPresupuestos(resPresupuestos)
        }
      } catch (err) {
        console.error('Error loading search context data:', err)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [isOpen])

  // Debounced transaction search from the API
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await transaccionService.getTransacciones({ busqueda: query, limit: 4 })
        setTransacciones(res)
      } catch (err) {
        console.error('Error fetching search transactions:', err)
      } finally {
        setLoadingTransactions(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  // Static items: Navigation (respects app Lucide icons)
  const itemsNavegacion = [
    { id: 'nav-dash', title: 'Dashboard', path: '/app/dashboard', Icon: LayoutDashboard },
    { id: 'nav-bill', title: 'Billeteras', path: '/app/billeteras', Icon: Wallet },
    { id: 'nav-tran', title: 'Transacciones', path: '/app/transacciones', Icon: ArrowUpDown },
    { id: 'nav-pres', title: 'Presupuestos', path: '/app/presupuestos', Icon: PieChart },
    { id: 'nav-meta', title: 'Metas de Ahorro', path: '/app/metas', Icon: Target },
    { id: 'nav-susc', title: 'Suscripciones', path: '/app/suscripciones', Icon: RefreshCw },
    { id: 'nav-perf', title: 'Perfil', path: '/app/perfil', Icon: User }
  ]

  // Handlers for modal actions
  const handleNuevaTransaccion = () => {
    open('transaccion', {
      data: {
        transaccion: null,
        billeteras,
        categorias,
        tarjetas,
        onSuccess: () => {}
      }
    })
    onClose()
  }

  const handleNuevaMeta = () => {
    open('goal', {
      data: {
        goal: null,
        onSuccess: () => {}
      }
    })
    onClose()
  }

  const handleNuevoPresupuesto = () => {
    open('presupuesto', {
      data: {
        presupuesto: null,
        categorias,
        onSuccess: () => {}
      }
    })
    onClose()
  }

  const handleLogout = () => {
    void logout()
    onClose()
  }

  const handleToggleTheme = () => {
    toggleTheme()
    onClose()
  }

  // Static items: Actions
  const itemsAcciones = [
    { id: 'act-new-tx', title: 'Nueva Transacción', subtitle: 'Registrar ingreso/egreso', Icon: Plus, action: handleNuevaTransaccion },
    { id: 'act-new-goal', title: 'Crear Meta', subtitle: 'Establecer objetivo de ahorro', Icon: Plus, action: handleNuevaMeta },
    { id: 'act-new-budget', title: 'Crear Presupuesto', subtitle: 'Crear límite de gasto', Icon: Plus, action: handleNuevoPresupuesto },
    { id: 'act-toggle-theme', title: `Tema ${theme === 'dark' ? 'Claro' : 'Oscuro'}`, subtitle: 'Alternar modo visual', Icon: theme === 'dark' ? Sun : Moon, action: handleToggleTheme },
    { id: 'act-logout', title: 'Cerrar Sesión', subtitle: 'Salir de la cuenta', Icon: LogOut, action: handleLogout }
  ]

  // Filtering
  const filteredNav = itemsNavegacion.filter(item => 
    normalizeStr(item.title).includes(normalizeStr(query))
  )

  const filteredAcciones = itemsAcciones.filter(item =>
    normalizeStr(item.title).includes(normalizeStr(query)) ||
    normalizeStr(item.subtitle).includes(normalizeStr(query))
  )

  const filteredBilleteras = billeteras.filter(b =>
    normalizeStr(b.nombre).includes(normalizeStr(query)) ||
    normalizeStr(b.moneda).includes(normalizeStr(query))
  )

  const filteredMetas = metas.filter(g =>
    normalizeStr(g.nombre).includes(normalizeStr(query))
  )

  const filteredPresupuestos = presupuestos.filter(p =>
    normalizeStr(p.nombre).includes(normalizeStr(query))
  )

  // Construct flattened list for index navigation
  const results: SearchResultItem[] = []

  // Fill in order of relevance
  filteredNav.forEach(n => results.push({ type: 'nav', id: n.id, title: n.title, subtitle: '', Icon: n.Icon, path: n.path }))
  filteredAcciones.forEach(a => results.push({ type: 'action', id: a.id, title: a.title, subtitle: a.subtitle, Icon: a.Icon, action: a.action }))
  
  const visibleBilleteras = query ? filteredBilleteras : filteredBilleteras.slice(0, 4)
  visibleBilleteras.forEach(b => results.push({
    type: 'billetera',
    id: `bill-${b.id}`,
    title: b.nombre,
    subtitle: b.es_efectivo ? 'Efectivo' : 'Banco / Cuenta Digital',
    Icon: Wallet,
    extra: `${b.moneda} ${b.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    path: `/app/billeteras/${b.id}`
  }))

  const visiblePresupuestos = query ? filteredPresupuestos : filteredPresupuestos.slice(0, 3)
  visiblePresupuestos.forEach(p => results.push({
    type: 'presupuesto',
    id: `pres-${p.id}`,
    title: p.nombre,
    subtitle: `Límite: ${p.moneda} ${p.monto.toLocaleString('es-AR')}`,
    Icon: PieChart,
    extra: p.periodo_actual ? `${p.periodo_actual.porcentaje_usado.toFixed(0)}%` : '',
    path: '/app/presupuestos'
  }))

  const visibleMetas = query ? filteredMetas : filteredMetas.slice(0, 3)
  visibleMetas.forEach(g => results.push({
    type: 'meta',
    id: `meta-${g.id}`,
    title: g.nombre,
    subtitle: `Objetivo: ${g.moneda} ${g.monto_objetivo.toLocaleString('es-AR')}`,
    Icon: Target,
    extra: `${((g.monto_actual / g.monto_objetivo) * 100).toFixed(0)}%`,
    path: `/app/metas/${g.id}`
  }))

  transacciones.forEach(t => {
    const formatMonto = t.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })
    results.push({
      type: 'transaccion',
      id: `tx-${t.id}`,
      title: t.descripcion || 'Sin descripción',
      subtitle: `${t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} • ${new Date(t.fecha).toLocaleDateString('es-AR')}`,
      Icon: ArrowUpDown,
      extra: `${t.tipo === 'ingreso' ? '+' : '-'} ${t.moneda} ${formatMonto}`,
      extraSub: billeteras.find(b => b.id === t.billetera_id)?.nombre || '',
      action: () => {
        open('transaccion', {
          data: {
            transaccion: t,
            billeteras,
            categorias,
            tarjetas,
            onSuccess: () => {}
          }
        })
        onClose()
      }
    })
  })

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected) {
        handleTriggerItem(selected)
      }
    }
  }

  const handleTriggerItem = (item: SearchResultItem) => {
    if ((item.type === 'nav' || item.type === 'billetera' || item.type === 'meta' || item.type === 'presupuesto') && item.path) {
      navigate(item.path)
      onClose()
    } else if (item.type === 'action' && item.action) {
      item.action()
    } else if (item.type === 'transaccion' && item.action) {
      item.action()
    }
  }

  const getGlobalIndex = (id: string) => results.findIndex(item => item.id === id)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      size="lg"
      ariaLabel="Buscador global"
    >
      <div className={styles.formContainer} onKeyDown={handleKeyDown}>
        
        {/* Header Search Input */}
        <div className={styles.formHeader}>
          <div className={styles.searchTitleArea}>
            <Search size={18} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Buscar transacciones, billeteras, metas o acciones..."
              value={query}
              onChange={(e) => {
                const val = e.target.value
                setQuery(val)
                setSelectedIndex(0)
                if (!val.trim() || val.trim().length < 2) {
                  setTransacciones([])
                  setLoadingTransactions(false)
                } else {
                  setLoadingTransactions(true)
                }
              }}
            />
          </div>
          <div className={styles.headerActions}>
            <span className={styles.shortcutBadge}>ESC</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar buscador"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.formBody}>
          <div className={styles.scrollArea}>
            {loadingTransactions && (
              <div className={styles.loadingWrapper}>
                <RefreshCw size={24} className={styles.spinner} />
              </div>
            )}

            {results.length === 0 && !loadingTransactions && (
              <div className={styles.emptyState}>
                <Search className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No se encontraron resultados</h3>
                <p className={styles.emptyText}>
                  Prueba con otros términos de búsqueda como "Dashboard", "Sueldo" o el nombre de tu banco.
                </p>
              </div>
            )}

            {results.length > 0 && (
              <>
                {/* Category: Navegación */}
                {filteredNav.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Navegación</h4>
                    <div className={styles.grid}>
                      {filteredNav.map(n => {
                        const idx = getGlobalIndex(n.id)
                        const isSel = idx === selectedIndex
                        return (
                          <div
                            key={n.id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(results[idx])}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_nav}`}>
                              <n.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{n.title}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Category: Acciones Rápidas */}
                {filteredAcciones.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Acciones Rápidas</h4>
                    <div className={styles.grid}>
                      {filteredAcciones.map(a => {
                        const idx = getGlobalIndex(a.id)
                        const isSel = idx === selectedIndex
                        return (
                          <div
                            key={a.id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(results[idx])}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_action}`}>
                              <a.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{a.title}</span>
                              <span className={styles.cardSubtitle}>{a.subtitle}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Category: Billeteras */}
                {visibleBilleteras.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Billeteras ({filteredBilleteras.length})</h4>
                    <div className={styles.grid}>
                      {visibleBilleteras.map(b => {
                        const id = `bill-${b.id}`
                        const idx = getGlobalIndex(id)
                        const isSel = idx === selectedIndex
                        const item = results[idx]
                        if (!item) return null
                        return (
                          <div
                            key={id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_billetera}`}>
                              <item.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{item.title}</span>
                              <span className={styles.cardExtra}>{item.extra}</span>
                              <span className={styles.cardSubtitle}>{item.subtitle}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Category: Presupuestos */}
                {visiblePresupuestos.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Presupuestos ({filteredPresupuestos.length})</h4>
                    <div className={styles.grid}>
                      {visiblePresupuestos.map(p => {
                        const id = `pres-${p.id}`
                        const idx = getGlobalIndex(id)
                        const isSel = idx === selectedIndex
                        const item = results[idx]
                        if (!item) return null
                        return (
                          <div
                            key={id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_presupuesto}`}>
                              <item.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{item.title}</span>
                              {item.extra && <span className={styles.cardExtra}>{item.extra} usado</span>}
                              <span className={styles.cardSubtitle}>{item.subtitle}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Category: Metas */}
                {visibleMetas.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Metas de Ahorro ({filteredMetas.length})</h4>
                    <div className={styles.grid}>
                      {visibleMetas.map(g => {
                        const id = `meta-${g.id}`
                        const idx = getGlobalIndex(id)
                        const isSel = idx === selectedIndex
                        const item = results[idx]
                        if (!item) return null
                        return (
                          <div
                            key={id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_meta}`}>
                              <item.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{item.title}</span>
                              <span className={styles.cardExtra}>{item.extra} completado</span>
                              <span className={styles.cardSubtitle}>{item.subtitle}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Category: Transacciones */}
                {transacciones.length > 0 && (
                  <div className={styles.group}>
                    <h4 className={styles.groupTitle}>Transacciones ({transacciones.length})</h4>
                    <div className={styles.grid}>
                      {transacciones.map(t => {
                        const id = `tx-${t.id}`
                        const idx = getGlobalIndex(id)
                        const isSel = idx === selectedIndex
                        const item = results[idx]
                        if (!item) return null
                        return (
                          <div
                            key={id}
                            className={`${styles.gridCard} ${isSel ? styles.gridCardActive : ''}`}
                            onClick={() => handleTriggerItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className={`${styles.iconWrapper} ${styles.nivel_transaccion}`}>
                              <item.Icon size={18} />
                            </div>
                            <div className={styles.cardBody}>
                              <span className={styles.cardTitle}>{item.title}</span>
                              <span className={styles.cardExtra}>{item.extra}</span>
                              <span className={styles.cardSubtitle}>{item.subtitle}</span>
                              {item.extraSub && <span className={styles.cardExtraSub}>{item.extraSub}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </Modal>
  )
}
