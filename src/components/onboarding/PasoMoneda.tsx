import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getCotizacionesDolar, postMoneda } from '../../lib/api/onboarding'
import type { CotizacionesDolarResponse } from '../../types'
import './PasoMoneda.css'

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
    <div className="onboarding-step">
      <h2 className="paso-moneda-title">Moneda y cotización</h2>
      <p className="paso-moneda-subtitle">¿En qué moneda querés ver tus totales?</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="paso-moneda-label">Moneda principal</label>
          <div className="flex gap-2">
            {['ARS', 'USD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className={`flex-1 h-11 rounded-[8px] border font-medium transition-colors paso-moneda-btn ${moneda === m ? 'paso-moneda-btn--active' : ''}`}
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
            <span className="paso-moneda-toggle-label">Mostrar moneda secundaria</span>
          </label>

          {(moneda === 'USD' || secundaria) && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label htmlFor="tipo-dolar-select" className="paso-moneda-label">
                Tipo de cambio de referencia
              </label>

              {cargandoCotizaciones ? (
                <div className="mb-3 flex items-center gap-2 paso-moneda-loading">
                  <Loader2 size={14} className="animate-spin" />
                  Cargando cotizaciones en tiempo real...
                </div>
              ) : null}

              <select
                id="tipo-dolar-select"
                title="Tipo de cambio de referencia"
                value={tipoDolar}
                onChange={(e) => setTipoDolar(e.target.value)}
                className="w-full h-11 px-4 rounded-[8px] border outline-none paso-moneda-select"
              >
                {dolares.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>

              {cotizaciones && !cargandoCotizaciones ? (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {dolares.map((d) => {
                    const c = cotizaciones.cotizaciones[d.id as 'oficial' | 'blue' | 'tarjeta' | 'mep']
                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-[8px] border paso-moneda-card ${tipoDolar === d.id ? 'paso-moneda-card--selected' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="paso-moneda-card-title">{d.label}</span>
                          <span className="paso-moneda-card-meta">
                            Promedio: {formatPrecio(c?.promedio)}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-3 paso-moneda-card-values">
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

        {error && <p className="mb-4 paso-moneda-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 paso-moneda-submit"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
