import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Notificacion, ConfiguracionNotificacion } from '@/types'
import notificacionService from '@/services/notificacion.service'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { NotificacionContext, type DataUpdateEvent } from './NotificacionContextBase'


export function NotificacionProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [config, setConfig] = useState<ConfiguracionNotificacion | null>(null)
  const [lastDataUpdate, setLastDataUpdate] = useState<DataUpdateEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  if (!isAuthenticated && (notificaciones.length > 0 || unreadCount !== 0 || config !== null || lastDataUpdate !== null)) {
    setNotificaciones([])
    setUnreadCount(0)
    setConfig(null)
    setLastDataUpdate(null)
  }


  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const data = await notificacionService.list({ solo_no_leidas: false }, signal)
      setNotificaciones(data)
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) return
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchUnreadCount = useCallback(async (signal?: AbortSignal) => {
    if (!isAuthenticated) return
    try {
      const count = await notificacionService.getContador(signal)
      setUnreadCount(count)
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) return
      console.error('Error fetching unread count:', error)
    }
  }, [isAuthenticated])

  const fetchConfig = useCallback(async (signal?: AbortSignal) => {
    if (!isAuthenticated) return
    try {
      const data = await notificacionService.getConfig(signal)
      setConfig(data)
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) return
      console.error('Error fetching notifications config:', error)
    }
  }, [isAuthenticated])

  const updateConfig = useCallback(async (payload: Partial<ConfiguracionNotificacion>) => {
    try {
      const updated = await notificacionService.updateConfig(payload)
      setConfig(updated)
      showToast('Preferencia de notificaciones guardada', 'success')
    } catch (error) {
      console.error('Error updating notifications config:', error)
      showToast('Error al guardar configuración', 'error')
    }
  }, [showToast])

  const marcarLeida = useCallback(async (id: string) => {
    try {
      await notificacionService.marcarLeida(id)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  const marcarNoLeida = useCallback(async (id: string) => {
    try {
      await notificacionService.marcarNoLeida(id)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: false } : n))
      )
      setUnreadCount((prev) => prev + 1)
    } catch (error) {
      console.error('Error marking as unread:', error)
    }
  }, [])

  const silenciar = useCallback(async (id: string, horas = 24) => {
    try {
      const notif = notificaciones.find((n) => n.id === id)
      await notificacionService.silenciar(id, horas)
      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
      if (notif && !notif.leida) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      showToast(`Notificación silenciada por ${horas} horas`, 'success')
    } catch (error) {
      console.error('Error silencing notification:', error)
    }
  }, [notificaciones, showToast])

  const eliminar = useCallback(async (id: string) => {
    try {
      const notif = notificaciones.find((n) => n.id === id)
      await notificacionService.delete(id)
      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
      if (notif && !notif.leida) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      showToast('No se puede eliminar esta notificación', 'error')
    }
  }, [notificaciones, showToast])

  const marcarTodasLeidas = useCallback(async () => {
    try {
      await notificacionService.marcarTodasLeidas()
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setUnreadCount(0)
      showToast('Todas las notificaciones marcadas como leídas', 'success')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [showToast])

  // Carga inicial al autenticar
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        fetchNotifications(controller.signal)
        fetchUnreadCount(controller.signal)
        fetchConfig(controller.signal)
      }
    })

    return () => {
      controller.abort()
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount, fetchConfig])

  // Conexión SSE
  useEffect(() => {
    if (!isAuthenticated) return

    let eventSource: EventSource | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connectSSE = () => {
      const baseUrl = import.meta.env.VITE_API_URL || '/api'
      const sseUrl = baseUrl.startsWith('http')
        ? `${baseUrl}/notificaciones/sse`
        : `${window.location.origin}${baseUrl}/notificaciones/sse`

      eventSource = new EventSource(sseUrl, { withCredentials: true })

      eventSource.onmessage = (event) => {
        try {
          if (event.data === ': ping') return
          const data = JSON.parse(event.data)
          if (data.event === 'connected') return

          if (data.event === 'data_update') {
            setLastDataUpdate({
              entidad: data.entidad,
              timestamp: Date.now()
            })
            return
          }

          const newNotif = data as Notificacion

          setNotificaciones((prev) => {
            // Evitar duplicados
            if (prev.some((n) => n.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })

          setUnreadCount((prev) => prev + 1)

          // Decidir el tipo de toast
          const isCritical = newNotif.nivel === 'CRITICA' || 
                             ['PRESUPUESTO_AGOTADO', 'SALDO_CERO', 'GASTO_INUSUAL'].includes(newNotif.tipo)
          const toastType = isCritical ? 'error' : 'success'
          showToast(newNotif.mensaje, toastType)
        } catch (err) {
          console.error('Error parsing SSE event:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE connection error, reconnecting...', err)
        if (eventSource) {
          eventSource.close()
        }
        reconnectTimeout = setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [isAuthenticated, showToast])

  const contextValue = useMemo(
    () => ({
      notificaciones,
      unreadCount,
      config,
      lastDataUpdate,
      isLoading,
      fetchNotifications,
      fetchUnreadCount,
      fetchConfig,
      updateConfig,
      marcarLeida,
      marcarNoLeida,
      silenciar,
      eliminar,
      marcarTodasLeidas,
    }),
    [
      notificaciones,
      unreadCount,
      config,
      lastDataUpdate,
      isLoading,
      fetchNotifications,
      fetchUnreadCount,
      fetchConfig,
      updateConfig,
      marcarLeida,
      marcarNoLeida,
      silenciar,
      eliminar,
      marcarTodasLeidas,
    ]
  )

  return (
    <NotificacionContext.Provider value={contextValue}>
      {children}
    </NotificacionContext.Provider>
  )
}
