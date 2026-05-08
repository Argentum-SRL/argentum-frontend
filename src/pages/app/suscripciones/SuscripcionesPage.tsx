import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import suscripcionService from '@/services/suscripcion.service'
import type { Suscripcion, TotalMensualSuscripciones } from '@/types'
import { formatMonto } from '@/utils/format'
import { CATALOGO_SUSCRIPCIONES } from '@/lib/constants/suscripciones'
import SuscripcionCard from '@/components/suscripciones/SuscripcionCard'
import SuscripcionModal from '@/components/suscripciones/SuscripcionModal'
import styles from './SuscripcionesPage.module.css'

const LOGOS_CONFIG = [
  // lejos (opacity 0.35, 40px)
  { top: '5%',  left: '8%',  size: 'far'  },
  { top: '10%', left: '78%', size: 'far'  },
  { top: '82%', left: '15%', size: 'far'  },
  { top: '88%', left: '72%', size: 'far'  },
  // medio (opacity 0.55, 52px)
  { top: '18%', left: '3%',  size: 'mid'  },
  { top: '22%', left: '85%', size: 'mid'  },
  { top: '68%', left: '5%',  size: 'mid'  },
  { top: '72%', left: '82%', size: 'mid'  },
  // cerca (opacity 0.8, 64px)
  { top: '38%', left: '2%',  size: 'near' },
  { top: '42%', left: '88%', size: 'near' },
  { top: '12%', left: '48%', size: 'near' },
  { top: '78%', left: '45%', size: 'near' },
]

const SuscripcionesPage: React.FC = () => {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [totales, setTotales] = useState<TotalMensualSuscripciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<Suscripcion | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const { showToast } = useToast()

  const loadData = async (isFirstLoad = false) => {
    try {
      const [data, t] = await Promise.all([
        suscripcionService.getSuscripciones(),
        suscripcionService.getTotalMensual()
      ])
      
      if (!isFirstLoad && suscripciones.length === 0 && data.length > 0) {
        setIsExiting(true)
        setTimeout(() => {
          setSuscripciones(data)
          setTotales(t)
          setIsExiting(false)
        }, 400)
      } else {
        setSuscripciones(data)
        setTotales(t)
      }
    } catch (error) {
      console.error(error)
      showToast('Error al cargar suscripciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(true)
  }, [])

  const handleCreate = () => {
    setSelectedSuscripcion(null)
    setModalOpen(true)
  }

  const handleEdit = (s: Suscripcion) => {
    setSelectedSuscripcion(s)
    setModalOpen(true)
  }

  const handleAction = async (id: string, action: 'pausar' | 'activar' | 'eliminar') => {
    try {
      if (action === 'eliminar') {
        await suscripcionService.deleteSuscripcion(id)
        showToast('Suscripción eliminada', 'success')
      } else if (action === 'pausar') {
        await suscripcionService.pausarSuscripcion(id)
        showToast('Suscripción pausada', 'success')
      } else {
        await suscripcionService.reactivarSuscripcion(id)
        showToast('Suscripción reactivada', 'success')
      }
      loadData()
    } catch (error) {
      showToast('Error al procesar acción', 'error')
    }
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
        <div className={`${styles.emptyStateContainer} ${isExiting ? styles.emptyStateExiting : ''}`}>
          {/* Capa 1: Logos Flotantes con profundidad */}
          <div className={styles.logosLayer}>
            {LOGOS_CONFIG.map((config, i) => {
              const s = CATALOGO_SUSCRIPCIONES[i % CATALOGO_SUSCRIPCIONES.length]
              return (
                <div 
                  key={`${s.id}-${i}`}
                  className={`${styles.logoBurbuja} ${styles[config.size]} ${i >= 8 ? styles.mobileHidden : ''}`}
                  style={{ 
                    top: config.top,
                    left: config.left,
                    animationDelay: `${i * 0.6}s`
                  }}
                >
                  <img 
                    src={s.logoPath} 
                    alt="" 
                    onError={(e) => {
                      // Ocultar el contenedor si la imagen falla
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.style.display = 'none'
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Capa 3: Blur de fondo con gradiente radial */}
          <div className={styles.blurOverlay} />

          {/* Capa 2: Contenido central con glassmorphism */}
          <div className={styles.emptyContent}>
            <h1 className={styles.emptyTitle}>Tus suscripciones, en un lugar</h1>
            <p className={styles.emptySubtitle}>
              Agregá Netflix, Spotify, el gimnasio o cualquier servicio con cobro periódico. 
              El sistema calcula cuánto gastás por mes en total.
            </p>
            <Button onClick={handleCreate} size="lg" className="w-full md:w-auto">
              Agregar mi primera suscripción
            </Button>
          </div>
        </div>

        <SuscripcionModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          suscripcion={selectedSuscripcion}
          onSuccess={() => loadData()}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Suscripciones</h1>
          <p className={styles.pageSubtitle}>
            {suscripciones.filter(s => s.estado === 'activa').length} activas · Total mensual: {formatMonto(totales?.total_ars || 0, 'ARS')}
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus size={18} />}>Nueva suscripción</Button>
      </header>

      <div className={styles.totalsCard}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Total Mensual ARS</span>
          <span className={styles.totalValue}>{formatMonto(totales?.total_ars || 0, 'ARS')}</span>
        </div>
        <div className={styles.totalDivider} />
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Total Mensual USD</span>
          <span className={styles.totalValue}>{formatMonto(totales?.total_usd || 0, 'USD')}</span>
        </div>
        <div className={styles.totalDivider} />
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Activas</span>
          <span className={styles.totalValue}>{suscripciones.filter(s => s.estado === 'activa').length}</span>
        </div>
      </div>

      <div className={styles.sections}>
        {sections.map(section => (
          <div key={section.title} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <span className={styles.sectionCount}>{section.count}</span>
            </div>
            <div className={styles.grid}>
              {section.items.map(s => (
                <SuscripcionCard 
                  key={s.id} 
                  suscripcion={s} 
                  onEdit={() => handleEdit(s)}
                  onAction={(a) => handleAction(s.id, a)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SuscripcionModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        suscripcion={selectedSuscripcion}
        onSuccess={() => loadData()}
      />
    </div>
  )
}

export default SuscripcionesPage
