import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { sileo } from 'sileo'
import { Users } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui'
import adminService from '@/services/adminService'
import { useViewport } from '@/hooks/useViewport'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  FiltrosAdmin,
  OrdenUsuariosAdmin,
  PaginatedUsuarios,
  UsuarioAdmin,
  UsuarioAdminResumen,
} from '@/types/admin'
import UsuariosLista from './UsuariosLista'
import UsuarioDetalle from './UsuarioDetalle'
import styles from './UsuariosPanel.module.css'

interface UsuariosPanelProps {
  selectedUserId: string | null
  refreshKey: number
  onSelectUser: (id: string | null) => void
  onStatsRefresh: () => void
}

function resumenDesdeDetalle(u: UsuarioAdmin): UsuarioAdminResumen {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono,
    auth_provider: u.auth_provider,
    is_active: u.is_active,
    is_admin: u.is_admin,
    onboarding_completado: u.onboarding_completado,
    whatsapp_vinculado: u.whatsapp_vinculado,
    created_at: u.created_at,
    ultima_actividad: u.ultima_actividad,
    foto_url: u.foto_url,
    estado_cuenta: u.estado_cuenta,
    estado_visible: u.estado_visible,
    movimientos_mes: u.movimientos_mes,
    ultimo_uso: u.ultimo_uso,
    ultimo_uso_canal: u.ultimo_uso_canal,
    costo_mes_ars: u.costo_mes_ars,
  }
}

export const UsuariosPanel: React.FC<UsuariosPanelProps> = ({
  selectedUserId,
  refreshKey,
  onSelectUser,
  onStatsRefresh,
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [estado, setEstado] = useState<NonNullable<FiltrosAdmin['estado']>>('')
  const [orden, setOrden] = useState<OrdenUsuariosAdmin>('ultimo_uso')
  const [page, setPage] = useState(1)
  const [reloadSeq, setReloadSeq] = useState(0)

  const [listaData, setListaData] = useState<PaginatedUsuarios | null>(null)
  const [loadingLista, setLoadingLista] = useState(true)
  const [errorLista, setErrorLista] = useState<string | null>(null)

  const [detalle, setDetalle] = useState<UsuarioAdmin | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)

  const scrollGuardadoRef = useRef(0)
  const eraDetalleMovilRef = useRef(false)
  const { esEscritorio: esDesktop } = useViewport()

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    adminService
      .getUsuarios(
        {
          page,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
          estado: estado || undefined,
          orden,
        },
        controller.signal
      )
      .then((res) => {
        if (controller.signal.aborted) return
        setErrorLista(null)
        setListaData(res.data)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const msg = getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.')
        setErrorLista(msg)
        sileo.error({ title: msg })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingLista(false)
        }
      })
    return () => controller.abort()
  }, [page, debouncedSearch, estado, orden, refreshKey, reloadSeq])

  const recargarDetalle = (id: string) => {
    setLoadingDetalle(true)
    setErrorDetalle(null)
    adminService
      .getUsuario(id)
      .then((res) => {
        setDetalle(res.data)
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.')
        setErrorDetalle(msg)
        sileo.error({ title: msg })
      })
      .finally(() => {
        setLoadingDetalle(false)
      })
  }

  useEffect(() => {
    if (!selectedUserId) {
      return
    }
    const controller = new AbortController()
    adminService
      .getUsuario(selectedUserId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return
        setErrorDetalle(null)
        setDetalle(res.data)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const msg = getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.')
        setErrorDetalle(msg)
        sileo.error({ title: msg })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDetalle(false)
        }
      })
    return () => controller.abort()
  }, [selectedUserId, refreshKey])

  useLayoutEffect(() => {
    const enDetalleMovil = !esDesktop && Boolean(selectedUserId)
    if (eraDetalleMovilRef.current && !enDetalleMovil) {
      window.scrollTo({ top: scrollGuardadoRef.current, behavior: 'auto' })
    } else if (!eraDetalleMovilRef.current && enDetalleMovil) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    eraDetalleMovilRef.current = enDetalleMovil
  }, [esDesktop, selectedUserId])

  const handleSelect = (id: string) => {
    if (!esDesktop) {
      scrollGuardadoRef.current = window.scrollY
    }
    setLoadingDetalle(true)
    setErrorDetalle(null)
    onSelectUser(id)
  }

  const handleLimpiarFiltros = () => {
    setLoadingLista(true)
    setSearchInput('')
    setDebouncedSearch('')
    setEstado('')
    setPage(1)
  }

  const handleUsuarioUpdated = (actualizado: UsuarioAdmin) => {
    setDetalle(actualizado)
    setListaData((prev) => {
      if (!prev) return prev
      const resumen = resumenDesdeDetalle(actualizado)
      return {
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === resumen.id ? resumen : u)),
      }
    })
    onStatsRefresh()
  }

  const handleUsuarioDeleted = () => {
    onSelectUser(null)
    setDetalle(null)
    setLoadingLista(true)
    setReloadSeq((n) => n + 1)
    onStatsRefresh()
  }

  const mostrarSoloDetalleMovil = !esDesktop && Boolean(selectedUserId)
  const detalleVisible = selectedUserId && detalle?.id === selectedUserId ? detalle : null

  return (
    <div className={styles.layout}>
      <div className={mostrarSoloDetalleMovil ? styles.hiddenMobile : styles.listaCol}>
        <UsuariosLista
          data={listaData}
          loading={loadingLista}
          error={errorLista}
          search={searchInput}
          estado={estado}
          orden={orden}
          selectedId={selectedUserId}
          onSearchChange={setSearchInput}
          onEstadoChange={(val) => {
            setLoadingLista(true)
            setEstado(val)
            setPage(1)
          }}
          onOrdenChange={(val) => {
            setLoadingLista(true)
            setOrden(val)
            setPage(1)
          }}
          onLimpiarFiltros={handleLimpiarFiltros}
          onPageChange={(nextPage) => {
            setLoadingLista(true)
            setPage(nextPage)
          }}
          onSelect={handleSelect}
          onRetry={() => {
            setLoadingLista(true)
            setReloadSeq((n) => n + 1)
          }}
        />
      </div>

      <div className={!esDesktop && !selectedUserId ? styles.hiddenMobile : styles.detalleCol}>
        {selectedUserId ? (
          <UsuarioDetalle
            usuario={detalleVisible}
            loading={loadingDetalle}
            error={errorDetalle}
            onBackMobile={() => onSelectUser(null)}
            onCloseDesktop={() => onSelectUser(null)}
            onRetry={() => recargarDetalle(selectedUserId)}
            onUsuarioUpdated={handleUsuarioUpdated}
            onUsuarioDeleted={handleUsuarioDeleted}
          />
        ) : (
          <div className={styles.sectionCard}>
            <EmptyState
              variant="compact"
              icon={Users}
              title="Elegí un usuario para ver su uso, su costo y qué podés hacer."
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default UsuariosPanel
