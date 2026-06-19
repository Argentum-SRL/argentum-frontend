import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Mail,
  Phone,
  Lock,
  AlertTriangle,
  Edit,
  Save,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  PieChart,
  CreditCard,
  Target,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import usuarioService from '@/services/usuario.service'
import * as authService from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { SelectInput, type SelectOption } from '@/components/ui'
import type { MetodosLogin } from '@/types'
import styles from './SettingsPage.module.css'
import notifCardStyles from '@/components/notificaciones/NotificacionesConfigModal.module.css'

const OPCIONES_REGLA_CICLO: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'primer_lunes', label: 'Primer Lunes' },
  { value: 'primer_martes', label: 'Primer Martes' },
  { value: 'primer_miercoles', label: 'Primer Miércoles' },
  { value: 'primer_jueves', label: 'Primer Jueves' },
  { value: 'primer_viernes', label: 'Primer Viernes' },
  { value: 'ultimo_lunes', label: 'Último Lunes' },
  { value: 'ultimo_martes', label: 'Último Martes' },
  { value: 'ultimo_miercoles', label: 'Último Miércoles' },
  { value: 'ultimo_jueves', label: 'Último Jueves' },
  { value: 'ultimo_viernes', label: 'Último Viernes' },
]

const OPCIONES_TIPO_DOLAR: SelectOption[] = [
  { value: 'oficial', label: 'Oficial' },
  { value: 'blue', label: 'Blue' },
  { value: 'mep', label: 'MEP' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const defaultFormState = {
  cuota_vence_anticipacion_dias: 3,
  cuota_vence_web: true,
  cuota_vence_whatsapp: true,
  presupuesto_umbral_1: 80,
  presupuesto_umbral_1_activo: true,
  presupuesto_umbral_1_web: true,
  presupuesto_umbral_1_whatsapp: false,
  presupuesto_umbral_2_web: true,
  presupuesto_umbral_2_whatsapp: true,
  suscripcion_hoy_web: true,
  suscripcion_hoy_whatsapp: true,
  suscripcion_recordatorio_activo: true,
  suscripcion_recordatorio_dias: 3,
  suscripcion_recordatorio_web: true,
  suscripcion_recordatorio_whatsapp: false,
  meta_alcanzada_activo: true,
  meta_alcanzada_web: true,
  meta_alcanzada_whatsapp: true,
  saldo_cero_web: true,
  saldo_cero_whatsapp: true,
  gasto_inusual_activo: true,
  gasto_inusual_web: true,
  gasto_inusual_whatsapp: false,
  resumen_semanal_activo: false,
  resumen_semanal_web: true,
  resumen_semanal_whatsapp: false,
  inactividad_activo: false,
  inactividad_dias: 7,
  inactividad_web: true,
  inactividad_whatsapp: false,
  whatsapp_hora_envio: 9,
  whatsapp_minuto_envio: 0,
}

export default function SettingsPage() {
  const { usuario, logout, updateUsuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { confirm } = useModal()

  // Tab: derivado directamente de la URL — no necesita state ni effect
  const _tabParam = new URLSearchParams(location.search).get('tab')
  const activeTab: 'cuenta' | 'financiero' | 'notificaciones' =
    _tabParam === 'cuenta' || _tabParam === 'financiero' || _tabParam === 'notificaciones'
      ? _tabParam
      : 'cuenta'

  // Metodos login
  const [metodosLogin, setMetodosLogin] = useState<MetodosLogin | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchMetodos = async () => {
      try {
        const data = await usuarioService.getMetodosLogin(controller.signal)
        if (!controller.signal.aborted) setMetodosLogin(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error('Error fetching metodos login:', err)
      }
    }
    fetchMetodos()
    return () => controller.abort()
  }, [usuario])

  const handleTabChange = (tab: 'cuenta' | 'financiero' | 'notificaciones') => {
    navigate(`/app/configuracion?tab=${tab}`, { replace: true })
  }

  // Modals & Saving state
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Profile forms state
  const [formDatos, setFormDatos] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', sexo: '' })
  const [formEmail, setFormEmail] = useState({ email_nuevo: '', password_actual: '' })
  const [formTelefono, setFormTelefono] = useState({ telefono_nuevo: '', password_actual: '' })
  const [formPassword, setFormPassword] = useState({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
  const [formCiclo, setFormCiclo] = useState({ ciclo_tipo: 'dia_fijo' as 'dia_fijo' | 'regla', ciclo_valor: '' })
  const [formMoneda, setFormMoneda] = useState({ moneda_principal: 'ARS' as 'ARS' | 'USD', moneda_secundaria_activa: false, tipo_dolar: 'blue' })

  const [prevUsuarioId, setPrevUsuarioId] = useState(usuario?.id)
  if (usuario?.id !== prevUsuarioId) {
    setPrevUsuarioId(usuario?.id)
    if (usuario) {
      setFormDatos({ nombre: usuario.nombre || '', apellido: usuario.apellido || '', fecha_nacimiento: usuario.fecha_nacimiento || '', sexo: usuario.sexo || '' })
      setFormEmail({ email_nuevo: usuario.email || '', password_actual: '' })
      setFormTelefono({ telefono_nuevo: usuario.telefono || '', password_actual: '' })
      setFormCiclo({ ciclo_tipo: (usuario.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo', ciclo_valor: usuario.ciclo_valor || '' })
      setFormMoneda({ moneda_principal: (usuario.moneda_principal as 'ARS' | 'USD') || 'ARS', moneda_secundaria_activa: usuario.moneda_secundaria_activa, tipo_dolar: usuario.tipo_dolar || 'blue' })
    }
  }

  const handleOpenModal = (modal: string) => { setModalError(null); setActiveModal(modal) }
  const handleCloseModal = () => { setActiveModal(null); setModalError(null) }

  // Handlers from PerfilPage
  const handleSaveDatosPersonales = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try { const updated = await usuarioService.actualizarDatosPersonales(formDatos); updateUsuario(updated); handleCloseModal() }
    catch (err: unknown) { const error = err as { response?: { data?: { detail?: string } } }; setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.') }
    finally { setIsSaving(false) }
  }

  const handleVerificarEmailActual = async () => {
    if (!usuario?.email) return; setIsSaving(true)
    try {
      const res = await authService.enviarCodigoEmail(usuario.email)
      if ((res as { verificado: boolean }).verificado) { if (usuario) updateUsuario({ ...usuario, email_verificado: true }); showToast('Email verificado correctamente.', 'success') }
      else navigate('/auth/verificar-email', { state: { email: usuario.email } })
    } catch (err: unknown) { const error = err as { response?: { data?: { detail?: string } } }; showToast(error.response?.data?.detail || 'Error al enviar el código.', 'error') }
    finally { setIsSaving(false) }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try {
      const res = await usuarioService.actualizarEmail({
        email_nuevo: formEmail.email_nuevo,
        password_actual: formEmail.password_actual
      })
      if (usuario) {
        updateUsuario({ ...usuario, email: formEmail.email_nuevo, email_verificado: false })
      }
      showToast(res.confirmacion || 'Email actualizado. Se envió un código de verificación.', 'success')
      handleCloseModal()
      if (res.requiere_verificacion_email) {
        navigate('/auth/verificar-email', { state: { email: formEmail.email_nuevo } })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTelefono = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try {
      const res = await usuarioService.actualizarTelefono({ telefono_nuevo: formTelefono.telefono_nuevo, password_actual: usuario?.auth_provider === 'google' ? undefined : formTelefono.password_actual })
      if (res.requiere_verificacion_telefono) navigate('/auth/verificar-telefono')
    } catch (err: unknown) { const error = err as { response?: { data?: { detail?: string } } }; setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.') }
    finally { setIsSaving(false) }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try {
      await usuarioService.actualizarPassword({ password_actual: formPassword.password_actual || undefined, password_nueva: formPassword.password_nueva, password_nueva_confirmacion: formPassword.password_nueva_confirmacion })
      showToast('Contraseña actualizada exitosamente', 'success'); handleCloseModal(); setFormPassword({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }; const detail = error.response?.data?.detail
      if (detail?.includes('coinciden')) setModalError('Las contraseñas nuevas no coinciden.')
      else if (detail?.includes('actual incorrecta')) setModalError('La contraseña actual es incorrecta.')
      else if (detail?.includes('8 caracteres')) setModalError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      else setModalError(detail || 'Algo salió mal.')
    }
    finally { setIsSaving(false) }
  }

  const handleSaveCiclo = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try { const updated = await usuarioService.actualizarCicloFinanciero(formCiclo); updateUsuario(updated); handleCloseModal() }
    catch (err: unknown) { const error = err as { response?: { data?: { detail?: string } } }; setModalError(error.response?.data?.detail || 'Algo salió mal.') }
    finally { setIsSaving(false) }
  }

  const handleSaveMoneda = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setModalError(null)
    try { const updated = await usuarioService.actualizarMoneda(formMoneda); updateUsuario(updated); handleCloseModal() }
    catch (err: unknown) { const error = err as { response?: { data?: { detail?: string } } }; setModalError(error.response?.data?.detail || 'Algo salió mal.') }
    finally { setIsSaving(false) }
  }

  // Notificaciones form logic
  const { config, updateConfig } = useNotificaciones()
  const [prevConfig, setPrevConfig] = useState<typeof config>(null)
  const [formNotificaciones, setFormNotificaciones] = useState(defaultFormState)
  const [isNotifSaving, setIsNotifSaving] = useState(false)

  if (config !== prevConfig) {
    setPrevConfig(config)
    if (config) {
      setFormNotificaciones({
        cuota_vence_anticipacion_dias: config.cuota_vence_anticipacion_dias,
        cuota_vence_web: config.cuota_vence_web,
        cuota_vence_whatsapp: config.cuota_vence_whatsapp,
        presupuesto_umbral_1: config.presupuesto_umbral_1,
        presupuesto_umbral_1_activo: config.presupuesto_umbral_1_activo,
        presupuesto_umbral_1_web: config.presupuesto_umbral_1_web,
        presupuesto_umbral_1_whatsapp: config.presupuesto_umbral_1_whatsapp,
        presupuesto_umbral_2_web: config.presupuesto_umbral_2_web,
        presupuesto_umbral_2_whatsapp: config.presupuesto_umbral_2_whatsapp,
        suscripcion_hoy_web: config.suscripcion_hoy_web,
        suscripcion_hoy_whatsapp: config.suscripcion_hoy_whatsapp,
        suscripcion_recordatorio_activo: config.suscripcion_recordatorio_activo,
        suscripcion_recordatorio_dias: config.suscripcion_recordatorio_dias,
        suscripcion_recordatorio_web: config.suscripcion_recordatorio_web,
        suscripcion_recordatorio_whatsapp: config.suscripcion_recordatorio_whatsapp,
        meta_alcanzada_activo: config.meta_alcanzada_activo,
        meta_alcanzada_web: config.meta_alcanzada_web,
        meta_alcanzada_whatsapp: config.meta_alcanzada_whatsapp,
        saldo_cero_web: config.saldo_cero_web,
        saldo_cero_whatsapp: config.saldo_cero_whatsapp,
        gasto_inusual_activo: config.gasto_inusual_activo,
        gasto_inusual_web: config.gasto_inusual_web,
        gasto_inusual_whatsapp: config.gasto_inusual_whatsapp,
        resumen_semanal_activo: config.resumen_semanal_activo || false,
        resumen_semanal_web: config.resumen_semanal_web || false,
        resumen_semanal_whatsapp: config.resumen_semanal_whatsapp || false,
        inactividad_activo: config.inactividad_activo,
        inactividad_dias: config.inactividad_dias,
        inactividad_web: config.inactividad_web,
        inactividad_whatsapp: config.inactividad_whatsapp,
        whatsapp_hora_envio: config.whatsapp_hora_envio,
        whatsapp_minuto_envio: config.whatsapp_minuto_envio,
      })
    }
  }

  const handleCheckboxChange = (field: keyof typeof defaultFormState) => {
    setFormNotificaciones((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleNumberChange = (field: keyof typeof defaultFormState, value: number, min: number, max: number) => {
    const safeValue = Math.max(min, Math.min(max, value || min))
    setFormNotificaciones((prev) => ({ ...prev, [field]: safeValue }))
  }

  const formatTimeValue = (hora: number, minuto: number) => {
    const h = String(hora).padStart(2, '0')
    const m = String(minuto).padStart(2, '0')
    return `${h}:${m}`
  }

  const handleTimeChange = (timeString: string) => {
    if (!timeString) return
    const [hStr, mStr] = timeString.split(':')
    const hora = parseInt(hStr, 10)
    const minuto = parseInt(mStr, 10)
    
    if (!isNaN(hora) && !isNaN(minuto)) {
      setFormNotificaciones((prev) => ({
        ...prev,
        whatsapp_hora_envio: Math.max(0, Math.min(23, hora)),
        whatsapp_minuto_envio: Math.max(0, Math.min(59, minuto)),
      }))
    }
  }

  const handleSaveNotificaciones = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsNotifSaving(true)
    try {
      await updateConfig(formNotificaciones)
      showToast('Preferencias de notificaciones guardadas exitosamente', 'success')
    } catch (err) {
      console.error(err)
      showToast('Error al guardar las notificaciones', 'error')
    } finally {
      setIsNotifSaving(false)
    }
  }

  const isGoogle = usuario?.auth_provider === 'google'
  const pw = formPassword.password_nueva
  const pwReqs = { length: pw.length >= 8, upper: /[A-Z]/.test(pw), lower: /[a-z]/.test(pw), number: /\d/.test(pw) }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Configuración</h1>
        <p className={styles.subtitle}>Gestioná tu cuenta, preferencias financieras y notificaciones.</p>
      </header>

      {/* TABS HEADER */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'cuenta' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('cuenta')}
        >
          Cuenta y Seguridad
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'financiero' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('financiero')}
        >
          Preferencias Financieras
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notificaciones' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('notificaciones')}
        >
          Notificaciones
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      <div className={styles.tabContent}>
        {/* TAB 1: CUENTA Y SEGURIDAD */}
        {activeTab === 'cuenta' && (
          <>
            {/* Card Datos Personales (Nombre / Apellido) */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Datos Personales
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.row}>
                  <div className={styles.rowContent}>
                    <span className={styles.rowLabel}>Nombre completo</span>
                    <span className={styles.rowValue}>{usuario?.nombre} {usuario?.apellido}</span>
                  </div>
                  <div className={styles.rowAction}>
                    <button className={styles.iconBtn} onClick={() => handleOpenModal('datos-personales')} aria-label="Editar datos personales">
                      <Edit size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Contacto */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Contacto
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.row}>
                  <div className={styles.rowIcon}><Mail size={16} /></div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowLabel}>Email</span>
                    <span className={styles.rowValue}>{usuario?.email || 'No asociado'}</span>
                  </div>
                  <div className={styles.rowAction}>
                    {isGoogle
                      ? <Lock size={15} className={styles.lockIcon} />
                      : <button className={styles.iconBtn} onClick={() => handleOpenModal('email')} aria-label="Editar email"><Edit size={15} /></button>
                    }
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.rowIcon}><Phone size={16} /></div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowLabel}>Teléfono</span>
                    <span className={styles.rowValue}>{usuario?.telefono || 'No asociado'}</span>
                  </div>
                  <div className={styles.rowAction}>
                    <button className={styles.iconBtn} onClick={() => handleOpenModal('telefono')} aria-label="Editar teléfono"><Edit size={15} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Métodos de acceso */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Métodos de acceso
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.methodRow}>
                  <div className={styles.methodIcon}><Mail size={16} /></div>
                  <div className={styles.methodContent}>
                    <span className={styles.methodName}>Email + contraseña</span>
                    {metodosLogin?.email_password && <button className={styles.methodLink} onClick={() => handleOpenModal('password')}>Cambiar contraseña</button>}
                    {metodosLogin?.puede_agregar_password && <button className={styles.methodLink} onClick={() => handleOpenModal('password')}>Crear contraseña</button>}
                    {metodosLogin?.puede_agregar_email && (
                      <div className={styles.methodLinks}>
                        <button className={styles.methodLink} onClick={handleVerificarEmailActual}>Verificar ahora</button>
                        <button className={styles.methodLink} onClick={() => handleOpenModal('email')}>Cambiar email</button>
                      </div>
                    )}
                  </div>
                  <div className={styles.methodBadge}>
                    {metodosLogin?.email_password ? <span className={styles.pillOk}>Activo</span>
                      : metodosLogin?.puede_agregar_password ? <span className={styles.pillNa}>Sin contraseña</span>
                      : metodosLogin?.puede_agregar_email ? <span className={styles.pillWarn}>Sin verificar</span>
                      : <span className={styles.pillNa}>No configurado</span>}
                  </div>
                </div>

                <div className={styles.methodRow}>
                  <div className={styles.methodIcon}><Phone size={16} /></div>
                  <div className={styles.methodContent}>
                    <span className={styles.methodName}>WhatsApp</span>
                    <button className={styles.methodLink} onClick={() => handleOpenModal('telefono')}>
                      {metodosLogin?.telefono ? 'Cambiar teléfono' : 'Agregar teléfono'}
                    </button>
                  </div>
                  <div className={styles.methodBadge}>
                    {metodosLogin?.telefono ? <span className={styles.pillOk}>Activo</span> : <span className={styles.pillNa}>No configurado</span>}
                  </div>
                </div>

                <div className={styles.methodRow}>
                  <div className={styles.methodIcon}><GoogleIcon /></div>
                  <div className={styles.methodContent}>
                    <span className={styles.methodName}>Google</span>
                    <span className={styles.methodDesc}>
                      {metodosLogin?.google
                        ? 'Disponible si tu Google coincide con tu email verificado.'
                        : 'Verificá tu email para habilitar el acceso con Google.'}
                    </span>
                  </div>
                  <div className={styles.methodBadge}>
                    {metodosLogin?.google ? <span className={styles.pillInfo}>Disponible</span> : <span className={styles.pillNa}>No disponible</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Zona de peligro */}
            <div className={styles.dangerSection}>
              <div className={styles.sectionTitle}>
                <AlertTriangle size={16} /> Zona de peligro
              </div>
              <div className={styles.row}>
                <div className={styles.dangerLeft}>
                  <p className={styles.dangerDesc}>Eliminar tu cuenta borra permanentemente todas tus billeteras, transacciones, presupuestos y datos personales. No se puede deshacer.</p>
                </div>
              </div>
              <div className={styles.dangerActions}>
                <button className={styles.logoutBtn} onClick={() => confirm({ title: 'Cerrar sesión', description: '¿Estás seguro de que querés cerrar sesión ahora?', onConfirm: logout })}>
                  <LogOut size={15} /> Cerrar sesión
                </button>
                <button className={styles.deleteBtn} onClick={() => confirm({
                  title: '¿Estás absolutamente seguro?',
                  description: 'Esta acción borrará definitivamente todos tus datos financieros en Argentum. No se puede deshacer.',
                  variant: 'danger',
                  confirmLabel: 'Confirmar eliminación total',
                  requireTyping: 'ELIMINAR',
                  onConfirm: async () => {
                    try { await usuarioService.eliminarCuenta(); showToast('Cuenta eliminada exitosamente', 'success'); await logout() }
                    catch (error) { console.error('Error al eliminar la cuenta:', error); showToast('Hubo un error al intentar eliminar la cuenta.', 'error') }
                  },
                })}>
                  <Trash2 size={15} /> Eliminar mi cuenta
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PREFERENCIAS FINANCIERAS */}
        {activeTab === 'financiero' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              Configuración financiera
            </div>
            <div className={styles.finGrid}>
              <div className={styles.finCell}>
                <div className={styles.finCellHead}>
                  <span className={styles.rowLabel}>Ciclo de cobro</span>
                  <button className={styles.iconBtn} onClick={() => handleOpenModal('ciclo')} aria-label="Editar ciclo"><Edit size={14} /></button>
                </div>
                <span className={styles.finValue}>
                  {usuario?.ciclo_tipo === 'dia_fijo' ? `Día ${usuario.ciclo_valor}` : usuario?.ciclo_valor?.replace('_', ' ')}
                </span>
                <span className={styles.finSub}>{usuario?.ciclo_tipo === 'dia_fijo' ? 'de cada mes' : 'regla'}</span>
              </div>
              <div className={styles.finCell}>
                <div className={styles.finCellHead}>
                  <span className={styles.rowLabel}>Moneda principal</span>
                  <button className={styles.iconBtn} onClick={() => handleOpenModal('moneda')} aria-label="Editar moneda"><Edit size={14} /></button>
                </div>
                <span className={styles.finValue}>{usuario?.moneda_principal}</span>
                {usuario?.moneda_secundaria_activa && (
                  <span className={styles.finSub}>Secundaria: {usuario?.tipo_dolar?.toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICACIONES */}
        {activeTab === 'notificaciones' && (
          <form onSubmit={handleSaveNotificaciones} className={notifCardStyles.form}>
            <div className={notifCardStyles.topGrid}>
              {/* Resumen por WhatsApp */}
              <section className={notifCardStyles.section}>
                <h3 className={notifCardStyles.sectionTitle}>
                  <Settings size={16} /> Resumen por WhatsApp
                </h3>
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Horario de envío</p>
                      <p className={notifCardStyles.cardDesc}>
                        Tus avisos del día se enviarán juntos en un solo mensaje de WhatsApp a la hora que elijas.
                      </p>
                    </div>
                    <div>
                      <input
                        type="time"
                        value={formatTimeValue(formNotificaciones.whatsapp_hora_envio, formNotificaciones.whatsapp_minuto_envio)}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className={notifCardStyles.timeInput}
                        aria-label="Horario de envío diario"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Alertas de Cuotas */}
              <section className={notifCardStyles.section}>
                <h3 className={notifCardStyles.sectionTitle}>
                  <Calendar size={16} /> Alertas de Cuotas
                </h3>
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Vencimiento de tarjetas</p>
                      <p className={notifCardStyles.cardDesc}>Avisarte antes del vencimiento del resumen de cada tarjeta.</p>
                    </div>
                  </div>
                  <div className={notifCardStyles.cardControls}>
                    <div className={notifCardStyles.inputGroup}>
                      <label htmlFor="cuota_vence_anticipacion_dias">Días de anticipación al vencimiento del resumen</label>
                      <input
                        type="number"
                        id="cuota_vence_anticipacion_dias"
                        value={formNotificaciones.cuota_vence_anticipacion_dias}
                        onChange={(e) =>
                          handleNumberChange('cuota_vence_anticipacion_dias', parseInt(e.target.value), 1, 30)
                        }
                        className={notifCardStyles.numberInput}
                        min={1}
                        max={30}
                      />
                      <span>días</span>
                    </div>
                    <div className={notifCardStyles.channels}>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.cuota_vence_web}
                          onChange={() => handleCheckboxChange('cuota_vence_web')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.cuota_vence_whatsapp}
                          onChange={() => handleCheckboxChange('cuota_vence_whatsapp')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Alertas de Presupuestos */}
            <section className={notifCardStyles.section}>
              <h3 className={notifCardStyles.sectionTitle}>
                <PieChart size={16} /> Alertas de Presupuestos
              </h3>
              <div className={notifCardStyles.grid}>
                {/* Umbral 1 */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Alerta de límite</p>
                      <p className={notifCardStyles.cardDesc}>Avisar cuando estés cerca de agotar un presupuesto.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.presupuesto_umbral_1_activo}
                        onChange={() => handleCheckboxChange('presupuesto_umbral_1_activo')}
                        aria-label="Activar aviso de límite de presupuesto"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.presupuesto_umbral_1_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.inputGroup}>
                        <label htmlFor="presupuesto_umbral_1">Porcentaje límite:</label>
                        <input
                          type="number"
                          id="presupuesto_umbral_1"
                          value={formNotificaciones.presupuesto_umbral_1}
                          onChange={(e) =>
                            handleNumberChange('presupuesto_umbral_1', parseInt(e.target.value), 50, 95)
                          }
                          className={notifCardStyles.numberInput}
                          min={50}
                          max={95}
                        />
                        <span>%</span>
                      </div>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.presupuesto_umbral_1_web}
                            onChange={() => handleCheckboxChange('presupuesto_umbral_1_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.presupuesto_umbral_1_whatsapp}
                            onChange={() => handleCheckboxChange('presupuesto_umbral_1_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Umbral 2 */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Presupuesto agotado</p>
                      <p className={notifCardStyles.cardDesc}>Avisar cuando un presupuesto se consuma por completo.</p>
                    </div>
                  </div>
                  <div className={notifCardStyles.cardControls}>
                    <div className={notifCardStyles.channels}>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.presupuesto_umbral_2_web}
                          onChange={() => handleCheckboxChange('presupuesto_umbral_2_web')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.presupuesto_umbral_2_whatsapp}
                          onChange={() => handleCheckboxChange('presupuesto_umbral_2_whatsapp')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Alertas de Suscripciones */}
            <section className={notifCardStyles.section}>
              <h3 className={notifCardStyles.sectionTitle}>
                <CreditCard size={16} /> Alertas de Suscripciones
              </h3>
              <div className={notifCardStyles.grid}>
                {/* Cobro del día */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Día de cobro</p>
                      <p className={notifCardStyles.cardDesc}>Avisar el mismo día que se cobra una suscripción.</p>
                    </div>
                  </div>
                  <div className={notifCardStyles.cardControls}>
                    <div className={notifCardStyles.channels}>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.suscripcion_hoy_web}
                          onChange={() => handleCheckboxChange('suscripcion_hoy_web')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.suscripcion_hoy_whatsapp}
                          onChange={() => handleCheckboxChange('suscripcion_hoy_whatsapp')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recordatorio anticipado */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Aviso anticipado</p>
                      <p className={notifCardStyles.cardDesc}>Avisar unos días antes del cobro para preparar el pago.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.suscripcion_recordatorio_activo}
                        onChange={() => handleCheckboxChange('suscripcion_recordatorio_activo')}
                        aria-label="Activar aviso anticipado de suscripción"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.suscripcion_recordatorio_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.inputGroup}>
                        <label htmlFor="suscripcion_recordatorio_dias">Anticipación:</label>
                        <input
                          type="number"
                          id="suscripcion_recordatorio_dias"
                          value={formNotificaciones.suscripcion_recordatorio_dias}
                          onChange={(e) =>
                            handleNumberChange('suscripcion_recordatorio_dias', parseInt(e.target.value), 1, 14)
                          }
                          className={notifCardStyles.numberInput}
                          min={1}
                          max={14}
                        />
                        <span>días</span>
                      </div>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.suscripcion_recordatorio_web}
                            onChange={() => handleCheckboxChange('suscripcion_recordatorio_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.suscripcion_recordatorio_whatsapp}
                            onChange={() => handleCheckboxChange('suscripcion_recordatorio_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Finanzas y Metas */}
            <section className={notifCardStyles.section}>
              <h3 className={notifCardStyles.sectionTitle}>
                <Target size={16} /> Finanzas y Metas
              </h3>
              <div className={notifCardStyles.grid}>
                {/* Metas alcanzadas */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Meta cumplida</p>
                      <p className={notifCardStyles.cardDesc}>Avisar cuando completes una meta de ahorro.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.meta_alcanzada_activo}
                        onChange={() => handleCheckboxChange('meta_alcanzada_activo')}
                        aria-label="Activar aviso de meta cumplida"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.meta_alcanzada_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.meta_alcanzada_web}
                            onChange={() => handleCheckboxChange('meta_alcanzada_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.meta_alcanzada_whatsapp}
                            onChange={() => handleCheckboxChange('meta_alcanzada_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saldo en Cero */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Billetera sin fondos</p>
                      <p className={notifCardStyles.cardDesc}>Avisar cuando una billetera se quede sin dinero.</p>
                    </div>
                  </div>
                  <div className={notifCardStyles.cardControls}>
                    <div className={notifCardStyles.channels}>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.saldo_cero_web}
                          onChange={() => handleCheckboxChange('saldo_cero_web')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={notifCardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={formNotificaciones.saldo_cero_whatsapp}
                          onChange={() => handleCheckboxChange('saldo_cero_whatsapp')}
                          className={notifCardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                </div>

                {/* Gasto inusual */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Gasto inusual</p>
                      <p className={notifCardStyles.cardDesc}>Avisar cuando se registre un gasto llamativamente alto.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.gasto_inusual_activo}
                        onChange={() => handleCheckboxChange('gasto_inusual_activo')}
                        aria-label="Activar aviso de gasto inusual"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.gasto_inusual_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.gasto_inusual_web}
                            onChange={() => handleCheckboxChange('gasto_inusual_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.gasto_inusual_whatsapp}
                            onChange={() => handleCheckboxChange('gasto_inusual_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inactividad */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Alerta de inactividad</p>
                      <p className={notifCardStyles.cardDesc}>Avisar si pasaron varios días sin registrar movimientos.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.inactividad_activo}
                        onChange={() => handleCheckboxChange('inactividad_activo')}
                        aria-label="Activar aviso de inactividad"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.inactividad_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.inputGroup}>
                        <label htmlFor="inactividad_dias">Días sin registrar:</label>
                        <input
                          type="number"
                          id="inactividad_dias"
                          value={formNotificaciones.inactividad_dias}
                          onChange={(e) =>
                            handleNumberChange('inactividad_dias', parseInt(e.target.value), 3, 30)
                          }
                          className={notifCardStyles.numberInput}
                          min={3}
                          max={30}
                        />
                        <span>días</span>
                      </div>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.inactividad_web}
                            onChange={() => handleCheckboxChange('inactividad_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.inactividad_whatsapp}
                            onChange={() => handleCheckboxChange('inactividad_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen Semanal [NUEVO] */}
                <div className={notifCardStyles.card}>
                  <div className={notifCardStyles.cardHeader}>
                    <div className={notifCardStyles.cardMeta}>
                      <p className={notifCardStyles.cardTitle}>Resumen semanal</p>
                      <p className={notifCardStyles.cardDesc}>Recibir un resumen detallado de ingresos y egresos al final de la semana.</p>
                    </div>
                    <label className={notifCardStyles.switch}>
                      <input
                        type="checkbox"
                        checked={formNotificaciones.resumen_semanal_activo}
                        onChange={() => handleCheckboxChange('resumen_semanal_activo')}
                        aria-label="Activar resumen semanal"
                      />
                      <span className={notifCardStyles.slider} />
                    </label>
                  </div>
                  {formNotificaciones.resumen_semanal_activo && (
                    <div className={notifCardStyles.cardControls}>
                      <div className={notifCardStyles.channels}>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.resumen_semanal_web}
                            onChange={() => handleCheckboxChange('resumen_semanal_web')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          En la web
                        </label>
                        <label className={notifCardStyles.channelLabel}>
                          <input
                            type="checkbox"
                            checked={formNotificaciones.resumen_semanal_whatsapp}
                            onChange={() => handleCheckboxChange('resumen_semanal_whatsapp')}
                            className={notifCardStyles.channelCheckbox}
                          />
                          Por WhatsApp
                        </label>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* Actions Footer */}
            <div className={notifCardStyles.footer}>
              <button
                type="submit"
                className={notifCardStyles.btnSave}
                disabled={isNotifSaving}
              >
                {isNotifSaving ? 'Guardando...' : 'Guardar Preferencias'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODALES DE EDICIÓN (Copiados de PerfilPage) */}
      {activeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {activeModal === 'datos-personales' && 'Editar datos personales'}
                {activeModal === 'email' && 'Editar email'}
                {activeModal === 'telefono' && 'Editar teléfono'}
                {activeModal === 'password' && (usuario?.password_configurada ? 'Cambiar contraseña' : 'Crear contraseña')}
                {activeModal === 'ciclo' && 'Configurar ciclo financiero'}
                {activeModal === 'moneda' && 'Configurar moneda'}
              </h3>
              <button className={styles.iconBtn} onClick={handleCloseModal} aria-label="Cerrar modal"><X size={20} /></button>
            </div>

            {modalError && <div className={styles.modalError}>{modalError}</div>}

            {activeModal === 'datos-personales' && (
              <form onSubmit={handleSaveDatosPersonales} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-nombre" className={styles.inputLabel}>Nombre</label>
                  <input id="perfil-nombre" type="text" className={styles.input} value={formDatos.nombre} onChange={(e) => setFormDatos({ ...formDatos, nombre: e.target.value })} required />
                </div>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />Guardar cambios</>}
                </button>
              </form>
            )}

            {activeModal === 'email' && (
              <form onSubmit={handleSaveEmail} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-email" className={styles.inputLabel}>Nuevo email</label>
                  <input id="perfil-email" type="email" className={styles.input} placeholder="nombre@ejemplo.com" value={formEmail.email_nuevo} onChange={(e) => setFormEmail({ ...formEmail, email_nuevo: e.target.value })} required />
                </div>
                {usuario?.password_configurada && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-email-pass" className={styles.inputLabel}>Contraseña actual</label>
                    <input id="perfil-email-pass" type="password" className={styles.input} placeholder="••••••••" value={formEmail.password_actual} onChange={(e) => setFormEmail({ ...formEmail, password_actual: e.target.value })} required />
                  </div>
                )}
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />Actualizar email</>}
                </button>
              </form>
            )}

            {activeModal === 'telefono' && (
              <form onSubmit={handleSaveTelefono} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-tel" className={styles.inputLabel}>Nuevo teléfono</label>
                  <input id="perfil-tel" type="tel" className={styles.input} placeholder="+549..." value={formTelefono.telefono_nuevo} onChange={(e) => setFormTelefono({ ...formTelefono, telefono_nuevo: e.target.value })} required />
                </div>
                {!isGoogle && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-tel-pass" className={styles.inputLabel}>Contraseña actual</label>
                    <input id="perfil-tel-pass" type="password" className={styles.input} placeholder="••••••••" value={formTelefono.password_actual} onChange={(e) => setFormTelefono({ ...formTelefono, password_actual: e.target.value })} required />
                  </div>
                )}
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />Actualizar teléfono</>}
                </button>
              </form>
            )}

            {activeModal === 'password' && (
              <form onSubmit={handleSavePassword} className={styles.modalForm}>
                {usuario?.password_configurada && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-pass-actual" className={styles.inputLabel}>Contraseña actual</label>
                    <input id="perfil-pass-actual" type="password" className={styles.input} placeholder="••••••••" value={formPassword.password_actual} onChange={(e) => setFormPassword({ ...formPassword, password_actual: e.target.value })} required />
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-pass-nueva" className={styles.inputLabel}>Nueva contraseña</label>
                  <input id="perfil-pass-nueva" type="password" className={styles.input} placeholder="••••••••" value={formPassword.password_nueva} onChange={(e) => setFormPassword({ ...formPassword, password_nueva: e.target.value })} required />
                  <div className={styles.pwReqs}>
                    <p className={`${styles.req} ${pwReqs.length ? styles.reqMet : ''}`}><CheckCircle2 size={11} />Mínimo 8 caracteres</p>
                    <p className={`${styles.req} ${pwReqs.upper ? styles.reqMet : ''}`}><CheckCircle2 size={11} />Una mayúscula</p>
                    <p className={`${styles.req} ${pwReqs.lower ? styles.reqMet : ''}`}><CheckCircle2 size={11} />Una minúscula</p>
                    <p className={`${styles.req} ${pwReqs.number ? styles.reqMet : ''}`}><CheckCircle2 size={11} />Un número</p>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-pass-conf" className={styles.inputLabel}>Confirmar nueva contraseña</label>
                  <input id="perfil-pass-conf" type="password" className={styles.input} placeholder="••••••••" value={formPassword.password_nueva_confirmacion} onChange={(e) => setFormPassword({ ...formPassword, password_nueva_confirmacion: e.target.value })} required />
                </div>
                <button type="submit" disabled={isSaving || !pwReqs.length || !pwReqs.upper || !pwReqs.lower || !pwReqs.number} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />{usuario?.password_configurada ? 'Cambiar contraseña' : 'Crear contraseña'}</>}
                </button>
              </form>
            )}

            {activeModal === 'ciclo' && (
              <form onSubmit={handleSaveCiclo} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Tipo de ciclo</label>
                  <div className={styles.selector}>
                    <button type="button" className={`${styles.selectorBtn} ${formCiclo.ciclo_tipo === 'dia_fijo' ? styles.selectorBtnActive : ''}`} onClick={() => setFormCiclo({ ...formCiclo, ciclo_tipo: 'dia_fijo' })}>Día fijo</button>
                    <button type="button" className={`${styles.selectorBtn} ${formCiclo.ciclo_tipo === 'regla' ? styles.selectorBtnActive : ''}`} onClick={() => setFormCiclo({ ...formCiclo, ciclo_tipo: 'regla' })}>Regla</button>
                  </div>
                </div>
                {formCiclo.ciclo_tipo === 'dia_fijo' ? (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-ciclo-dia" className={styles.inputLabel}>Día del mes (1–28)</label>
                    <input id="perfil-ciclo-dia" type="number" min="1" max="28" className={styles.input} value={formCiclo.ciclo_valor} placeholder="1" onChange={(e) => setFormCiclo({ ...formCiclo, ciclo_valor: e.target.value })} required />
                    <p className={styles.hint}>Tu ciclo empieza el día {formCiclo.ciclo_valor || '…'} de cada mes</p>
                  </div>
                ) : (
                  <SelectInput id="perfil-ciclo-regla" label="Seleccionar regla" value={formCiclo.ciclo_valor} onChange={(val) => setFormCiclo({ ...formCiclo, ciclo_valor: val })} options={OPCIONES_REGLA_CICLO} />
                )}
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />Guardar configuración</>}
                </button>
              </form>
            )}

            {activeModal === 'moneda' && (
              <form onSubmit={handleSaveMoneda} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Moneda principal</label>
                  <div className={styles.selector}>
                    <button type="button" className={`${styles.selectorBtn} ${formMoneda.moneda_principal === 'ARS' ? styles.selectorBtnActive : ''}`} onClick={() => setFormMoneda({ ...formMoneda, moneda_principal: 'ARS' })}>ARS</button>
                    <button type="button" className={`${styles.selectorBtn} ${formMoneda.moneda_principal === 'USD' ? styles.selectorBtnActive : ''}`} onClick={() => setFormMoneda({ ...formMoneda, moneda_principal: 'USD' })}>USD</button>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <span className={styles.inputLabel}>Moneda secundaria activa</span>
                  <div className={`${styles.toggle} ${formMoneda.moneda_secundaria_activa ? styles.toggleActive : ''}`} onClick={() => setFormMoneda({ ...formMoneda, moneda_secundaria_activa: !formMoneda.moneda_secundaria_activa })}>
                    <div className={styles.toggleCircle} />
                  </div>
                </div>
                {formMoneda.moneda_secundaria_activa && (
                  <SelectInput id="perfil-tipo-dolar" label="Tipo de dólar" value={formMoneda.tipo_dolar} onChange={(val) => setFormMoneda({ ...formMoneda, tipo_dolar: val })} options={OPCIONES_TIPO_DOLAR} />
                )}
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={16} />Guardar configuración</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
