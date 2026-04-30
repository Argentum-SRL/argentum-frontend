import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { guardarDatosPersonales } from '@/lib/api/onboarding'
import styles from './StepDatosPersonales.module.css'

interface Props {
  datosIniciales: { nombre: string | null; apellido: string | null }
  onNext: (siguientePaso: string | null) => void
}

export default function StepDatosPersonales({ datosIniciales, onNext }: Props) {
  const [nombre, setNombre] = useState(datosIniciales.nombre ?? '')
  const [apellido, setApellido] = useState(datosIniciales.apellido ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const nombreError = submitted && !nombre.trim() ? 'El nombre es obligatorio.' : null
  const apellidoError = submitted && !apellido.trim() ? 'El apellido es obligatorio.' : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!nombre.trim() || !apellido.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await guardarDatosPersonales({ nombre: nombre.trim(), apellido: apellido.trim() })
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail ?? 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className={styles.title}>Contanos quién sos</h2>
      <p className={styles.subtitle}>Necesitamos tu nombre para personalizar tu experiencia.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="nombre" className={styles.label}>Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={[styles.input, nombreError ? styles.inputError : ''].filter(Boolean).join(' ')}
            autoFocus
            autoComplete="given-name"
          />
          {nombreError && <p className={styles.fieldError}>{nombreError}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="apellido" className={styles.label}>Apellido</label>
          <input
            id="apellido"
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className={[styles.input, apellidoError ? styles.inputError : ''].filter(Boolean).join(' ')}
            autoComplete="family-name"
          />
          {apellidoError && <p className={styles.fieldError}>{apellidoError}</p>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
