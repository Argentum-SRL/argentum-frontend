import React, { useState } from 'react'
import { MessageSquare } from '@/components/ui/icons'
import {
  Button,
  CollapseToggle,
  EmptyState,
  SelectInput,
  type SelectOption,
} from '@/components/ui'
import {
  formatearFechaHoraCortaAr,
  rangoPagina,
  textoIntent,
} from '@/utils/admin'
import type {
  ConversacionMonitorItem,
  PaginatedConversacionesMonitor,
} from '@/types/admin'
import styles from './ConversacionesCard.module.css'

const OPCIONES_CATEGORIA: SelectOption[] = [
  { value: '', label: 'Todas' },
  { value: 'entendido_primera', label: 'Entendió a la primera' },
  { value: 'no_entendido', label: 'No entendió' },
  { value: 'error_ia', label: 'Error de la IA' },
  { value: 'deshecho_o_corregido', label: 'Deshecho o corregido' },
  { value: 'correccion', label: 'Corrección' },
  { value: 'tope', label: 'Tope alcanzado' },
]

const TIPOS_MENSAJE: Record<string, string> = {
  texto: 'Texto',
  text: 'Texto',
  audio: 'Audio',
  imagen: 'Foto',
  image: 'Foto',
  foto: 'Foto',
  pdf: 'PDF',
  document: 'PDF',
  documento: 'PDF',
}

function textoTipoMensaje(tipo: string): string {
  const clave = tipo.trim().toLowerCase()
  return TIPOS_MENSAJE[clave] || tipo
}

function resultadoConversacion(
  categoria: string
): { texto: string; tono: 'bien' | 'aviso' | 'mal' } {
  switch (categoria) {
    case 'entendido_primera':
      return { texto: 'Entendió', tono: 'bien' }
    case 'no_entendido':
      return { texto: 'No entendió', tono: 'aviso' }
    case 'deshecho_o_corregido':
    case 'correccion':
      return { texto: 'Corregido', tono: 'aviso' }
    case 'error_ia':
      return { texto: 'Error de IA', tono: 'mal' }
    case 'tope':
      return { texto: 'Tope', tono: 'aviso' }
    default:
      return { texto: categoria, tono: 'aviso' }
  }
}

function claseDot(tono: 'bien' | 'aviso' | 'mal'): string {
  if (tono === 'bien') return styles.dotBien
  if (tono === 'mal') return styles.dotMal
  return styles.dotAviso
}

interface ConversacionesCardProps {
  convs: PaginatedConversacionesMonitor | null
  categoria: string
  pagina: number
  loadingConvs: boolean
  onCambioCategoria: (val: string) => void
  onCambioPagina: (nextPage: number) => void
}

export const ConversacionesCard: React.FC<ConversacionesCardProps> = ({
  convs,
  categoria,
  pagina,
  loadingConvs,
  onCambioCategoria,
  onCambioPagina,
}) => {
  const [expandida, setExpandida] = useState(true)

  const itemsConv = convs?.items ?? []
  const cantidadConvs = convs?.total ?? 0
  const paginasConvs = Math.max(1, Math.ceil(cantidadConvs / 50))

  return (
    <section className={styles.sectionCard} aria-label="Conversaciones">
      <div className={styles.convHeader}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <MessageSquare size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Conversaciones</h3>
          </div>
        </div>

        <CollapseToggle
          expanded={expandida}
          onToggle={() => setExpandida((prev) => !prev)}
          ariaLabel={expandida ? 'Ocultar conversaciones' : 'Mostrar conversaciones'}
        />
      </div>

      {expandida && (
        <>
          <div className={styles.convToolbar}>
            <div className={styles.convFilterWrap}>
              <label htmlFor="admin-monitor-categoria" className={styles.srOnly}>
                Filtrar conversaciones por resultado
              </label>
              <SelectInput
                id="admin-monitor-categoria"
                value={categoria}
                onChange={onCambioCategoria}
                options={OPCIONES_CATEGORIA}
              />
            </div>
          </div>

          {loadingConvs ? (
            <p className={styles.emptySimple}>Cargando conversaciones...</p>
          ) : itemsConv.length === 0 ? (
            <EmptyState
              variant="compact"
              icon={MessageSquare}
              title="No hay conversaciones registradas en este período."
            />
          ) : (
            <>
              <div className={styles.desktopTableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Cuándo</th>
                      <th className={styles.th}>Quién</th>
                      <th className={styles.th}>Tipo</th>
                      <th className={styles.th}>Qué entendió</th>
                      <th className={styles.th}>Resultado</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Tiempo</th>
                      <th className={styles.th}>Mensaje</th>
                      <th className={styles.th}>Respuesta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsConv.map((c: ConversacionMonitorItem, idx: number) => {
                      const res = resultadoConversacion(c.categoria)
                      const tiempoTexto =
                        c.tiempo_respuesta_ms !== null
                          ? `${(c.tiempo_respuesta_ms / 1000).toFixed(1).replace('.', ',')} s`
                          : '—'
                      return (
                        <tr key={`${c.fecha}-${idx}`} className={styles.tableRow}>
                          <td className={`${styles.td} ${styles.numCell}`}>
                            {formatearFechaHoraCortaAr(c.fecha)}
                          </td>
                          <td className={styles.td}>{c.email || 'Sin email'}</td>
                          <td className={styles.td}>{textoTipoMensaje(c.tipo_mensaje)}</td>
                          <td className={styles.td}>{textoIntent(c.intent)}</td>
                          <td className={styles.td}>
                            <span className={styles.estadoInline}>
                              <span
                                className={`${styles.statusDot} ${claseDot(res.tono)}`}
                                aria-hidden="true"
                              />
                              <span>{res.texto}</span>
                            </span>
                          </td>
                          <td className={`${styles.td} ${styles.tdRight} ${styles.numCell}`}>
                            {tiempoTexto}
                          </td>
                          <td className={styles.td}>
                            {c.texto_visible ? (
                              <span className={styles.msgText}>
                                {c.mensaje_usuario || c.transcripcion || '—'}
                              </span>
                            ) : (
                              <span className={styles.hiddenMsg}>Oculto: no dio permiso</span>
                            )}
                          </td>
                          <td className={styles.td}>
                            {c.texto_visible ? (
                              <span className={styles.msgText}>{c.mensaje_bot || '—'}</span>
                            ) : (
                              <span className={styles.hiddenMsg}>Oculto: no dio permiso</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.mobileList}>
                {itemsConv.map((c: ConversacionMonitorItem, idx: number) => {
                  const res = resultadoConversacion(c.categoria)
                  const tiempoTexto =
                    c.tiempo_respuesta_ms !== null
                      ? `${(c.tiempo_respuesta_ms / 1000).toFixed(1).replace('.', ',')} s`
                      : '—'
                  return (
                    <div key={`${c.fecha}-${idx}`} className={styles.mobileConvItem}>
                      <div className={styles.mobileConvTop}>
                        <span className={styles.mobileConvWho}>{c.email || 'Sin email'}</span>
                        <span className={styles.mobileConvWhen}>
                          {formatearFechaHoraCortaAr(c.fecha)}
                        </span>
                      </div>
                      <div className={styles.mobileConvMeta}>
                        <span className={styles.estadoInline}>
                          <span
                            className={`${styles.statusDot} ${claseDot(res.tono)}`}
                            aria-hidden="true"
                          />
                          <span>{res.texto}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{textoTipoMensaje(c.tipo_mensaje)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{textoIntent(c.intent)}</span>
                        <span aria-hidden="true">·</span>
                        <span className={styles.numCell}>{tiempoTexto}</span>
                      </div>
                      <div className={styles.mobileConvMsg}>
                        {c.texto_visible ? (
                          <>
                            <div>{c.mensaje_usuario || c.transcripcion || '—'}</div>
                            {c.mensaje_bot && (
                              <div className={styles.mobileBotMsg}>{c.mensaje_bot}</div>
                            )}
                          </>
                        ) : (
                          <span className={styles.hiddenMsg}>Oculto: no dio permiso</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.paginationFooter}>
                <span className={styles.rangeText}>{rangoPagina(pagina, 50, cantidadConvs)}</span>
                <div className={styles.paginationBtns}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pagina <= 1 || loadingConvs}
                    onClick={() => onCambioPagina(pagina - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pagina >= paginasConvs || loadingConvs}
                    onClick={() => onCambioPagina(pagina + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default ConversacionesCard
