import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import suscripcionService from '@/services/suscripcion.service'
import type { Suscripcion, TotalMensualSuscripciones } from '@/types'
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

const LOGOS_ANIM = [
  { dx1: 8,  dy1: -12, r1: 3,  dx2: -5, dy2: 8,   r2: -2, dx3: 10, dy3: -4, r3: 1,  duration: 8,  delay: 0   },
  { dx1: -10,dy1: -8,  r1: -3, dx2: 6,  dy2: 12,  r2: 2,  dx3: -8, dy3: 4,  r3: -1, duration: 10, delay: 1.2 },
  { dx1: 6,  dy1: 10,  r1: 2,  dx2: -8, dy2: -6,  r2: -3, dx3: 4,  dy3: 8,  r3: 2,  duration: 9,  delay: 0.6 },
  { dx1: -8, dy1: 6,   r1: -2, dx2: 10, dy2: -10, r2: 3,  dx3: -6, dy3: -4, r3: -2, duration: 11, delay: 1.8 },
  { dx1: 10, dy1: -6,  r1: 4,  dx2: -6, dy2: 10,  r2: -2, dx3: 8,  dy3: -8, r3: 3,  duration: 7,  delay: 0.3 },
  { dx1: -6, dy1: -10, r1: -4, dx2: 8,  dy2: 6,   r2: 3,  dx3: -4, dy3: -8, r3: -3, duration: 9,  delay: 2.1 },
  { dx1: 4,  dy1: 12,  r1: 2,  dx2: -10,dy2: -4,  r2: -4, dx3: 6,  dy3: 10, r3: 1,  duration: 12, delay: 0.9 },
  { dx1: -4, dy1: -14, r1: -2, dx2: 6,  dy2: 8,   r2: 4,  dx3: -8, dy3: -6, r3: -2, duration: 8,  delay: 1.5 },
  { dx1: 12, dy1: 4,   r1: 3,  dx2: -4, dy2: -12, r2: -3, dx3: 10, dy3: 6,  r3: 2,  duration: 10, delay: 0.4 },
  { dx1: -12,dy1: 8,   r1: -3, dx2: 4,  dy2: -8,  r2: 4,  dx3: -6, dy3: 10, r3: -1, duration: 9,  delay: 1.7 },
  { dx1: 8,  dy1: -4,  r1: 4,  dx2: -12,dy2: 6,   r2: -3, dx3: 4,  dy3: -10,r3: 3,  duration: 11, delay: 0.7 },
  { dx1: -4, dy1: 8,   r1: -4, dx2: 10, dy2: -4,  r2: 2,  dx3: -10,dy3: 4,  r3: -4, duration: 7,  delay: 2.3 },
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
        <div className={`${styles.emptyState} ${isExiting ? styles.emptyStateExiting : ''}`}>
          {/* Capa 1: Logos Flotantes con profundidad */}
          <div className={styles.logosLayer}>
            {POSICIONES.map((pos, i) => {
              const s = CATALOGO_SUSCRIPCIONES[i % CATALOGO_SUSCRIPCIONES.length]
              const anim = LOGOS_ANIM[i % LOGOS_ANIM.length]
              
              return (
                <img
                  key={`${s.id}-${i}`}
                  src={s.logoPath}
                  alt=""
                  className={`${styles.logoFlotante} ${styles[pos.size]}`}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    '--dx1': `${anim.dx1}px`, '--dy1': `${anim.dy1}px`, '--r1': `${anim.r1}deg`, '--s1': '1.05',
                    '--dx2': `${anim.dx2}px`, '--dy2': `${anim.dy2}px`, '--r2': `${anim.r2}deg`,
                    '--dx3': `${anim.dx3}px`, '--dy3': `${anim.dy3}px`, '--r3': `${anim.r3}deg`,
                    animationDuration: `${anim.duration}s`,
                    animationDelay: `${anim.delay}s`,
                    animationTimingFunction: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
                    animationIterationCount: 'infinite',
                  } as React.CSSProperties}
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
            <h1 className={styles.emptyTitle}>Tus suscripciones, en un lugar</h1>
            <p className={styles.emptySubtitle}>
              Agregá Netflix, Spotify, el gimnasio o cualquier servicio con cobro periódico. 
              El sistema calcula cuánto gastás por mes en total.
            </p>
            <Button 
              onClick={handleCreate} 
              size="lg" 
              className={styles.emptyButton}
              icon={<Plus size={20} />}
            >
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
              <h2 className={section.title === 'Activas' ? styles.sectionTitle : styles.sectionTitleAlt}>{section.title}</h2>
              <span className={section.count > 0 ? styles.sectionCount : ''}>{section.count}</span>
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
