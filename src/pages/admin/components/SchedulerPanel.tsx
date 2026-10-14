import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Play, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { sileo } from 'sileo'
import adminService, { type JobSchedulerItem } from '../../../services/adminService'
import styles from './SchedulerPanel.module.css'

/** Formatea una fecha ISO a la zona horaria de Argentina (dd/MM/yyyy HH:mm:ss) */
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

export const SchedulerPanel: React.FC = () => {
  const [jobs, setJobs] = useState<JobSchedulerItem[]>([])
  const [schedulerActivo, setSchedulerActivo] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [corriendoJobId, setCorriendoJobId] = useState<string | null>(null)
  const [detallesAbiertos, setDetallesAbiertos] = useState<Record<string, boolean>>({})

  const cargarScheduler = useCallback(async (mostrarFeedback = false) => {
    try {
      setLoading(true)
      const data = await adminService.getScheduler()
      setSchedulerActivo(data.scheduler_activo)
      setJobs(data.jobs)
      if (mostrarFeedback) {
        sileo.success({ title: 'Estado del scheduler actualizado' })
      }
    } catch (err: unknown) {
      console.error('Error al cargar scheduler:', err)
      sileo.error({ title: 'No se pudo cargar el estado del scheduler' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let activo = true
    adminService
      .getScheduler()
      .then((data) => {
        if (!activo) return
        setSchedulerActivo(data.scheduler_activo)
        setJobs(data.jobs)
      })
      .catch((err: unknown) => {
        if (!activo) return
        console.error('Error al cargar scheduler:', err)
        sileo.error({ title: 'No se pudo cargar el estado del scheduler' })
      })
      .finally(() => {
        if (activo) {
          setLoading(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  const handleCorrerJob = async (jobId: string) => {
    try {
      setCorriendoJobId(jobId)
      const res = await adminService.correrJob(jobId)
      sileo.success({ title: res.mensaje || 'Se va a correr en unos segundos.' })
      // Recargar después de una pequeña pausa
      setTimeout(() => {
        cargarScheduler()
      }, 1500)
    } catch (err: unknown) {
      console.error(`Error al ejecutar job ${jobId}:`, err)
      const mensaje = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      sileo.error({ title: typeof mensaje === 'string' ? mensaje : 'Error al ejecutar la tarea' })
    } finally {
      setCorriendoJobId(null)
    }
  }

  const toggleDetalle = (jobId: string) => {
    setDetallesAbiertos((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }))
  }

  const renderResultadoChip = (job: JobSchedulerItem) => {
    const ult = job.ultima_corrida
    if (!ult) return <span className={styles.vacioText}>—</span>

    if (ult.resultado === 'ok') {
      return (
        <span className={`${styles.chipResultado} ${styles.chipBien}`}>
          <CheckCircle2 size={12} />
          Bien
        </span>
      )
    }

    if (ult.resultado === 'error') {
      const estaAbierto = detallesAbiertos[job.job_id]
      return (
        <button
          type="button"
          onClick={() => toggleDetalle(job.job_id)}
          className={`${styles.chipResultado} ${styles.chipFallo}`}
          title="Tocar para ver detalle del error"
        >
          <XCircle size={12} />
          Falló
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            {estaAbierto ? '▲' : '▼'}
          </span>
        </button>
      )
    }

    return (
      <span className={`${styles.chipResultado} ${styles.chipOmitida}`}>
        <Clock size={12} />
        Omitida
      </span>
    )
  }

  const renderEstadoChip = (estado: JobSchedulerItem['estado']) => {
    switch (estado) {
      case 'Al día':
        return (
          <span className={`${styles.chipEstado} ${styles.chipEstadoAlDia}`}>
            ● Al día
          </span>
        )
      case 'Atrasado':
        return (
          <span className={`${styles.chipEstado} ${styles.chipEstadoAtrasado}`}>
            ▲ Atrasado
          </span>
        )
      case 'Falló':
        return (
          <span className={`${styles.chipEstado} ${styles.chipEstadoFallo}`}>
            ✕ Falló
          </span>
        )
      case 'Sin datos':
      default:
        return (
          <span className={`${styles.chipEstado} ${styles.chipEstadoSinDatos}`}>
            ○ Sin datos
          </span>
        )
    }
  }

  return (
    <div className={styles.container}>
      {/* Aviso si el scheduler está apagado */}
      {!schedulerActivo && (
        <div className={styles.warningBanner}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <span>Las tareas automáticas están apagadas en este servidor.</span>
        </div>
      )}

      {/* Cabecera del Panel */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.title}>Tareas Automáticas</h2>
          <p className={styles.subtitle}>
            Monitoreo y ejecución de trabajos programados (APScheduler). Total: {jobs.length} tareas.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => cargarScheduler(true)}
          disabled={loading}
          title="Recargar listado de tareas"
        >
          <RefreshCw size={15} className={loading ? styles.spin : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className={styles.loadingContainer}>
          <RefreshCw size={24} className={styles.spin} />
          <span>Cargando catálogo de tareas automáticas...</span>
        </div>
      ) : (
        <>
          {/* Vista Escritorio: Tabla */}
          <div className={styles.desktopWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Tarea</th>
                  <th className={styles.th}>Última corrida</th>
                  <th className={styles.th}>Próxima corrida</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const tieneDetalleError = job.ultima_corrida?.resultado === 'error' && detallesAbiertos[job.job_id]
                  return (
                    <React.Fragment key={job.job_id}>
                      <tr className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.taskInfo}>
                            <span className={styles.taskName}>{job.nombre}</span>
                            <span className={styles.taskDesc}>{job.que_hace}</span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.corridaStack}>
                            <span className={styles.fechaText}>
                              {formatearFechaArgentina(job.ultima_corrida?.inicio)}
                            </span>
                            {renderResultadoChip(job)}
                            {job.ultima_corrida && (
                              <span className={styles.duracionText}>
                                {job.ultima_corrida.duracion_ms} ms
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.fechaText}>
                            {formatearFechaArgentina(job.proxima_corrida)}
                          </span>
                        </td>
                        <td className={styles.td}>
                          {renderEstadoChip(job.estado)}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          {job.puede_correr_ahora && (
                            <button
                              type="button"
                              className={styles.runBtn}
                              disabled={corriendoJobId === job.job_id || !schedulerActivo}
                              onClick={() => handleCorrerJob(job.job_id)}
                              title={
                                !schedulerActivo
                                  ? 'El scheduler está apagado'
                                  : 'Ejecutar tarea en segundo plano inmediatamente'
                              }
                            >
                              <Play size={12} fill="currentColor" />
                              <span>{corriendoJobId === job.job_id ? 'Corriendo...' : 'Correr ahora'}</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Fila desplegable con detalle de error */}
                      {tieneDetalleError && (
                        <tr className={styles.errorDetailRow}>
                          <td colSpan={5}>
                            <div className={styles.errorDetailBox}>
                              <span className={styles.errorDetailLabel}>Detalle del fallo:</span>
                              {job.ultima_corrida?.detalle || 'Sin mensaje de error especificado'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil: Tarjetas */}
          <div className={styles.mobileCards}>
            {jobs.map((job) => {
              const tieneDetalleError = job.ultima_corrida?.resultado === 'error' && detallesAbiertos[job.job_id]
              return (
                <div key={job.job_id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.cardTitle}>{job.nombre}</h3>
                      <p className={styles.cardDesc}>{job.que_hace}</p>
                    </div>
                    {renderEstadoChip(job.estado)}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardRow}>
                      <span className={styles.cardRowLabel}>Última corrida:</span>
                      <div className={styles.cardRowVal}>
                        <span>{formatearFechaArgentina(job.ultima_corrida?.inicio)}</span>
                        {renderResultadoChip(job)}
                      </div>
                    </div>

                    {tieneDetalleError && (
                      <div className={styles.errorDetailBox} style={{ margin: '4px 0' }}>
                        <span className={styles.errorDetailLabel}>Error:</span>
                        {job.ultima_corrida?.detalle || 'Sin mensaje de error'}
                      </div>
                    )}

                    <div className={styles.cardRow}>
                      <span className={styles.cardRowLabel}>Próxima corrida:</span>
                      <span className={styles.cardRowVal}>
                        {formatearFechaArgentina(job.proxima_corrida)}
                      </span>
                    </div>
                  </div>

                  {job.puede_correr_ahora && (
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.runBtn}
                        disabled={corriendoJobId === job.job_id || !schedulerActivo}
                        onClick={() => handleCorrerJob(job.job_id)}
                      >
                        <Play size={12} fill="currentColor" />
                        <span>{corriendoJobId === job.job_id ? 'Corriendo...' : 'Correr ahora'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default SchedulerPanel
