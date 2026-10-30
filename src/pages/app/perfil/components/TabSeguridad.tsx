import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Check,
  Edit3,
  MessageSquare,
  Unlink,
  LogOut,
  Download,
  Lock,
} from '@/components/ui/icons'
import type { Usuario, MetodosLogin } from '@/types'
import { formatearTelefonoVisual } from '@/utils/telefono.utils'
import usuarioService from '@/services/usuario.service'
import authService from '@/services/auth.service'
import { nombreArchivoMisDatos } from '@/utils/misDatos'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { getPasswordRequirements, validatePassword, validatePasswordConfirmation } from '@/utils/password.utils'
import perfilStyles from '../PerfilPage.module.css'
import localStyles from './TabSeguridad.module.css'
import { PerfilSeguridadSkeleton } from '@/components/ui'

interface TabSeguridadProps {
  usuario: Usuario | null
  metodosLogin?: MetodosLogin | null
  loadingMetodos?: boolean
  updateUsuario: (u: Usuario) => void
  onEditEmail: () => void
  onVerificarEmail: () => void
}

export const TabSeguridad: React.FC<TabSeguridadProps> = ({
  usuario,
  loadingMetodos = false,
  updateUsuario,
  onEditEmail,
  onVerificarEmail,
}) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { confirm } = useModal()

  // ── Password Editing & State ─────────────────────────────────────────────
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPwActual, setShowPwActual] = useState(false)
  const [showPwNueva, setShowPwNueva] = useState(false)
  const [isSavingPw, setIsSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Password validations
  const reqs = getPasswordRequirements(passwordNueva, passwordConfirm)
  const isPwValid = reqs.length && reqs.maxLength && reqs.upper && reqs.lower && reqs.number && reqs.match

  const handleCancelPassword = () => {
    setIsEditingPassword(false)
    setPasswordActual('')
    setPasswordNueva('')
    setPasswordConfirm('')
    setPwError(null)
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)

    if (usuario?.password_configurada && !passwordActual.trim()) {
      setPwError('Ingresá tu contraseña actual para confirmar el cambio.')
      return
    }

    if (usuario?.password_configurada && passwordActual === passwordNueva) {
      setPwError('La nueva contraseña no puede ser idéntica a tu contraseña actual.')
      return
    }

    const pErr = validatePassword(passwordNueva)
    if (pErr) {
      setPwError(pErr)
      return
    }

    const cpErr = validatePasswordConfirmation(passwordNueva, passwordConfirm)
    if (cpErr) {
      setPwError(cpErr)
      return
    }

    setIsSavingPw(true)
    try {
      await usuarioService.actualizarPassword({
        password_actual: passwordActual || undefined,
        password_nueva: passwordNueva,
        password_nueva_confirmacion: passwordConfirm,
      })
      sileo.success({ title: 'Contraseña actualizada con éxito' })
      handleCancelPassword()
      if (usuario) {
        updateUsuario({ ...usuario, password_configurada: true })
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar la contraseña. Verificá que la contraseña actual sea correcta.')
      setPwError(msg)
      sileo.error({ title: msg })
    } finally {
      setIsSavingPw(false)
    }
  }

  // ── WhatsApp Actions ─────────────────────────────────────────────────────
  const [isDesvinculando, setIsDesvinculando] = useState(false)

  const handleDesvincular = () => {
    confirm({
      title: '¿Desvincular WhatsApp?',
      description:
        'Dejarás de recibir notificaciones y no podrás registrar gastos ni consultar tus finanzas desde tu chat de WhatsApp hasta volver a vincular un número.',
      variant: 'danger',
      confirmLabel: 'Desvincular WhatsApp',
      onConfirm: async () => {
        setIsDesvinculando(true)
        try {
          const usuarioActualizado = await usuarioService.desvincularTelefono()
          updateUsuario(usuarioActualizado)
          sileo.success({ title: 'Tu cuenta de WhatsApp fue desvinculada exitosamente.' })
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos desvincular tu cuenta de WhatsApp.') })
        } finally {
          setIsDesvinculando(false)
        }
      },
    })
  }

  const [isUpdatingPermiso, setIsUpdatingPermiso] = useState(false)

  const handleTogglePermisoMensajes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.checked
    setIsUpdatingPermiso(true)
    try {
      const usuarioActualizado = await usuarioService.actualizarPermisoMensajes(nuevoValor)
      updateUsuario(usuarioActualizado)
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar el permiso de lectura de mensajes.') })
    } finally {
      setIsUpdatingPermiso(false)
    }
  }

  // ── Sesiones y Descarga de Datos ─────────────────────────────────────────
  const [isDownloading, setIsDownloading] = useState(false)

  const handleCerrarSesiones = () => {
    confirm({
      title: '¿Cerrar sesión en todos los dispositivos?',
      description: 'Vas a tener que volver a iniciar sesión en todos los navegadores y teléfonos, incluido este.',
      variant: 'danger',
      confirmLabel: 'Cerrar sesiones',
      onConfirm: async () => {
        try {
          await authService.cerrarSesionEnTodos()
          await logout()
        } catch (err: unknown) {
          sileo.error({
            title: getErrorMessage(err, 'No pudimos cerrar las sesiones.'),
          })
        }
      },
    })
  }

  const handleDescargarMisDatos = async () => {
    setIsDownloading(true)
    try {
      const blob = await usuarioService.descargarMisDatos()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivoMisDatos(new Date())
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      sileo.success({ title: 'Tus datos se descargaron correctamente.' })
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos generar el archivo. Probá de nuevo en unos minutos.'),
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (loadingMetodos && !usuario) {
    return <PerfilSeguridadSkeleton />
  }

  return (
    <div className={localStyles.tabContainer}>
      <div className={localStyles.tabForm}>
        {/* ── Grid Principal Superior (2 Columnas en Desktop) ──────────────── */}
        <div className={`${localStyles.mainGrid} ${isEditingPassword ? localStyles.mainGridEditing : ''}`}>
          {/* Card 1: Acceso y Autenticación */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#2563eb' }}>
                <Shield size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Acceso y credenciales</h3>
              </div>
            </div>

            <div className={localStyles.cardStack}>
              {/* Row: Correo Electrónico */}
              <div className={localStyles.securityRow}>
                <div className={localStyles.rowInfo}>
                  <div className={localStyles.rowLabelGroup}>
                    <span className={localStyles.rowLabel}>Correo electrónico</span>
                    {usuario?.email_verificado ? (
                      <span className={localStyles.badgeVerified}>
                        <CheckCircle2 size={11} /> Verificado
                      </span>
                    ) : (
                      <span className={localStyles.badgePending}>
                        <AlertCircle size={11} /> Pendiente
                      </span>
                    )}
                  </div>
                  <span className={localStyles.rowSubtitle}>
                    {usuario?.email || 'Sin correo asignado'}
                  </span>
                </div>

                <div className={localStyles.rowActions}>
                  {!usuario?.email_verificado && usuario?.email && (
                    <button
                      type="button"
                      className={localStyles.btnPrimary}
                      onClick={onVerificarEmail}
                    >
                      Reenviar código
                    </button>
                  )}
                  {usuario?.auth_provider !== 'google' && (
                    <button
                      type="button"
                      className={localStyles.btnSecondary}
                      onClick={onEditEmail}
                      title="Cambiar correo electrónico"
                    >
                      <Edit3 size={13} />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row: Contraseña de Acceso */}
              <div className={`${localStyles.securityRow} ${isEditingPassword ? localStyles.securityRowExpandable : ''}`}>
                <div className={localStyles.securityRowHeader}>
                  <div className={localStyles.rowInfo}>
                    <div className={localStyles.rowLabelGroup}>
                      <span className={localStyles.rowLabel}>Contraseña de la cuenta</span>
                      {usuario?.password_configurada ? (
                        <span className={localStyles.badgeVerified}>
                          <CheckCircle2 size={11} /> Configurada
                        </span>
                      ) : (
                        <span className={localStyles.badgePending}>
                          <AlertCircle size={11} /> Sin configurar
                        </span>
                      )}
                    </div>
                    <span className={localStyles.rowSubtitle}>
                      {usuario?.password_configurada
                        ? '•••••••• • Protegida con cifrado seguro'
                        : 'Acceso directo mediante Google OAuth'}
                    </span>
                  </div>

                  {!isEditingPassword && (
                    <div className={localStyles.rowActions}>
                      <button
                        type="button"
                        className={localStyles.btnSecondary}
                        onClick={() => setIsEditingPassword(true)}
                      >
                        <Key size={13} />
                        <span>{usuario?.password_configurada ? 'Cambiar contraseña' : 'Crear contraseña'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Formulario Expandible de Contraseña */}
                {isEditingPassword && (
                  <form onSubmit={handleSavePassword} className={localStyles.passwordExpandPanel}>
                    {pwError && (
                      <div className={localStyles.alertError}>
                        <AlertCircle size={14} />
                        <span>{pwError}</span>
                      </div>
                    )}

                    {usuario?.password_configurada && (
                      <div className={localStyles.fieldGroup}>
                        <label htmlFor="pw-actual-input" className={localStyles.fieldLabel}>
                          Contraseña actual
                        </label>
                        <div className={localStyles.inputWrap}>
                          <input
                            id="pw-actual-input"
                            name="current_account_pw"
                            type={showPwActual ? 'text' : 'password'}
                            autoComplete="current-password"
                            className={localStyles.fieldInput}
                            value={passwordActual}
                            onChange={(e) => setPasswordActual(e.target.value)}
                            placeholder="Ingresá tu contraseña actual"
                            required
                          />
                          <button
                            type="button"
                            className={localStyles.eyeToggleBtn}
                            onClick={() => setShowPwActual(!showPwActual)}
                            tabIndex={-1}
                            aria-label={showPwActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                          >
                            {showPwActual ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={localStyles.fieldGroup}>
                      <label htmlFor="pw-nueva-input" className={localStyles.fieldLabel}>
                        Nueva contraseña
                      </label>
                      <div className={localStyles.inputWrap}>
                        <input
                          id="pw-nueva-input"
                          name="new_account_pw"
                          type={showPwNueva ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={localStyles.fieldInput}
                          value={passwordNueva}
                          onChange={(e) => setPasswordNueva(e.target.value)}
                          placeholder="Ingresá tu nueva contraseña"
                          required
                        />
                        <button
                          type="button"
                          className={localStyles.eyeToggleBtn}
                          onClick={() => setShowPwNueva(!showPwNueva)}
                          tabIndex={-1}
                          aria-label={showPwNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                        >
                          {showPwNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className={localStyles.fieldGroup}>
                      <label htmlFor="pw-confirm-input" className={localStyles.fieldLabel}>
                        Confirmar nueva contraseña
                      </label>
                      <div className={localStyles.inputWrap}>
                        <input
                          id="pw-confirm-input"
                          name="confirm_new_account_pw"
                          type="password"
                          autoComplete="new-password"
                          className={localStyles.fieldInput}
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          placeholder="Repetí la nueva contraseña"
                          required
                        />
                      </div>
                    </div>

                    {/* Requisitos de seguridad */}
                    {(passwordNueva.length > 0 || passwordConfirm.length > 0) && !isPwValid && (
                      <div className={localStyles.reqChecklist}>
                        <span className={localStyles.reqTitle}>Requisitos de seguridad:</span>
                        <div className={localStyles.reqGrid}>
                          <div className={`${localStyles.reqItem} ${reqs.length ? localStyles.reqPassed : ''}`}>
                            {reqs.length ? <Check size={12} /> : <span className={localStyles.reqDot} />}
                            <span>Mínimo 8 caracteres</span>
                          </div>
                          <div className={`${localStyles.reqItem} ${reqs.upper ? localStyles.reqPassed : ''}`}>
                            {reqs.upper ? <Check size={12} /> : <span className={localStyles.reqDot} />}
                            <span>Al menos una mayúscula</span>
                          </div>
                          <div className={`${localStyles.reqItem} ${reqs.lower ? localStyles.reqPassed : ''}`}>
                            {reqs.lower ? <Check size={12} /> : <span className={localStyles.reqDot} />}
                            <span>Al menos una minúscula</span>
                          </div>
                          <div className={`${localStyles.reqItem} ${reqs.number ? localStyles.reqPassed : ''}`}>
                            {reqs.number ? <Check size={12} /> : <span className={localStyles.reqDot} />}
                            <span>Al menos un número</span>
                          </div>
                          <div className={`${localStyles.reqItem} ${reqs.match ? localStyles.reqPassed : ''}`}>
                            {reqs.match ? <Check size={12} /> : <span className={localStyles.reqDot} />}
                            <span>Las contraseñas coinciden</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={localStyles.formActions}>
                      <button
                        type="button"
                        className={localStyles.btnSecondary}
                        onClick={handleCancelPassword}
                        disabled={isSavingPw}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPw || !isPwValid}
                        className={localStyles.btnPrimary}
                      >
                        <Save size={13} />
                        <span>
                          {isSavingPw
                            ? 'Guardando...'
                            : usuario?.password_configurada
                            ? 'Actualizar contraseña'
                            : 'Crear contraseña'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Row: Cuenta vinculada de Google */}
              {usuario?.auth_provider === 'google' && (
                <div className={localStyles.securityRow}>
                  <div className={localStyles.rowInfo}>
                    <div className={localStyles.rowLabelGroup}>
                      <span className={localStyles.rowLabel}>Google OAuth</span>
                      <span className={localStyles.badgeVerified}>
                        <CheckCircle2 size={11} /> Vinculado
                      </span>
                    </div>
                    <span className={localStyles.rowSubtitle}>
                      {`Conectado como ${usuario.email}`}
                    </span>
                  </div>

                  <div className={localStyles.rowActions}>
                    <span className={localStyles.badgeNeutral} title="Cuenta protegida con Google">
                      <Lock size={11} /> Acceso seguro
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Asistente de WhatsApp y Privacidad */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#10b981' }}>
                <MessageSquare size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Asistente de WhatsApp</h3>
              </div>
            </div>

            <div className={localStyles.cardStack}>
              {/* Row: Vinculación de WhatsApp */}
              <div className={localStyles.securityRow}>
                <div className={localStyles.rowInfo}>
                  <div className={localStyles.rowLabelGroup}>
                    <span className={localStyles.rowLabel}>Asistente por WhatsApp</span>
                    {usuario?.telefono_verificado ? (
                      <span className={localStyles.badgeVerified}>
                        <CheckCircle2 size={11} /> Vinculado
                      </span>
                    ) : (
                      <span className={localStyles.badgePending}>
                        <AlertCircle size={11} /> No vinculado
                      </span>
                    )}
                  </div>
                  <span className={localStyles.rowSubtitle}>
                    {usuario?.telefono
                      ? usuario?.telefono_verificado
                        ? formatearTelefonoVisual(usuario.telefono)
                        : `${formatearTelefonoVisual(usuario.telefono)} (Sin verificar)`
                      : 'Sin número de teléfono asignado'}
                  </span>
                </div>

                <div className={localStyles.rowActions}>
                  {!usuario?.telefono_verificado ? (
                    <button
                      type="button"
                      className={localStyles.btnPrimary}
                      onClick={() => navigate('/auth/verificar-telefono', { state: { from: '/app/perfil?tab=seguridad' } })}
                    >
                      Vincular WhatsApp
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={localStyles.btnSecondary}
                        onClick={() => navigate('/auth/verificar-telefono', { state: { from: '/app/perfil?tab=seguridad' } })}
                        title="Cambiar número de teléfono"
                      >
                        <Edit3 size={13} />
                        <span>Cambiar</span>
                      </button>
                      <button
                        type="button"
                        className={localStyles.btnDanger}
                        onClick={handleDesvincular}
                        disabled={isDesvinculando}
                        title="Desvincular WhatsApp"
                      >
                        <Unlink size={13} />
                        <span>{isDesvinculando ? 'Desvinculando...' : 'Desvincular'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Row: Privacidad del Asistente */}
              <div className={`${localStyles.securityRow} ${localStyles.securityRowToggle}`}>
                <div className={localStyles.rowInfo}>
                  <div className={localStyles.rowLabelGroup}>
                    <span className={localStyles.rowLabel}>Mejora del asistente financiero</span>
                  </div>
                  <span className={localStyles.rowSubtitle}>
                    Permitir que el equipo de Argentum audite las conversaciones para optimizar las respuestas. Si lo apagás, se dejan de ver también los mensajes anteriores.
                  </span>
                </div>

                <div className={localStyles.rowActions}>
                  <label className={localStyles.switch}>
                    <input
                      type="checkbox"
                      checked={Boolean(usuario?.permiso_lectura_mensajes_en)}
                      onChange={handleTogglePermisoMensajes}
                      disabled={isUpdatingPermiso}
                      aria-label="Permitir que el equipo de Argentum lea mis mensajes con el asistente para mejorarlo"
                    />
                    <span className={localStyles.slider} />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Card 3: Dispositivos y Datos (Ancho Completo Inferior) ────────── */}
        <section className={`${perfilStyles.sectionCard} ${localStyles.bottomSection}`}>
          <div className={perfilStyles.sectionHeader}>
            <div className={perfilStyles.sectionIconWrap} style={{ color: '#8b5cf6' }}>
              <Lock size={18} />
            </div>
            <div className={perfilStyles.sectionHeaderText}>
              <h3>Dispositivos y datos</h3>
            </div>
          </div>

          <div className={localStyles.cardStack}>
            {/* Row: Cerrar Sesiones */}
            <div className={localStyles.securityRow}>
              <div className={localStyles.rowInfo}>
                <div className={localStyles.rowLabelGroup}>
                  <span className={localStyles.rowLabel}>Cerrar sesión en todos los dispositivos</span>
                </div>
                <span className={localStyles.rowSubtitle}>
                  Desconecta de inmediato todas las sesiones abiertas en computadoras y teléfonos (incluyendo este navegador).
                </span>
              </div>

              <div className={localStyles.rowActions}>
                <button
                  type="button"
                  onClick={handleCerrarSesiones}
                  className={localStyles.btnDanger}
                >
                  <LogOut size={13} />
                  <span>Cerrar sesiones</span>
                </button>
              </div>
            </div>

            {/* Row: Descargar Datos */}
            <div className={localStyles.securityRow}>
              <div className={localStyles.rowInfo}>
                <div className={localStyles.rowLabelGroup}>
                  <span className={localStyles.rowLabel}>Descargar copia de mis datos</span>
                </div>
                <span className={localStyles.rowSubtitle}>
                  Exportá un archivo estructurado con todos tus movimientos, billeteras, tarjetas, metas, presupuestos y suscripciones.
                </span>
              </div>

              <div className={localStyles.rowActions}>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDescargarMisDatos}
                  className={localStyles.btnSecondary}
                >
                  <Download size={13} />
                  <span>{isDownloading ? 'Generando archivo...' : 'Descargar datos'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
