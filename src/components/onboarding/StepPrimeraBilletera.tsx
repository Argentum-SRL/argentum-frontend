import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { crearPrimeraBilletera } from '@/lib/api/onboarding'
import { useAuth } from '@/hooks/useAuth'
import styles from './StepPrimeraBilletera.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

interface Props {
  monedaPrincipal: string | null
  onNext: (siguientePaso: string | null) => void
}

export default function StepPrimeraBilletera({ monedaPrincipal, onNext }: Props) {
  const { updateUsuario } = useAuth()
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>((monedaPrincipal as 'ARS' | 'USD') ?? 'ARS')
  const [saldo, setSaldo] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const nombreError = submitted && !nombre.trim() ? 'El nombre es obligatorio.' : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!nombre.trim()) return
    setLoading(true)
    setError(null)
    try {
      const saldoNum = saldo || 0
      const res = await crearPrimeraBilletera({ nombre: nombre.trim(), moneda, saldo_inicial: saldoNum })
      updateUsuario(res.usuario)
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
      <h2 className={styles.title}>Tu primera billetera</h2>
      <p className={styles.subtitle}>Cargá tu cuenta bancaria o billetera virtual principal.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="nombre_billetera" className={styles.label}>Nombre de la billetera</label>
          <input
            id="nombre_billetera"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mercado Pago, Galicia..."
            className={[styles.input, nombreError ? styles.inputError : ''].filter(Boolean).join(' ')}
            autoFocus
          />
          {nombreError && <p className={styles.fieldError}>{nombreError}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Moneda</label>
          <div className={styles.monedaPills}>
            {(['ARS', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className={[styles.pill, moneda === m ? styles.pillActive : ''].filter(Boolean).join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <MontoInput
            value={saldo}
            onChange={setSaldo}
            moneda={moneda}
            label="Saldo inicial"
            placeholder="0"
            allowDecimals
            optional
          />
        </div>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            También vamos a crear billeteras de efectivo (ARS y USD) automáticamente.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Creando...</>
            : 'Finalizar configuración'
          }
        </button>
      </form>
    </div>
  )
}
