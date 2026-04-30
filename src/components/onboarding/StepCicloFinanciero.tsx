import { useState } from 'react'
import { Calendar, RefreshCw, Loader2 } from 'lucide-react'
import { guardarCicloFinanciero } from '@/lib/api/onboarding'
import styles from './StepCicloFinanciero.module.css'

interface Props {
  datosIniciales: { ciclo_tipo: string | null; ciclo_valor: string | null }
  onNext: (siguientePaso: string | null) => void
}

const REGLAS = [
  { id: 'primer_lunes',    label: 'Primer lunes del mes' },
  { id: 'primer_martes',   label: 'Primer martes del mes' },
  { id: 'primer_miercoles',label: 'Primer miércoles del mes' },
  { id: 'primer_jueves',   label: 'Primer jueves del mes' },
  { id: 'primer_viernes',  label: 'Primer viernes del mes' },
  { id: 'ultimo_lunes',    label: 'Último lunes del mes' },
  { id: 'ultimo_martes',   label: 'Último martes del mes' },
  { id: 'ultimo_miercoles',label: 'Último miércoles del mes' },
  { id: 'ultimo_jueves',   label: 'Último jueves del mes' },
  { id: 'ultimo_viernes',  label: 'Último viernes del mes' },
]

export default function StepCicloFinanciero({ datosIniciales, onNext }: Props) {
  const [tipo, setTipo] = useState(datosIniciales.ciclo_tipo ?? 'dia_fijo')
  const [valor, setValor] = useState(datosIniciales.ciclo_valor ?? '1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTipoChange(newTipo: string) {
    setTipo(newTipo)
    setValor(newTipo === 'dia_fijo' ? '1' : 'primer_lunes')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await guardarCicloFinanciero({ ciclo_tipo: tipo, ciclo_valor: valor })
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail ?? 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const reglaSeleccionada = REGLAS.find((r) => r.id === valor)
  const hint =
    tipo === 'dia_fijo'
      ? `Tu ciclo empieza el día ${valor} de cada mes`
      : `Tu ciclo empieza el ${reglaSeleccionada?.label.toLowerCase() ?? ''}`

  return (
    <div>
      <h2 className={styles.title}>Tu ciclo financiero</h2>
      <p className={styles.subtitle}>¿Cuándo empezás a contar tus gastos del mes?</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.typeCards}>
          <button
            type="button"
            onClick={() => handleTipoChange('dia_fijo')}
            className={[styles.typeCard, tipo === 'dia_fijo' ? styles.typeCardActive : ''].filter(Boolean).join(' ')}
          >
            <Calendar size={22} className={styles.typeIcon} />
            <span className={styles.typeLabel}>Día fijo</span>
            <span className={styles.typeDesc}>Mismo día cada mes</span>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('regla')}
            className={[styles.typeCard, tipo === 'regla' ? styles.typeCardActive : ''].filter(Boolean).join(' ')}
          >
            <RefreshCw size={22} className={styles.typeIcon} />
            <span className={styles.typeLabel}>Día relativo</span>
            <span className={styles.typeDesc}>Primer o último día hábil</span>
          </button>
        </div>

        <div className={styles.field}>
          <label htmlFor="valor_ciclo" className={styles.label}>
            {tipo === 'dia_fijo' ? 'Día del mes (1–28)' : 'Regla'}
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
              {REGLAS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          )}

          <p className={styles.hint}>{hint}</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
