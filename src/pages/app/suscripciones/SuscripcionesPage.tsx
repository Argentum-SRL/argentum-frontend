import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button, PageSummaryBar } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import type { Suscripcion, TotalMensualSuscripciones, Billetera, TarjetaCredito } from '@/types'
import { formatMonto } from '@/utils/format'
import { CATALOGO_SUSCRIPCIONES } from '@/lib/constants/suscripciones'
import SuscripcionCard from '@/components/suscripciones/SuscripcionCard'
import SuscripcionModal from '@/components/suscripciones/SuscripcionModal'
import styles from './SuscripcionesPage.module.css'

const POSICIONES = [
  { top: '8%',  left: '15%', size: 'mid'  },
  { top: '5%',  left: '55%', size: 'near' },
  { top: '12%', left: '82%', size: 'mid'  },
  { top: '35%', left: '4%',  size: 'near' },
  { top: '55%', left: '8%',  size: 'far'  },
  { top: '75%', left: '18%', size: 'mid'  },
  { top: '85%', left: '48%', size: 'near' },
  { top: '78%', left: '78%', size: 'mid'  },
  { top: '55%', left: '88%', size: 'near' },
  { top: '30%', left: '85%', size: 'far'  },
  { top: '18%', left: '38%', size: 'far'  },
  { top: '72%', left: '42%', size: 'far'  },
]


const SuscripcionesPage: React.FC = () => {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [totales, setTotales] = useState<TotalMensualSuscripciones | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<Suscripcion | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const { showToast } = useToast()
  const { confirm } = useModal()
  
  const internalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suscripcionesLengthRef = useRef(0)
  useEffect(() => {
    suscripcionesLengthRef.current = suscripciones.length
  }, [suscripciones.length])

  const loadData = useCallback(async (isFirstLoad = false, signal?: AbortSignal) => {
    try {
      const [data, t, bills, cards] = await Promise.all([
        suscripcionService.getSuscripciones(undefined, signal),
        suscripcionService.getTotalMensual(signal),
        billeteraService.list(signal),
        tarjetaService.getTarjetas(signal),
      ])
      if (signal?.aborted) return

      setBilleteras(bills)
      setTarjetas(cards)
      
      const prevLength = suscripcionesLengthRef.current
      if (!isFirstLoad && prevLength === 0 && data.length > 0) {
        setIsExiting(true)
        if (internalTimeoutRef.current) clearTimeout(internalTimeoutRef.current)
        internalTimeoutRef.current = setTimeout(() => {
          if (!signal?.aborted) {
            setSuscripciones(data)
            setTotales(t)
            setIsExiting(false)
          }
        }, 400)
      } else {
        setSuscripciones(data)
        setTotales(t)
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
        return
      }
      console.error(error)
      showToast(getErrorMessage(error, 'No pudimos cargar las suscripciones. Intentá de nuevo.'), 'error')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [showToast])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void loadData(true, controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
      if (internalTimeoutRef.current) {
        clearTimeout(internalTimeoutRef.current)
      }
    }
  }, [loadData])

  const handleCreate = () => {
    setSelectedSuscripcion(null)
    setModalOpen(true)
  }

  const handleEdit = (s: Suscripcion) => {
    setSelectedSuscripcion(s)
    setModalOpen(true)
  }

  const handleToggleEstado = async (s: Suscripcion) => {
    try {
      if (s.estado === 'activa') {
        await suscripcionService.pausarSuscripcion(s.id)
        showToast('Suscripción pausada', 'success')
      } else {
        await suscripcionService.reactivarSuscripcion(s.id)
        showToast('Suscripción reactivada', 'success')
      }
      loadData()
    } catch (error: unknown) {
      console.error(error)
      showToast(getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    }
  }

  const handleDelete = async (s: Suscripcion) => {
    confirm({
      title: '¿Eliminás esta suscripción?',
      description: 'Se va a borrar junto con sus recordatorios.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await suscripcionService.deleteSuscripcion(s.id)
          showToast('Suscripción eliminada', 'success')
          loadData()
        } catch (error) {
          console.error(error)
          showToast(getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const sections = useMemo(() => {
    const active = suscripciones.filter(s => s.estado === 'activa')
    const paused = suscripciones.filter(s => s.estado === 'pausada')
    const canceled = suscripciones.filter(s => s.estado === 'cancelada')
    return [
      { title: 'Activas', items: active, count: active.length },
      { title: 'Pausadas', items: paused, count: paused.length },
      { title: 'Canceladas', items: canceled, count: canceled.length }
    ].filter(s => s.count > 0)
  }, [suscripciones])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="animate-spin" size={40} color="#0D2045" />
      </div>
    )
  }

  if (suscripciones.length === 0 || isExiting) {
    return (
      <div className={styles.root}>
        <div className={`${styles.emptyState} ${isExiting ? styles.emptyStateExiting : ''}`}>
          {/* Capa 1: Logos Flotantes con profundidad */}
          <div className={styles.logosLayer}>
            {POSICIONES.map((pos, i) => {
              const s = CATALOGO_SUSCRIPCIONES[i % CATALOGO_SUSCRIPCIONES.length]
              if (!s || !s.logoPath) return null
              
              return (
                <img
                  key={`${s.id}-${i}`}
                  src={s.logoPath}
                  alt=""
                  className={`${styles.logoFlotante} ${styles[pos.size]}`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )
            })}
          </div>

          {/* Capa 3: Blur de fondo con gradiente radial */}
          <div className={styles.blurOverlay} />

          {/* Capa 2: Contenido central con glassmorphism */}
          <div className={styles.emptyContent}>
            <h1 className={styles.emptyTitle}>Todavía no cargaste ninguna suscripción.</h1>
            <p className={styles.emptySubtitle}>
              Agregá Netflix, Spotify, el gimnasio o cualquier servicio con cobro periódico. 
              El sistema calcula cuánto gastás por mes en total.
            </p>
            <Button 
              onClick={handleCreate} 
              className={`${styles.emptyButton} ${styles.btnLg}`}
            >
              <Plus size={20} />
              Agregar mi primera suscripción
            </Button>
          </div>
        </div>

        <SuscripcionModal 
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          suscripcion={selectedSuscripcion}
          onSuccess={() => loadData()}
        />
      </div>
    )
  }

  const totalMensualARS = totales?.total_ars || 0
  const totalMensualUSD = totales?.total_usd || 0
  const suscripcionesActivas = suscripciones.filter(s => s.estado === 'activa')
  const formatCurrency = (monto: number) => formatMonto(monto, 'ARS')

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Suscripciones</h1>
          <p className={styles.subtitle}>
            {suscripcionesActivas.length} activas · Total mensual: {formatCurrency(totalMensualARS)}
          </p>
        </div>
        <button className={styles.nuevaBtn} onClick={handleCreate}>
          <Plus size={16} strokeWidth={2.5} />
          Nueva suscripción
        </button>
      </header>

      {/* ── Mobile Summary Card (Unified Metric Surface) ────────────────── */}
      {!loading && suscripciones.length > 0 && (
        <div className={styles.mobileSummaryCard}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardLabel}>Gasto fijo mensual</span>
            <span className={styles.cardBadge}>
              {suscripcionesActivas.length} activa{suscripcionesActivas.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className={styles.cardAmount}>{formatCurrency(totalMensualARS)}</span>
          <div className={styles.cardSubline}>
            <span>
              {totalMensualUSD > 0 
                ? `+ US$ ${totalMensualUSD.toLocaleString('es-AR', { minimumFractionDigits: totalMensualUSD % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })} en dólares`
                : `${suscripcionesActivas.length} suscripciones registradas`}
            </span>
          </div>
        </div>
      )}

      {/* ── Barra de resumen (Desktop) ────────────────────────────────────── */}
      <PageSummaryBar
        className={styles.desktopSummaryBar}
        items={[
          {
            label: "Total mensual ARS",
            value: formatCurrency(totalMensualARS),
          },
          {
            label: "Total mensual USD",
            value: `US$ ${totalMensualUSD.toLocaleString('es-AR', { minimumFractionDigits: totalMensualUSD % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
          },
          {
            label: "Activas",
            value: String(suscripcionesActivas.length),
          },
        ]}
      />

      <div className={styles.sections}>
        {sections.map(section => (
          <div key={section.title} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={section.title === 'Activas' ? styles.sectionTitle : styles.sectionTitleAlt}>{section.title}</h2>
              <span className={section.count > 0 ? styles.sectionCount : ''}>{section.count}</span>
            </div>
            <div className={styles.grid}>
              {section.items.map(s => (
                <SuscripcionCard
                  key={s.id}
                  suscripcion={s}
                  billeteras={billeteras}
                  tarjetas={tarjetas}
                  onEdit={handleEdit}
                  onUpdatePrecio={handleEdit}
                  onToggleEstado={handleToggleEstado}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SuscripcionModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        suscripcion={selectedSuscripcion}
        onSuccess={() => loadData()}
      />
    </div>
  )
}

export default SuscripcionesPage
