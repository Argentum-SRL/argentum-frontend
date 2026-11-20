import React, { useEffect, useState } from 'react'
import {
  AdminUsuariosListaSkeleton,
  AyudaBoton,
  Button,
  EmptyState,
  Input,
  SelectInput,
  type SelectOption,
} from '@/components/ui'
import { ChevronRight, Search, Users } from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import {
  AYUDA_COSTO_ESTIMADO,
  estadoVisual,
  formatearCantidad,
  rangoPagina,
  type TonoEstadoAdmin,
} from '@/utils/admin'
import type {
  EstadoVisibleAdmin,
  FiltrosAdmin,
  OrdenUsuariosAdmin,
  PaginatedUsuarios,
  UsuarioAdminResumen,
} from '@/types/admin'
import AvatarUsuario from './AvatarUsuario'
import styles from './UsuariosPanel.module.css'

interface UsuariosListaProps {
  data: PaginatedUsuarios | null
  loading: boolean
  error: string | null
  search: string
  estado: FiltrosAdmin['estado']
  orden: OrdenUsuariosAdmin
  selectedId: string | null
  onSearchChange: (val: string) => void
  onEstadoChange: (val: NonNullable<FiltrosAdmin['estado']>) => void
  onOrdenChange: (val: OrdenUsuariosAdmin) => void
  onLimpiarFiltros: () => void
  onPageChange: (page: number) => void
  onSelect: (id: string) => void
  onRetry: () => void
}

const OPCIONES_ORDEN: SelectOption[] = [
  { value: 'ultimo_uso', label: 'Último uso' },
  { value: 'movimientos', label: 'Más movimientos' },
  { value: 'costo_mes', label: 'Mayor costo' },
  { value: 'registro', label: 'Más nuevos' },
]

function nombreUsuario(u: UsuarioAdminResumen): string {
  const full = [u.nombre, u.apellido].filter(Boolean).join(' ').trim()
  return full || u.email || 'Sin nombre'
}

function claseDotTono(tono: TonoEstadoAdmin): string {
  switch (tono) {
    case 'bien':
      return styles.dotBien
    case 'info':
      return styles.dotInfo
    case 'mal':
      return styles.dotMal
    case 'apagado':
      return styles.dotApagado
    case 'aviso':
    default:
      return styles.dotAviso
  }
}

function PuntoEstado({ estado }: { estado: EstadoVisibleAdmin }) {
  const { texto, tono } = estadoVisual(estado)
  return (
    <span className={styles.estadoInline}>
      <span className={`${styles.statusDot} ${claseDotTono(tono)}`} aria-hidden="true" />
      <span>{texto}</span>
    </span>
  )
}

export const UsuariosLista: React.FC<UsuariosListaProps> = ({
  data,
  loading,
  error,
  search,
  estado,
  orden,
  selectedId,
  onSearchChange,
  onEstadoChange,
  onOrdenChange,
  onLimpiarFiltros,
  onPageChange,
  onSelect,
  onRetry,
}) => {
  const [esPantallaChica, setEsPantallaChica] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 479px)')
    const sync = () => setEsPantallaChica(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const conteos = data?.conteos_estado
  const opcionesEstado: SelectOption[] = [
    { value: '', label: conteos ? `Todos (${conteos.todos})` : 'Todos' },
    { value: 'activo', label: conteos ? `Activos (${conteos.activo})` : 'Activos' },
    { value: 'nuevo', label: conteos ? `Nuevos (${conteos.nuevo})` : 'Nuevos' },
    { value: 'poco_uso', label: conteos ? `Poco uso (${conteos.poco_uso})` : 'Poco uso' },
    { value: 'en_desuso', label: conteos ? `En desuso (${conteos.en_desuso})` : 'En desuso' },
    { value: 'sin_empezar', label: conteos ? `Sin empezar (${conteos.sin_empezar})` : 'Sin empezar' },
    { value: 'suspendida', label: conteos ? `Suspendidas (${conteos.suspendida})` : 'Suspendidas' },
    {
      value: 'sin_verificar',
      label: conteos ? `Mail sin verificar (${conteos.sin_verificar})` : 'Mail sin verificar',
    },
  ]

  const hayFiltrosActivos = Boolean(search.trim() || estado)
  const total = data?.total ?? 0
  const page = data?.page ?? 1
  const limit = data?.limit ?? 20
  const pages = data?.pages ?? 1
  const usuarios = data?.usuarios ?? []

  return (
    <section className={`${styles.sectionCard} ${styles.listaCard}`} aria-label="Lista de usuarios">
      <div className={styles.filtersBox}>
        <Input
          icon={<Search size={16} />}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={esPantallaChica ? 'Buscar' : 'Buscar por nombre, email o teléfono'}
          aria-label="Buscar usuarios"
        />

        <div className={styles.selectsGrid}>
          <div>
            <label htmlFor="admin-filtro-estado" className={styles.srOnly}>
              Estado
            </label>
            <SelectInput
              id="admin-filtro-estado"
              value={estado ?? ''}
              onChange={(v) => onEstadoChange(v as NonNullable<FiltrosAdmin['estado']>)}
              options={opcionesEstado}
            />
          </div>

          <div>
            <label htmlFor="admin-filtro-orden" className={styles.srOnly}>
              Orden
            </label>
            <SelectInput
              id="admin-filtro-orden"
              value={orden}
              onChange={(v) => onOrdenChange(v as OrdenUsuariosAdmin)}
              options={OPCIONES_ORDEN}
            />
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className={styles.clearFiltersRow}>
            <Button type="button" variant="ghost" onClick={onLimpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <AdminUsuariosListaSkeleton />
      ) : error ? (
        <EmptyState
          variant="compact"
          icon={Users}
          title={error}
          actionLabel="Reintentar"
          onActionClick={onRetry}
        />
      ) : usuarios.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={Users}
          title="No hay usuarios para mostrar"
          description={
            hayFiltrosActivos
              ? 'Probá sacando alguno de los filtros o buscando con otro texto.'
              : 'Todavía no hay cuentas registradas.'
          }
          actionLabel={hayFiltrosActivos ? 'Limpiar filtros' : undefined}
          onActionClick={hayFiltrosActivos ? onLimpiarFiltros : undefined}
        />
      ) : (
        <>
          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col />
                <col className={styles.colEstado} />
                <col className={styles.colMov} />
                <col className={styles.colCosto} />
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.th}>Usuario</th>
                  <th className={styles.th}>Estado</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Movimientos del mes</th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    <span className={styles.thWithHelp}>
                      <span>Costo estimado</span>
                      <AyudaBoton
                        titulo={AYUDA_COSTO_ESTIMADO.titulo}
                        texto={AYUDA_COSTO_ESTIMADO.texto}
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const selected = selectedId === u.id
                  return (
                    <tr
                      key={u.id}
                      tabIndex={0}
                      aria-selected={selected}
                      className={`${styles.tableRow} ${selected ? styles.tableRowSelected : ''}`}
                      onClick={() => onSelect(u.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelect(u.id)
                        }
                      }}
                    >
                      <td className={`${styles.td} ${styles.firstCell}`}>
                        <div className={styles.userCell}>
                          <AvatarUsuario
                            fotoUrl={u.foto_url}
                            nombre={u.nombre}
                            apellido={u.apellido}
                            email={u.email}
                            tamano={32}
                          />
                          <div className={styles.userText}>
                            <span className={styles.userName}>
                              {nombreUsuario(u)}
                              {u.is_admin && <span className={styles.adminText}> · Admin</span>}
                            </span>
                            <span className={styles.userEmail}>{u.email || 'Sin email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <PuntoEstado estado={u.estado_visible} />
                      </td>
                      <td className={`${styles.td} ${styles.tdRight} ${styles.numCell}`}>
                        {formatearCantidad(u.movimientos_mes)}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight} ${styles.numCell}`}>
                        {formatMonto(u.costo_mes_ars, 'ARS')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {usuarios.map((u) => {
              const selected = selectedId === u.id
              const movTexto =
                u.movimientos_mes === 1
                  ? '1 movimiento'
                  : `${formatearCantidad(u.movimientos_mes)} movimientos`
              return (
                <button
                  key={u.id}
                  type="button"
                  aria-selected={selected}
                  className={`${styles.mobileRow} ${selected ? styles.mobileRowSelected : ''}`}
                  onClick={() => onSelect(u.id)}
                >
                  <AvatarUsuario
                    fotoUrl={u.foto_url}
                    nombre={u.nombre}
                    apellido={u.apellido}
                    email={u.email}
                    tamano={40}
                  />
                  <div className={styles.mobileRowInfo}>
                    <span className={styles.userName}>
                      {nombreUsuario(u)}
                      {u.is_admin && <span className={styles.adminText}> · Admin</span>}
                    </span>
                    <div className={styles.mobileMeta}>
                      <span className={styles.metaPieza}>
                        <PuntoEstado estado={u.estado_visible} />
                      </span>
                      <span className={styles.metaPieza}>{movTexto}</span>
                      <span className={styles.metaPieza}>{formatMonto(u.costo_mes_ars, 'ARS')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={styles.mobileChevron} aria-hidden="true" />
                </button>
              )
            })}
          </div>

          <div className={styles.paginationFooter}>
            <span className={styles.rangeText}>{rangoPagina(page, limit, total)}</span>
            <div className={styles.paginationBtns}>
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pages}
                onClick={() => onPageChange(page + 1)}
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

export default UsuariosLista
