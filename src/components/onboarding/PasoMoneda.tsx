import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getCotizacionesDolar, postMoneda } from '../../services/onboarding.service'
import type { CotizacionesDolarResponse } from '../../types'

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
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Moneda y cotización</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>¿En qué moneda querés ver tus totales?</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Moneda principal
          </label>
          <div className="flex gap-2">
            {['ARS', 'USD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className="flex-1 h-11 rounded-[8px] border font-medium transition-colors"
                style={
                  moneda === m
                    ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                    : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--surface-alt)' }
                }
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
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Mostrar moneda secundaria</span>
          </label>

          {(moneda === 'USD' || secundaria) && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label htmlFor="tipo-dolar-select" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                Tipo de cambio de referencia
              </label>

              {cargandoCotizaciones ? (
                <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--text-2)', fontSize: '13px' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Cargando cotizaciones en tiempo real...
                </div>
              ) : null}

              <select
                id="tipo-dolar-select"
                title="Tipo de cambio de referencia"
                value={tipoDolar}
                onChange={(e) => setTipoDolar(e.target.value)}
                className="w-full h-11 px-4 rounded-[8px] border outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--surface-alt)' }}
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
                        className="p-3 rounded-[8px] border"
                        style={
                          tipoDolar === d.id
                            ? { borderColor: 'var(--primary)', background: 'rgba(52, 152, 219, 0.08)' }
                            : { borderColor: 'var(--surface-alt)', background: 'var(--surface)' }
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{d.label}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                            Promedio: {formatPrecio(c?.promedio)}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-3" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
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

        {error && <p className="mb-4" style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
