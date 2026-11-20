import React, { useEffect, useState } from 'react'
import { sileo } from 'sileo'
import { ScrollText } from 'lucide-react'
import { Button, EmptyState, SelectInput, type SelectOption } from '@/components/ui'
import { AdminRegistroSkeleton } from '@/components/ui'
import adminService from '@/services/adminService'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatearFechaHoraAr, rangoPagina } from '@/utils/admin'
import type { PaginatedRegistroAdmin } from '@/types/admin'
import styles from './RegistroPanel.module.css'

interface RegistroPanelProps {
  refreshKey: number
}

const OPCIONES_ACCION: SelectOption[] = [
  { value: '', label: 'Todas las acciones' },
  { value: 'suspender', label: 'Suspendió la cuenta' },
  { value: 'reactivar', label: 'Reactivó la cuenta' },
  { value: 'mail_contrasena', label: 'Mandó el mail para cambiar la contraseña' },
  { value: 'cerrar_sesiones', label: 'Cerró las sesiones' },
  { value: 'desconectar_whatsapp', label: 'Desconectó WhatsApp' },
  { value: 'hacer_admin', label: 'Le dio permisos de admin' },
  { value: 'quitar_admin', label: 'Le quitó los permisos de admin' },
  { value: 'eliminar_cuenta', label: 'Eliminó la cuenta' },
  { value: 'correr_tarea', label: 'Corrió una tarea a mano' },
  { value: 'verificacion_fallida', label: 'No pudo confirmar su identidad' },
]

export const RegistroPanel: React.FC<RegistroPanelProps> = ({ refreshKey }) => {
  const [accionFiltro, setAccionFiltro] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedRegistroAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadSeq, setReloadSeq] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    adminService
      .getRegistro({ page, limit: 20, accion: accionFiltro || undefined }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return
        setError(null)
        setData(res.data)
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
  }, [page, accionFiltro, refreshKey, reloadSeq])

  const handleReintentar = () => {
    setLoading(true)
    setError(null)
    setReloadSeq((n) => n + 1)
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <section className={styles.sectionCard} aria-label="Registro de acciones">
      <div className={styles.headerRow}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <ScrollText size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Registro de acciones</h3>
            <p>Historial de cambios realizados en el panel</p>
          </div>
        </div>

        <div className={styles.filterWrap}>
          <label htmlFor="admin-registro-filtro-accion" className={styles.srOnly}>
            Filtrar por acción
          </label>
          <SelectInput
            id="admin-registro-filtro-accion"
            value={accionFiltro}
            onChange={(val) => {
              setLoading(true)
              setAccionFiltro(val)
              setPage(1)
            }}
            options={OPCIONES_ACCION}
          />
        </div>
      </div>

      {loading ? (
        <AdminRegistroSkeleton />
      ) : error ? (
        <EmptyState
          variant="compact"
          icon={ScrollText}
          title={error}
          actionLabel="Reintentar"
          onActionClick={handleReintentar}
        />
      ) : items.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={ScrollText}
          title="Todavía no hay acciones registradas."
        />
      ) : (
        <>
          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Cuándo</th>
                  <th className={styles.th}>Quién</th>
                  <th className={styles.th}>Qué hizo</th>
                  <th className={styles.th}>A quién</th>
                  <th className={styles.th}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.fecha}-${item.accion}-${idx}`} className={styles.tableRow}>
                    <td className={`${styles.td} ${styles.numCell}`}>
                      {formatearFechaHoraAr(item.fecha)}
                    </td>
                    <td className={styles.td}>{item.admin}</td>
                    <td className={styles.td}>{item.accion_texto}</td>
                    <td className={styles.td}>{item.usuario || '—'}</td>
                    <td className={`${styles.td} ${styles.detalleText}`}>{item.detalle || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {items.map((item, idx) => (
              <div key={`${item.fecha}-${item.accion}-${idx}`} className={styles.mobileItem}>
                <div className={styles.mobileMain}>
                  {item.admin} · {item.accion_texto}
                </div>
                <div className={styles.mobileSub}>
                  {item.usuario || '—'} · {formatearFechaHoraAr(item.fecha)}
                </div>
                {item.detalle && <div className={styles.mobileDetalle}>{item.detalle}</div>}
              </div>
            ))}
          </div>

          <div className={styles.paginationFooter}>
            <span className={styles.rangeText}>{rangoPagina(page, 20, total)}</span>
            <div className={styles.paginationBtns}>
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true)
                  setPage(page - 1)
                }}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pages}
                onClick={() => {
                  setLoading(true)
                  setPage(page + 1)
                }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default RegistroPanel
