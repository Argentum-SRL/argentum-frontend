import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, Loader2 } from '@/components/ui/icons'
import { Button, PageSummaryBar } from '@/components/ui'
import { sileo } from 'sileo'
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

interface FloatingItemConfig {
  dt: string
  dl: string
  mt?: string
  ml?: string
  size: 'far' | 'mid' | 'near'
}

const FLOATING_ITEMS: FloatingItemConfig[] = [
  // ── Sector Izquierdo Exterior (Left Wing Outer)
  { dt: '12%', dl: '5%',  mt: '5%',  ml: '16%', size: 'mid'  }, // 1: Netflix
  { dt: '32%', dl: '5%',  mt: '6%',  ml: '82%', size: 'near' }, // 2: HBO Max
  { dt: '54%', dl: '5%',  mt: '13%', ml: '50%', size: 'far'  }, // 3: Prime Video
  { dt: '76%', dl: '5%',  mt: '22%', ml: '18%', size: 'near' }, // 4: Paramount+

  // ── Sector Izquierdo Interior (Left Wing Inner)
  { dt: '18%', dl: '15%', mt: '21%', ml: '82%', size: 'mid'  }, // 5: Apple TV+
  { dt: '42%', dl: '15%', mt: '38%', ml: '4%',  size: 'far'  }, // 6: Crunchyroll
  { dt: '66%', dl: '15%', mt: '48%', ml: '96%', size: 'far'  }, // 7: Pluto TV

  // ── Sector Flancos (Flanks)
  { dt: '10%', dl: '25%', mt: '58%', ml: '4%',  size: 'mid'  }, // 8: Peacock
  { dt: '84%', dl: '24%', mt: '57%', ml: '96%', size: 'mid'  }, // 9: Spotify

  // ── Sector Superior Desktop / Inferior Mobile
  { dt: '5%',  dl: '38%', mt: '65%', ml: '20%', size: 'near' }, // 10: Apple Music
  { dt: '5%',  dl: '62%', mt: '66%', ml: '80%', size: 'mid'  }, // 11: YT Music

  // ── Sector Flancos y Base
  { dt: '10%', dl: '75%', mt: '73%', ml: '50%', size: 'near' }, // 12: Tidal
  { dt: '84%', dl: '76%', mt: '80%', ml: '18%', size: 'mid'  }, // 13: Deezer

  // ── Sector Derecho Interior
  { dt: '18%', dl: '85%', mt: '81%', ml: '82%', size: 'near' }, // 14: iCloud
  { dt: '42%', dl: '85%', mt: '88%', ml: '30%', size: 'mid'  }, // 15: Google One
  { dt: '66%', dl: '85%', mt: '88%', ml: '70%', size: 'near' }, // 16: Microsoft 365

  // ── Sector Derecho Exterior
  { dt: '12%', dl: '95%', mt: '95%', ml: '16%', size: 'far'  }, // 17: Adobe CC
  { dt: '32%', dl: '95%', mt: '96%', ml: '50%', size: 'mid'  }, // 18: ChatGPT Plus
  { dt: '54%', dl: '95%', mt: '95%', ml: '84%', size: 'far'  }, // 19: Canva
  { dt: '76%', dl: '95%', size: 'far'  },                        // 20: Notion

  // ── Sector Inferior Desktop (Base)
  { dt: '90%', dl: '38%', size: 'mid'  }, // 21: Evernote
  { dt: '92%', dl: '50%', size: 'near' }, // 22: Dropbox
  { dt: '90%', dl: '62%', size: 'mid'  }, // 23: Grammarly
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
      sileo.error({ title: getErrorMessage(error, 'No pudimos cargar las suscripciones. Intentá de nuevo.') })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

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
        sileo.success({ title: 'Suscripción pausada' })
      } else {
        await suscripcionService.reactivarSuscripcion(s.id)
        sileo.success({ title: 'Suscripción reactivada' })
      }
      loadData()
    } catch (error: unknown) {
      console.error(error)
      sileo.error({ title: getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.') })
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
          sileo.success({ title: 'Suscripción eliminada' })
          loadData()
        } catch (error) {
          console.error(error)
          sileo.error({ title: getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.') })
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
      <div className={`${styles.root} ${styles.emptyRoot}`}>
        <div className={`${styles.emptyState} ${isExiting ? styles.emptyStateExiting : ''}`}>
          {/* Capa 1: Logos Flotantes con profundidad */}
          <div className={styles.logosLayer}>
            {FLOATING_ITEMS.map((item, i) => {
              const s = CATALOGO_SUSCRIPCIONES[i % CATALOGO_SUSCRIPCIONES.length]
              if (!s || !s.logoPath) return null
              
              const style = {
                '--top-dt': item.dt,
                '--left-dt': item.dl,
                '--top-m': item.mt,
                '--left-m': item.ml,
              } as React.CSSProperties

              return (
                <img
                  key={`${s.id}-${i}`}
                  src={s.logoPath}
                  alt={s.nombre}
                  style={style}
                  className={`${styles.logoFlotante} ${styles[item.size]} ${!item.mt ? styles.hideMobile : ''}`}
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
              className={styles.emptyButton}
            >
              <Plus size={18} />
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
            {totalMensualUSD > 0 && ` + ${formatMonto(totalMensualUSD, 'USD')}`}
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
                ? `+ ${formatMonto(totalMensualUSD, 'USD')} en dólares`
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
            label: "Total mensual en Pesos",
            value: formatCurrency(totalMensualARS),
          },
          {
            label: "Total mensual en Dólares",
            value: formatMonto(totalMensualUSD, 'USD'),
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
