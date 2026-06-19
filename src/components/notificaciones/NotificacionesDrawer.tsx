import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  Check,
  Archive,
  Trash2,
  Clock,
  Settings,
  ShieldAlert,
  Calendar,
  PieChart,
  AlertTriangle,
  CreditCard,
  Target,
  Smile,
  ExternalLink,
  Info,
  X,
} from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import type { Notificacion, TipoNotificacion } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import { EmptyState } from '@/components/ui'
import NotificacionesConfigModal from './NotificacionesConfigModal'
import styles from './NotificacionesDrawer.module.css'

interface NotificacionesDrawerProps {
  open: boolean
  onClose: () => void
}

const NotificacionesDrawer: React.FC<NotificacionesDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const {
    notificaciones,
    unreadCount,
    isLoading,
    marcarLeida,
    marcarNoLeida,
    archivar,
    silenciar,
    eliminar,
    marcarTodasLeidas,
    archivarTodas,
  } = useNotificaciones()

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [activeSilenceId, setActiveSilenceId] = useState<string | null>(null)

  // Agrupar notificaciones por fecha
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notificacion[] } = {
      Hoy: [],
      Ayer: [],
      'Esta semana': [],
      'Más antiguas': [],
    }

    const hoy = new Date()
    const ayer = new Date()
    ayer.setDate(hoy.getDate() - 1)

    notificaciones.forEach((n) => {
      const d = new Date(n.created_at)
      if (d.toDateString() === hoy.toDateString()) {
        groups['Hoy'].push(n)
      } else if (d.toDateString() === ayer.toDateString()) {
        groups['Ayer'].push(n)
      } else {
        const diffTime = Math.abs(hoy.getTime() - d.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays <= 7) {
          groups['Esta semana'].push(n)
        } else {
          groups['Más antiguas'].push(n)
        }
      }
    })

    // Eliminar grupos vacíos
    return Object.keys(groups).reduce((acc, key) => {
      if (groups[key].length > 0) {
        acc[key] = groups[key]
      }
      return acc
    }, {} as { [key: string]: Notificacion[] })
  }, [notificaciones])

  // Icono según tipo de notificación
  const getIcon = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'CAMBIO_CONTRASENA':
      case 'INTENTOS_LOGIN_FALLIDOS':
      case 'NUEVO_DISPOSITIVO':
      case 'WHATSAPP_NUEVO_VINCULADO':
      case 'CAMBIO_EMAIL':
        return <ShieldAlert size={18} />
      case 'CUOTA_VENCE':
        return <Calendar size={18} />
      case 'PRESUPUESTO_AGOTADO':
      case 'PRESUPUESTO_LIMITE':
        return <PieChart size={18} />
      case 'SALDO_CERO':
      case 'GASTO_INUSUAL':
        return <AlertTriangle size={18} />
      case 'SUSCRIPCION_HOY':
      case 'SUSCRIPCION_PROXIMA':
        return <CreditCard size={18} />
      case 'META_ALCANZADA':
        return <Target size={18} />
      case 'INACTIVIDAD':
        return <Smile size={18} />
      default:
        return <Info size={18} />
    }
  }

  // Formatear hora local
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs'
  }

  const handleNotificationClick = async (n: Notificacion) => {
    if (!n.leida) {
      await marcarLeida(n.id)
    }
    if (n.deep_link) {
      navigate(n.deep_link)
      onClose()
    }
  }

  const handleSilenceClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSilenceId(activeSilenceId === id ? null : id)
  }

  const handleSelectSilence = async (id: string, horas: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await silenciar(id, horas)
    setActiveSilenceId(null)
  }

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        showHeader={false}
        noPadding
        size="md"
        ariaLabel="Notificaciones"
      >
        <div className={styles.formContainer}>
          {/* Cabecera con estética de TransaccionModal */}
          <div className={styles.formHeader}>
            <div className={styles.titleArea}>
              <h2 className={styles.headerTitle}>Notificaciones</h2>
              {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} no leídas</span>}
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.configBtn}
                onClick={() => setIsConfigOpen(true)}
                title="Configuración de notificaciones"
                aria-label="Configurar preferencias de notificación"
              >
                <Settings size={18} />
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                title="Cerrar"
                aria-label="Cerrar notificaciones"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Subcabecera para acciones masivas */}
          {notificaciones.length > 0 && (
            <div className={styles.actionsSubheader}>
              <button
                type="button"
                className={styles.actionTextBtn}
                onClick={marcarTodasLeidas}
                disabled={unreadCount === 0 || isLoading}
                title="Marcar todas como leídas"
              >
                <Check size={14} />
                Marcar leídas
              </button>
              <button
                type="button"
                className={styles.actionTextBtn}
                onClick={archivarTodas}
                disabled={notificaciones.length === 0 || isLoading}
                title="Archivar notificaciones no críticas"
              >
                <Archive size={14} />
                Archivar todas
              </button>
            </div>
          )}

          {/* Cuerpo del modal / Lista scrollable */}
          <div className={styles.formBody}>
            <div className={styles.scrollArea}>
              {isLoading && notificaciones.length === 0 ? (
                <div className={styles.list}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonCard} />
                  ))}
                </div>
              ) : notificaciones.length === 0 ? (
                <EmptyState
                  variant="compact"
                  icon={Bell}
                  title="Sin notificaciones"
                  description="Te mantendremos al tanto de tu actividad financiera y de seguridad cuando ocurra algo."
                />
              ) : (
                Object.entries(groupedNotifications).map(([groupName, items]) => (
                  <div key={groupName} className={styles.group}>
                    <h4 className={styles.groupTitle}>{groupName}</h4>
                    <div className={styles.list}>
                      {items.map((n) => (
                        <div
                          key={n.id}
                          className={`${styles.card} ${!n.leida ? styles.cardUnread : ''} ${
                            styles[`nivel${n.nivel}`]
                          } ${n.deep_link || !n.leida ? styles.cardClickable : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={styles.iconWrapper}>{getIcon(n.tipo)}</div>
                          <div className={styles.cardBody}>
                            <p className={styles.message}>{n.mensaje}</p>
                            <div className={styles.metaRow}>
                              <span className={styles.time}>{formatTime(n.created_at)}</span>
                              {n.deep_link && (
                                <span className={styles.link}>
                                  Ver detalle <ExternalLink size={10} />
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                            {!n.leida ? (
                              <button
                                type="button"
                                className={styles.btnAction}
                                onClick={() => marcarLeida(n.id)}
                                title="Marcar como leída"
                                aria-label="Marcar como leída"
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.btnAction}
                                onClick={() => marcarNoLeida(n.id)}
                                title="Marcar como no leída"
                                aria-label="Marcar como no leída"
                              >
                                <Bell size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.btnAction}
                              onClick={() => archivar(n.id)}
                              title="Archivar"
                              aria-label="Archivar notificación"
                            >
                              <Archive size={14} />
                            </button>
                            <div className={styles.relativeContainer}>
                              <button
                                type="button"
                                className={styles.btnAction}
                                onClick={(e) => handleSilenceClick(n.id, e)}
                                title="Silenciar temporalmente"
                                aria-label="Silenciar notificación"
                              >
                                <Clock size={14} />
                              </button>
                              {activeSilenceId === n.id && (
                                <div className={styles.silenceMenu}>
                                  <button
                                    type="button"
                                    className={styles.silenceOption}
                                    onClick={(e) => handleSelectSilence(n.id, 1, e)}
                                  >
                                    1 hora
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.silenceOption}
                                    onClick={(e) => handleSelectSilence(n.id, 24, e)}
                                  >
                                    24 horas
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.silenceOption}
                                    onClick={(e) => handleSelectSilence(n.id, 168, e)}
                                  >
                                    7 días
                                  </button>
                                </div>
                              )}
                            </div>
                            {n.nivel !== 'CRITICA' && (
                              <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnActionDanger}`}
                                onClick={() => eliminar(n.id)}
                                title="Eliminar"
                                aria-label="Eliminar notificación"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer del modal con estética de TransaccionModal */}
          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cerrar
            </button>
            <Link
              to="/app/configuracion?tab=notificaciones"
              className={styles.submitBtn}
              onClick={onClose}
            >
              Configurar preferencias
            </Link>
          </div>
        </div>
      </Modal>

      <NotificacionesConfigModal open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  )
}

export default NotificacionesDrawer
