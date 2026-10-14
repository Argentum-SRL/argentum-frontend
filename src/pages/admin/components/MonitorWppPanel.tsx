import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, MessageSquare, AlertTriangle, DollarSign, Activity } from 'lucide-react'
import { sileo } from 'sileo'
import adminService from '../../../services/adminService'
import type {
  MonitorWppResumen,
  PaginatedConversacionesMonitor,
  ConversacionMonitorItem,
} from '../../../types/admin'
import styles from './MonitorWppPanel.module.css'

/** Formatea un monto a 'USD 0,000' (3 decimales, coma decimal) */
function formatMontoUsd(monto: number | string | undefined | null): string {
  const num = Number(monto) || 0
  const fijado = num.toFixed(3)
  return `USD ${fijado.replace('.', ',')}`
}

/** Formatea una fecha ISO a la zona horaria de Argentina */
function formatearFechaArgentina(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return '—'
  }
}

const NOMBRES_FUNCIONES: Record<string, string> = {
  texto_whatsapp: 'Mensajes de texto',
  audio_whatsapp: 'Audios',
  imagen_whatsapp: 'Fotos',
  pdf_whatsapp: 'PDF por WhatsApp',
  importacion_pdf: 'Importación de resúmenes',
}

const NOMBRES_CATEGORIAS: Record<string, string> = {
  entendido_primera: 'Entendido a la primera',
  no_entendido: 'No entendido',
  error_ia: 'Error de la IA',
  deshecho_o_corregido: 'Deshecho o corregido',
  correccion: 'Corrección',
  tope: 'Tope alcanzado',
}

export const MonitorWppPanel: React.FC = () => {
  const [dias, setDias] = useState<1 | 7 | 30>(1)
  const [resumen, setResumen] = useState<MonitorWppResumen | null>(null)
  const [conversacionesData, setConversacionesData] = useState<PaginatedConversacionesMonitor | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')
  const [pagina, setPagina] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingTable, setLoadingTable] = useState<boolean>(false)

  const cargarDatos = useCallback(async (diasVal: 1 | 7 | 30, catVal: string, pagVal: number, mostrarFeedback = false) => {
    try {
      setLoading(true)
      const [resumenData, convsData] = await Promise.all([
        adminService.getMonitorWppResumen(diasVal),
        adminService.getMonitorWppConversaciones(diasVal, catVal, pagVal),
      ])
      setResumen(resumenData)
      setConversacionesData(convsData)
      if (mostrarFeedback) {
        sileo.success({ title: 'Monitor de WhatsApp actualizado' })
      }
    } catch (err: unknown) {
      console.error('Error al cargar monitor wpp:', err)
      sileo.error({ title: 'No se pudo cargar el monitor de WhatsApp' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let activo = true
    Promise.all([
      adminService.getMonitorWppResumen(dias),
      adminService.getMonitorWppConversaciones(dias, categoriaFiltro, pagina),
    ])
      .then(([resumenData, convsData]) => {
        if (!activo) return
        setResumen(resumenData)
        setConversacionesData(convsData)
      })
      .catch((err: unknown) => {
        if (!activo) return
        console.error('Error al cargar monitor wpp:', err)
        sileo.error({ title: 'No se pudo cargar el monitor de WhatsApp' })
      })
      .finally(() => {
        if (activo) {
          setLoading(false)
          setLoadingTable(false)
        }
      })

    return () => {
      activo = false
    }
  }, [dias, categoriaFiltro, pagina])

  const handleCambioDias = (nuevosDias: 1 | 7 | 30) => {
    setLoading(true)
    setDias(nuevosDias)
    setPagina(1)
  }

  const handleCambioCategoria = (nuevaCat: string) => {
    setLoadingTable(true)
    setCategoriaFiltro(nuevaCat)
    setPagina(1)
  }

  const handleCambioPagina = (nuevaPagina: number) => {
    setLoadingTable(true)
    setPagina(nuevaPagina)
  }

  // Textos y etiquetas de Topes de Hoy
  const estadoNivelMap: Record<string, { label: string; className: string }> = {
    normal: { label: 'Normal', className: styles.badgeNormal },
    aviso: { label: 'Aviso enviado', className: styles.badgeAviso },
    sin_archivos: { label: 'Fotos y PDF en pausa', className: styles.badgePausa },
    sin_ia: { label: 'IA en pausa', className: styles.badgePausa },
  }

  const nivelActual = resumen?.topes_hoy.nivel || 'normal'
  const estadoBadge = estadoNivelMap[nivelActual] || { label: nivelActual, className: styles.badgeNormal }

  // Formato de entendidos primera
  const pctEntendidoFmt = resumen
    ? `${resumen.calidad.porcentaje_entendidos_primera.toFixed(1).replace('.', ',')} %`
    : '0,0 %'
  const baseEntendidos = resumen ? (resumen.calidad.total - resumen.calidad.correcciones) : 0
  const textoEntendidosPrimera = `Entendidos a la primera: ${pctEntendidoFmt} (${resumen?.calidad.entendidos_primera ?? 0} de ${baseEntendidos})`

  // Salud - Tiempo de respuesta
  let textoSaludTiempo = 'Todavía no hay datos de tiempo de respuesta'
  if (
    resumen?.salud.mensajes_con_tiempo &&
    resumen.salud.tiempo_respuesta_mediana_ms !== null &&
    resumen.salud.tiempo_respuesta_p90_ms !== null
  ) {
    const medS = (resumen.salud.tiempo_respuesta_mediana_ms / 1000).toFixed(1).replace('.', ',')
    const p90S = (resumen.salud.tiempo_respuesta_p90_ms / 1000).toFixed(1).replace('.', ',')
    textoSaludTiempo = `La mitad de las respuestas tarda menos de ${medS} s y 9 de cada 10, menos de ${p90S} s`
  }

  const totalPaginas = conversacionesData ? Math.max(1, Math.ceil(conversacionesData.total / 50)) : 1

  return (
    <div className={styles.container}>
      {/* Header & Controls */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.title}>Monitor de WhatsApp y Costos de IA</h2>
          <p className={styles.subtitle}>
            Monitoreo en tiempo real de entendimiento del bot, consumo de OpenAI, topes diarios y latencia.
          </p>
        </div>

        <div className={styles.controlsGroup}>
          {/* Selector Hoy | 7 días | 30 días */}
          <div className={styles.selectorDias}>
            <button
              type="button"
              className={`${styles.diaBtn} ${dias === 1 ? styles.diaBtnActive : ''}`}
              onClick={() => handleCambioDias(1)}
            >
              Hoy
            </button>
            <button
              type="button"
              className={`${styles.diaBtn} ${dias === 7 ? styles.diaBtnActive : ''}`}
              onClick={() => handleCambioDias(7)}
            >
              7 días
            </button>
            <button
              type="button"
              className={`${styles.diaBtn} ${dias === 30 ? styles.diaBtnActive : ''}`}
              onClick={() => handleCambioDias(30)}
            >
              30 días
            </button>
          </div>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => cargarDatos(dias, categoriaFiltro, pagina, true)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? styles.spin : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Cuatro Tarjetas */}
      <div className={styles.cardsGrid}>
        {/* Tarjeta 1: Cómo entiende el bot */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Cómo entiende el bot</h3>
            <MessageSquare size={16} className="text-primary" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.metricRow}>
              <span className={styles.metricHighlight}>{textoEntendidosPrimera}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>No entendidos:</span>
              <span className={styles.metricValue}>{resumen?.calidad.no_entendidos ?? 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Deshechos o corregidos después:</span>
              <span className={styles.metricValue}>{resumen?.calidad.deshechos_o_corregidos ?? 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Errores de la IA:</span>
              <span className={styles.metricValue}>{resumen?.calidad.errores_ia ?? 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Topes alcanzados:</span>
              <span className={styles.metricValue}>{resumen?.calidad.topes ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Costo de la IA */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Costo de la IA</h3>
            <DollarSign size={16} className="text-primary" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Total acumulado:</span>
              <span className={styles.metricHighlight}>{formatMontoUsd(resumen?.costo.total_usd)}</span>
            </div>

            {/* Desglose por función */}
            <div className={styles.subList}>
              {Object.entries(NOMBRES_FUNCIONES).map(([clave, nombre]) => {
                const monto = resumen?.costo.por_funcion[clave] ?? 0
                return (
                  <div key={clave} className={styles.subItem}>
                    <span>{nombre}:</span>
                    <span className="font-semibold">{formatMontoUsd(monto)}</span>
                  </div>
                )
              })}
            </div>

            {/* Sin usuario si aplica */}
            {resumen && Number(resumen.costo.sin_usuario_usd) > 0 && (
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Sin usuario:</span>
                <span className={styles.metricValue}>{formatMontoUsd(resumen.costo.sin_usuario_usd)}</span>
              </div>
            )}

            {/* Top 10 usuarios */}
            {resumen && resumen.costo.por_usuario.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs font-semibold text-[var(--text-2)]">Top usuarios de mayor costo:</span>
                <div className={styles.subList}>
                  {resumen.costo.por_usuario.map((u, i) => (
                    <div key={u.usuario_id || i} className={styles.subItem}>
                      <span className="truncate max-w-[170px]" title={u.email || u.usuario_id}>
                        {u.email || u.usuario_id.slice(0, 8)}:
                      </span>
                      <span className="font-semibold">{formatMontoUsd(u.total_usd)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <span className={styles.leyendaFija}>Estimado por Argentum, no es la factura de OpenAI.</span>
          </div>
        </div>

        {/* Tarjeta 3: Topes de hoy */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Topes de hoy</h3>
            <AlertTriangle size={16} className="text-primary" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.metricRow}>
              <span className={styles.metricHighlight}>
                {`Gasto de hoy: ${formatMontoUsd(resumen?.topes_hoy.gasto_hoy_usd)} de ${formatMontoUsd(resumen?.topes_hoy.presupuesto_usd)}`}
              </span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Estado de cuota global:</span>
              <span className={`${styles.badge} ${estadoBadge.className}`}>{estadoBadge.label}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Personas en el tope de mensajes:</span>
              <span className={styles.metricValue}>{resumen?.topes_hoy.usuarios_tope_mensajes ?? 0}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Personas en el tope de fotos y archivos:</span>
              <span className={styles.metricValue}>{resumen?.topes_hoy.usuarios_tope_archivos ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Salud */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Salud</h3>
            <Activity size={16} className="text-primary" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.metricRow}>
              <span className={styles.metricValue}>{textoSaludTiempo}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Avisos por WhatsApp:</span>
              <span className={styles.metricValue}>
                {`${resumen?.salud.avisos_whatsapp_enviados ?? 0} enviados, ${resumen?.salud.avisos_whatsapp_sin_enviar ?? 0} sin enviar`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Conversaciones */}
      <div className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <div className="flex flex-col gap-1">
            <h3 className={styles.title}>Registro de Conversaciones</h3>
            <span className={styles.subtitle}>
              Listado detallado de mensajes entrantes y respuestas del asistente.
            </span>
          </div>

          {/* Filtro por Categoría */}
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-categoria" className="text-xs font-semibold text-[var(--text-2)]">
              Categoría:
            </label>
            <select
              id="filtro-categoria"
              className={styles.filterSelect}
              value={categoriaFiltro}
              onChange={(e) => handleCambioCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="entendido_primera">Entendidos a la primera</option>
              <option value="no_entendido">No entendidos</option>
              <option value="error_ia">Errores de la IA</option>
              <option value="deshecho_o_corregido">Deshechos o corregidos</option>
              <option value="correccion">Correcciones</option>
              <option value="tope">Topes</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loadingTable ? (
            <div className={styles.emptyMsg}>Cargando conversaciones...</div>
          ) : !conversacionesData || conversacionesData.items.length === 0 ? (
            <div className={styles.emptyMsg}>No hay conversaciones registradas en esta ventana.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Usuario</th>
                  <th className={styles.th}>Tipo</th>
                  <th className={styles.th}>Intent</th>
                  <th className={styles.th}>Categoría</th>
                  <th className={styles.th}>Tiempo</th>
                  <th className={styles.th}>Error IA</th>
                  <th className={styles.th}>Mensaje Usuario</th>
                  <th className={styles.th}>Respuesta Bot</th>
                </tr>
              </thead>
              <tbody>
                {conversacionesData.items.map((c: ConversacionMonitorItem, idx: number) => {
                  const nombreCat = NOMBRES_CATEGORIAS[c.categoria] || c.categoria
                  return (
                    <tr key={`${c.usuario_id}_${c.fecha}_${idx}`} className={styles.row}>
                      <td className={styles.td}>{formatearFechaArgentina(c.fecha)}</td>
                      <td className={styles.td}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{c.email || '—'}</span>
                          <span className="text-[11px] text-[var(--text-2)]">{c.usuario_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className="capitalize">{c.tipo_mensaje}</span>
                      </td>
                      <td className={styles.td}>
                        <code className="text-xs bg-[var(--surface-alt)] px-1.5 py-0.5 rounded">
                          {c.intent || '—'}
                        </code>
                      </td>
                      <td className={styles.td}>
                        <span className="text-xs font-semibold">{nombreCat}</span>
                      </td>
                      <td className={styles.td}>
                        {c.tiempo_respuesta_ms !== null ? `${c.tiempo_respuesta_ms} ms` : '—'}
                      </td>
                      <td className={styles.td}>
                        {c.error_ia ? (
                          <span className="text-red-500 font-bold">Sí</span>
                        ) : (
                          <span className="text-[var(--text-2)]">No</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {!c.texto_visible ? (
                          <span className={styles.textoOculto}>Texto oculto: no dio permiso</span>
                        ) : (
                          <div className={styles.msgBox}>
                            <span className={styles.msgContent}>{c.mensaje_usuario || '—'}</span>
                            {c.transcripcion && (
                              <span className="text-[11px] text-[var(--text-2)]">
                                <strong>Audio:</strong> {c.transcripcion}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        {!c.texto_visible ? (
                          <span className={styles.textoOculto}>Texto oculto: no dio permiso</span>
                        ) : (
                          <div className={styles.msgBox}>
                            <span className={styles.msgContent}>{c.mensaje_bot || '—'}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {conversacionesData && conversacionesData.total > 0 && (
          <div className={styles.pagination}>
            <span>
              Página {pagina} de {totalPaginas} ({conversacionesData.total} conversaciones)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => handleCambioPagina(pagina - 1)}
                disabled={pagina <= 1 || loadingTable}
              >
                Anterior
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => handleCambioPagina(pagina + 1)}
                disabled={pagina >= totalPaginas || loadingTable}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
