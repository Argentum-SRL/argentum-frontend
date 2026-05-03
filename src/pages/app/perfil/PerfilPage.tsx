import { useState, useRef, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Trash2, 
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Edit,
  Camera,
  Lock,
  X,
  Save,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import usuarioService from '@/services/usuario.service'
import styles from './PerfilPage.module.css'
import { useNavigate } from 'react-router-dom'
import type { MetodosLogin } from '@/types'
import * as authService from '@/services/auth.service'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import { useToast } from '@/hooks/useToast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function PerfilPage() {
  const { usuario, logout, updateUsuario } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [metodosLogin, setMetodosLogin] = useState<MetodosLogin | null>(null)

  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const data = await usuarioService.getMetodosLogin()
        setMetodosLogin(data)
      } catch (err) {
        console.error('Error fetching metodos login:', err)
      }
    }
    fetchMetodos()
  }, [usuario])

  // Estados de modales
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Estados de eliminación de cuenta
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const [showConfirmDeleteFoto, setShowConfirmDeleteFoto] = useState(false)

  const { showToast } = useToast()

  // Formularios
  const [formDatos, setFormDatos] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', sexo: '' })
  const [formEmail, setFormEmail] = useState({ email_nuevo: '', password_actual: '' })
  const [formTelefono, setFormTelefono] = useState({ telefono_nuevo: '', password_actual: '' })
  const [formPassword, setFormPassword] = useState({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
  const [formCiclo, setFormCiclo] = useState({ ciclo_tipo: 'dia_fijo' as 'dia_fijo' | 'regla', ciclo_valor: '' })
  const [formMoneda, setFormMoneda] = useState({ moneda_principal: 'ARS' as 'ARS' | 'USD', moneda_secundaria_activa: false, tipo_dolar: 'blue' })

  // Inicializar formularios cuando el usuario carga (Sync in render to avoid cascading renders)
  const [prevUsuarioId, setPrevUsuarioId] = useState(usuario?.id)
  if (usuario?.id !== prevUsuarioId) {
    setPrevUsuarioId(usuario?.id)
    if (usuario) {
      setFormDatos({ 
        nombre: usuario.nombre || '', 
        apellido: usuario.apellido || '',
        fecha_nacimiento: usuario.fecha_nacimiento || '',
        sexo: usuario.sexo || ''
      })
      setFormEmail({ email_nuevo: usuario.email || '', password_actual: '' })
      setFormTelefono({ telefono_nuevo: usuario.telefono || '', password_actual: '' })
      setFormCiclo({ 
        ciclo_tipo: (usuario.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo', 
        ciclo_valor: usuario.ciclo_valor || '' 
      })
      setFormMoneda({
        moneda_principal: (usuario.moneda_principal as 'ARS' | 'USD') || 'ARS',
        moneda_secundaria_activa: usuario.moneda_secundaria_activa,
        tipo_dolar: usuario.tipo_dolar || 'blue'
      })
    }
  }

  const handleOpenModal = (modal: string) => {
    setModalError(null)
    setActiveModal(modal)
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    setModalError(null)
  }

  const handleSaveDatosPersonales = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      const updated = await usuarioService.actualizarDatosPersonales(formDatos)
      updateUsuario(updated)
      handleCloseModal()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      const res = await usuarioService.actualizarEmail(formEmail)
      if (res.requiere_verificacion_email) {
        showToast(res.confirmacion, 'info')
        navigate('/auth/verificar-email', { state: { email: formEmail.email_nuevo } })
      } else {
        if (usuario) {
          updateUsuario({ ...usuario, email: formEmail.email_nuevo, email_verificado: true })
        }
        showToast('Email actualizado correctamente.', 'success')
        handleCloseModal()
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      const detail = error.response?.data?.detail
      if (detail?.includes('Google')) {
        setModalError('Tu cuenta está vinculada a Google. El email debe gestionarse desde Google.')
      } else if (detail?.includes('Contraseña')) {
        setModalError('Contraseña actual incorrecta. Por favor, verificala.')
      } else {
        setModalError(detail || 'Algo salió mal. Intenta de nuevo.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerificarEmailActual = async () => {
    if (!usuario?.email) return
    setIsSaving(true)
    try {
      const res = await authService.enviarCodigoEmail(usuario.email)
      if ((res as { verificado: boolean }).verificado) {
        if (usuario) {
          updateUsuario({ ...usuario, email_verificado: true })
        }
        showToast('Email verificado correctamente (Bypass activo).', 'success')
      } else {
        navigate('/auth/verificar-email', { state: { email: usuario.email } })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast(error.response?.data?.detail || 'Error al enviar el código de verificación.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTelefono = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      const res = await usuarioService.actualizarTelefono({
        telefono_nuevo: formTelefono.telefono_nuevo,
        password_actual: usuario?.auth_provider === 'google' ? undefined : formTelefono.password_actual
      })
      if (res.requiere_verificacion_telefono) {
        navigate('/auth/verificar-telefono')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      // La lógica de si tiene password actual se maneja por usuario?.password_hash en el backend
      await usuarioService.actualizarPassword({
        password_actual: formPassword.password_actual || undefined,
        password_nueva: formPassword.password_nueva,
        password_nueva_confirmacion: formPassword.password_nueva_confirmacion
      })
      showToast('Contraseña actualizada exitosamente', 'success')
      handleCloseModal()
      setFormPassword({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      const detail = error.response?.data?.detail
      if (detail?.includes('coinciden')) {
        setModalError('Las contraseñas nuevas no coinciden.')
      } else if (detail?.includes('actual incorrecta')) {
        setModalError('La contraseña actual es incorrecta.')
      } else if (detail?.includes('8 caracteres')) {
        setModalError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      } else {
        setModalError(detail || 'Algo salió mal al actualizar la contraseña.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCiclo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      const updated = await usuarioService.actualizarCicloFinanciero(formCiclo)
      updateUsuario(updated)
      handleCloseModal()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMoneda = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setModalError(null)
    try {
      const updated = await usuarioService.actualizarMoneda(formMoneda)
      updateUsuario(updated)
      handleCloseModal()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setModalError(error.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await usuarioService.subirFoto(file)
      if (usuario) {
        updateUsuario({ ...usuario, foto_url: res.foto_url })
      }
      showToast('Foto de perfil actualizada', 'success')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast(error.response?.data?.detail || 'Error al subir la foto', 'error')
    }
  }

  const handleDeleteFotoConfirmed = async () => {
    try {
      await usuarioService.eliminarFoto()
      if (usuario) {
        updateUsuario({ ...usuario, foto_url: null })
      }
      showToast('Foto eliminada', 'success')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      showToast(error.response?.data?.detail || 'Error al eliminar la foto', 'error')
    } finally {
      setShowConfirmDeleteFoto(false)
    }
  }

  const handleLogoutConfirmed = async () => {
    await logout()
  }

  const handleDeleteAccountConfirmed = async () => {
    setIsDeleting(true)
    try {
      await usuarioService.eliminarCuenta()
      showToast('Cuenta eliminada exitosamente', 'success')
      await logout()
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error)
      showToast('Hubo un error al intentar eliminar la cuenta.', 'error')
    } finally {
      setIsDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  const getFotoUrl = () => {
    if (!usuario?.foto_url) return null
    if (usuario.foto_url.startsWith('http')) return usuario.foto_url
    return `${API_URL}${usuario.foto_url}`
  }



  // Auxiliares de permisos
  const isGoogle = usuario?.auth_provider === 'google'

  // Validaciones password en tiempo real
  const pw = formPassword.password_nueva
  const pwReqs = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw)
  }

  return (
    <div className={styles.root}>
      {/* Header Perfil */}
      <div className={styles.headerCard}>
        <div className={styles.headerInner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {getFotoUrl() ? (
                <img src={getFotoUrl()!} alt="Avatar" className={styles.avatarImage} />
              ) : (
                usuario?.nombre?.charAt(0) || 'U'
              )}
            </div>
            <button 
              className={styles.cameraBtn} 
              onClick={() => fileInputRef.current?.click()}
              title="Cambiar foto"
              aria-label="Cambiar foto de perfil"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              title="Seleccionar imagen de perfil"
            />
            {usuario?.foto_url && (
              <button 
                className={styles.deleteFotoBtn} 
                onClick={() => setShowConfirmDeleteFoto(true)}
                aria-label="Eliminar foto de perfil"
              >
                Eliminar foto
              </button>
            )}
          </div>
          
          <div className={styles.headerMeta}>
            <div className={styles.dataRowHeader}>
              <h1 className={styles.headerName}>
                {usuario?.nombre} {usuario?.apellido}
              </h1>
              <button 
                className={styles.editBtn} 
                onClick={() => handleOpenModal('datos-personales')}
                aria-label="Editar datos personales"
              >
                <Edit size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        {/* Datos de la Cuenta */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <User className={styles.dataCardTitleIcon} size={20} />
            Datos de la Cuenta
          </h2>
          
          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Mail size={20} />
              </div>
              <div className={styles.dataRowHeader}>
                <div>
                  <p className={styles.dataRowLabel}>Email</p>
                  <p className={styles.dataRowValue}>{usuario?.email || 'No asociado'}</p>
                </div>
                {isGoogle ? (
                  <Lock size={16} className={styles.lockIcon} />
                ) : (
                  <button 
                    className={styles.editBtn} 
                    onClick={() => handleOpenModal('email')}
                    aria-label="Editar email"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Phone size={20} />
              </div>
              <div className={styles.dataRowHeader}>
                <div>
                  <p className={styles.dataRowLabel}>Teléfono</p>
                  <p className={styles.dataRowValue}>{usuario?.telefono || 'No asociado'}</p>
                </div>
                <button 
                  className={styles.editBtn} 
                  onClick={() => handleOpenModal('telefono')}
                  aria-label="Editar teléfono"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Métodos de inicio de sesión */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <ShieldCheck className={styles.dataCardTitleIcon} size={20} />
            Métodos de inicio de sesión
          </h2>
          
          <div className={styles.dataRows}>
            {/* Email + Password */}
            <div className={styles.metodoRow}>
              <div className={styles.metodoRowMain}>
                <div className={styles.metodoInfo}>
                  <div className={styles.dataRowIcon}>
                    <Mail size={20} />
                  </div>
                  <p className={styles.dataRowValue}>Email + Contraseña</p>
                </div>
                {metodosLogin?.email_password ? (
                  <span className={styles.metodoActivo}>Activo</span>
                ) : metodosLogin?.puede_agregar_password ? (
                  <span className={styles.metodoInactivo}>Sin contraseña</span>
                ) : metodosLogin?.puede_agregar_email ? (
                  <span className={styles.metodoWarning}>Email no verificado</span>
                ) : (
                  <span className={styles.metodoInactivo}>No configurado</span>
                )}
              </div>
              <div>
                {metodosLogin?.email_password && (
                  <button className={styles.actionLink} onClick={() => handleOpenModal('password')}>
                    Cambiar contraseña
                  </button>
                )}
                {metodosLogin?.puede_agregar_password && (
                  <button className={styles.actionLink} onClick={() => handleOpenModal('password')}>
                    Crear contraseña
                  </button>
                )}
                {metodosLogin?.puede_agregar_email && (
                  <div className={styles.formMethodsActions}>
                    <button className={styles.actionLink} onClick={handleVerificarEmailActual}>
                      Verificar ahora
                    </button>
                    <button className={styles.actionLink} onClick={() => handleOpenModal('email')}>
                      Cambiar email
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Teléfono */}
            <div className={styles.metodoRow}>
              <div className={styles.metodoRowMain}>
                <div className={styles.metodoInfo}>
                  <div className={styles.dataRowIcon}>
                    <Phone size={20} />
                  </div>
                  <p className={styles.dataRowValue}>WhatsApp</p>
                </div>
                {metodosLogin?.telefono ? (
                  <span className={styles.metodoActivo}>Activo</span>
                ) : (
                  <span className={styles.metodoInactivo}>No configurado</span>
                )}
              </div>
              <div>
                <button className={styles.actionLink} onClick={() => handleOpenModal('telefono')}>
                  {metodosLogin?.telefono ? 'Cambiar teléfono' : 'Agregar teléfono'}
                </button>
              </div>
            </div>

            {/* Google */}
            <div className={styles.metodoRow}>
              <div className={styles.metodoRowMain}>
                <div className={styles.metodoInfo}>
                  <div className={styles.dataRowIcon}>
                    <GoogleIcon />
                  </div>
                  <p className={styles.dataRowValue}>Google</p>
                </div>
                {metodosLogin?.google ? (
                  <span className={styles.metodoActivo}>Disponible</span>
                ) : (
                  <span className={styles.metodoInactivo}>No disponible</span>
                )}
              </div>
              <p className={styles.metodoDescription}>
                {metodosLogin?.google 
                  ? 'Podés iniciar sesión con tu cuenta de Google si coincide con tu email verificado.'
                  : 'Verificá tu email para poder usar Google como método de ingreso.'}
              </p>
            </div>
          </div>
        </div>

        {/* Seguridad (original, simplificada) */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <ShieldCheck className={styles.dataCardTitleIcon} size={20} />
            Estado de Verificación
          </h2>
          
          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <ShieldCheck size={20} />
              </div>
              <div className={styles.formMethodsActions}>
                <span className={`${styles.verificacionBadge} ${usuario?.email_verificado ? styles.verificado : styles.noVerificado}`}>
                  Email {usuario?.email_verificado ? 'verificado' : 'no verificado'}
                </span>
                <span className={`${styles.verificacionBadge} ${usuario?.telefono_verificado ? styles.verificado : styles.noVerificado}`}>
                  Teléfono {usuario?.telefono_verificado ? 'verificado' : 'no verificado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Financiera */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <TrendingUp className={styles.dataCardTitleIcon} size={20} />
            Configuración Financiera
          </h2>
          
          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Calendar size={20} />
              </div>
              <div className={styles.dataRowHeader}>
                <div>
                  <p className={styles.dataRowLabel}>Ciclo de cobro</p>
                  <p className={styles.dataRowValue}>
                    {usuario?.ciclo_tipo === 'dia_fijo' 
                      ? `Día ${usuario.ciclo_valor} de cada mes`
                      : usuario?.ciclo_valor?.replace('_', ' ')}
                  </p>
                </div>
                <button 
                  className={styles.editBtn} 
                  onClick={() => handleOpenModal('ciclo')}
                  aria-label="Editar ciclo de cobro"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>

            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <DollarSign size={20} />
              </div>
              <div className={styles.dataRowHeader}>
                <div>
                  <p className={styles.dataRowLabel}>Moneda principal</p>
                  <p className={styles.dataRowValue}>{usuario?.moneda_principal}</p>
                </div>
                <button 
                  className={styles.editBtn} 
                  onClick={() => handleOpenModal('moneda')}
                  aria-label="Editar moneda principal"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>

            {usuario?.moneda_secundaria_activa && (
              <div className={styles.dataRow}>
                <div className={styles.dataRowIcon}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className={styles.dataRowLabel}>Tipo de dólar</p>
                  <p className={styles.dataRowValue}>{usuario?.tipo_dolar?.toUpperCase()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className={styles.dangerCard}>
          <div>
            <h2 className={styles.dangerTitle}>
              <AlertTriangle size={20} />
              Zona de Peligro
            </h2>
            <p className={styles.dangerText}>
              Eliminar tu cuenta es una acción **permanente**. Se borrarán todas tus billeteras, transacciones, presupuestos y datos personales. No se puede deshacer.
            </p>
          </div>

          <div className={styles.dangerActions}>
            <button onClick={() => setShowConfirmLogout(true)} className={styles.logoutBtn}>
              <LogOut size={20} />
              Cerrar sesión
            </button>

            <button onClick={() => setShowConfirmDelete(true)} className={styles.dangerBtn}>
              <Trash2 size={20} />
              Eliminar mi cuenta permanentemente
            </button>
          </div>
        </div>
      </div>

      {/* Modales de Edición */}
      {activeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeaderFlex}>
              <h3 className={styles.modalTitleNoMargin}>
                {activeModal === 'datos-personales' && 'Editar Datos Personales'}
                {activeModal === 'email' && 'Editar Email'}
                {activeModal === 'telefono' && 'Editar Teléfono'}
                {activeModal === 'password' && (usuario?.password_hash ? 'Cambiar Contraseña' : 'Crear Contraseña')}
                {activeModal === 'ciclo' && 'Configurar Ciclo Financiero'}
                {activeModal === 'moneda' && 'Configurar Moneda'}
              </h3>
              <button 
                className={styles.editBtn} 
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.modalErrorBox}>
                {modalError}
              </div>
            )}

            {/* Formulario Datos Personales */}
            {activeModal === 'datos-personales' && (
              <form onSubmit={handleSaveDatosPersonales} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-nombre" className={styles.inputLabel}>Nombre</label>
                  <input 
                    id="perfil-nombre"
                    type="text" 
                    className={styles.input} 
                    value={formDatos.nombre}
                    onChange={(e) => setFormDatos({...formDatos, nombre: e.target.value})}
                    required
                    placeholder="Tu nombre"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-apellido" className={styles.inputLabel}>Apellido</label>
                  <input 
                    id="perfil-apellido"
                    type="text" 
                    className={styles.input} 
                    value={formDatos.apellido}
                    onChange={(e) => setFormDatos({...formDatos, apellido: e.target.value})}
                    required
                    placeholder="Tu apellido"
                  />
                </div>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Guardar Cambios</>}
                </button>
              </form>
            )}

            {/* Formulario Email */}
            {activeModal === 'email' && (
              <form onSubmit={handleSaveEmail} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-email" className={styles.inputLabel}>Nuevo Email</label>
                  <input 
                    id="perfil-email"
                    type="email" 
                    className={styles.input} 
                    value={formEmail.email_nuevo}
                    onChange={(e) => setFormEmail({...formEmail, email_nuevo: e.target.value})}
                    required
                    placeholder="nuevo@email.com"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-email-pass" className={styles.inputLabel}>Contraseña Actual</label>
                  <input 
                    id="perfil-email-pass"
                    type="password" 
                    className={styles.input} 
                    value={formEmail.password_actual}
                    onChange={(e) => setFormEmail({...formEmail, password_actual: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Guardar Cambios</>}
                </button>
              </form>
            )}

            {/* Formulario Teléfono */}
            {activeModal === 'telefono' && (
              <form onSubmit={handleSaveTelefono} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-tel" className={styles.inputLabel}>Nuevo Teléfono</label>
                  <input 
                    id="perfil-tel"
                    type="tel" 
                    className={styles.input} 
                    placeholder="+549..."
                    value={formTelefono.telefono_nuevo}
                    onChange={(e) => setFormTelefono({...formTelefono, telefono_nuevo: e.target.value})}
                    required
                  />
                </div>
                {!isGoogle && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-tel-pass" className={styles.inputLabel}>Contraseña Actual</label>
                    <input 
                      id="perfil-tel-pass"
                      type="password" 
                      className={styles.input} 
                      value={formTelefono.password_actual}
                      onChange={(e) => setFormTelefono({...formTelefono, password_actual: e.target.value})}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Actualizar Teléfono</>}
                </button>
              </form>
            )}

            {/* Formulario Password */}
            {activeModal === 'password' && (
              <form onSubmit={handleSavePassword} className={styles.modalForm}>
                {usuario?.password_hash && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-pass-actual" className={styles.inputLabel}>Contraseña Actual</label>
                    <input 
                      id="perfil-pass-actual"
                      type="password" 
                      className={styles.input} 
                      value={formPassword.password_actual}
                      onChange={(e) => setFormPassword({...formPassword, password_actual: e.target.value})}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-pass-nueva" className={styles.inputLabel}>Nueva Contraseña</label>
                  <input 
                    id="perfil-pass-nueva"
                    type="password" 
                    className={styles.input} 
                    value={formPassword.password_nueva}
                    onChange={(e) => setFormPassword({...formPassword, password_nueva: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                  <div className={styles.pwRequirements}>
                    <p className={`${styles.requirement} ${pwReqs.length ? styles.requirementMet : ''}`}>
                      <CheckCircle2 size={12} /> Mínimo 8 caracteres
                    </p>
                    <p className={`${styles.requirement} ${pwReqs.upper ? styles.requirementMet : ''}`}>
                      <CheckCircle2 size={12} /> Una mayúscula
                    </p>
                    <p className={`${styles.requirement} ${pwReqs.lower ? styles.requirementMet : ''}`}>
                      <CheckCircle2 size={12} /> Una minúscula
                    </p>
                    <p className={`${styles.requirement} ${pwReqs.number ? styles.requirementMet : ''}`}>
                      <CheckCircle2 size={12} /> Un número
                    </p>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="perfil-pass-conf" className={styles.inputLabel}>Confirmar Nueva Contraseña</label>
                  <input 
                    id="perfil-pass-conf"
                    type="password" 
                    className={styles.input} 
                    value={formPassword.password_nueva_confirmacion}
                    onChange={(e) => setFormPassword({...formPassword, password_nueva_confirmacion: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={isSaving || !pwReqs.length || !pwReqs.upper || !pwReqs.lower || !pwReqs.number} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> {usuario?.password_hash ? 'Cambiar Contraseña' : 'Crear Contraseña'}</>}
                </button>
              </form>
            )}

            {/* Formulario Ciclo */}
            {activeModal === 'ciclo' && (
              <form onSubmit={handleSaveCiclo} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Tipo de Ciclo</label>
                  <div className={styles.selector}>
                    <button 
                      type="button" 
                      className={`${styles.selectorBtn} ${formCiclo.ciclo_tipo === 'dia_fijo' ? styles.selectorBtnActive : ''}`}
                      onClick={() => setFormCiclo({...formCiclo, ciclo_tipo: 'dia_fijo'})}
                    >
                      Día fijo
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.selectorBtn} ${formCiclo.ciclo_tipo === 'regla' ? styles.selectorBtnActive : ''}`}
                      onClick={() => setFormCiclo({...formCiclo, ciclo_tipo: 'regla'})}
                    >
                      Regla
                    </button>
                  </div>
                </div>

                {formCiclo.ciclo_tipo === 'dia_fijo' ? (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-ciclo-dia" className={styles.inputLabel}>Día del mes (1-28)</label>
                    <input 
                      id="perfil-ciclo-dia"
                      type="number" 
                      min="1" max="28"
                      className={styles.input}
                      value={formCiclo.ciclo_valor}
                      onChange={(e) => setFormCiclo({...formCiclo, ciclo_valor: e.target.value})}
                      required
                      placeholder="15"
                    />
                    <p className={styles.exampleText}>Tu ciclo empieza el día {formCiclo.ciclo_valor || '...'} de cada mes</p>
                  </div>
                ) : (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-ciclo-regla" className={styles.inputLabel}>Seleccionar Regla</label>
                    <select 
                      id="perfil-ciclo-regla"
                      className={styles.input}
                      value={formCiclo.ciclo_valor}
                      onChange={(e) => setFormCiclo({...formCiclo, ciclo_valor: e.target.value})}
                      required
                      title="Regla de ciclo financiero"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="primer_lunes">Primer Lunes</option>
                      <option value="primer_martes">Primer Martes</option>
                      <option value="primer_miercoles">Primer Miércoles</option>
                      <option value="primer_jueves">Primer Jueves</option>
                      <option value="primer_viernes">Primer Viernes</option>
                      <option value="ultimo_lunes">Último Lunes</option>
                      <option value="ultimo_martes">Último Martes</option>
                      <option value="ultimo_miercoles">Último Miércoles</option>
                      <option value="ultimo_jueves">Último Jueves</option>
                      <option value="ultimo_viernes">Último Viernes</option>
                    </select>
                  </div>
                )}
                
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Guardar Configuración</>}
                </button>
              </form>
            )}

            {/* Formulario Moneda */}
            {activeModal === 'moneda' && (
              <form onSubmit={handleSaveMoneda} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Moneda Principal</label>
                  <div className={styles.selector}>
                    <button 
                      type="button" 
                      className={`${styles.selectorBtn} ${formMoneda.moneda_principal === 'ARS' ? styles.selectorBtnActive : ''}`}
                      onClick={() => setFormMoneda({...formMoneda, moneda_principal: 'ARS'})}
                    >
                      ARS
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.selectorBtn} ${formMoneda.moneda_principal === 'USD' ? styles.selectorBtnActive : ''}`}
                      onClick={() => setFormMoneda({...formMoneda, moneda_principal: 'USD'})}
                    >
                      USD
                    </button>
                  </div>
                </div>

                <div className={styles.toggleRow}>
                  <span className={styles.inputLabel}>Moneda Secundaria Activa</span>
                  <div 
                    className={`${styles.toggle} ${formMoneda.moneda_secundaria_activa ? styles.toggleActive : ''}`}
                    onClick={() => setFormMoneda({...formMoneda, moneda_secundaria_activa: !formMoneda.moneda_secundaria_activa})}
                  >
                    <div className={styles.toggleCircle} />
                  </div>
                </div>

                {formMoneda.moneda_secundaria_activa && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="perfil-tipo-dolar" className={styles.inputLabel}>Tipo de Dólar</label>
                    <select 
                      id="perfil-tipo-dolar"
                      className={styles.input}
                      value={formMoneda.tipo_dolar}
                      onChange={(e) => setFormMoneda({...formMoneda, tipo_dolar: e.target.value})}
                      title="Tipo de cambio dólar"
                    >
                      <option value="oficial">Oficial</option>
                      <option value="blue">Blue</option>
                      <option value="mep">MEP</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                )}
                
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Guardar Configuración</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        onConfirm={handleLogoutConfirmed}
        title="Cerrar sesión"
        description="¿Estás seguro de que querés cerrar sesión ahora?"
      />

      <ConfirmModal
        isOpen={showConfirmDeleteFoto}
        onClose={() => setShowConfirmDeleteFoto(false)}
        onConfirm={handleDeleteFotoConfirmed}
        title="Eliminar foto de perfil"
        description="¿Estás seguro de que querés eliminar tu foto de perfil?"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteAccountConfirmed}
        title="¿Estás absolutamente seguro?"
        description="Esta acción borrará definitivamente todos tus datos financieros en Argentum. No se puede deshacer."
        variant="danger"
        confirmLabel="Confirmar eliminación total"
        requireTyping="ELIMINAR"
        isLoading={isDeleting}
      />
    </div>
  )
}
