import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle, Eye, EyeOff } from '@/components/ui/icons'
import type { Usuario } from '@/types'
import usuarioService from '@/services/usuario.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { Modal, DateInput, type SelectOption } from '@/components/ui'
import styles from '../PerfilPage.module.css'

const OPCIONES_SEXO: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

interface EditModalsProps {
  activeModal: 'datos' | 'email' | null
  onClose: () => void
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
}

// ── 1. Formulario de Datos Personales (Diseño TransaccionModal) ──────────────────────────
const DatosPersonalesForm: React.FC<{
  usuario: Usuario | null
  onClose: () => void
  updateUsuario: (u: Usuario) => void
}> = ({ usuario, onClose, updateUsuario }) => {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formDatos, setFormDatos] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    fecha_nacimiento: usuario?.fecha_nacimiento || '',
    sexo: usuario?.sexo || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)

    const nombreLimpio = formDatos.nombre.trim()
    const apellidoLimpio = formDatos.apellido.trim()

    if (!nombreLimpio || nombreLimpio.length < 2) {
      setErrorMsg('El nombre debe tener al menos 2 caracteres.')
      setIsSaving(false)
      return
    }

    if (!apellidoLimpio || apellidoLimpio.length < 2) {
      setErrorMsg('El apellido debe tener al menos 2 caracteres.')
      setIsSaving(false)
      return
    }

    if (formDatos.fecha_nacimiento) {
      const parts = formDatos.fecha_nacimiento.split('-').map((v) => parseInt(v, 10))
      if (parts.length !== 3 || parts.some(isNaN)) {
        setErrorMsg('La fecha de nacimiento no es válida.')
        setIsSaving(false)
        return
      }
      const [year, month, day] = parts
      const selectedDate = new Date(year, month - 1, day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (isNaN(selectedDate.getTime()) || selectedDate > today) {
        setErrorMsg('La fecha ingresada no puede ser futura ni inválida.')
        setIsSaving(false)
        return
      }
      let age = today.getFullYear() - year
      const m = (today.getMonth() + 1) - month
      if (m < 0 || (m === 0 && today.getDate() < day)) {
        age--
      }
      if (age < 18) {
        setErrorMsg('Debés tener al menos 18 años para utilizar Argentum.')
        setIsSaving(false)
        return
      }
      if (age > 120) {
        setErrorMsg('La fecha de nacimiento ingresada no es válida.')
        setIsSaving(false)
        return
      }
    }

    try {
      const updated = await usuarioService.actualizarDatosPersonales({
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        fecha_nacimiento: formDatos.fecha_nacimiento || null,
        sexo: formDatos.sexo || null,
      })
      updateUsuario(updated)
      sileo.success({ title: 'Datos personales actualizados correctamente' })
      onClose()
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudieron actualizar los datos personales.')
      setErrorMsg(msg)
      sileo.error({ title: msg })
    } finally {
      setIsSaving(false)
    }
  }

  const maxBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  })()

  const minBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 120)
    return d.toISOString().split('T')[0]
  })()

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} data-modal-frame>
      <div className={`${styles.formBody} ${styles.formBodyWithHeader}`}>
        <div className={styles.formHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Editar datos personales</h2>
          </div>
          <div className={styles.headerRightActions}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className={styles.modalAlertError}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.formFields} data-modal-stack>
          <div data-modal-block className={styles.modalStackBlock}>
            <div className={styles.formRowDual}>
              <div className={styles.formField}>
                <label htmlFor="modal-nombre" className={styles.fieldLabel}>
                  Nombre
                </label>
                <input
                  id="modal-nombre"
                  type="text"
                  maxLength={100}
                  className={styles.fieldInput}
                  value={formDatos.nombre}
                  onChange={(e) => setFormDatos({ ...formDatos, nombre: e.target.value })}
                  placeholder="Ej: Tester"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="modal-apellido" className={styles.fieldLabel}>
                  Apellido
                </label>
                <input
                  id="modal-apellido"
                  type="text"
                  maxLength={100}
                  className={styles.fieldInput}
                  value={formDatos.apellido}
                  onChange={(e) => setFormDatos({ ...formDatos, apellido: e.target.value })}
                  placeholder="Ej: Argentum"
                  required
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="modal-nacimiento" className={styles.fieldLabel}>
                Fecha de nacimiento
              </label>
              <DateInput
                id="modal-nacimiento"
                value={formDatos.fecha_nacimiento}
                min={minBirthDate}
                max={maxBirthDate}
                defaultYear={2000}
                onChange={(val) => setFormDatos({ ...formDatos, fecha_nacimiento: val })}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="modal-sexo" className={styles.fieldLabel}>
                Sexo / Género
              </label>
              <select
                id="modal-sexo"
                className={`${styles.fieldInput} ${styles.selectInput}`}
                value={formDatos.sexo}
                onChange={(e) => setFormDatos({ ...formDatos, sexo: e.target.value })}
              >
                {OPCIONES_SEXO.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className={styles.submitBtn}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

// ── 2. Formulario de Email (Diseño TransaccionModal) ──────────────────────────
const EmailForm: React.FC<{
  usuario: Usuario | null
  onClose: () => void
  updateUsuario: (u: Usuario) => void
}> = ({ usuario, onClose, updateUsuario }) => {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [emailNuevo, setEmailNuevo] = useState(usuario?.email || '')
  const [passwordActual, setPasswordActual] = useState('')

  const hasPassword = !!(usuario?.password_configurada && usuario?.auth_provider !== 'google')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)

    const emailLimpio = emailNuevo.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(emailLimpio)) {
      setErrorMsg('Ingresá un correo electrónico válido (ej: nombre@dominio.com).')
      setIsSaving(false)
      return
    }

    if (usuario?.email && emailLimpio === usuario.email.toLowerCase()) {
      setErrorMsg('El correo ingresado es idéntico a tu correo actual.')
      setIsSaving(false)
      return
    }

    if (hasPassword && !passwordActual.trim()) {
      setErrorMsg('Ingresá tu contraseña actual para confirmar la modificación de tu email.')
      setIsSaving(false)
      return
    }

    try {
      const res = await usuarioService.actualizarEmail({
        email_nuevo: emailLimpio,
        password_actual: hasPassword ? passwordActual : undefined,
      })
      if (usuario) {
        updateUsuario({ ...usuario, email: emailLimpio, email_verificado: false })
      }
      sileo.success({ title: res.confirmacion || 'Correo actualizado. Se envió un código de verificación.' })
      onClose()
      if (res.requiere_verificacion_email) {
        navigate('/auth/verificar-email', { state: { email: emailLimpio } })
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar el correo. Verificá los datos.')
      setErrorMsg(msg)
      sileo.error({ title: msg })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} autoComplete="off" data-modal-frame>
      <div className={`${styles.formBody} ${styles.formBodyWithHeader}`}>
        <div className={styles.formHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Actualizar correo electrónico</h2>
          </div>
          <div className={styles.headerRightActions}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className={styles.modalAlertError}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.formFields} data-modal-stack>
          <div data-modal-block className={styles.modalStackBlock}>
            <div className={styles.formField}>
              <label htmlFor="modal-email-nuevo" className={styles.fieldLabel}>
                Nuevo correo electrónico
              </label>
              <input
                id="modal-email-nuevo"
                name="new_email_address"
                type="email"
                autoComplete="email"
                className={styles.fieldInput}
                value={emailNuevo}
                onChange={(e) => setEmailNuevo(e.target.value)}
                placeholder="nombre@ejemplo.com"
                required
              />
              <span className={styles.modalFieldHint}>
                Enviaremos un código de seguridad de 6 dígitos a esta nueva casilla.
              </span>
            </div>

            {hasPassword && (
              <div className={styles.formField}>
                <label htmlFor="modal-email-pw" className={styles.fieldLabel}>
                  Contraseña actual
                </label>
                <div className={styles.passwordInputWrap}>
                  <input
                    id="modal-email-pw"
                    name="current_security_pw"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={styles.fieldInput}
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="Ingresá tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    className={styles.modalPwEyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className={styles.submitBtn}>
          {isSaving ? 'Actualizando...' : 'Actualizar y verificar'}
        </button>
      </div>
    </form>
  )
}

// ── Modal Maestro ─────────────────────────────────────────────────────────────
export const EditModals: React.FC<EditModalsProps> = ({
  activeModal,
  onClose,
  usuario,
  updateUsuario,
}) => {
  return (
    <Modal
      isOpen={!!activeModal}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      size="md"
      ariaLabel={
        activeModal === 'datos'
          ? 'Editar datos personales'
          : activeModal === 'email'
          ? 'Actualizar correo electrónico'
          : 'Editar perfil'
      }
    >
      <div className={styles.modalRoot}>
        {activeModal === 'datos' && (
          <DatosPersonalesForm
            usuario={usuario}
            onClose={onClose}
            updateUsuario={updateUsuario}
          />
        )}

        {activeModal === 'email' && (
          <EmailForm
            usuario={usuario}
            onClose={onClose}
            updateUsuario={updateUsuario}
          />
        )}
      </div>
    </Modal>
  )
}
