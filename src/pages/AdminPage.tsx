import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import adminService from '@/services/adminService'
import type { UsuarioAdminResumen, UsuarioAdmin, FiltrosAdmin, AdminStats } from '@/types/admin'
import { Button, PageSummaryBar, EmptyState, Select } from '@/components/ui'
import {
  Search,
  Loader2,
  AlertTriangle,
  UserX,
  UserCheck,
  KeyRound,
  LogOut,
  MessageSquareOff,
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

      {/* ── PageSummaryBar (Aesthetics like Transacciones) ────────────────────────────── */}
      <PageSummaryBar
        className={styles.summaryBar}
        leftSlot={
          <div className={styles.statsLeftSlot}>
            <span className={styles.statsLeftLabel}>Usuarios de la plataforma</span>
            <span className={styles.statsLeftValue}>
              {stats ? stats.total : 0}
            </span>
          </div>
        }
        items={[
          {
            label: "Cuentas Activas",
            value: `${stats ? stats.activos : 0}`,
            subValue: `de ${stats ? stats.total : 0} registradas`,
            highlight: true,
          },
          {
            label: "Onboarding Completado",
            value: `${stats ? stats.onboarding_completo : 0}`,
            subValue: `${stats && stats.total ? Math.round((stats.onboarding_completo / stats.total) * 100) : 0}% del total`,
            valueColor: '#f5a623',
          },
          {
            label: "WhatsApp Vinculados",
            value: `${stats ? stats.whatsapp_vinculados : 0}`,
            subValue: `${stats && stats.total ? Math.round((stats.whatsapp_vinculados / stats.total) * 100) : 0}% del total`,
            valueColor: '#4caf7d',
          },
        ]}
      />

      {/* ── Split Grid Layout (Influenced by Tools Page) ────────────────────────────────── */}
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

              {/* Detail Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <Mail className={styles.detailIcon} size={16} />
                  <div className={styles.detailRowContent}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{selectedUser.email || 'No configurado'}</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Phone className={styles.detailIcon} size={16} />
                  <div className={styles.detailRowContent}>
                    <span className={styles.detailLabel}>Teléfono</span>
                    <span className={styles.detailValue}>{selectedUser.telefono || 'No configurado'}</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Calendar className={styles.detailIcon} size={16} />
                  <div className={styles.detailRowContent}>
                    <span className={styles.detailLabel}>Fecha Registro</span>
                    <span className={styles.detailValue}>{new Date(selectedUser.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Clock className={styles.detailIcon} size={16} />
                  <div className={styles.detailRowContent}>
                    <span className={styles.detailLabel}>Última Actividad</span>
                    <span className={styles.detailValue}>
                      {selectedUser.ultima_actividad ? new Date(selectedUser.ultima_actividad).toLocaleString() : 'Sin actividad registrada'}
                    </span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <UserIcon className={styles.detailIcon} size={16} />
                  <div className={styles.detailRowContent}>
                    <span className={styles.detailLabel}>Tipo Cuenta</span>
                    <span className={styles.detailValue}>{selectedUser.is_admin ? 'Administrador' : 'Usuario estándar'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.statusSection}>
                <h3>Estado Operativo</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className={styles.statusPill}>
                    <span className="text-gray-400">Cuenta:</span>
                    <span className={`${styles.badge} ${selectedUser.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {selectedUser.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className={styles.statusPill}>
                    <span className="text-gray-400">WhatsApp:</span>
                    <span className={`${styles.badge} ${selectedUser.whatsapp_vinculado ? styles.badgeLinked : styles.badgeUnlinked}`}>
                      {selectedUser.whatsapp_vinculado ? 'Vinculado' : 'No Vinculado'}
                    </span>
                  </div>
                  <div className={styles.statusPill}>
                    <span className="text-gray-400">Onboarding:</span>
                    <span className={`${styles.badge} ${selectedUser.onboarding_completado ? styles.badgeCompleted : styles.badgeIncomplete}`}>
                      {selectedUser.onboarding_completado ? 'Completo' : 'Incompleto'}
                    </span>
                    {!selectedUser.onboarding_completado && selectedUser.paso_onboarding_actual && (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 ml-1">
                        ({selectedUser.paso_onboarding_actual})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className={styles.actionsPanel}>
                <h3>Acciones de Soporte</h3>
                
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
    </div>
  )
}


