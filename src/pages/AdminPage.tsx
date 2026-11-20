import React, { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layout, ScrollText } from 'lucide-react'
import { sileo } from 'sileo'
import { Clock, MessageSquare, RefreshCw, Users } from '@/components/ui/icons'
import {
  AdminSummaryBarSkeleton,
  Button,
  PageSummaryBar,
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui'
import adminService from '@/services/adminService'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatMonto } from '@/utils/format'
import type { AdminStats } from '@/types/admin'
import UsuariosPanel from './admin/usuarios/UsuariosPanel'
import MonitorWppPanel from './admin/components/MonitorWppPanel'
import SchedulerPanel from './admin/components/SchedulerPanel'
import RegistroPanel from './admin/registro/RegistroPanel'
import styles from './AdminPage.module.css'

type AdminTab = 'usuarios' | 'whatsapp' | 'tareas' | 'registro'

const TABS_VALIDOS: readonly AdminTab[] = ['usuarios', 'whatsapp', 'tareas', 'registro']

const OPCIONES_TABS: SegmentedControlOption<AdminTab>[] = [
  { value: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
  { value: 'whatsapp', label: 'WhatsApp\u00a0e\u00a0IA', icon: <MessageSquare size={16} /> },
  { value: 'tareas', label: 'Tareas', icon: <Clock size={16} /> },
  { value: 'registro', label: 'Registro', icon: <ScrollText size={16} /> },
]

function normalizarTab(raw: string | null): AdminTab {
  if (raw && (TABS_VALIDOS as readonly string[]).includes(raw)) {
    return raw as AdminTab
  }
  return 'usuarios'
}

export const AdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [esCelular, setEsCelular] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  const rawTab = normalizarTab(searchParams.get('tab'))
  const activeTab: AdminTab = esCelular ? 'usuarios' : rawTab
  const selectedUserId = activeTab === 'usuarios' ? searchParams.get('usuario') : null

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setEsCelular(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const cargarStats = useCallback(() => {
    adminService
      .getStats()
      .then((res) => {
        setStats(res.data)
      })
      .catch((err: unknown) => {
        sileo.error({
          title: getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.'),
        })
      })
      .finally(() => {
        setLoadingStats(false)
        setReloading(false)
      })
  }, [])

  useEffect(() => {
    let activo = true
    adminService
      .getStats()
      .then((res) => {
        if (activo) setStats(res.data)
      })
      .catch((err: unknown) => {
        if (activo) {
          sileo.error({
            title: getErrorMessage(err, 'No se pudieron cargar los datos. Probá de nuevo.'),
          })
        }
      })
      .finally(() => {
        if (activo) {
          setLoadingStats(false)
          setReloading(false)
        }
      })
    return () => {
      activo = false
    }
  }, [])

  const handleRefresh = () => {
    setReloading(true)
    setRefreshKey((k) => k + 1)
    if (!esCelular) {
      cargarStats()
    } else {
      setReloading(false)
    }
  }

  const handleTabChange = (nextTab: AdminTab) => {
    setSearchParams({ tab: nextTab })
  }

  const handleSelectUsuario = (id: string | null) => {
    if (id) {
      setSearchParams({ tab: 'usuarios', usuario: id })
    } else {
      setSearchParams({ tab: 'usuarios' })
    }
  }

  const summaryItems = stats
    ? [
        {
          label: 'Usuarios',
          value: String(stats.total),
          subValue: `+${stats.nuevos_7_dias} en 7 días`,
        },
        {
          label: 'Activos',
          value: String(stats.usaron_7_dias),
          subValue: `${stats.activos_pct}% del total`,
        },
        {
          label: 'En desuso',
          value: String(stats.en_desuso),
          subValue: 'más de 30 días sin usarla',
        },
        {
          label: 'Con WhatsApp',
          value: String(stats.whatsapp_vinculados),
          subValue: `de ${stats.total}`,
        },
        {
          label: 'Costo del mes',
          value: formatMonto(stats.costo_mes_ars, 'ARS'),
          subValue: stats.costo_mes_sin_dolar
            ? 'falta el dólar'
            : stats.costo_mes_fuente === 'openai'
              ? 'IA real y WhatsApp'
              : 'estimado',
        },
      ]
    : []

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Administración</h1>
          {!esCelular && <p className={styles.subtitle}>Usuarios, costos y tareas de Argentum</p>}
        </div>

        <div className={styles.headerActions}>
          {!esCelular && (
            <Link to="/diseño" className={styles.disenoLink}>
              <Layout size={16} />
              <span>Diseño</span>
            </Link>
          )}

          <Button
            type="button"
            variant="secondary"
            disabled={reloading}
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className={reloading ? styles.spinIcon : undefined} />
            <span>Actualizar</span>
          </Button>
        </div>
      </header>

      {!esCelular && (
        <>
          {loadingStats && !stats ? (
            <AdminSummaryBarSkeleton />
          ) : (
            stats && <PageSummaryBar items={summaryItems} />
          )}

          <div className={styles.tabsWrap}>
            <SegmentedControl<AdminTab>
              options={OPCIONES_TABS}
              value={activeTab}
              onChange={handleTabChange}
              layout="inline"
              ariaLabel="Secciones de administración"
            />
          </div>
        </>
      )}

      {(esCelular || activeTab === 'usuarios') && (
        <UsuariosPanel
          selectedUserId={selectedUserId}
          refreshKey={refreshKey}
          onSelectUser={handleSelectUsuario}
          onStatsRefresh={() => void cargarStats()}
        />
      )}

      {!esCelular && activeTab === 'whatsapp' && (
        <MonitorWppPanel
          refreshKey={refreshKey}
          onSelectUsuario={(id) => setSearchParams({ tab: 'usuarios', usuario: id })}
        />
      )}

      {!esCelular && activeTab === 'tareas' && <SchedulerPanel refreshKey={refreshKey} />}

      {!esCelular && activeTab === 'registro' && <RegistroPanel refreshKey={refreshKey} />}
    </div>
  )
}

export default AdminPage
