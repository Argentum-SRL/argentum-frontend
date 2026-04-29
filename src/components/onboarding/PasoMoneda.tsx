import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postMoneda } from '../../lib/api/onboarding'

interface Props {
  datos: { moneda_principal: string | null }
  onNext: (siguiente: string | null) => void
}

export default function PasoMoneda({ datos, onNext }: Props) {
  const [moneda, setMoneda] = useState(datos.moneda_principal || 'ARS')
  const [secundaria, setSecundaria] = useState(false)
  const [tipoDolar, setTipoDolar] = useState('blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const necesitaDolar = moneda === 'USD' || secundaria
      const res = await postMoneda(moneda, secundaria, necesitaDolar ? tipoDolar : null)
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const dolares = [
    { id: 'oficial', label: 'Dólar oficial' },
    { id: 'blue', label: 'Dólar blue' },
    { id: 'tarjeta', label: 'Dólar tarjeta' },
    { id: 'bolsa', label: 'Dólar bolsa (MEP)' },
    { id: 'cripto', label: 'Dólar cripto' },
  ]

  return (
    <div className="onboarding-step">
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Moneda y cotización</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>¿En qué moneda querés ver tus totales?</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Moneda principal</label>
          <div className="flex gap-2">
            {['ARS', 'USD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className="flex-1 h-11 rounded-[8px] border font-medium transition-colors"
                style={{
                  background: moneda === m ? 'var(--primary)' : 'var(--surface)',
                  color: moneda === m ? 'white' : 'var(--text)',
                  borderColor: moneda === m ? 'var(--primary)' : 'var(--surface-alt)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={secundaria}
              onChange={(e) => setSecundaria(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)]"
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Mostrar moneda secundaria</span>
          </label>

          {(moneda === 'USD' || secundaria) && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
                Tipo de cambio de referencia
              </label>
              <select
                value={tipoDolar}
                onChange={(e) => setTipoDolar(e.target.value)}
                className="w-full h-11 px-4 rounded-[8px] border outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
              >
                {dolares.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
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
