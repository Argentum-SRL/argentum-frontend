import React, { useEffect, useState } from 'react'
import { sileo } from 'sileo'
import { AlertTriangle, Clock } from '@/components/ui/icons'
import { AdminTareasSkeleton, Button, EmptyState } from '@/components/ui'
import adminService, { type JobSchedulerItem } from '@/services/adminService'
import { getErrorMessage } from '@/utils/errorMessages'
import { ordenarTareas, tiempoHasta, tiempoRelativo } from '@/utils/admin'
import styles from './SchedulerPanel.module.css'

interface SchedulerPanelProps {
  refreshKey: number
}

function dotClaseEstado(estado: JobSchedulerItem['estado']): string {
  switch (estado) {
    case 'Al día':
      return styles.dotBien
    case 'Atrasado':
      return styles.dotAviso
    case 'Falló':
      return styles.dotMal
    case 'Sin datos':
    default:
      return styles.dotGris
  }
}

export const SchedulerPanel: React.FC<SchedulerPanelProps> = ({ refreshKey }) => {
  const [jobs, setJobs] = useState<JobSchedulerItem[]>([])
  const [schedulerActivo, setSchedulerActivo] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [corriendoJobId, setCorriendoJobId] = useState<string | null>(null)
  const [detallesAbiertos, setDetallesAbiertos] = useState<Record<string, boolean>>({})
  const [reloadSeq, setReloadSeq] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    adminService
      .getScheduler(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setError(null)
        setSchedulerActivo(data.scheduler_activo)
        setJobs(ordenarTareas(data.jobs))
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const msg = getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.')
        setError(msg)
        sileo.error({ title: msg })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [refreshKey, reloadSeq])

  const handleReintentar = () => {
    setLoading(true)
    setError(null)
    setReloadSeq((n) => n + 1)
  }

  const handleCorrerJob = async (jobId: string) => {
    try {
      setCorriendoJobId(jobId)
      await adminService.correrJob(jobId)
      sileo.success({ title: 'La tarea va a correr en unos segundos.' })
      setLoading(true)
      setReloadSeq((n) => n + 1)
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo correr la tarea. Probá de nuevo.') })
    } finally {
      setCorriendoJobId(null)
    }
  }

  const toggleDetalle = (jobId: string) => {
    setDetallesAbiertos((prev) => ({ ...prev, [jobId]: !prev[jobId] }))
  }

  const ahora = new Date()
  const conProblemas = jobs.filter((j) => j.estado === 'Falló' || j.estado === 'Atrasado').length

  return (
    <section className={styles.sectionCard} aria-label="Tareas automáticas">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIconWrap}>
          <Clock size={18} />
        </div>
        <div className={styles.sectionHeaderText}>
          <h3>Tareas automáticas</h3>
          <p>
            {jobs.length} tareas · {conProblemas} con problemas
          </p>
        </div>
      </div>

      {!loading && !schedulerActivo && (
        <div className={styles.avisoApagado} role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Las tareas automáticas están apagadas en este servidor.</span>
        </div>
      )}

      {loading ? (
        <AdminTareasSkeleton />
      ) : error ? (
        <EmptyState
          variant="compact"
          icon={Clock}
          title={error}
          actionLabel="Reintentar"
          onActionClick={handleReintentar}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={Clock}
          title="No hay tareas registradas."
        />
      ) : (
        <>
          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Tarea</th>
                  <th className={styles.th}>Última vez</th>
                  <th className={styles.th}>Próxima</th>
                  <th className={styles.th}>Estado</th>
                  <th className={`${styles.th} ${styles.thRight}`} />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const abierto = Boolean(detallesAbiertos[job.job_id])
                  const falloUltima = job.ultima_corrida?.resultado === 'error'
                  return (
                    <React.Fragment key={job.job_id}>
                      <tr className={styles.tableRow}>
                        <td className={styles.td}>
                          <div className={styles.jobTitle}>{job.nombre}</div>
                          <div className={styles.jobDesc}>{job.que_hace}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.ultimaTime}>
                            {tiempoRelativo(job.ultima_corrida?.inicio ?? null, ahora)}
                          </div>
                          {job.ultima_corrida?.resultado === 'ok' && (
                            <div className={styles.ultimaSub}>
                              Bien · {job.ultima_corrida.duracion_ms} ms
                            </div>
                          )}
                          {job.ultima_corrida?.resultado === 'omitido' && (
                            <div className={styles.ultimaSub}>Omitido</div>
                          )}
                          {falloUltima && (
                            <div className={styles.falloInline}>
                              <span className={styles.falloTexto}>Falló</span>
                              <button
                                type="button"
                                className={styles.motivoBtn}
                                aria-expanded={abierto}
                                onClick={() => toggleDetalle(job.job_id)}
                              >
                                {abierto ? 'Ocultar motivo' : 'Ver motivo'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className={`${styles.td} ${styles.numCell}`}>
                          {tiempoHasta(job.proxima_corrida ?? null, ahora)}
                        </td>
                        <td className={styles.td}>
                          <div className={styles.estadoInline}>
                            <span
                              className={`${styles.statusDot} ${dotClaseEstado(job.estado)}`}
                              aria-hidden="true"
                            />
                            <span>{job.estado}</span>
                          </div>
                          {job.errores_24h > 0 && (
                            <div className={styles.erroresSub}>
                              {job.errores_24h === 1
                                ? '1 error en 24 h'
                                : `${job.errores_24h} errores en 24 h`}
                            </div>
                          )}
                        </td>
                        <td className={`${styles.td} ${styles.tdRight}`}>
                          {job.puede_correr_ahora && (
                            <Button
                              type="button"
                              variant="secondary"
                              loading={corriendoJobId === job.job_id}
                              disabled={!schedulerActivo || Boolean(corriendoJobId)}
                              onClick={() => void handleCorrerJob(job.job_id)}
                            >
                              Correr ahora
                            </Button>
                          )}
                        </td>
                      </tr>
                      {falloUltima && abierto && (
                        <tr className={styles.detalleRow}>
                          <td colSpan={5} className={styles.detalleCell}>
                            <div className={styles.detalleBox}>
                              {job.ultima_corrida?.detalle || 'Sin detalle registrado.'}
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

          <div className={styles.mobileList}>
            {jobs.map((job) => {
              const abierto = Boolean(detallesAbiertos[job.job_id])
              const falloUltima = job.ultima_corrida?.resultado === 'error'
              return (
                <div key={job.job_id} className={styles.mobileCard}>
                  <div className={styles.mobileTop}>
                    <div className={styles.mobileTitleCol}>
                      <div className={styles.jobTitle}>{job.nombre}</div>
                      <div className={styles.jobDesc}>{job.que_hace}</div>
                    </div>
                    <span className={styles.estadoInline}>
                      <span
                        className={`${styles.statusDot} ${dotClaseEstado(job.estado)}`}
                        aria-hidden="true"
                      />
                      <span>{job.estado}</span>
                    </span>
                  </div>

                  <div className={styles.mobileRows}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Última vez</span>
                      <div className={styles.mobileValCol}>
                        <span>{tiempoRelativo(job.ultima_corrida?.inicio ?? null, ahora)}</span>
                        {job.ultima_corrida?.resultado === 'ok' && (
                          <span className={styles.ultimaSub}>
                            Bien · {job.ultima_corrida.duracion_ms} ms
                          </span>
                        )}
                        {falloUltima && (
                          <div className={styles.falloInline}>
                            <span className={styles.falloTexto}>Falló</span>
                            <button
                              type="button"
                              className={styles.motivoBtn}
                              aria-expanded={abierto}
                              onClick={() => toggleDetalle(job.job_id)}
                            >
                              {abierto ? 'Ocultar motivo' : 'Ver motivo'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {falloUltima && abierto && (
                      <div className={styles.detalleBox}>
                        {job.ultima_corrida?.detalle || 'Sin detalle registrado.'}
                      </div>
                    )}

                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Próxima</span>
                      <span className={styles.numCell}>
                        {tiempoHasta(job.proxima_corrida ?? null, ahora)}
                      </span>
                    </div>

                    {job.errores_24h > 0 && (
                      <div className={styles.erroresSub}>
                        {job.errores_24h === 1
                          ? '1 error en 24 h'
                          : `${job.errores_24h} errores en 24 h`}
                      </div>
                    )}
                  </div>

                  {job.puede_correr_ahora && (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      loading={corriendoJobId === job.job_id}
                      disabled={!schedulerActivo || Boolean(corriendoJobId)}
                      onClick={() => void handleCorrerJob(job.job_id)}
                    >
                      Correr ahora
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default SchedulerPanel
