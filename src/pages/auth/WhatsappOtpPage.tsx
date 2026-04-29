import { FormEvent, useState } from 'react'
import { enviarCodigoWhatsapp, verificarCodigo } from '../../services/auth.service'
import './WhatsappOtpPage.css'

export default function WhatsappOtpPage() {
  const [telefono, setTelefono] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [loadingVerif, setLoadingVerif] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function handleEnviar(e: FormEvent) {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (!telefono.trim()) {
      setError('Ingresa un telefono con codigo de pais.')
      return
    }

    setLoadingEnvio(true)
    try {
      const res = await enviarCodigoWhatsapp(telefono)
      if (res.ok) setMensaje('Codigo enviado por WhatsApp.')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'No se pudo enviar el codigo.')
    } finally {
      setLoadingEnvio(false)
    }
  }

  async function handleVerificar(e: FormEvent) {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (!telefono.trim() || !codigo.trim()) {
      setError('Completa telefono y codigo.')
      return
    }

    setLoadingVerif(true)
    try {
      const res = await verificarCodigo(telefono, codigo)
      if (res.ok) setMensaje('Codigo verificado correctamente.')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'No se pudo verificar el codigo.')
    } finally {
      setLoadingVerif(false)
    }
  }

  return (
    <main className="whatsapp-otp-page">
      <h1 className="whatsapp-otp-title">Verificacion por WhatsApp</h1>

      <form onSubmit={handleEnviar} className="whatsapp-otp-form whatsapp-otp-form--first">
        <label htmlFor="telefono">Telefono</label>
        <input
          id="telefono"
          type="tel"
          placeholder="+54911..."
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="whatsapp-otp-input"
        />
        <button type="submit" disabled={loadingEnvio} className="whatsapp-otp-button">
          {loadingEnvio ? 'Enviando...' : 'Enviar codigo'}
        </button>
      </form>

      <form onSubmit={handleVerificar} className="whatsapp-otp-form">
        <label htmlFor="codigo">Codigo OTP</label>
        <input
          id="codigo"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="whatsapp-otp-input"
        />
        <button type="submit" disabled={loadingVerif} className="whatsapp-otp-button">
          {loadingVerif ? 'Verificando...' : 'Verificar codigo'}
        </button>
      </form>

      {mensaje ? <p className="whatsapp-otp-success">{mensaje}</p> : null}
      {error ? <p className="whatsapp-otp-error">{error}</p> : null}
    </main>
  )
}
