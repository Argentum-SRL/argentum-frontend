import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postPrimeraBilletera } from '@/services/onboarding.service'
import { useAuth } from '@/hooks/useAuth'
import styles from './PasoPrimeraBilletera.module.css'

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
    <div>
      <h2 className={styles.title}>Tu primera billetera</h2>
      <p className={styles.subtitle}>Cargá tu cuenta bancaria o billetera virtual principal.</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="nombre_billetera" className={styles.label}>Nombre de la billetera</label>
          <input
            id="nombre_billetera"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mercado Pago, Galicia, etc."
            className={styles.input}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={styles.field}>
            <label htmlFor="moneda" className={styles.label}>Moneda</label>
            <select
              id="moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className={styles.select}
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="saldo" className={styles.label}>Saldo inicial</label>
            <input
              id="saldo"
              type="number"
              step="0.01"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💡 <strong>Dato:</strong> Vamos a crear también dos billeteras de efectivo (ARS y USD) automáticamente para que puedas registrar tus gastos diarios.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar configuración'}
        </button>
      </form>
    </div>
  )
}
