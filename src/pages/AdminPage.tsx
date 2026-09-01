import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import adminService from '@/services/adminService'
import type { UsuarioAdminResumen, UsuarioAdmin, FiltrosAdmin, AdminStats } from '@/types/admin'
import { Button, EmptyState, SelectInput } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import {
  Search,
  Loader2,
  AlertTriangle,
  UserX,
  UserCheck,
  KeyRound,
  LogOut,
  MessageSquareOff,
  MessageSquare,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  Users,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Trash2
} from 'lucide-react'
import { getFotoUrl } from '@/utils/fotoUrl'
import { formatFecha, formatFechaHora } from '@/utils/format'
import styles from './AdminPage.module.css'

// TableAvatar component to fetch and render user profile picture or fallback initials
function TableAvatar({ fotoUrl, nombre }: { fotoUrl: string | null; nombre: string | null }) {
  const [error, setError] = useState(false)
  
  const resolvedUrl = getFotoUrl(fotoUrl)
  const inicial = nombre?.charAt(0)?.toUpperCase() ?? 'U'

  if (resolvedUrl && !error) {
    return (
      <div className={styles.tableAvatar}>
        <img 
          src={resolvedUrl} 
          alt="avatar" 
          referrerPolicy="no-referrer" 
          onError={() => setError(true)} 
        />
      </div>
    )
  }

  return (
    <div className={styles.tableAvatar}>
      <span>{inicial}</span>
    </div>
  )
}

export default function AdminPage() {
  const { usuario: currentAdmin } = useAuth()
  const { showToast } = useToast()
  
  // Tab activa
  const [activeTab, setActiveTab] = useState<'usuarios' | 'wpp' | 'scheduler'>('usuarios')
  
  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Lista de usuarios
  const [usuarios, setUsuarios] = useState<UsuarioAdminResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Paginación y filtros
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<FiltrosAdmin['estado']>('')
  const [onboardingFilter, setOnboardingFilter] = useState<FiltrosAdmin['onboarding']>('')
  const [wppFilter, setWppFilter] = useState<FiltrosAdmin['wpp']>('')
  
  // Detalle de usuario
  const [selectedUser, setSelectedUser] = useState<UsuarioAdmin | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  
  // Confirmaciones e inline feedback
  const [confirmAction, setConfirmAction] = useState<{
    type: 'estado' | 'reset-password' | 'revocar' | 'wpp' | 'onboarding' | 'cambiar-admin' | 'eliminar'
    title: string
    description: string
    requireDouble?: boolean
    requireEmail?: boolean
    expectedEmail?: string
  } | null>(null)
  const [doubleConfirmChecked, setDoubleConfirmChecked] = useState(false)
  const [emailConfirmInput, setEmailConfirmInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null)

  // Debounce para búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Obtener estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getStats()
      if (res.success) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Obtener lista de usuarios
  const fetchUsuarios = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const filters: FiltrosAdmin = {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        estado: estadoFilter || undefined,
        onboarding: onboardingFilter || undefined,
        wpp: wppFilter || undefined,
      }
      
      const res = await adminService.getUsuarios(filters, signal)
      if (res.success) {
        setUsuarios(res.data.usuarios)
        setTotalPages(res.data.pages)
      } else {
        setError('No se pudieron cargar los usuarios.')
      }
    } catch (err) {
      const errorObj = err as { name?: string }
      if (errorObj.name !== 'CanceledError' && errorObj.name !== 'AbortError') {
        setError(getErrorMessage(err, 'No pudimos cargar la información de los usuarios.'))
      }
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, estadoFilter, onboardingFilter, wppFilter])

  // Cargar stats al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchStats])

  // Ejecutar fetch en cambios de filtros
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchUsuarios(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchUsuarios])

  // Refrescar todo manualmente
  const handleRefreshAll = () => {
    fetchStats()
    fetchUsuarios()
    if (selectedUser) {
      handleVerDetalle(selectedUser.id)
    }
  }

  // Obtener detalle de usuario específico
  const handleVerDetalle = async (id: string) => {
    setLoadingDetail(true)
    setDetailError(null)
    setSelectedUser(prev => prev && prev.id === id ? prev : null)
    setConfirmAction(null)
    setActionFeedback(null)
    setDoubleConfirmChecked(false)
    setEmailConfirmInput('')
    try {
      const res = await adminService.getUsuario(id)
      if (res.success) {
        setSelectedUser(res.data)
      } else {
        setDetailError('No se pudo obtener el detalle del usuario.')
      }
    } catch (err) {
      setDetailError(getErrorMessage(err, 'No pudimos obtener el detalle del usuario.'))
    } finally {
      setLoadingDetail(false)
    }
  }

  // Handler para limpiar feedback
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [actionFeedback])

  // Ejecutar acción de admin confirmada
  const handleExecuteAction = async () => {
    if (!selectedUser || !confirmAction) return
    
    setActionLoading(true)
    setActionFeedback(null)
    
    try {
      let message = ''
      
      switch (confirmAction.type) {
        case 'estado': {
          const newStatus = !selectedUser.is_active
          const res = await adminService.cambiarEstado(selectedUser.id, newStatus)
          if (res.success) {
            setSelectedUser(res.data)
            setUsuarios((prev) =>
              prev.map((u) => (u.id === selectedUser.id ? { ...u, is_active: res.data.is_active } : u))
            )
            message = res.message || `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente.`
          }
          break
        }
        case 'reset-password': {
          const res = await adminService.resetPassword(selectedUser.id)
          if (res.success) {
            message = res.message || 'Email de restablecimiento enviado correctamente.'
          }
          break
        }
        case 'revocar': {
          const res = await adminService.revocarSesiones(selectedUser.id)
          if (res.success) {
            message = res.message || 'Sesiones revocadas exitosamente.'
          }
          break
        }
        case 'wpp': {
          const res = await adminService.desconectarWpp(selectedUser.id)
          if (res.success) {
            setSelectedUser(res.data)
            setUsuarios((prev) =>
              prev.map((u) => (u.id === selectedUser.id ? { ...u, whatsapp_vinculado: res.data.whatsapp_vinculado } : u))
            )
            message = res.message || 'WhatsApp desconectado correctamente.'
          }
          break
        }
        case 'onboarding': {
          if (!doubleConfirmChecked) {
            setActionLoading(false)
            return
          }
          const res = await adminService.resetearOnboarding(selectedUser.id)
          if (res.success) {
            setSelectedUser(res.data)
            setUsuarios((prev) =>
              prev.map((u) => (u.id === selectedUser.id ? { ...u, onboarding_completado: res.data.onboarding_completado } : u))
            )
            message = res.message || 'Onboarding reseteado correctamente.'
          }
          break
        }
        case 'cambiar-admin': {
          const newAdminStatus = !selectedUser.is_admin
          const res = await adminService.cambiarRolAdmin(selectedUser.id, newAdminStatus)
          if (res.success) {
            setSelectedUser(res.data)
            setUsuarios((prev) =>
              prev.map((u) => (u.id === selectedUser.id ? { ...u, is_admin: res.data.is_admin } : u))
            )
            message = res.message || (newAdminStatus ? 'Usuario promovido a Administrador.' : 'Rol de Administrador revocado.')
          }
          break
        }
        case 'eliminar': {
          const targetEmail = (confirmAction.expectedEmail || '').trim().toLowerCase()
          if (!emailConfirmInput.trim() || emailConfirmInput.trim().toLowerCase() !== targetEmail) {
            showToast('El email ingresado no coincide con el email de confirmación.', 'error')
            setActionLoading(false)
            return
          }
          const res = await adminService.eliminarCuenta(selectedUser.id, emailConfirmInput.trim())
          if (res.success) {
            message = res.message || 'Usuario y todos sus datos fueron eliminados correctamente.'
            setSelectedUser(null)
          }
          break
        }
      }
      
      setActionFeedback({ success: true, message })
      setConfirmAction(null)
      setDoubleConfirmChecked(false)
      setEmailConfirmInput('')
      
      // Refrescar lista y stats en segundo plano
      fetchUsuarios()
      fetchStats()
    } catch (err) {
      showToast(getErrorMessage(err, "No pudimos completar la acción. Intentá de nuevo."), "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Helper para renderizar páginas de paginación
  const renderPageNumbers = () => {
    const numbers = []
    const range = 2
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - range && i <= page + range)
      ) {
        numbers.push(
          <button
            key={i}
            className={`${styles.paginationBtn} ${page === i ? styles.activePage : ''}`}
            onClick={() => setPage(i)}
          >
            {i}
          </button>
        )
      } else if (i === page - range - 1 || i === page + range + 1) {
        numbers.push(
          <span key={i} className={styles.pageInfo}>
            ...
          </span>
        )
      }
    }
    return numbers
  }

  // Opciones para los select dropdowns customizados
  const estadoOptions = [
    { value: '', label: 'Todos los Estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'bloqueado', label: 'Verificación Pendiente' }
  ]

  const onboardingOptions = [
    { value: '', label: 'Onboarding: Todos' },
    { value: 'completo', label: 'Onboarding: Completo' },
    { value: 'incompleto', label: 'Onboarding: Incompleto' }
  ]

  const wppOptions = [
    { value: '', label: 'WhatsApp: Todos' },
    { value: 'vinculado', label: 'WhatsApp: Vinculado' },
    { value: 'no_vinculado', label: 'WhatsApp: No vinculado' }
  ]

  return (
    <div className={styles.page}>
      
      {/* ── Page Header (Aesthetics like Transacciones) ──────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Panel de Administración</h1>
          <p className={styles.subtitle}>
            {loadingStats ? 'Cargando datos...' : `${stats?.total || 0} usuarios registrados en total`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefreshAll}
            title="Sincronizar datos"
          >
            <RefreshCw size={16} className={`${styles.btnIcon} ${loading || loadingStats ? styles.spin : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* ── KPI Strip (Unified compact bar) ────────────────────────────────────────────── */}
      <div className={styles.kpiStrip}>
        <div className={`${styles.kpiRow} ${styles.kpiRow4}`}>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Total usuarios</span>
            <span className={styles.kpiValue}>{stats?.total ?? 0}</span>
          </div>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Cuentas activas</span>
            <span className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{stats?.activos ?? 0}</span>
            <span className={styles.kpiSub}>de {stats?.total ?? 0} registradas</span>
          </div>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Onboarding completo</span>
            <span className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>{stats?.onboarding_completo ?? 0}</span>
            <span className={styles.kpiSub}>
              {stats?.total ? Math.round((stats.onboarding_completo / stats.total) * 100) : 0}% del total
            </span>
          </div>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>WPP vinculados</span>
            <span className={`${styles.kpiValue} ${styles.kpiValueBlue}`}>{stats?.whatsapp_vinculados ?? 0}</span>
            <span className={styles.kpiSub}>
              {stats?.total ? Math.round((stats.whatsapp_vinculados / stats.total) * 100) : 0}% del total
            </span>
          </div>
        </div>
        <div className={`${styles.kpiRow} ${styles.kpiRow3}`}>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Nuevos hoy</span>
            <span className={styles.kpiValue}>{stats?.nuevos_hoy ?? 0}</span>
          </div>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Nuevos 7 días</span>
            <span className={styles.kpiValue}>{stats?.nuevos_7_dias ?? 0}</span>
          </div>
          <div className={styles.kpiItem}>
            <span className={styles.kpiLabel}>Activos 7 días</span>
            <span className={styles.kpiValue}>{stats?.activos_7_dias ?? 0}</span>
            <span className={styles.kpiSub}>por último acceso</span>
          </div>
        </div>
      </div>

      {/* ── Registro por proveedor (Provider Row) ────────────────────────────────────────── */}
      <div className={styles.providerRow}>
        <div className={styles.providerCard}>
          <div className={`${styles.providerIcon} ${styles.providerIconEmail}`}>
            <Mail size={18} />
          </div>
          <div className={styles.providerInfo}>
            <span className={styles.providerName}>Registro por email</span>
            <span className={styles.providerVal}>{stats?.por_proveedor?.EMAIL ?? 0}</span>
            <span className={styles.providerPct}>
              {stats?.total ? Math.round(((stats.por_proveedor?.EMAIL ?? 0) / stats.total) * 100) : 0}% del total
            </span>
          </div>
        </div>
        <div className={styles.providerCard}>
          <div className={`${styles.providerIcon} ${styles.providerIconGoogle}`}>
            <UserIcon size={18} />
          </div>
          <div className={styles.providerInfo}>
            <span className={styles.providerName}>Registro por Google</span>
            <span className={styles.providerVal}>{stats?.por_proveedor?.GOOGLE ?? 0}</span>
            <span className={styles.providerPct}>
              {stats?.total ? Math.round(((stats.por_proveedor?.GOOGLE ?? 0) / stats.total) * 100) : 0}% del total
            </span>
          </div>
        </div>
        <div className={styles.providerCard}>
          <div className={`${styles.providerIcon} ${styles.providerIconPhone}`}>
            <Phone size={18} />
          </div>
          <div className={styles.providerInfo}>
            <span className={styles.providerName}>Registro por teléfono</span>
            <span className={styles.providerVal}>{stats?.por_proveedor?.TELEFONO ?? 0}</span>
            <span className={styles.providerPct}>
              {stats?.total ? Math.round(((stats.por_proveedor?.TELEFONO ?? 0) / stats.total) * 100) : 0}% del total
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'usuarios' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <Users size={16} />
          <span>Usuarios</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'wpp' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('wpp')}
        >
          <MessageSquare size={16} />
          <span>Monitor WPP / AI</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'scheduler' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          <Clock size={16} />
          <span>Scheduler</span>
        </button>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────────────────── */}
      <div className={styles.tabContent}>
        {activeTab === 'usuarios' && (
          <div className={`${styles.grid} ${selectedUser ? styles.showDetail : styles.showList}`}>
        
        {/* Left Column (Master List) */}
        <div className={styles.masterCol}>
          
          {/* Filters Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                maxLength={150}
                aria-label="Buscar usuarios por nombre, email o teléfono"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filtersGroup}>
              <SelectInput
                value={estadoFilter || ''}
                onChange={(val) => {
                  setEstadoFilter(val as FiltrosAdmin['estado'])
                  setPage(1)
                }}
                options={estadoOptions}
                placeholder="Filtrar por estado"
                className={styles.filterSelect}
              />
              
              <SelectInput
                value={onboardingFilter || ''}
                onChange={(val) => {
                  setOnboardingFilter(val as FiltrosAdmin['onboarding'])
                  setPage(1)
                }}
                options={onboardingOptions}
                placeholder="Filtrar por onboarding"
                className={styles.filterSelect}
              />

              <SelectInput
                value={wppFilter || ''}
                onChange={(val) => {
                  setWppFilter(val as FiltrosAdmin['wpp'])
                  setPage(1)
                }}
                options={wppOptions}
                placeholder="Filtrar por WhatsApp"
                className={styles.filterSelect}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                <span className="text-sm text-gray-500">Cargando listado de usuarios...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-[var(--error)] font-medium">
                {error}
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No se encontraron usuarios con los filtros aplicados.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Usuario</th>
                    <th className={styles.th}>Estado</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const isSelected = selectedUser?.id === u.id
                    return (
                      <tr key={u.id} className={`${styles.tr} ${isSelected ? styles.trSelected : ''}`} onClick={() => handleVerDetalle(u.id)}>
                        <td className={styles.td}>
                          <div className={styles.userCell}>
                            <TableAvatar fotoUrl={u.foto_url} nombre={u.nombre} />
                            <div className={styles.userInfoStack}>
                              <span className={styles.userName}>
                                {[u.nombre, u.apellido].filter(Boolean).join(' ') || <em className="text-gray-400">Sin nombre</em>}
                                {u.is_admin && <span className={styles.adminTag}>Admin</span>}
                              </span>
                              <span className={styles.userEmail}>{u.email || <em className="text-gray-400">Sin email</em>}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.badge} ${u.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant={isSelected ? "primary" : "secondary"}
                              onClick={() => {
                                handleVerDetalle(u.id)
                              }}
                            >
                              Detalle
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationBtn}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Anterior
              </button>
              
              {renderPageNumbers()}
              
              <button
                className={styles.paginationBtn}
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Right Column (Detail View / Support Actions) */}
        <div className={styles.detailCol}>
          {loadingDetail ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <span className="text-sm text-gray-500">Cargando detalles del usuario...</span>
            </div>
          ) : detailError ? (
            <div className="py-12 text-center text-[var(--error)] font-medium">
              {detailError}
            </div>
          ) : selectedUser ? (
            <div className={styles.detailContent}>
              
              {/* Back button (Mobile only) */}
              <button 
                className={styles.backBtn}
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft size={16} />
                <span>Volver al listado</span>
              </button>

              {/* Detail Header */}
              <div className={styles.detailHeader}>
                <TableAvatar fotoUrl={selectedUser.foto_url} nombre={selectedUser.nombre} />
                <div className={styles.detailNameGroup}>
                  <h2>{[selectedUser.nombre, selectedUser.apellido].filter(Boolean).join(' ') || 'Usuario sin nombre'}</h2>
                </div>
              </div>

              {/* Inline Feedback */}
              {actionFeedback && (
                <div className={`${styles.feedbackMessage} ${actionFeedback.success ? styles.successBox : styles.errorBox}`}>
                  {actionFeedback.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* Detail Fields (Redesigned compact table view) */}
              <div className={styles.detailFields}>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <Mail size={14} /> Email
                  </span>
                  <span className={styles.detailFieldValue}>
                    {selectedUser.email || 'No configurado'}
                  </span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <Phone size={14} /> Teléfono
                  </span>
                  <span className={styles.detailFieldValue}>
                    {selectedUser.telefono || 'No configurado'}
                  </span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <Calendar size={14} /> Registro
                  </span>
                  <span className={styles.detailFieldValue}>
                    {formatFecha(selectedUser.created_at)}
                  </span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <Clock size={14} /> Última actividad
                  </span>
                  <span className={styles.detailFieldValue}>
                    {selectedUser.ultima_actividad
                      ? formatFechaHora(selectedUser.ultima_actividad)
                      : 'Sin actividad'}
                  </span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <UserIcon size={14} /> Tipo de cuenta
                  </span>
                  <span className={styles.detailFieldValue}>
                    {selectedUser.is_admin ? 'Administrador' : 'Usuario estándar'}
                  </span>
                </div>
              </div>

              <div className={styles.statusPillsRow}>
                <div className={`${styles.statusDot} ${selectedUser.is_active ? styles.dotGreen : styles.dotRed}`} />
                <span className={styles.statusDotLabel}>
                  Cuenta {selectedUser.is_active ? 'activa' : 'inactiva'}
                </span>
                <div className={`${styles.statusDot} ${selectedUser.whatsapp_vinculado ? styles.dotBlue : styles.dotGray}`} />
                <span className={styles.statusDotLabel}>
                  WPP {selectedUser.whatsapp_vinculado ? 'vinculado' : 'no vinculado'}
                </span>
                <div className={`${styles.statusDot} ${selectedUser.onboarding_completado ? styles.dotAmber : styles.dotGray}`} />
                <span className={styles.statusDotLabel}>
                  Onboarding {selectedUser.onboarding_completado 
                    ? 'completo' 
                    : selectedUser.paso_onboarding_actual 
                      ? `incompleto (${selectedUser.paso_onboarding_actual === 'datos_personales' ? 'Datos personales' : selectedUser.paso_onboarding_actual === 'ciclo_financiero' ? 'Ciclo financiero' : 'Moneda'})`
                      : 'incompleto'}
                </span>
              </div>

              {/* Actions Section */}
              <div className={styles.actionsPanel}>
                <h3>Acciones de soporte</h3>
                
                <div className={styles.actionsGrid}>
                  
                  {/* Activar / Desactivar */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                    disabled={actionLoading || selectedUser.id === currentAdmin?.id}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'estado',
                        title: selectedUser.is_active ? '¿Suspendés este usuario?' : '¿Reactivás este usuario?',
                        description: selectedUser.is_active
                          ? 'No va a poder entrar a su cuenta hasta que lo reactives.'
                          : 'Va a poder volver a acceder a la plataforma.'
                      })
                    }}
                    title={selectedUser.id === currentAdmin?.id ? 'No podés desactivar tu propia cuenta' : ''}
                  >
                    {selectedUser.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    <span>{selectedUser.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}</span>
                  </button>

                  {/* Reset Password */}
                  <button
                    className={styles.actionBtn}
                    disabled={actionLoading || !selectedUser.email || selectedUser.auth_provider === 'google'}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'reset-password',
                        title: '¿Enviás el reset de contraseña?',
                        description: 'Le vamos a mandar un email para que cambie su contraseña.'
                      })
                    }}
                    title={
                      selectedUser.auth_provider === 'google'
                        ? 'Usuario autenticado con Google OAuth (No requiere contraseña)'
                        : !selectedUser.email
                        ? 'El usuario no tiene email configurado'
                        : 'Enviar link de recuperación de contraseña'
                    }
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Link Reset</span>
                  </button>

                  {/* Hacer Admin / Quitar Rol Admin */}
                  <button
                    className={`${styles.actionBtn} ${selectedUser.is_admin ? styles.actionBtnWarning : styles.actionBtnAdmin}`}
                    disabled={actionLoading || (selectedUser.id === currentAdmin?.id && selectedUser.is_admin)}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'cambiar-admin',
                        title: selectedUser.is_admin ? '¿Revocar permisos de administrador?' : '¿Promover a Administrador?',
                        description: selectedUser.is_admin
                          ? `El usuario ${selectedUser.email || selectedUser.nombre} dejará de tener acceso al panel de administración.`
                          : `El usuario ${selectedUser.email || selectedUser.nombre} obtendrá acceso completo al panel de administración y a la gestión operativa.`
                      })
                    }}
                    title={
                      selectedUser.id === currentAdmin?.id && selectedUser.is_admin
                        ? 'No podés revocar tus propios permisos de administrador'
                        : selectedUser.is_admin
                        ? 'Quitar rol de Administrador'
                        : 'Otorgar permisos de Administrador'
                    }
                  >
                    {selectedUser.is_admin ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{selectedUser.is_admin ? 'Quitar Rol Admin' : 'Hacer Admin'}</span>
                  </button>

                  {/* Revocar Sesiones */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={actionLoading || selectedUser.id === currentAdmin?.id}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'revocar',
                        title: '¿Forzás el cierre de sesiones?',
                        description: 'Todos sus dispositivos abiertos van a tener que iniciar sesión de nuevo.'
                      })
                    }}
                    title={selectedUser.id === currentAdmin?.id ? 'No podés revocar tus propias sesiones' : ''}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Forzar Cierre Sesión</span>
                  </button>

                  {/* Desconectar WhatsApp */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={actionLoading || !selectedUser.whatsapp_vinculado}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'wpp',
                        title: '¿Desconectás WhatsApp?',
                        description: 'Se va a desvincular su número y no va a recibir notificaciones por esta vía.'
                      })
                    }}
                    title={!selectedUser.whatsapp_vinculado ? 'El usuario no tiene WhatsApp vinculado' : ''}
                  >
                    <MessageSquareOff className="w-4 h-4" />
                    <span>Desconectar WhatsApp</span>
                  </button>

                  {/* Resetear Onboarding */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                    disabled={actionLoading || !selectedUser.onboarding_completado}
                    onClick={() => {
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'onboarding',
                        title: '¿Reseteás el onboarding?',
                        description: 'El usuario va a tener que completar de nuevo la configuración inicial (datos personales, ciclo financiero y moneda) al ingresar.',
                        requireDouble: true
                      })
                    }}
                    title={!selectedUser.onboarding_completado ? 'El onboarding ya está incompleto' : ''}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Resetear Onboarding</span>
                  </button>

                  {/* Eliminar Cuenta */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger} ${styles.colSpanFull}`}
                    disabled={actionLoading || selectedUser.id === currentAdmin?.id}
                    onClick={() => {
                      const targetEmail = selectedUser.email || selectedUser.telefono || ''
                      setEmailConfirmInput('')
                      setConfirmAction({
                        type: 'eliminar',
                        title: '¿Eliminar permanentemente esta cuenta?',
                        description: `Esta acción es IRREVERSIBLE. Se borrarán todas las transacciones, billeteras, presupuestos y datos asociados a ${selectedUser.email || selectedUser.nombre}.`,
                        requireEmail: true,
                        expectedEmail: targetEmail
                      })
                    }}
                    title={selectedUser.id === currentAdmin?.id ? 'No podés eliminar tu propia cuenta desde acá' : 'Eliminar permanentemente la cuenta y todos sus datos'}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>

                {/* Dynamic Confirmation Box */}
                {confirmAction && (
                  <div className={styles.confirmBox}>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 text-[var(--gold)] font-semibold">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{confirmAction.title}</span>
                      </div>
                      <span className={styles.confirmText}>{confirmAction.description}</span>
                    </div>

                    {confirmAction.requireEmail && (
                      <div className={styles.confirmEmailGroup}>
                        <label htmlFor="confirmEmailInput" className={styles.confirmEmailLabel}>
                          Para confirmar, escribí el email <span className={styles.confirmEmailTarget}>{confirmAction.expectedEmail}</span>:
                        </label>
                        <input
                          id="confirmEmailInput"
                          type="text"
                          className={styles.confirmEmailInput}
                          value={emailConfirmInput}
                          onChange={(e) => setEmailConfirmInput(e.target.value)}
                          placeholder={`Escribí ${confirmAction.expectedEmail}`}
                          autoComplete="off"
                          spellCheck={false}
                          autoFocus
                        />
                        {emailConfirmInput.length > 0 &&
                          emailConfirmInput.trim().toLowerCase() !== confirmAction.expectedEmail?.trim().toLowerCase() && (
                            <span className={styles.confirmEmailError}>
                              El correo ingresado no coincide exactamente.
                            </span>
                          )}
                      </div>
                    )}
                    
                    {confirmAction.requireDouble && (
                      <label className={styles.confirmCheckboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.confirmCheckbox}
                          checked={doubleConfirmChecked}
                          onChange={(e) => setDoubleConfirmChecked(e.target.checked)}
                        />
                        <span>Entiendo que esta acción es delicada y deseo proceder.</span>
                      </label>
                    )}

                    <div className={styles.confirmActions}>
                      <Button
                        variant="danger"
                        disabled={
                          actionLoading ||
                          (confirmAction.requireDouble && !doubleConfirmChecked) ||
                          (confirmAction.requireEmail &&
                            emailConfirmInput.trim().toLowerCase() !== (confirmAction.expectedEmail || '').trim().toLowerCase())
                        }
                        onClick={handleExecuteAction}
                      >
                        {actionLoading ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                          </span>
                        ) : (
                          'Sí, confirmar'
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={actionLoading}
                        onClick={() => {
                          setConfirmAction(null)
                          setDoubleConfirmChecked(false)
                          setEmailConfirmInput('')
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <EmptyState
                icon={Users}
                title="Gestión de Cuentas"
                description="Seleccioná un usuario del listado de la izquierda para acceder a su detalle operativo y a las herramientas de soporte."
              />
            </div>
          )}
        </div>

      </div>
        )}

        {activeTab === 'wpp' && (
          <div className={styles.emptyStateContainer}>
            <EmptyState
              icon={MessageSquare}
              title="Monitor de conversaciones"
              description="Esta sección estará disponible una vez que la plataforma esté desplegada con dominio propio. Mostrará todas las conversaciones de WhatsApp, intents detectados, errores de AI y latencia de respuesta."
            />
          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className={styles.emptyStateContainer}>
            <EmptyState
              icon={Clock}
              title="Logs del scheduler"
              description="Próximamente. Mostrará los jobs de APScheduler ejecutados, su estado y los errores ocurridos."
            />
          </div>
        )}
      </div>
    </div>
  )
}
