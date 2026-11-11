import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Calendar, CreditCard, Sparkles } from '@/components/ui/icons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import analisisService, {
  type MonedaModoAnalisis,
  type ProyeccionCompromisosResponse,
} from '@/services/analisis.service'
import { formatMonto, formatAxisCompact } from '@/utils/format'
import { useTheme } from '@/hooks/useTheme'
import ChartLoadingState from './ChartLoadingState'
import styles from './ProyeccionCuotasCard.module.css'

interface ProyeccionCuotasCardProps {
  monedaModo: MonedaModoAnalisis
  monedaVisual: 'ARS' | 'USD'
  billeteraId?: string
  tarjetaId?: string
  horizonteExterno?: '6' | '12'
  onHorizonteChange?: (h: '6' | '12') => void
  vistaInternaExterna?: 'grafico' | 'planes'
  onVistaInternaChange?: (v: 'grafico' | 'planes') => void
}

export default function ProyeccionCuotasCard({
  monedaModo,
  monedaVisual,
  billeteraId,
  tarjetaId,
  horizonteExterno,
  onHorizonteChange,
  vistaInternaExterna,
  onVistaInternaChange,
}: ProyeccionCuotasCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const cuotasBarColor = '#FF8A65'
  const subsBarColor = isDark ? '#A78BFA' : '#7C3AED'
  const [horizonteInterno, setHorizonteInterno] = useState<'6' | '12'>('6')
  const [vistaInternaState, setVistaInternaState] = useState<'grafico' | 'planes'>('grafico')
  const horizonte = horizonteExterno ?? horizonteInterno
  const vistaInterna = vistaInternaExterna ?? vistaInternaState

  const handleCambiarHorizonte = (h: '6' | '12') => {
    setHorizonteInterno(h)
    onHorizonteChange?.(h)
  }
  const handleCambiarVistaInterna = (v: 'grafico' | 'planes') => {
    setVistaInternaState(v)
    onVistaInternaChange?.(v)
  }
  const [data, setData] = useState<ProyeccionCompromisosResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const fetchProyeccion = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      const minLoaderDelay = new Promise<void>((resolve) => {
        const t = setTimeout(resolve, 260)
        signal?.addEventListener('abort', () => {
          clearTimeout(t)
          resolve()
        })
      })
      try {
        const [res] = await Promise.all([
          analisisService.getProyeccionCompromisos(
            {
              moneda_modo: monedaModo,
              meses: Number(horizonte),
              billetera_id: billeteraId,
              tarjeta_id: tarjetaId,
            },
            signal
          ),
          minLoaderDelay,
        ])
        if (!signal?.aborted) {
          setData(res)
        }
      } catch {
        // Silencioso en cancelación
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [monedaModo, horizonte, billeteraId, tarjetaId]
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchProyeccion(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchProyeccion])

  const alivio = data?.kpis.mes_mayor_alivio ?? null

  return (
    <section className={styles.card} aria-label="Proyección de tarjetas y cuotas futuras">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <Calendar size={18} />
          </div>
          <div>
            <h2 className={styles.title}>Proyección de Cuotas y Suscripciones</h2>
            <p className={styles.subtitle}>
              Evolución de tu compromiso mensual futuro y liberación de flujo de caja
            </p>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <SegmentedControl
            options={[
              { value: '6', label: '6 meses' },
              { value: '12', label: '12 meses' },
            ]}
            value={horizonte}
            onChange={(v: string) => handleCambiarHorizonte(v as '6' | '12')}
            ariaLabel="Horizonte de proyección"
            layout="inline"
          />

          <SegmentedControl
            options={[
              { value: 'grafico', label: 'Curva Mensual' },
              { value: 'planes', label: 'Planes Activos' },
            ]}
            value={vistaInterna}
            onChange={(v: string) => handleCambiarVistaInterna(v as 'grafico' | 'planes')}
            ariaLabel="Modo de vista de proyección"
            layout="inline"
          />
        </div>
      </header>

      {/* Mini KPIs de compromiso futuro */}
      {data && (
        <div className={styles.metricsStrip}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Compromiso este mes</span>
            <span className={styles.metricVal}>
              {formatMonto(data.kpis.compromiso_mes_actual, monedaVisual)}
            </span>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Total cuotas en ventana</span>
            <span className={styles.metricVal}>
              {formatMonto(data.kpis.total_cuotas_ventana, monedaVisual)}
            </span>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Planes en curso</span>
            <span className={styles.metricVal}>
              {data.kpis.cantidad_planes_activos} compras en cuotas
            </span>
          </div>

          {alivio && (
            <div className={styles.reliefBanner}>
              <Sparkles size={14} />
              <span>
                En <strong>{alivio.etiqueta}</strong> terminás{' '}
                <strong>
                  {alivio.planes_finalizados}{' '}
                  {alivio.planes_finalizados === 1 ? 'compra' : 'compras'}
                </strong>{' '}
                y liberás <strong>{formatMonto(alivio.monto_liberado, monedaVisual)}/mes</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {!data && loading ? (
        <ChartLoadingState
          label="Calculando proyección"
          sublabel="Proyectando cuotas y suscripciones..."
        />
      ) : !data ? (
        <div className={styles.emptyWrap}>
          <CreditCard size={28} />
          <p className={styles.emptyText}>No pudimos proyectar compromisos en este momento.</p>
        </div>
      ) : (
        <div className={styles.bodyContentWrap}>
          {loading && (
            <ChartLoadingState
              overlay
              label="Actualizando proyección"
              sublabel="Recalculando horizonte futuro..."
            />
          )}
          {vistaInterna === 'grafico' ? (
        <>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={215}>
              <BarChart
                key={`${horizonte}-${monedaModo}-${billeteraId ?? 'all'}-${tarjetaId ?? 'all'}`}
                data={data.serie_mensual}
                margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-2)', fontSize: 11 }}
                  tickFormatter={(val: number) => formatAxisCompact(val)}
                  width={56}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const p = payload[0].payload
                    return (
                      <div className={styles.tooltipCard}>
                        <p className={styles.tooltipTitle}>{p.mes_nombre}</p>
                        <div className={styles.tooltipRow}>
                          <span>Cuotas ({p.cantidad_cuotas}):</span>
                          <strong>{formatMonto(p.monto_cuotas, monedaVisual)}</strong>
                        </div>
                        <div className={styles.tooltipRow}>
                          <span>Suscripciones:</span>
                          <strong>{formatMonto(p.monto_suscripciones, monedaVisual)}</strong>
                        </div>
                        <div className={styles.tooltipDivider} />
                        <div className={styles.tooltipRow}>
                          <span>Total proyectado:</span>
                          <strong>{formatMonto(p.monto_total, monedaVisual)}</strong>
                        </div>
                        {p.planes_que_finalizan > 0 && (
                          <div className={styles.tooltipRelief}>
                            Finalizan {p.planes_que_finalizan} planes (se liberan{' '}
                            {formatMonto(p.monto_que_se_libera, monedaVisual)})
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="monto_cuotas"
                  stackId="compromiso"
                  fill={cuotasBarColor}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={34}
                  isAnimationActive={!prefersReducedMotion}
                />
                <Bar
                  dataKey="monto_suscripciones"
                  stackId="compromiso"
                  fill={subsBarColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                  isAnimationActive={!prefersReducedMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.legendRow}>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: cuotasBarColor }} />
              Cuotas de compras
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: subsBarColor }} />
              Suscripciones activas
            </span>
          </div>
        </>
      ) : data.planes_activos.length === 0 ? (
        <div className={styles.emptyWrap}>
          <CreditCard size={28} />
          <p className={styles.emptyText}>No tenés planes de cuotas pendientes en esta moneda.</p>
        </div>
      ) : (
        <div className={styles.plansList}>
          {data.planes_activos.map((plan) => (
            <div key={plan.id} className={styles.planRow}>
              <div className={styles.planLeft}>
                <div className={styles.planIconBox}>
                  <CreditCard size={16} />
                </div>
                <div className={styles.planTexts}>
                  <span className={styles.planTitle}>{plan.descripcion}</span>
                  <span className={styles.planSub}>
                    {plan.tarjeta_nombre} · Restan {plan.cuotas_restantes} de {plan.cantidad_cuotas}{' '}
                    cuotas · Termina en <strong>{plan.ultimo_mes_etiqueta}</strong>
                  </span>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${plan.progreso_pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.planRight}>
                <span className={styles.planPending}>
                  {formatMonto(plan.saldo_pendiente, monedaVisual)}
                </span>
                <span className={styles.planInstallment}>
                  {formatMonto(plan.monto_cuota, monedaVisual)} / mes
                </span>
              </div>
            </div>
          ))}
        </div>
          )}
        </div>
      )}
    </section>
  )
}
