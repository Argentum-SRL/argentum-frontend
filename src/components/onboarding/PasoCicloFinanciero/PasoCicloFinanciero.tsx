import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postCicloFinanciero } from '@/services/onboarding.service'
import styles from './PasoCicloFinanciero.module.css'

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
    <div>
      <h2 className={styles.title}>Tu ciclo financiero</h2>
      <p className={styles.subtitle}>¿Cuándo empezás a contar tus gastos del mes?</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="tipo_ciclo" className={styles.label}>Tipo de ciclo</label>
          <select
            id="tipo_ciclo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setValor(e.target.value === 'dia_fijo' ? '1' : 'primer_lunes')
            }}
            className={styles.select}
          >
            <option value="dia_fijo">Día fijo del mes</option>
            <option value="regla">Regla relativa</option>
          </select>
        </div>

        <div className={styles.fieldLast}>
          <label htmlFor="valor_ciclo" className={styles.label}>
            {tipo === 'dia_fijo' ? 'Día del mes' : 'Regla'}
          </label>
          {tipo === 'dia_fijo' ? (
            <input
              id="valor_ciclo"
              type="number"
              min="1"
              max="28"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={styles.input}
            />
          ) : (
            <select
              id="valor_ciclo"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={styles.select}
            >
              {reglas.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          )}
          <p className={styles.hint}>
            Ejemplo: {tipo === 'dia_fijo' 
              ? `Tu ciclo empieza el día ${valor} de cada mes` 
              : `Tu ciclo empieza el ${reglas.find(r => r.id === valor)?.label.toLowerCase()}`}
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
