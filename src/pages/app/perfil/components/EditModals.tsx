import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, AlertCircle, MessageSquare } from 'lucide-react'
import type { Usuario } from '@/types'
import usuarioService from '@/services/usuario.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { Modal, DateInput, SelectInput, type SelectOption } from '@/components/ui'
import styles from '../PerfilPage.module.css'

const OPCIONES_SEXO: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

import {
  buildPhone,
  desglosarTelefono,
  normalizarTelefono,
  formatearTelefonoVisual,
} from '@/utils/telefono.utils'

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

    // Validaciones de Nombre y Apellido
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

    // Validación de Fecha de Nacimiento
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
    <>
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.modalFormBox}>
        <div className={styles.formRowDual}>
          <div className={styles.formGroup}>
            <label htmlFor="modal-nombre" className={styles.formGroupLabel}>
              Nombre *
            </label>
            <input
              id="modal-nombre"
              type="text"
              className={styles.cleanInput}
              value={formDatos.nombre}
              onChange={(e) => setFormDatos({ ...formDatos, nombre: e.target.value })}
              placeholder="Ej: Lucas"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="modal-apellido" className={styles.formGroupLabel}>
              Apellido *
            </label>
            <input
              id="modal-apellido"
              type="text"
              className={styles.cleanInput}
              value={formDatos.apellido}
              onChange={(e) => setFormDatos({ ...formDatos, apellido: e.target.value })}
              placeholder="Ej: González"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <DateInput
            id="modal-nacimiento"
            label="Fecha de nacimiento"
            value={formDatos.fecha_nacimiento}
            onChange={(val) => setFormDatos({ ...formDatos, fecha_nacimiento: val })}
          />
        </div>

        <div className={styles.formGroup}>
          <SelectInput
            id="modal-sexo"
            label="Sexo / Género"
            value={formDatos.sexo}
            onChange={(val) => setFormDatos({ ...formDatos, sexo: val })}
            options={OPCIONES_SEXO}
          />
        </div>

        <div className={styles.modalFooterActions}>
          <button type="submit" disabled={isSaving} className={styles.saveBtnPrimary}>
            <Save size={15} />
            <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>
    </>
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
        password_actual: passwordActual,
      })
      if (usuario) {
        updateUsuario({ ...usuario, email: emailLimpio, email_verificado: false })
      }
      showToast(res.confirmacion || 'Email actualizado. Te enviamos un código de verificación.', 'success')
      onClose()
      if (res.requiere_verificacion_email) {
        navigate('/auth/verificar-email', { state: { email: emailLimpio } })
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar el email. Verificá tu contraseña actual.')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.modalFormBox} autoComplete="off">
        <div className={styles.formGroup}>
          <label htmlFor="modal-email-nuevo" className={styles.formGroupLabel}>
            Nuevo correo electrónico *
          </label>
          <input
            id="modal-email-nuevo"
            name="new_account_email"
            type="email"
            autoComplete="email"
            className={styles.cleanInput}
            value={emailNuevo}
            onChange={(e) => setEmailNuevo(e.target.value)}
            placeholder="nuevo@correo.com"
            required
          />
        </div>

        {hasPassword && (
          <div className={styles.formGroup}>
            <label htmlFor="modal-email-pw" className={styles.formGroupLabel}>
              Contraseña actual *
            </label>
            <input
              id="modal-email-pw"
              name="current_security_pw"
              type="password"
              autoComplete="new-password"
              className={styles.cleanInput}
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="Ingresá tu contraseña"
              required
            />
          </div>
        )}

        <div className={styles.modalFooterActions}>
          <button type="submit" disabled={isSaving} className={styles.saveBtnPrimary}>
            <Save size={15} />
            <span>{isSaving ? 'Actualizando...' : 'Actualizar y verificar email'}</span>
          </button>
        </div>
      </form>
    </>
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
    <>
      {errorMsg && (
        <div className={styles.modalAlertError}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.modalFormBox} autoComplete="off">
        <div className={styles.formGroup}>
          <label htmlFor="modal-tel-num" className={styles.formGroupLabel}>
            Número de WhatsApp *
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className={styles.countryBadgeFixed} title="Código de Argentina">
              <span>🇦🇷</span>
              <span>+54 9</span>
            </div>
            <input
              id="modal-tel-num"
              name="whatsapp_contact_num"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              className={styles.cleanInput}
              value={telefonoNumero}
              onChange={(e) => setTelefonoNumero(e.target.value)}
              placeholder="11 1234-5678"
              required
            />
          </div>
          <p className={styles.fieldHelpText}>
            Enviaremos el código de verificación a: <strong>{formatearTelefonoVisual(fullPhone) || fullPhone}</strong>
          </p>
        </div>

        {hasPassword && (
          <div className={styles.formGroup}>
            <label htmlFor="modal-tel-pw" className={styles.formGroupLabel}>
              Contraseña actual *
            </label>
            <input
              id="modal-tel-pw"
              name="current_security_pw"
              type="password"
              autoComplete="new-password"
              className={styles.cleanInput}
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="Ingresá tu contraseña"
              required
            />
          </div>
        )}

        <div className={styles.modalFooterActions}>
          <button type="submit" disabled={isSaving} className={styles.saveBtnPrimary}>
            <MessageSquare size={15} />
            <span>{isSaving ? 'Enviando código...' : usuario?.telefono ? 'Actualizar y verificar' : 'Asociar y verificar'}</span>
          </button>
        </div>
      </form>
    </>
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
          ? (usuario?.telefono ? 'Cambiar Teléfono de WhatsApp' : 'Asociar Teléfono de WhatsApp')
          : ''
      }
      size="sm"
    >
      {activeModal === 'datos' && (
        <DatosPersonalesForm
          key="datos-form"
          usuario={usuario}
          onClose={onClose}
          updateUsuario={updateUsuario}
        />
      )}

      {activeModal === 'email' && (
        <EmailForm
          key="email-form"
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
