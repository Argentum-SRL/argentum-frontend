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
  CreditCard
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import usuarioService from '@/services/usuario.service'
import styles from './PerfilPage.module.css'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PerfilPage() {
  const { usuario, logout, updateUsuario } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de modales
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Estados de eliminación de cuenta
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Formularios
  const [formDatos, setFormDatos] = useState({ nombre: '', apellido: '' })
  const [formEmail, setFormEmail] = useState({ email_nuevo: '', password_actual: '' })
  const [formTelefono, setFormTelefono] = useState({ telefono_nuevo: '', password_actual: '' })
  const [formPassword, setFormPassword] = useState({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
  const [formCiclo, setFormCiclo] = useState({ ciclo_tipo: 'dia_fijo' as 'dia_fijo' | 'regla', ciclo_valor: '' })
  const [formMoneda, setFormMoneda] = useState({ moneda_principal: 'ARS' as 'ARS' | 'USD', moneda_secundaria_activa: false, tipo_dolar: 'blue' })

  // Inicializar formularios cuando el usuario carga
  useEffect(() => {
    if (usuario) {
      setFormDatos({ nombre: usuario.nombre || '', apellido: usuario.apellido || '' })
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
  }, [usuario])

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
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
        alert(res.confirmacion)
        navigate('/auth/verificar-email')
      }
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
      alert('Contraseña actualizada exitosamente')
      handleCloseModal()
      setFormPassword({ password_actual: '', password_nueva: '', password_nueva_confirmacion: '' })
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Algo salió mal. Intenta de nuevo.')
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al subir la foto')
    }
  }

  const handleDeleteFoto = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) return
    try {
      await usuarioService.eliminarFoto()
      if (usuario) {
        updateUsuario({ ...usuario, foto_url: null })
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar la foto')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    
    setIsDeleting(true)
    try {
      await usuarioService.eliminarCuenta()
      setIsSuccess(true)
      setTimeout(async () => {
        await logout({ state: { message: 'Cuenta eliminada exitosamente' } })
      }, 2500)
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error)
      alert('Hubo un error al intentar eliminar la cuenta. Por favor, reintenta más tarde.')
    } finally {
      setIsDeleting(false)
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
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            {usuario?.foto_url && (
              <button className={styles.deleteFotoBtn} onClick={handleDeleteFoto}>
                Eliminar foto
              </button>
            )}
          </div>
          
          <div className={styles.headerMeta}>
            <div className={styles.dataRowHeader}>
              <h1 className={styles.headerName}>
                {usuario?.nombre} {usuario?.apellido}
              </h1>
              <button className={styles.editBtn} onClick={() => handleOpenModal('datos-personales')}>
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
                  <button className={styles.editBtn} onClick={() => handleOpenModal('email')}>
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
                <button className={styles.editBtn} onClick={() => handleOpenModal('telefono')}>
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <ShieldCheck className={styles.dataCardTitleIcon} size={20} />
            Seguridad
          </h2>
          
          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Lock size={20} />
              </div>
              <div className={styles.dataRowHeader}>
                <div>
                  <p className={styles.dataRowLabel}>Contraseña</p>
                  <p className={styles.dataRowValue}>
                    {isGoogle ? 'Gestionada por Google' : (usuario?.password_hash ? '••••••••' : 'No configurada')}
                  </p>
                </div>
                {isGoogle ? (
                  <Lock size={16} className={styles.lockIcon} />
                ) : (
                  <button className={styles.editBtn} onClick={() => handleOpenModal('password')}>
                    <Edit size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <ShieldCheck size={20} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
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
                <button className={styles.editBtn} onClick={() => handleOpenModal('ciclo')}>
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
                <button className={styles.editBtn} onClick={() => handleOpenModal('moneda')}>
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
          
          <button onClick={() => setShowConfirmDelete(true)} className={styles.dangerBtn}>
            <Trash2 size={20} />
            Eliminar mi cuenta permanentemente
          </button>
        </div>
      </div>

      {/* Modales de Edición */}
      {activeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>
                {activeModal === 'datos-personales' && 'Editar Datos Personales'}
                {activeModal === 'email' && 'Editar Email'}
                {activeModal === 'telefono' && 'Editar Teléfono'}
                {activeModal === 'password' && (usuario?.password_hash ? 'Cambiar Contraseña' : 'Crear Contraseña')}
                {activeModal === 'ciclo' && 'Configurar Ciclo Financiero'}
                {activeModal === 'moneda' && 'Configurar Moneda'}
              </h3>
              <button className={styles.editBtn} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.errorText} style={{ marginBottom: '16px', textAlign: 'center', padding: '8px', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '8px' }}>
                {modalError}
              </div>
            )}

            {/* Formulario Datos Personales */}
            {activeModal === 'datos-personales' && (
              <form onSubmit={handleSaveDatosPersonales} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Nombre</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={formDatos.nombre}
                    onChange={(e) => setFormDatos({...formDatos, nombre: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Apellido</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={formDatos.apellido}
                    onChange={(e) => setFormDatos({...formDatos, apellido: e.target.value})}
                    required
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
                  <label className={styles.inputLabel}>Nuevo Email</label>
                  <input 
                    type="email" 
                    className={styles.input} 
                    value={formEmail.email_nuevo}
                    onChange={(e) => setFormEmail({...formEmail, email_nuevo: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Contraseña Actual</label>
                  <input 
                    type="password" 
                    className={styles.input} 
                    value={formEmail.password_actual}
                    onChange={(e) => setFormEmail({...formEmail, password_actual: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? <div className={styles.spinner} /> : <><Save size={18} /> Actualizar Email</>}
                </button>
              </form>
            )}

            {/* Formulario Teléfono */}
            {activeModal === 'telefono' && (
              <form onSubmit={handleSaveTelefono} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Nuevo Teléfono</label>
                  <input 
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
                    <label className={styles.inputLabel}>Contraseña Actual</label>
                    <input 
                      type="password" 
                      className={styles.input} 
                      value={formTelefono.password_actual}
                      onChange={(e) => setFormTelefono({...formTelefono, password_actual: e.target.value})}
                      required
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
                    <label className={styles.inputLabel}>Contraseña Actual</label>
                    <input 
                      type="password" 
                      className={styles.input} 
                      value={formPassword.password_actual}
                      onChange={(e) => setFormPassword({...formPassword, password_actual: e.target.value})}
                      required
                    />
                  </div>
                )}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    className={styles.input} 
                    value={formPassword.password_nueva}
                    onChange={(e) => setFormPassword({...formPassword, password_nueva: e.target.value})}
                    required
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
                  <label className={styles.inputLabel}>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    className={styles.input} 
                    value={formPassword.password_nueva_confirmacion}
                    onChange={(e) => setFormPassword({...formPassword, password_nueva_confirmacion: e.target.value})}
                    required
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
                    <label className={styles.inputLabel}>Día del mes (1-28)</label>
                    <input 
                      type="number" 
                      min="1" max="28"
                      className={styles.input}
                      value={formCiclo.ciclo_valor}
                      onChange={(e) => setFormCiclo({...formCiclo, ciclo_valor: e.target.value})}
                      required
                    />
                    <p className={styles.exampleText}>Tu ciclo empieza el día {formCiclo.ciclo_valor || '...'} de cada mes</p>
                  </div>
                ) : (
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Seleccionar Regla</label>
                    <select 
                      className={styles.input}
                      value={formCiclo.ciclo_valor}
                      onChange={(e) => setFormCiclo({...formCiclo, ciclo_valor: e.target.value})}
                      required
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
                    <label className={styles.inputLabel}>Tipo de Dólar</label>
                    <select 
                      className={styles.input}
                      value={formMoneda.tipo_dolar}
                      onChange={(e) => setFormMoneda({...formMoneda, tipo_dolar: e.target.value})}
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

      {/* Modal de Confirmación Eliminación */}
      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWrap}>
              <AlertTriangle size={40} />
            </div>
            
            <h3 className={styles.modalTitle}>
              ¿Estás absolutamente seguro?
            </h3>
            
            {isSuccess ? (
              <div className={styles.successWrap}>
                <div className={styles.successIconWrap}>
                  <ShieldCheck size={32} />
                </div>
                <p className={styles.successTitle}>Cuenta eliminada con éxito</p>
                <p className={styles.successText}>
                  Tus datos han sido borrados de Argentum. <br/>Redirigiendo...
                </p>
              </div>
            ) : (
              <>
                <p className={styles.modalText}>
                  Esta acción borrará definitivamente todos tus datos financieros en Argentum.
                </p>
                
                <div className={styles.modalInputWrap}>
                  <p className={styles.modalInputLabel}>Escribe &quot;ELIMINAR&quot; para confirmar</p>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button 
                    disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                    onClick={handleDeleteAccount}
                    className={styles.modalConfirmBtn}
                  >
                    {isDeleting ? (
                      <div className={styles.spinner} />
                    ) : (
                      <>Confirmar Eliminación Total</>
                    )}
                  </button>
                  
                  <button 
                    disabled={isDeleting}
                    onClick={() => {
                      setShowConfirmDelete(false)
                      setDeleteConfirmText('')
                    }}
                    className={styles.modalCancelBtn}
                  >
                    Mejor no, volver atrás
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
