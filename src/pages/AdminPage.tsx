import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import adminService from '@/services/adminService'
import type { UsuarioAdminResumen, UsuarioAdmin, FiltrosAdmin, AdminStats } from '@/types/admin'
import { Button, EmptyState, Select } from '@/components/ui'
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
  Clock
} from 'lucide-react'
import styles from './AdminPage.module.css'

// TableAvatar component to fetch and render user profile picture or fallback initials
function TableAvatar({ fotoUrl, nombre }: { fotoUrl: string | null; nombre: string | null }) {
  const [error, setError] = useState(false)
  
  const getFotoUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const API_URL = import.meta.env.VITE_API_URL || '/api'
    return `${API_URL}${url}`
  }
  
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
    type: 'estado' | 'reset-password' | 'revocar' | 'wpp' | 'onboarding'
    message: string
    requireDouble?: boolean
  } | null>(null)
  const [doubleConfirmChecked, setDoubleConfirmChecked] = useState(false)
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
        setError('Ocurrió un error al obtener la lista de usuarios.')
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
    try {
      const res = await adminService.getUsuario(id)
      if (res.success) {
        setSelectedUser(res.data)
      } else {
        setDetailError('No se pudo obtener el detalle del usuario.')
      }
    } catch (err) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } }
      const errMsg = errorObj.response?.data?.error?.message || 'Error al obtener el detalle del usuario.'
      setDetailError(errMsg)
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
            message = res.message || 'Onboarding reseteado correctamente.'
          }
          break
        }
      }
      
      setActionFeedback({ success: true, message })
      setConfirmAction(null)
      setDoubleConfirmChecked(false)
      
      // Refrescar lista y stats en segundo plano
      fetchUsuarios()
      fetchStats()
    } catch (err) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } }
      const errMsg = errorObj.response?.data?.error?.message || 'Ocurrió un error al procesar la acción.'
      setActionFeedback({ success: false, message: errMsg })
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filtersGroup}>
              <Select
                value={estadoFilter || ''}
                onChange={(val) => {
                  setEstadoFilter(val as FiltrosAdmin['estado'])
                  setPage(1)
                }}
                options={estadoOptions}
                placeholder="Filtrar por estado"
                className={styles.filterSelect}
              />
              
              <Select
                value={onboardingFilter || ''}
                onChange={(val) => {
                  setOnboardingFilter(val as FiltrosAdmin['onboarding'])
                  setPage(1)
                }}
                options={onboardingOptions}
                placeholder="Filtrar por onboarding"
                className={styles.filterSelect}
              />

              <Select
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
                                {u.nombre ? `${u.nombre} ${u.apellido || ''}` : <em className="text-gray-400">Sin nombre</em>}
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
                  <h2>{selectedUser.nombre ? `${selectedUser.nombre} ${selectedUser.apellido || ''}` : 'Usuario sin nombre'}</h2>
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
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.detailFieldRow}>
                  <span className={styles.detailFieldLabel}>
                    <Clock size={14} /> Última actividad
                  </span>
                  <span className={styles.detailFieldValue}>
                    {selectedUser.ultima_actividad
                      ? new Date(selectedUser.ultima_actividad).toLocaleString()
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
                  Onboarding {selectedUser.onboarding_completado ? 'completo' : 'incompleto'}
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
                    onClick={() =>
                      setConfirmAction({
                        type: 'estado',
                        message: `¿Estás seguro de que querés ${selectedUser.is_active ? 'DESACTIVAR' : 'ACTIVAR'} la cuenta de este usuario?`
                      })
                    }
                    title={selectedUser.id === currentAdmin?.id ? 'No podés desactivar tu propia cuenta' : ''}
                  >
                    {selectedUser.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    <span>{selectedUser.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}</span>
                  </button>

                  {/* Reset Password */}
                  <button
                    className={styles.actionBtn}
                    disabled={actionLoading || !selectedUser.email}
                    onClick={() =>
                      setConfirmAction({
                        type: 'reset-password',
                        message: '¿Querés enviar un correo para que el usuario restablezca su contraseña?'
                      })
                    }
                    title={!selectedUser.email ? 'El usuario no tiene email configurado' : ''}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Link Reset</span>
                  </button>

                  {/* Revocar Sesiones */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={actionLoading || selectedUser.id === currentAdmin?.id}
                    onClick={() =>
                      setConfirmAction({
                        type: 'revocar',
                        message: '¿Estás seguro de que querés forzar el cierre de todas las sesiones de este usuario? Todos sus dispositivos deberán volver a iniciar sesión.'
                      })
                    }
                    title={selectedUser.id === currentAdmin?.id ? 'No podés revocar tus propias sesiones' : ''}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Forzar Cierre Sesión</span>
                  </button>

                  {/* Desconectar WhatsApp */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={actionLoading || !selectedUser.whatsapp_vinculado}
                    onClick={() =>
                      setConfirmAction({
                        type: 'wpp',
                        message: '¿Estás seguro de que querés desvincular el número de WhatsApp de este usuario? Se perderá la recepción de notificaciones inmediatas.'
                      })
                    }
                    title={!selectedUser.whatsapp_vinculado ? 'El usuario no tiene WhatsApp vinculado' : ''}
                  >
                    <MessageSquareOff className="w-4 h-4" />
                    <span>Desconectar WhatsApp</span>
                  </button>

                  {/* Resetear Onboarding */}
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnWarning} ${styles.colSpanFull}`}
                    disabled={actionLoading || !selectedUser.onboarding_completado}
                    onClick={() =>
                      setConfirmAction({
                        type: 'onboarding',
                        message: '¿Estás seguro de que querés resetear el onboarding? Esto forzará al usuario a ingresar al flujo de configuración inicial de datos personales, ciclo financiero y moneda. No afectará sus transacciones ni billeteras existentes.',
                        requireDouble: true
                      })
                    }
                    title={!selectedUser.onboarding_completado ? 'El onboarding ya está incompleto' : ''}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Resetear Configuración Onboarding</span>
                  </button>
                </div>

                {/* Dynamic Confirmation Box */}
                {confirmAction && (
                  <div className={styles.confirmBox}>
                    <div className="flex gap-2 text-[var(--gold)]">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span className={styles.confirmText}>{confirmAction.message}</span>
                    </div>
                    
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
                        disabled={actionLoading || (confirmAction.requireDouble && !doubleConfirmChecked)}
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


