import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postPrimeraBilletera } from '../../lib/api/onboarding'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  monedaPrincipal: string | null
  onFinish: () => void
}

export default function PasoPrimeraBilletera({ monedaPrincipal, onFinish }: Props) {
  const { updateUsuario } = useAuth()
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState(monedaPrincipal || 'ARS')
  const [saldo, setSaldo] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la billetera es obligatorio.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postPrimeraBilletera(nombre.trim(), moneda, parseFloat(saldo) || 0)
      updateUsuario(res.usuario)
      onFinish()
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step">
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Tu primera billetera</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Cargá tu cuenta bancaria o billetera virtual principal.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Nombre de la billetera</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mercado Pago, Galicia, etc."
            className="w-full h-11 px-4 rounded-[8px] border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Moneda</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full h-11 px-4 rounded-[8px] border outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Saldo inicial</label>
            <input
              type="number"
              step="0.01"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              className="w-full h-11 px-4 rounded-[8px] border outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
            />
          </div>
        </div>

        <div className="p-4 rounded-[12px] mb-6" style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
          <p style={{ fontSize: '13px', color: '#2980B9', lineHeight: 1.4 }}>
            💡 <strong>Dato:</strong> Vamos a crear también dos billeteras de efectivo (ARS y USD) automáticamente para que puedas registrar tus gastos diarios.
          </p>
        </div>

        {error && <p className="mb-4" style={{ color: '#C0392B', fontSize: '13px' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar configuración'}
        </button>
      </form>
    </div>
  )
}
