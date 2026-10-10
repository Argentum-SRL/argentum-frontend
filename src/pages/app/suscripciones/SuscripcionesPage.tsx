import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus } from '@/components/ui/icons'
import { Button, PageSummaryBar, LunarLoader } from '@/components/ui'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import categoriaService from '@/services/categoria.service'
import type { Suscripcion, TotalMensualSuscripciones, Billetera, TarjetaCredito, Categoria, Subcategoria } from '@/types'
import { formatMonto } from '@/utils/format'
import { CATALOGO_SUSCRIPCIONES } from '@/lib/constants/suscripciones'
import { getSubcategoriaVisual } from '@/lib/utils/categoria.utils'
import SuscripcionCard from '@/components/suscripciones/SuscripcionCard'
import SuscripcionModal from '@/components/suscripciones/SuscripcionModal'
import styles from './SuscripcionesPage.module.css'

interface FloatingItemConfig {
  dt: string
  dl: string
  mt?: string
  ml?: string
  size: 'far' | 'mid' | 'near'
  brandId?: string
  subcatName?: string
  label: string
}

const FLOATING_ITEMS: FloatingItemConfig[] = [
  // ── Halo Inmediato alrededor del Card Central (Immediate Orbit)
  // Flanco Izquierdo Cercano
  { dt: '26%', dl: '26%', mt: '19%', ml: '68%', size: 'mid',  subcatName: 'obra social', label: 'Obra Social' },
  { dt: '44%', dl: '23%', mt: '10%', ml: '18%', size: 'near', brandId: 'netflix', label: 'Netflix' },
  { dt: '62%', dl: '25%',                       size: 'mid',  brandId: 'hbomax', label: 'HBO Max' },
  { dt: '76%', dl: '28%', mt: '19%', ml: '32%', size: 'far',  brandId: 'spotify', label: 'Spotify' },

  // Flanco Derecho Cercano
  { dt: '26%', dl: '74%', mt: '10%', ml: '82%', size: 'mid',  brandId: 'applemusic', label: 'Apple Music' },
  { dt: '44%', dl: '77%', mt: '50%', ml: '93%', size: 'far',  brandId: 'chatgpt', label: 'ChatGPT' },
  { dt: '62%', dl: '75%',                       size: 'near', brandId: 'appletv', label: 'Apple TV+' },
  { dt: '76%', dl: '72%',                       size: 'mid',  brandId: 'googleone', label: 'Google One' },

  // Corona Superior Cercana (Arriba del Card)
  { dt: '15%', dl: '38%', mt: '6%',  ml: '50%', size: 'near', brandId: 'duolingo', label: 'Duolingo' },
  { dt: '11%', dl: '50%',                       size: 'mid',  brandId: 'youtubepremium', label: 'YouTube Premium' },
  { dt: '15%', dl: '62%', mt: '32%', ml: '92%', size: 'near', brandId: 'playstation', label: 'PlayStation' },

  // Base Inferior Cercana (Abajo del Card)
  { dt: '85%', dl: '38%', mt: '75%', ml: '26%', size: 'far',  brandId: 'deezer', label: 'Deezer' },
  { dt: '88%', dl: '50%', mt: '78%', ml: '50%', size: 'near', brandId: 'dropbox', label: 'Dropbox' },
  { dt: '85%', dl: '62%', mt: '75%', ml: '74%', size: 'mid',  brandId: 'adobe', label: 'Adobe CC' },

  // ── Órbita Media y Flancos Exteriores
  // Sector Izquierdo Exterior
  { dt: '12%', dl: '14%', mt: '50%', ml: '7%',  size: 'far',  brandId: 'primevideo', label: 'Prime Video' },
  { dt: '34%', dl: '8%',  mt: '32%', ml: '8%',  size: 'near', subcatName: 'gimnasio', label: 'Gimnasio' },
  { dt: '52%', dl: '6%',                        size: 'far',  brandId: 'paramount', label: 'Paramount+' },
  { dt: '70%', dl: '10%',                       size: 'far',  brandId: 'microsoft365', label: 'Microsoft 365' },
  { dt: '88%', dl: '16%', mt: '67%', ml: '9%',  size: 'near', subcatName: 'celular', label: 'Celular' },

  // Sector Derecho Exterior
  { dt: '12%', dl: '86%',                       size: 'mid',  brandId: 'icloud', label: 'iCloud' },
  { dt: '34%', dl: '92%',                       size: 'near', brandId: 'github', label: 'GitHub' },
  { dt: '52%', dl: '94%',                       size: 'far',  brandId: 'canva', label: 'Canva' },
  { dt: '70%', dl: '90%',                       size: 'far',  brandId: 'notion', label: 'Notion' },
  { dt: '88%', dl: '84%', mt: '67%', ml: '91%', size: 'mid',  subcatName: 'cuotas', label: 'Cuotas' },
]


const SuscripcionesPage: React.FC = () => {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [totales, setTotales] = useState<TotalMensualSuscripciones | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
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
      const [data, t, bills, cards, cats, subs] = await Promise.all([
        suscripcionService.getSuscripciones(undefined, signal),
        suscripcionService.getTotalMensual(signal),
        billeteraService.list(signal),
        tarjetaService.getTarjetas(signal),
        categoriaService.getCategorias().catch(() => []),
        categoriaService.getAllSubcategorias(signal).catch(() => []),
      ])
      if (signal?.aborted) return

      setBilleteras(bills)
      setTarjetas(cards)
      setCategorias(cats)
      setSubcategorias(subs)
      
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
        <LunarLoader size={40} color="var(--primary)" />
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
              const src = item.subcatName
                ? getSubcategoriaVisual(item.subcatName)?.iconSrc
                : item.brandId
                  ? CATALOGO_SUSCRIPCIONES.find(s => s.id === item.brandId)?.logoPath
                  : ''
              
              if (!src) return null
              
              const style = {
                '--top-dt': item.dt,
                '--left-dt': item.dl,
                '--top-m': item.mt,
                '--left-m': item.ml,
              } as React.CSSProperties

              return (
                <img
                  key={`${item.label}-${i}`}
                  src={src}
                  alt={item.label}
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
            <h1 className={styles.emptyTitle}>No tenés suscripciones ni débitos registrados</h1>
            <p className={styles.emptySubtitle}>
              Registrá tus servicios digitales, membresías y cargos recurrentes (como streaming, telefonía, gimnasio o seguros). Configuralos una sola vez para proyectar tu gasto fijo mensual y registrar cada cobro automáticamente a su vencimiento.
            </p>
            <Button 
              onClick={handleCreate} 
              className={styles.emptyButton}
            >
              <Plus size={18} />
              Agregar suscripción o débito
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
            Controlá tus servicios, membresías y débitos automáticos recurrentes.
          </p>
        </div>
        <button className={styles.nuevaBtn} onClick={handleCreate}>
          <Plus size={16} strokeWidth={2.5} />
          Agregar suscripción o débito
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
                  categorias={categorias}
                  subcategorias={subcategorias}
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
