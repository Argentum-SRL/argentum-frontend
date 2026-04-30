import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getCotizacionesDolar, postMoneda } from '@/services/onboarding.service'
import type { CotizacionesDolarResponse } from '@/types'
import styles from './PasoMoneda.module.css'

interface Props {
  datos: { moneda_principal: string | null }
  onNext: (siguiente: string | null) => void
}

export default function PasoMoneda({ datos, onNext }: Props) {
  const [moneda, setMoneda] = useState(datos.moneda_principal || 'ARS')
  const [secundaria, setSecundaria] = useState(false)
  const [tipoDolar, setTipoDolar] = useState('blue')
  const [cotizaciones, setCotizaciones] = useState<CotizacionesDolarResponse | null>(null)
  const [cargandoCotizaciones, setCargandoCotizaciones] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarCotizaciones() {
      setCargandoCotizaciones(true)
      try {
        const data = await getCotizacionesDolar()
        setCotizaciones(data)
      } catch {
        setCotizaciones(null)
      } finally {
        setCargandoCotizaciones(false)
      }
    }

    cargarCotizaciones()
  }, [])

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

  const dolares = useMemo(
    () => [
      { id: 'oficial', label: 'Dólar oficial' },
      { id: 'blue', label: 'Dólar blue' },
      { id: 'tarjeta', label: 'Dólar tarjeta' },
      { id: 'mep', label: 'Dólar MEP' },
    ],
    [],
  )

  function formatPrecio(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(valor)
  }

  return (
    <div>
      <h2 className={styles.title}>Moneda y cotización</h2>
      <p className={styles.subtitle}>¿En qué moneda querés ver tus totales?</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Moneda principal</label>
          <div className={styles.currencyGroup}>
            {['ARS', 'USD'].map((m) => {
              const btnCls = [styles.currencyBtn, moneda === m ? styles.currencyBtnActive : '']
                .filter(Boolean)
                .join(' ')
              return (
                <button key={m} type="button" onClick={() => setMoneda(m)} className={btnCls}>
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.fieldLast}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={secundaria}
              onChange={(e) => setSecundaria(e.target.checked)}
            />
            <span className={styles.checkText}>Mostrar moneda secundaria</span>
          </label>

          {(moneda === 'USD' || secundaria) && (
            <div>
              <label htmlFor="tipo-dolar-select" className={styles.label}>
                Tipo de cambio de referencia
              </label>

              {cargandoCotizaciones ? (
                <div className={styles.loadingHint}>
                  <Loader2 size={14} className="animate-spin" />
                  Cargando cotizaciones en tiempo real...
                </div>
              ) : null}

              <select
                id="tipo-dolar-select"
                title="Tipo de cambio de referencia"
                value={tipoDolar}
                onChange={(e) => setTipoDolar(e.target.value)}
                className={styles.select}
              >
                {dolares.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>

              {cotizaciones && !cargandoCotizaciones ? (
                <div className={styles.cotizacionGrid}>
                  {dolares.map((d) => {
                    const c = cotizaciones.cotizaciones[d.id as 'oficial' | 'blue' | 'tarjeta' | 'mep']
                    const cardCls = [
                      styles.cotizacionCard,
                      tipoDolar === d.id ? styles.cotizacionCardActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <div key={d.id} className={cardCls}>
                        <div className={styles.cotizacionHeader}>
                          <span className={styles.cotizacionLabel}>{d.label}</span>
                          <span className={styles.cotizacionAvg}>
                            Promedio: {formatPrecio(c?.promedio)}
                          </span>
                        </div>
                        <div className={styles.cotizacionDetails}>
                          <span>Compra: {formatPrecio(c?.compra)}</span>
                          <span>Venta: {formatPrecio(c?.venta)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
