import { useState, useEffect } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { guardarCicloFinanciero, getPreviewFechaCobro } from '@/services/onboarding.service'
import { invalidateDashboardCache } from '@/services/dashboard.service'
import { SelectInput, Field, Button, SegmentedControl } from '@/components/ui'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './StepCicloFinanciero.module.css'

interface Props {
  datosIniciales: {
    ciclo_tipo: string | null
    ciclo_valor: string | null
    ciclo_ajuste_direccion?: string | null
  }
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
  const [direccion, setDireccion] = useState<'anterior' | 'posterior'>(
    (datosIniciales.ciclo_ajuste_direccion as 'anterior' | 'posterior') || 'anterior'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    proxima_fecha_cobro: string
    fue_ajustada: boolean
  } | null>(null)
  
  const isInitialDiaFijo = (datosIniciales.ciclo_tipo ?? 'dia_fijo') === 'dia_fijo'
  const initialDiaVal = parseInt(datosIniciales.ciclo_valor ?? '1', 10)
  const isInitialValValid = !isNaN(initialDiaVal) && initialDiaVal >= 1 && initialDiaVal <= 31
  const [loadingPreview, setLoadingPreview] = useState(
    isInitialDiaFijo ? isInitialValValid : Boolean(datosIniciales.ciclo_valor)
  )

  useEffect(() => {
    let isValid = false
    if (tipo === 'dia_fijo') {
      const diaNum = parseInt(valor, 10)
      isValid = !isNaN(diaNum) && diaNum >= 1 && diaNum <= 31
    } else if (tipo === 'regla') {
      isValid = Boolean(valor)
    }

    if (!isValid) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const data = await getPreviewFechaCobro({
          tipo: tipo as 'dia_fijo' | 'regla',
          valor,
          direccion,
        }, controller.signal)
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
  }, [tipo, valor, direccion])

  function handleTipoChange(newTipo: string) {
    setTipo(newTipo)
    setValor(newTipo === 'dia_fijo' ? '1' : 'primer_lunes')
    setPreview(null)
    setLoadingPreview(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (tipo === 'dia_fijo') {
      const diaNum = parseInt(valor, 10)
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        setError('El día de corte debe ser un número entero entre 1 y 31.')
        return
      }
    } else if (tipo === 'regla') {
      if (!valor || !REGLAS.some((r) => r.id === valor)) {
        setError('Seleccioná una regla de corte válida.')
        return
      }
    }

    setLoading(true)
    try {
      const res = await guardarCicloFinanciero({
        ciclo_tipo: tipo,
        ciclo_valor: valor,
        ciclo_ajuste_direccion: direccion,
      })
      invalidateDashboardCache()
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "No pudimos guardar tus preferencias. Intentá de nuevo.")
      setError(msg)
      sileo.error({ title: msg })
    } finally {
      setLoading(false)
    }
  }

  const reglaSeleccionada = REGLAS.find((r) => r.id === valor)
  
  const getHint = () => {
    if (preview && !loadingPreview) {
      const calculatedDate = new Date(preview.proxima_fecha_cobro + 'T12:00:00')
      const fechaFormateada = calculatedDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })

      if (preview.fue_ajustada) {
        return `Tu próximo cobro sería el ${fechaFormateada} (ajustado por feriado o fin de semana)`
      } else {
        return `Tu próximo cobro sería el ${fechaFormateada}`
      }
    }

    if (tipo === 'dia_fijo') {
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
            <span className={styles.typeLabel}>Regla semanal</span>
            <span className={styles.typeDesc}>Regla por día de la semana</span>
          </button>
        </div>

        <div className={styles.field}>
          {tipo === 'dia_fijo' ? (
            <>
              <Field
                id="valor_ciclo"
                label="¿Qué día del mes te depositan el sueldo?"
                type="number"
                min={1}
                max={31}
                value={valor}
                onChange={(val) => {
                  setValor(val)
                  setPreview(null)
                  const parsed = parseInt(val, 10)
                  setLoadingPreview(!isNaN(parsed) && parsed >= 1 && parsed <= 31)
                }}
              />
              <p className={styles.hint}>{hint}</p>
            </>
          ) : (
            <>
              <SelectInput
                id="valor_ciclo"
                label="Regla"
                value={valor}
                onChange={(newVal) => {
                  setValor(newVal)
                  setPreview(null)
                  setLoadingPreview(Boolean(newVal))
                }}
                options={REGLAS.map((r) => ({ value: r.id, label: r.label }))}
              />
              <p className={styles.hint}>{hint}</p>
            </>
          )}
        </div>

        {/* Selector de dirección de ajuste (en ambos modos) */}
        <div className={styles.field}>
          <label className={styles.label}>Dirección de ajuste</label>
          <SegmentedControl
            options={[
              { value: 'anterior', label: 'Ajustar hacia atrás' },
              { value: 'posterior', label: 'Ajustar hacia adelante' },
            ]}
            value={direccion}
            onChange={(val) => setDireccion(val as 'anterior' | 'posterior')}
            fullWidth
          />
          <p className={styles.hint}>
            Si el día calculado cae en fin de semana o feriado, ¿el cobro se corre para atrás o para adelante?
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          className={styles.submitBtn}
        >
          Continuar
        </Button>
      </form>
    </div>
  )
}
