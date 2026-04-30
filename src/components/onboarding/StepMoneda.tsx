import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getCotizaciones, guardarMoneda } from '@/lib/api/onboarding'
import type { CotizacionesDolarResponse } from '@/types'
import styles from './StepMoneda.module.css'

interface Props {
  datosIniciales: { moneda_principal: string | null }
  onNext: (siguientePaso: string | null) => void
}

const DOLARES = [
  { id: 'oficial', label: 'Oficial' },
  { id: 'blue',    label: 'Blue' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'mep',     label: 'MEP' },
] as const

function formatARS(valor: number | null | undefined): string {
  if (valor == null) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

export default function StepMoneda({ datosIniciales, onNext }: Props) {
  const [moneda, setMoneda] = useState(datosIniciales.moneda_principal ?? 'ARS')
  const [secundaria, setSecundaria] = useState(false)
  const [tipoDolar, setTipoDolar] = useState<'oficial' | 'blue' | 'tarjeta' | 'mep'>('blue')
  const [cotizaciones, setCotizaciones] = useState<CotizacionesDolarResponse | null>(null)
  const [cargando, setCargando] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCotizaciones()
      .then(setCotizaciones)
      .catch(() => setCotizaciones(null))
      .finally(() => setCargando(false))
  }, [])

  const necesitaDolar = useMemo(() => moneda === 'USD' || secundaria, [moneda, secundaria])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await guardarMoneda({
        moneda_principal: moneda,
        moneda_secundaria_activa: secundaria,
        tipo_dolar: necesitaDolar ? tipoDolar : null,
      })
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
      <h2 className={styles.title}>Moneda y cotización</h2>
      <p className={styles.subtitle}>¿En qué moneda querés ver tus totales?</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label}>Moneda principal</label>
          <div className={styles.currencyCards}>
            {(['ARS', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className={[styles.currencyCard, moneda === m ? styles.currencyCardActive : ''].filter(Boolean).join(' ')}
              >
                <span className={styles.currencyCode}>{m}</span>
                <span className={styles.currencyName}>{m === 'ARS' ? 'Peso argentino' : 'Dólar'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.toggleLabel}>
            <div className={[styles.toggle, secundaria ? styles.toggleOn : ''].filter(Boolean).join(' ')}
              onClick={() => setSecundaria((v) => !v)}
              role="checkbox"
              aria-checked={secundaria}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && setSecundaria((v) => !v)}
            >
              <div className={styles.toggleThumb} />
            </div>
            <span className={styles.toggleText}>Mostrar moneda secundaria</span>
          </label>
        </div>

        {necesitaDolar && (
          <div className={styles.field}>
            <label className={styles.label}>Tipo de cambio de referencia</label>

            <div className={styles.dolarPills}>
              {DOLARES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setTipoDolar(d.id)}
                  className={[styles.dolarPill, tipoDolar === d.id ? styles.dolarPillActive : ''].filter(Boolean).join(' ')}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {cargando ? (
              <div className={styles.cotizacionLoading}>
                <Loader2 size={14} className="animate-spin" />
                <span>Cargando cotizaciones...</span>
              </div>
            ) : cotizaciones ? (
              <div className={styles.cotizacionGrid}>
                {DOLARES.map((d) => {
                  const c = cotizaciones.cotizaciones[d.id]
                  const active = tipoDolar === d.id
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setTipoDolar(d.id)}
                      className={[styles.cotizacionCard, active ? styles.cotizacionCardActive : ''].filter(Boolean).join(' ')}
                    >
                      <span className={styles.cotizacionNombre}>{d.label}</span>
                      <span className={styles.cotizacionValor}>{formatARS(c?.promedio)}</span>
                      <span className={styles.cotizacionDetalle}>
                        C: {formatARS(c?.compra)} · V: {formatARS(c?.venta)}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
