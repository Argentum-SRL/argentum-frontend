import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, AlertCircle, MessageSquare, Eye, EyeOff } from 'lucide-react'
import type { Usuario } from '@/types'
import usuarioService from '@/services/usuario.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { Modal, DateInput, SelectInput, type SelectOption } from '@/components/ui'
import {
  buildPhone,
  desglosarTelefono,
  normalizarTelefono,
  formatearTelefonoVisual,
} from '@/utils/telefono.utils'
import styles from '../PerfilPage.module.css'

const OPCIONES_SEXO: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

interface EditModalsProps {
  activeModal: 'datos' | 'email' | 'telefono' | null
  onClose: () => void
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
}

// ── 1. Formulario de Datos Personales ──────────────────────────────────────
const DatosPersonalesForm: React.FC<{
  usuario: Usuario | null
  onClose: () => void
  updateUsuario: (u: Usuario) => void
}> = ({ usuario, onClose, updateUsuario }) => {
  const { showToast } = useToast()
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
      const selectedDate = new Date(formDatos.fecha_nacimiento)
      const today = new Date()
      if (isNaN(selectedDate.getTime()) || selectedDate > today) {
        setErrorMsg('La fecha ingresada no puede ser futura ni inválida.')
        setIsSaving(false)
        return
      }
      let age = today.getFullYear() - selectedDate.getFullYear()
      const m = today.getMonth() - selectedDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
        age--
      }
      if (age < 18) {
        setErrorMsg('Debés tener al menos 18 años para utilizar Argentum.')
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
      showToast('Datos personales actualizados correctamente', 'success')
      onClose()
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudieron actualizar los datos personales.')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.modalFormContainer}>
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.modalFormBody}>
        <div className={styles.formRowDual}>
          <div className={styles.formField}>
            <label htmlFor="modal-nombre" className={styles.fieldLabel}>
              Nombre *
            </label>
            <input
              id="modal-nombre"
              type="text"
              className={styles.fieldInput}
              value={formDatos.nombre}
              onChange={(e) => setFormDatos({ ...formDatos, nombre: e.target.value })}
              placeholder="Ej: Lucas"
              required
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="modal-apellido" className={styles.fieldLabel}>
              Apellido *
            </label>
            <input
              id="modal-apellido"
              type="text"
              className={styles.fieldInput}
              value={formDatos.apellido}
              onChange={(e) => setFormDatos({ ...formDatos, apellido: e.target.value })}
              placeholder="Ej: González"
              required
            />
          </div>
        </div>

        <div className={styles.formField}>
          <DateInput
            id="modal-nacimiento"
            label="Fecha de nacimiento"
            value={formDatos.fecha_nacimiento}
            onChange={(val) => setFormDatos({ ...formDatos, fecha_nacimiento: val })}
          />
        </div>

        <div className={styles.formField}>
          <SelectInput
            id="modal-sexo"
            label="Sexo / Género"
            value={formDatos.sexo}
            onChange={(val) => setFormDatos({ ...formDatos, sexo: val })}
            options={OPCIONES_SEXO}
          />
        </div>
      </div>

      <div className={styles.modalFormFooter}>
        <button
          type="button"
          className={styles.modalCancelBtn}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className={styles.modalSubmitBtn}>
          <Save size={15} />
          <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </button>
      </div>
    </form>
  )
}

// ── 2. Formulario de Email ────────────────────────────────────────────────
const EmailForm: React.FC<{
  usuario: Usuario | null
  onClose: () => void
  updateUsuario: (u: Usuario) => void
}> = ({ usuario, onClose, updateUsuario }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
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
      showToast(res.confirmacion || 'Correo actualizado. Se envió un código de verificación.', 'success')
      onClose()
      if (res.requiere_verificacion_email) {
        navigate('/auth/verificar-email')
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar el correo. Verificá los datos.')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.modalFormContainer} autoComplete="off">
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.modalFormBody}>
        <div className={styles.formField}>
          <label htmlFor="modal-email-nuevo" className={styles.fieldLabel}>
            Nuevo correo electrónico *
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
              Contraseña actual *
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
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.modalFormFooter}>
        <button
          type="button"
          className={styles.modalCancelBtn}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className={styles.modalSubmitBtn}>
          <Save size={15} />
          <span>{isSaving ? 'Actualizando...' : 'Actualizar y verificar'}</span>
        </button>
      </div>
    </form>
  )
}

// ── 3. Formulario de Teléfono ─────────────────────────────────────────────
const TelefonoForm: React.FC<{
  usuario: Usuario | null
  onClose: () => void
  updateUsuario: (u: Usuario) => void
}> = ({ usuario, onClose, updateUsuario }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const initial = desglosarTelefono(usuario?.telefono)
  const [telefonoNumero, setTelefonoNumero] = useState(initial.numeroLocal)
  const [passwordActual, setPasswordActual] = useState('')

  const hasPassword = !!(usuario?.password_configurada && usuario?.auth_provider !== 'google')
  const fullPhone = buildPhone('+54', telefonoNumero)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)

    const numLimpio = normalizarTelefono(fullPhone)

    if (!numLimpio || numLimpio.length < 8) {
      setErrorMsg('Ingresá un número de teléfono válido (código de área + número, mín. 8 dígitos).')
      setIsSaving(false)
      return
    }

    if (usuario?.telefono && fullPhone === usuario.telefono) {
      setErrorMsg('El número ingresado es idéntico al que ya tenés registrado.')
      setIsSaving(false)
      return
    }

    if (hasPassword && !passwordActual.trim()) {
      setErrorMsg('Ingresá tu contraseña actual para confirmar el cambio de teléfono.')
      setIsSaving(false)
      return
    }

    try {
      const res = await usuarioService.actualizarTelefono({
        telefono_nuevo: fullPhone,
        password_actual: hasPassword ? passwordActual : undefined,
      })
      if (usuario) {
        updateUsuario({ ...usuario, telefono: fullPhone, telefono_verificado: false })
      }
      showToast(res.confirmacion || 'Teléfono actualizado. Se envió un código por WhatsApp.', 'success')
      onClose()
      if (res.requiere_verificacion_telefono) {
        navigate('/auth/verificar-telefono')
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar el teléfono. Verificá los datos ingresados.')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.modalFormContainer} autoComplete="off">
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.modalFormBody}>
        <div className={styles.formField}>
          <label htmlFor="modal-tel-num" className={styles.fieldLabel}>
            Número de WhatsApp *
          </label>
          <div className={styles.phoneInputRow}>
            <div className={styles.countryBadgeWrap}>
              <span className={styles.flagIcon}>🇦🇷</span>
              <span className={styles.countryCode}>+54 9</span>
            </div>
            <input
              id="modal-tel-num"
              name="whatsapp_contact_num"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              className={`${styles.fieldInput} ${styles.phoneInputField}`}
              value={telefonoNumero}
              onChange={(e) => setTelefonoNumero(e.target.value)}
              placeholder="11 1234-5678"
              required
            />
          </div>
          <span className={styles.modalFieldHint}>
            Enviaremos el código de verificación a: <strong>{formatearTelefonoVisual(fullPhone) || fullPhone}</strong>
          </span>
        </div>

        {hasPassword && (
          <div className={styles.formField}>
            <label htmlFor="modal-tel-pw" className={styles.fieldLabel}>
              Contraseña actual *
            </label>
            <div className={styles.passwordInputWrap}>
              <input
                id="modal-tel-pw"
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
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.modalFormFooter}>
        <button
          type="button"
          className={styles.modalCancelBtn}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSaving} className={styles.modalSubmitBtn}>
          <MessageSquare size={15} />
          <span>{isSaving ? 'Enviando código...' : usuario?.telefono ? 'Actualizar y verificar' : 'Asociar y verificar'}</span>
        </button>
      </div>
    </form>
  )
}

// ── Modal Maestro ─────────────────────────────────────────────────────────
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
      title={
        activeModal === 'datos'
          ? 'Editar Datos Personales'
          : activeModal === 'email'
          ? 'Actualizar Correo Electrónico'
          : activeModal === 'telefono'
          ? 'Asociar Teléfono de WhatsApp'
          : ''
      }
    >
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

      {activeModal === 'telefono' && (
        <TelefonoForm
          key="tel-form"
          usuario={usuario}
          onClose={onClose}
          updateUsuario={updateUsuario}
        />
      )}
    </Modal>
  )
}
