import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { Notificacion, ConfiguracionNotificacion } from '@/types'
import notificacionService from '@/services/notificacion.service'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
import { NotificacionContext, type DataUpdateEvent } from './NotificacionContextBase'
import { limpiarMensajeNotificacion } from '@/utils/notificacion.utils'
import {
  esRegresoLargo,
  registrarIdsConocidos,
  sonarAlEntrar,
  sonarPendiente,
  sonarPorAvisosNuevos,
  type AlmacenSimple,
  type DependenciasSonido,
  type ResultadoSonido,
  type SonidoPendiente,
} from '@/utils/sonidoAvisos'
import {
  alDesbloquear,
  instalarDesbloqueo,
  reproducirAviso,
} from '@/services/reproductorAvisos'

// Obtiene localStorage de forma segura (null si no está disponible o bloqueado).
function obtenerAlmacenSeguro(): AlmacenSimple | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}


export function NotificacionProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [config, setConfig] = useState<ConfiguracionNotificacion | null>(null)
  const [lastDataUpdate, setLastDataUpdate] = useState<DataUpdateEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuth()

  const unreadCountRef = useRef(unreadCount)
  const isAuthenticatedRef = useRef(isAuthenticated)
  const pendienteRef = useRef<SonidoPendiente | null>(null)
  const ocultoDesdeRef = useRef<number | null>(null)
  const revisandoRef = useRef(false)
  const sseConectadoAntesRef = useRef(false)

  const dependenciasSonido = useMemo<DependenciasSonido>(
    () => ({
      almacen: obtenerAlmacenSeguro(),
      ahora: Date.now,
      reproducir: reproducirAviso,
    }),
    []
  )

  useEffect(() => {
    unreadCountRef.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
    if (!isAuthenticated) {
      pendienteRef.current = null
      ocultoDesdeRef.current = null
      sseConectadoAntesRef.current = false
    }
  }, [isAuthenticated])

  // Instala el desbloqueo de audio al montar (sin depender de la sesión, incluso en el login).
  useEffect(() => {
    const limpiarDesbloqueo = instalarDesbloqueo()
    const limpiarAlDesbloquear = alDesbloquear(() => {
      if (isAuthenticatedRef.current) {
        void sonarPendiente(dependenciasSonido, pendienteRef.current, unreadCountRef.current)
      }
      pendienteRef.current = null
    })

    return () => {
      limpiarAlDesbloquear()
      limpiarDesbloqueo()
    }
  }, [dependenciasSonido])

  if (!isAuthenticated && (notificaciones.length > 0 || unreadCount !== 0 || config !== null || lastDataUpdate !== null)) {
    setNotificaciones([])
    setUnreadCount(0)
    setConfig(null)
    setLastDataUpdate(null)
  }


  const fetchNotifications = useCallback(async (signal?: AbortSignal): Promise<Notificacion[] | null> => {
    if (!isAuthenticated) return null
    setIsLoading(true)
    try {
      const data = await notificacionService.list({ solo_no_leidas: false }, signal)
      const limpias = data.map((n) => ({ ...n, mensaje: limpiarMensajeNotificacion(n.mensaje) }))
      setNotificaciones(limpias)
      return limpias
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) return null
      console.error('Error fetching notifications:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchUnreadCount = useCallback(async (signal?: AbortSignal): Promise<number | null> => {
    if (!isAuthenticated) return null
    try {
      const count = await notificacionService.getContador(signal)
      unreadCountRef.current = count
      setUnreadCount(count)
      return count
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) return null
      console.error('Error fetching unread count:', error)
      return null
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
      sileo.success({ title: 'Preferencia de notificaciones guardada' })
    } catch (error) {
      console.error('Error updating notifications config:', error)
      sileo.error({ title: 'Error al guardar configuración' })
    }
  }, [])

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
      sileo.success({ title: `Notificación silenciada por ${horas} horas` })
    } catch (error) {
      console.error('Error silencing notification:', error)
    }
  }, [notificaciones])

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
      sileo.error({ title: 'No se puede eliminar esta notificación' })
    }
  }, [notificaciones])

  const marcarTodasLeidas = useCallback(async () => {
    try {
      await notificacionService.marcarTodasLeidas()
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setUnreadCount(0)
      sileo.success({ title: 'Todas las notificaciones marcadas como leídas' })
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  // Evalúa avisos nuevos y agenda un sonido pendiente si quedó bloqueado por autoplay.
  const reproducirSiSonNuevos = useCallback(
    async (ids: string[]): Promise<ResultadoSonido> => {
      const resultado = await sonarPorAvisosNuevos(dependenciasSonido, ids)
      if (resultado === 'bloqueado') {
        pendienteRef.current = { pedidoEn: dependenciasSonido.ahora(), tipo: 'nuevo' }
      }
      return resultado
    },
    [dependenciasSonido]
  )

  // Consulta la lista y el contador al volver a la pestaña o al reconectar el SSE.
  const revisarNovedades = useCallback(async () => {
    if (!isAuthenticated || revisandoRef.current) return
    revisandoRef.current = true
    try {
      const anterior = ocultoDesdeRef.current
      ocultoDesdeRef.current = null

      const [lista, contador] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ])
      if (!isAuthenticatedRef.current || lista === null || contador === null) {
        return
      }

      const idsNoLeidos = lista.filter((n) => !n.leida).map((n) => n.id)
      const resultadoNuevos = await reproducirSiSonNuevos(idsNoLeidos)

      if (
        resultadoNuevos === 'no' &&
        esRegresoLargo(anterior, dependenciasSonido.ahora())
      ) {
        const resultadoEntrada = await sonarAlEntrar(dependenciasSonido, contador)
        if (resultadoEntrada === 'bloqueado') {
          pendienteRef.current = { pedidoEn: dependenciasSonido.ahora(), tipo: 'entrada' }
        }
      }

      registrarIdsConocidos(
        dependenciasSonido,
        lista.map((n) => n.id)
      )
    } finally {
      revisandoRef.current = false
    }
  }, [
    isAuthenticated,
    dependenciasSonido,
    fetchNotifications,
    fetchUnreadCount,
    reproducirSiSonNuevos,
  ])

  // Carga inicial al autenticar
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const controller = new AbortController()
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return
      void fetchConfig(controller.signal)
      const [lista, contador] = await Promise.all([
        fetchNotifications(controller.signal),
        fetchUnreadCount(controller.signal),
      ])
      if (controller.signal.aborted || !isAuthenticatedRef.current) return

      if (lista !== null) {
        registrarIdsConocidos(
          dependenciasSonido,
          lista.map((n) => n.id)
        )
      }
      if (contador !== null) {
        const resultado = await sonarAlEntrar(dependenciasSonido, contador)
        if (!controller.signal.aborted && isAuthenticatedRef.current && resultado === 'bloqueado') {
          pendienteRef.current = { pedidoEn: dependenciasSonido.ahora(), tipo: 'entrada' }
        }
      }
    })

    return () => {
      controller.abort()
    }
  }, [isAuthenticated, dependenciasSonido, fetchNotifications, fetchUnreadCount, fetchConfig])

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
          if (!data || typeof data !== 'object') return

          if (data.event === 'connected') {
            if (sseConectadoAntesRef.current) {
              void revisarNovedades()
            }
            sseConectadoAntesRef.current = true
            return
          }

          if (data.event === 'data_update') {
            setLastDataUpdate({
              entidad: data.entidad,
              timestamp: Date.now()
            })
            return
          }

          // Ignoramos sesiones revocadas o mensajes sin id ni tipo para no sumar filas, contadores, toasts ni sonido vacíos.
          if (data.event === 'revoked' || !data.id || !data.tipo) {
            return
          }

          const rawNotif = data as Notificacion
          const newNotif: Notificacion = {
            ...rawNotif,
            mensaje: limpiarMensajeNotificacion(rawNotif.mensaje),
          }

          setNotificaciones((prev) => {
            // Evitar duplicados
            if (prev.some((n) => n.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })

          setUnreadCount((prev) => prev + 1)
          unreadCountRef.current = unreadCountRef.current + 1

          // Decidir el tipo de toast
          if (
            newNotif.nivel === 'CRITICA' || 
            ['PRESUPUESTO_AGOTADO', 'SALDO_CERO', 'GASTO_INUSUAL'].includes(newNotif.tipo)
          ) {
            sileo.error({ title: newNotif.mensaje })
          } else if (
            newNotif.nivel === 'FINANCIERA_IMPORTANTE' ||
            ['PRESUPUESTO_LIMITE', 'CUOTA_VENCE', 'SUSCRIPCION_HOY', 'PROYECCION_NEGATIVA'].includes(newNotif.tipo)
          ) {
            sileo.warning({ title: newNotif.mensaje })
          } else if (
            newNotif.nivel === 'FINANCIERA_INFORMATIVA' ||
            ['RESUMEN_SEMANAL', 'RESUMEN_CICLO'].includes(newNotif.tipo)
          ) {
            sileo.info({ title: newNotif.mensaje })
          } else {
            sileo.success({ title: newNotif.mensaje })
          }

          // Acompaña el aviso visual con el sonido corto si no se reprodujo ya en otra pestaña.
          void reproducirSiSonNuevos([newNotif.id])
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
      sseConectadoAntesRef.current = false
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [isAuthenticated, revisarNovedades, reproducirSiSonNuevos])

  // Detecta el paso a segundo plano y revisa avisos nuevos o regresos largos al volver a la pestaña/app.
  useEffect(() => {
    if (!isAuthenticated || typeof document === 'undefined') return

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') {
        ocultoDesdeRef.current = dependenciasSonido.ahora()
      } else if (document.visibilityState === 'visible') {
        void revisarNovedades()
      }
    }

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [isAuthenticated, dependenciasSonido, revisarNovedades])

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
