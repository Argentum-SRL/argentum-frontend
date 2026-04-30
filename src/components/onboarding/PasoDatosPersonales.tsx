import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postDatosPersonales } from '../../services/onboarding.service'

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
    <div className="onboarding-step">
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Contanos quién sos</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Necesitamos tu nombre para personalizar tu experiencia.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-11 px-4 rounded-[8px] border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="w-full h-11 px-4 rounded-[8px] border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
          />
        </div>

        {error && <p className="mb-4" style={{ color: '#C0392B', fontSize: '13px' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
