import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postCicloFinanciero } from '../../lib/api/onboarding'

interface Props {
  datos: { ciclo_tipo: string | null; ciclo_valor: string | null }
  onNext: (siguiente: string | null) => void
}

export default function PasoCicloFinanciero({ datos, onNext }: Props) {
  const [tipo, setTipo] = useState(datos.ciclo_tipo || 'dia_fijo')
  const [valor, setValor] = useState(datos.ciclo_valor || '1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await postCicloFinanciero(tipo, valor)
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const reglas = [
    { id: 'primer_lunes', label: 'Primer lunes del mes' },
    { id: 'primer_martes', label: 'Primer martes del mes' },
    { id: 'primer_miercoles', label: 'Primer miércoles del mes' },
    { id: 'primer_jueves', label: 'Primer jueves del mes' },
    { id: 'primer_viernes', label: 'Primer viernes del mes' },
    { id: 'ultimo_lunes', label: 'Último lunes del mes' },
    { id: 'ultimo_martes', label: 'Último martes del mes' },
    { id: 'ultimo_miercoles', label: 'Último miércoles del mes' },
    { id: 'ultimo_jueves', label: 'Último jueves del mes' },
    { id: 'ultimo_viernes', label: 'Último viernes del mes' },
  ]

  return (
    <div className="onboarding-step">
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Tu ciclo financiero</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>¿Cuándo empezás a contar tus gastos del mes?</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Tipo de ciclo</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setValor(e.target.value === 'dia_fijo' ? '1' : 'primer_lunes')
            }}
            className="w-full h-11 px-4 rounded-[8px] border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
          >
            <option value="dia_fijo">Día fijo del mes</option>
            <option value="regla">Regla relativa</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
            {tipo === 'dia_fijo' ? 'Día del mes' : 'Regla'}
          </label>
          {tipo === 'dia_fijo' ? (
            <input
              type="number"
              min="1"
              max="28"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full h-11 px-4 rounded-[8px] border outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            />
          ) : (
            <select
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full h-11 px-4 rounded-[8px] border outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            >
              {reglas.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          )}
          <p className="mt-2" style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>
            Ejemplo: {tipo === 'dia_fijo' 
              ? `Tu ciclo empieza el día ${valor} de cada mes` 
              : `Tu ciclo empieza el ${reglas.find(r => r.id === valor)?.label.toLowerCase()}`}
          </p>
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
