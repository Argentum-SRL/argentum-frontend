import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, Loader2 } from 'lucide-react'
import { guardarCicloFinanciero, getPreviewFechaCobro } from '@/lib/api/onboarding'
import { SelectInput } from '@/components/ui'
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
  const [preview, setPreview] = useState<{
    proxima_fecha_cobro: string
    es_dia_habil: boolean
  } | null>(null)
  
  const isInitialDiaFijo = (datosIniciales.ciclo_tipo ?? 'dia_fijo') === 'dia_fijo'
  const initialDiaVal = parseInt(datosIniciales.ciclo_valor ?? '1', 10)
  const isInitialValValid = !isNaN(initialDiaVal) && initialDiaVal >= 1 && initialDiaVal <= 31
  const [loadingPreview, setLoadingPreview] = useState(isInitialDiaFijo && isInitialValValid)

  useEffect(() => {
    if (tipo !== 'dia_fijo') {
      return
    }

    const diaNum = parseInt(valor, 10)
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const data = await getPreviewFechaCobro(diaNum, controller.signal)
        setPreview(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        console.error('Error fetching preview fecha cobro:', err)
        setPreview(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false)
        }
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [tipo, valor])

  function handleTipoChange(newTipo: string) {
    setTipo(newTipo)
    setValor(newTipo === 'dia_fijo' ? '1' : 'primer_lunes')
    setPreview(null)
    setLoadingPreview(newTipo === 'dia_fijo')
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
  
  const getHint = () => {
    if (tipo === 'dia_fijo') {
      if (preview && !loadingPreview) {
        const calculatedDate = new Date(preview.proxima_fecha_cobro + 'T12:00:00')
        const fechaFormateada = calculatedDate.toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        const calculatedDay = calculatedDate.getDate()
        const diaNominal = parseInt(valor, 10)
        
        if (calculatedDay !== diaNominal) {
          return `Tu próximo cobro sería el ${fechaFormateada} (el ${diaNominal} cae en fin de semana o feriado)`
        } else {
          return `Tu próximo cobro sería el ${fechaFormateada}`
        }
      }
      return `Tu ciclo empieza el día ${valor} de cada mes`
    }
    return `Tu ciclo empieza el ${reglaSeleccionada?.label.toLowerCase() ?? ''}`
  }

  const hint = getHint()

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
          {tipo === 'dia_fijo' ? (
            <>
              <label htmlFor="valor_ciclo" className={styles.label}>Día del mes (1–31)</label>
              <input
                id="valor_ciclo"
                type="number"
                min="1"
                max="31"
                value={valor}
                onChange={(e) => {
                  const val = e.target.value
                  setValor(val)
                  setPreview(null)
                  const parsed = parseInt(val, 10)
                  setLoadingPreview(!isNaN(parsed) && parsed >= 1 && parsed <= 31)
                }}
                className={styles.input}
              />
            </>
          ) : (
            <SelectInput
              id="valor_ciclo"
              label="Regla"
              value={valor}
              onChange={setValor}
              options={REGLAS.map((r) => ({ value: r.id, label: r.label }))}
            />
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
