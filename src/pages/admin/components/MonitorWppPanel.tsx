import React, { useEffect, useState } from 'react'
import { sileo } from 'sileo'
import { Send } from 'lucide-react'
import { Activity, AlertTriangle, DollarSign, MessageSquare, Users } from '@/components/ui/icons'
import {
  AdminMonitorSkeleton,
  Button,
  DateInput,
  EmptyState,
  PageSummaryBar,
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui'
import adminService from '@/services/adminService'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatMonto, formatMontoCorto } from '@/utils/format'
import {
  formatearCantidad,
  formatearDiaMes,
  porcentajeBarra,
} from '@/utils/admin'
import type {
  MonitorWppResumen,
  PaginatedConversacionesMonitor,
} from '@/types/admin'
import ConversacionesCard from '../whatsapp/ConversacionesCard'
import styles from './MonitorWppPanel.module.css'

interface MonitorWppPanelProps {
  refreshKey: number
  onSelectUsuario: (usuarioId: string) => void
}

type PeriodoMonitor = '1' | '7' | '30' | 'rango'

type ConsultaPeriodo =
  | { dias: number; desde?: undefined; hasta?: undefined }
  | { dias?: undefined; desde: string; hasta: string }

const OPCIONES_PERIODO: SegmentedControlOption<PeriodoMonitor>[] = [
  { value: '1', label: 'Hoy' },
  { value: '7', label: '7\u00a0días' },
  { value: '30', label: '30\u00a0días' },
  { value: 'rango', label: 'Elegir\u00a0fechas' },
]

const NOMBRES_FUNCIONES: Array<{ key: string; label: string }> = [
  { key: 'texto_whatsapp', label: 'Mensajes de texto' },
  { key: 'audio_whatsapp', label: 'Audios' },
  { key: 'imagen_whatsapp', label: 'Fotos' },
  { key: 'pdf_whatsapp', label: 'PDF por WhatsApp' },
  { key: 'importacion_pdf', label: 'Importación de resúmenes' },
]

function hoyArgentinaIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function diasEntreIso(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.split('-').map(Number)
  const [y2, m2, d2] = hasta.split('-').map(Number)
  const t1 = Date.UTC(y1, m1 - 1, d1)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((t2 - t1) / 86_400_000)
}

function validarRangoFechas(desde: string, hasta: string, hoyIso: string): string | null {
  if (!desde || !hasta) {
    return 'Elegí las dos fechas.'
  }
  if (desde > hasta) {
    return 'La fecha de inicio tiene que ser anterior a la de fin.'
  }
  if (hasta > hoyIso) {
    return 'La fecha de fin no puede ser posterior a hoy.'
  }
  if (diasEntreIso(desde, hasta) > 89) {
    return 'Elegí un rango de hasta 90 días.'
  }
  return null
}

function nivelHoyVisual(nivel: string): { texto: string; tono: 'bien' | 'aviso' | 'mal' } {
  switch (nivel) {
    case 'aviso':
      return { texto: 'Cerca del tope', tono: 'aviso' }
    case 'sin_archivos':
      return { texto: 'Sin fotos ni PDF por hoy', tono: 'aviso' }
    case 'sin_ia':
      return { texto: 'Sin IA por hoy', tono: 'mal' }
    case 'normal':
    default:
      return { texto: 'Todo normal', tono: 'bien' }
  }
}

function claseDot(tono: 'bien' | 'aviso' | 'mal'): string {
  if (tono === 'bien') return styles.dotBien
  if (tono === 'mal') return styles.dotMal
  return styles.dotAviso
}

export const MonitorWppPanel: React.FC<MonitorWppPanelProps> = ({
  refreshKey,
  onSelectUsuario,
}) => {
  const hoyIso = hoyArgentinaIso()
  const [periodo, setPeriodo] = useState<PeriodoMonitor>('1')
  const [desdeInput, setDesdeInput] = useState(hoyIso)
  const [hastaInput, setHastaInput] = useState(hoyIso)
  const [rangoError, setRangoError] = useState<string | null>(null)
  const [consulta, setConsulta] = useState<ConsultaPeriodo>({ dias: 1 })

  const [categoria, setCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [reloadSeq, setReloadSeq] = useState(0)

  const [resumen, setResumen] = useState<MonitorWppResumen | null>(null)
  const [convs, setConvs] = useState<PaginatedConversacionesMonitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      adminService.getMonitorWppResumen(consulta, controller.signal),
      adminService.getMonitorWppConversaciones(consulta, categoria, pagina, controller.signal),
    ])
      .then(([resumenData, convsData]) => {
        if (controller.signal.aborted) return
        setError(null)
        setRangoError(null)
        setResumen(resumenData)
        setConvs(convsData)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const msg = getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.')
        if (consulta.desde) {
          setRangoError(msg)
        }
        setError(msg)
        sileo.error({ title: msg })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLoadingConvs(false)
        }
      })
    return () => controller.abort()
  }, [consulta, categoria, pagina, refreshKey, reloadSeq])

  const handleCambioPeriodo = (val: PeriodoMonitor) => {
    setPeriodo(val)
    setRangoError(null)
    if (val !== 'rango') {
      setLoading(true)
      setError(null)
      setPagina(1)
      setConsulta({ dias: Number(val) })
    }
  }

  const handleVerRango = () => {
    const errValidacion = validarRangoFechas(desdeInput, hastaInput, hoyArgentinaIso())
    if (errValidacion) {
      setRangoError(errValidacion)
      return
    }
    setRangoError(null)
    setError(null)
    setLoading(true)
    setPagina(1)
    setConsulta({ desde: desdeInput, hasta: hastaInput })
  }

  const handleCambioCategoria = (val: string) => {
    setLoadingConvs(true)
    setCategoria(val)
    setPagina(1)
  }

  const handleCambioPagina = (nextPage: number) => {
    setLoadingConvs(true)
    setPagina(nextPage)
  }

  const handleReintentar = () => {
    setLoading(true)
    setError(null)
    setReloadSeq((n) => n + 1)
  }

  const cabeceraPeriodo = (
    <>
      <div className={styles.topRow}>
        <h2 className={styles.panelTitle}>WhatsApp e IA</h2>
        <SegmentedControl
          options={OPCIONES_PERIODO}
          value={periodo}
          onChange={handleCambioPeriodo}
          layout="inline"
          size="md"
          ariaLabel="Período del monitor"
        />
      </div>

      {periodo === 'rango' && (
        <div className={styles.rangoBlock}>
          <div className={styles.rangoRow}>
            <div className={styles.rangoInputWrap}>
              <DateInput
                label="Desde"
                value={desdeInput}
                onChange={setDesdeInput}
                max={hoyIso}
              />
            </div>
            <div className={styles.rangoInputWrap}>
              <DateInput
                label="Hasta"
                value={hastaInput}
                onChange={setHastaInput}
                max={hoyIso}
              />
            </div>
            <Button type="button" variant="secondary" onClick={handleVerRango}>
              Ver
            </Button>
          </div>
          {rangoError && (
            <p className={styles.rangoError} role="alert">
              {rangoError}
            </p>
          )}
        </div>
      )}
    </>
  )

  if (loading && !resumen) {
    return (
      <div className={styles.panelStack}>
        {cabeceraPeriodo}
        <AdminMonitorSkeleton />
      </div>
    )
  }

  if (error && !resumen) {
    return (
      <div className={styles.panelStack}>
        {cabeceraPeriodo}
        <div className={styles.sectionCard}>
          <EmptyState
            variant="compact"
            icon={MessageSquare}
            title={error}
            actionLabel="Reintentar"
            onActionClick={handleReintentar}
          />
        </div>
      </div>
    )
  }

  const calidad = resumen?.calidad
  const costo = resumen?.costo
  const topesHoy = resumen?.topes_hoy
  const salud = resumen?.salud
  const salientes = resumen?.whatsapp_salientes

  const pctEntendido = (calidad?.porcentaje_entendidos_primera ?? 0).toFixed(1).replace('.', ',')
  const totalUsdNum = Number(costo?.total_usd) || 0
  const openaiEstado = costo?.openai_estado ?? 'sin_conexion'
  const openaiOk =
    openaiEstado === 'ok' && costo?.openai_usd !== null && costo?.openai_usd !== undefined
  const openaiUsdNum = openaiOk ? Number(costo?.openai_usd) || 0 : 0

  const medianaMs = salud?.tiempo_respuesta_mediana_ms
  const segundosMediana =
    medianaMs !== null && medianaMs !== undefined
      ? (medianaMs / 1000).toFixed(1).replace('.', ',')
      : null

  const summaryItems = [
    {
      label: 'Entendió a la primera',
      value: `${pctEntendido}%`,
      subValue: `${calidad?.entendidos_primera ?? 0} de ${calidad?.total ?? 0} mensajes`,
    },
    {
      label: 'Costo de la IA',
      value: openaiOk ? formatMonto(openaiUsdNum, 'USD') : formatMonto(totalUsdNum, 'USD'),
      valorCorto: openaiOk
        ? formatMontoCorto(openaiUsdNum, 'USD')
        : formatMontoCorto(totalUsdNum, 'USD'),
      subValue: openaiOk
        ? `según OpenAI · estimado ${formatMonto(totalUsdNum, 'USD')}`
        : 'estimado por Argentum',
    },
    {
      label: 'Mensajes recibidos',
      value: String(calidad?.total ?? 0),
      subValue: 'en el período',
    },
    {
      label: 'Tiempo de respuesta',
      value: segundosMediana ? `${segundosMediana} s` : '—',
      subValue: 'la mitad tarda menos',
    },
  ]

  const funcionesVisibles = NOMBRES_FUNCIONES.filter(
    ({ key }) => Number(costo?.por_funcion?.[key] ?? 0) > 0
  )
  const sinUsuarioUsd = Number(costo?.sin_usuario_usd ?? 0)

  let pieCostoOpenAi: string
  if (openaiOk) {
    pieCostoOpenAi = costo?.openai_hasta
      ? `Según OpenAI, en este período: ${formatMonto(openaiUsdNum, 'USD')} (datos hasta el ${formatearDiaMes(costo.openai_hasta)}).`
      : `Según OpenAI, en este período: ${formatMonto(openaiUsdNum, 'USD')}.`
  } else if (openaiEstado === 'error') {
    pieCostoOpenAi = 'No se pudo consultar OpenAI. Probá de nuevo más tarde.'
  } else {
    pieCostoOpenAi = 'Sin conexión con OpenAI: estos números son estimados.'
  }

  const wppFallados = salud?.wpp_fallados ?? 0
  const wppInterrumpidos = salud?.wpp_interrumpidos ?? 0
  const wppVencidos = salud?.wpp_vencidos ?? 0
  const avisosSinEnviar = salud?.avisos_whatsapp_sin_enviar ?? 0
  const sinProblemas =
    wppFallados === 0 &&
    wppInterrumpidos === 0 &&
    wppVencidos === 0 &&
    avisosSinEnviar === 0

  const gastoHoyNum = Number(topesHoy?.gasto_hoy_usd) || 0
  const presupuestoNum = Number(topesHoy?.presupuesto_usd) || 0
  const pctHoyBarra = porcentajeBarra(gastoHoyNum, presupuestoNum)
  const nivelHoy = nivelHoyVisual(topesHoy?.nivel ?? 'normal')

  const cupoUsado = salientes?.mes.cupo_usado ?? 0
  const cupoGratis = salientes?.mes.cupo_gratis ?? 0
  const pctCupoBarra = porcentajeBarra(cupoUsado, cupoGratis)
  const ultimos7Dias = (salientes?.por_dia ?? []).slice(-7)
  const maxDiaSalientes = Math.max(1, ...ultimos7Dias.map((d) => d.total))
  const topUsuariosMes = costo?.por_usuario_mes ?? []

  return (
    <div className={styles.panelStack}>
      {cabeceraPeriodo}

      <PageSummaryBar items={summaryItems} />

      <div className={styles.columnas}>
        <div className={styles.columna}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <MessageSquare size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Calidad</h3>
              </div>
            </div>

            <div className={styles.metricRows}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>No entendió</span>
                <span className={styles.metricVal}>{calidad?.no_entendidos ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Se deshizo o corrigió</span>
                <span className={styles.metricVal}>{calidad?.deshechos_o_corregidos ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Errores de la IA</span>
                <span className={styles.metricVal}>{calidad?.errores_ia ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Topes alcanzados</span>
                <span className={styles.metricVal}>{calidad?.topes ?? 0}</span>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Activity size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Hoy</h3>
              </div>
            </div>

            <div className={styles.progressSection}>
              <span className={styles.progressTitle}>
                {formatMonto(gastoHoyNum, 'USD')} de {formatMonto(presupuestoNum, 'USD')}
              </span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${
                    nivelHoy.tono === 'mal'
                      ? styles.barMal
                      : nivelHoy.tono === 'aviso'
                      ? styles.barAviso
                      : styles.barPrimary
                  }`}
                  style={{ width: `${pctHoyBarra}%` }}
                />
              </div>
              <span className={styles.estadoInline}>
                <span
                  className={`${styles.statusDot} ${claseDot(nivelHoy.tono)}`}
                  aria-hidden="true"
                />
                <span>{nivelHoy.texto}</span>
              </span>
            </div>

            <div className={styles.metricRows}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Personas en el tope de mensajes</span>
                <span className={styles.metricVal}>{topesHoy?.usuarios_tope_mensajes ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>En el tope de fotos y archivos</span>
                <span className={styles.metricVal}>{topesHoy?.usuarios_tope_archivos ?? 0}</span>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.columna}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <DollarSign size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Costo por función</h3>
              </div>
            </div>

            {funcionesVisibles.length === 0 && sinUsuarioUsd <= 0 ? (
              <p className={styles.emptySimple}>Sin consumo registrado en el período.</p>
            ) : (
              <div className={styles.metricRows}>
                {funcionesVisibles.map(({ key, label }) => {
                  const val = Number(costo?.por_funcion?.[key] ?? 0)
                  return (
                    <div key={key} className={styles.metricRow}>
                      <span className={styles.metricLabel}>{label}</span>
                      <span className={styles.metricVal}>{formatMonto(val, 'USD')}</span>
                    </div>
                  )
                })}
                {sinUsuarioUsd > 0 && (
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Sin usuario</span>
                    <span className={styles.metricVal}>{formatMonto(sinUsuarioUsd, 'USD')}</span>
                  </div>
                )}
              </div>
            )}

            <p className={styles.cardFootnote}>{pieCostoOpenAi}</p>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Send size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Mensajes de Meta este mes</h3>
              </div>
            </div>

            <div className={styles.bigNumberBlock}>
              <span className={styles.bigNumber}>
                {formatearCantidad(salientes?.mes.enviados ?? 0)}
              </span>
              <span className={styles.bigCaption}>enviados</span>
            </div>

            <div className={styles.progressSection}>
              <span className={styles.progressCaption}>
                {formatearCantidad(cupoUsado)} de {formatearCantidad(cupoGratis)} gratis
              </span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${styles.barPrimary}`}
                  style={{ width: `${pctCupoBarra}%` }}
                />
              </div>
            </div>

            <div className={styles.metricRows}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Cobrados por Meta</span>
                <span className={styles.metricVal}>{salientes?.mes.cobrados_meta ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Sin dato de Meta todavía</span>
                <span className={styles.metricVal}>{salientes?.mes.sin_dato_meta ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Sin enviar</span>
                <span className={styles.metricVal}>{salientes?.mes.no_enviados ?? 0}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Con más de una respuesta</span>
                <span className={styles.metricVal}>
                  {salientes?.entrantes_con_mas_de_una_respuesta ?? 0}
                </span>
              </div>
            </div>

            {ultimos7Dias.length > 0 && (
              <div className={styles.dailyBars}>
                <span className={styles.subTitle}>Últimos 7 días</span>
                {ultimos7Dias.map((d) => (
                  <div key={d.fecha} className={styles.dailyBarRow}>
                    <span className={styles.dailyFecha}>{formatearDiaMes(d.fecha)}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${styles.barPrimary}`}
                        style={{ width: `${porcentajeBarra(d.total, maxDiaSalientes)}%` }}
                      />
                    </div>
                    <span className={styles.dailyCount}>{d.total}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={`${styles.columna} ${styles.columnaTercera}`}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <AlertTriangle size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Problemas</h3>
              </div>
            </div>

            {sinProblemas ? (
              <span className={styles.estadoInline}>
                <span className={`${styles.statusDot} ${styles.dotBien}`} aria-hidden="true" />
                <span>Sin problemas en el período.</span>
              </span>
            ) : (
              <div className={styles.metricRows}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Mensajes que fallaron</span>
                  <span className={styles.metricVal}>{wppFallados}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Cortados por un reinicio</span>
                  <span className={styles.metricVal}>{wppInterrumpidos}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Sin respuesta después de 1 hora</span>
                  <span className={styles.metricVal}>{wppVencidos}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Avisos sin enviar</span>
                  <span className={styles.metricVal}>{avisosSinEnviar}</span>
                </div>
              </div>
            )}
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Users size={18} />
              </div>
              <div className={styles.sectionHeaderText}>
                <h3>Los que más cuestan este mes</h3>
              </div>
            </div>

            {topUsuariosMes.length === 0 ? (
              <p className={styles.emptySimple}>Todavía no hay costos este mes.</p>
            ) : (
              <div className={styles.topUsersList}>
                {topUsuariosMes.map((u) => {
                  const msgTxt =
                    u.whatsapp_cobrados === 1
                      ? '1 mensaje cobrado'
                      : `${u.whatsapp_cobrados} mensajes cobrados`
                  return (
                    <button
                      key={u.usuario_id}
                      type="button"
                      className={styles.topUserRow}
                      onClick={() => onSelectUsuario(u.usuario_id)}
                    >
                      <div className={styles.topUserLeft}>
                        <span className={styles.topUserName}>{u.nombre}</span>
                        <span className={styles.topUserSub}>
                          IA {formatMonto(u.ia_usd, 'USD')} · {msgTxt}
                        </span>
                      </div>
                      <span className={styles.topUserTotal}>{formatMonto(u.total_ars, 'ARS')}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConversacionesCard
        convs={convs}
        categoria={categoria}
        pagina={pagina}
        loadingConvs={loadingConvs}
        onCambioCategoria={handleCambioCategoria}
        onCambioPagina={handleCambioPagina}
      />
    </div>
  )
}

export default MonitorWppPanel
