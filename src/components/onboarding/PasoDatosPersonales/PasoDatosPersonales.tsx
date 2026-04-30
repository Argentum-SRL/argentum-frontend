import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postDatosPersonales } from '@/services/onboarding.service'
import styles from './PasoDatosPersonales.module.css'

interface Props {
  datos: { nombre: string | null; apellido: string | null }
  onNext: (siguiente: string | null) => void
}

export default function PasoDatosPersonales({ datos, onNext }: Props) {
  const [nombre, setNombre] = useState(datos.nombre || '')
  const [apellido, setApellido] = useState(datos.apellido || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postDatosPersonales(nombre.trim(), apellido.trim())
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className={styles.title}>Contanos quién sos</h2>
      <p className={styles.subtitle}>Necesitamos tu nombre para personalizar tu experiencia.</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="nombre" className={styles.label}>Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.fieldLast}>
          <label htmlFor="apellido" className={styles.label}>Apellido</label>
          <input
            id="apellido"
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className={styles.input}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
