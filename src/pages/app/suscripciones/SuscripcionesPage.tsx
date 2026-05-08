import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import suscripcionService from '@/services/suscripcion.service'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import type { Suscripcion, Billetera, TarjetaCredito, TotalMensualSuscripciones } from '@/types'
import { formatMonto } from '@/utils/format'
import SuscripcionCard from '@/components/suscripciones/SuscripcionCard'
import SuscripcionModal from '@/components/suscripciones/SuscripcionModal'
import styles from './SuscripcionesPage.module.css'

const SuscripcionesPage: React.FC = () => {
  const { showToast } = useToast()
  const { open } = useModal()
  
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [totales, setTotales] = useState<TotalMensualSuscripciones | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showCanceladas, setShowCanceladas] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<Suscripcion | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, t, b, c] = await Promise.all([
        suscripcionService.getSuscripciones(),
        suscripcionService.getTotalMensual(),
        billeteraService.list(),
        tarjetaService.getTarjetas()
      ])
      setSuscripciones(s)
      setTotales(t)
      setBilleteras(b)
      setTarjetas(c)
    } catch (error) {
      console.error(error)
      showToast('Error al cargar suscripciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  const activas = useMemo(() => suscripciones.filter(s => s.estado === 'activa'), [suscripciones])
  const pausadas = useMemo(() => suscripciones.filter(s => s.estado === 'pausada'), [suscripciones])
  const canceladas = useMemo(() => suscripciones.filter(s => s.estado === 'cancelada'), [suscripciones])

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
      } else if (s.estado === 'pausada') {
        await suscripcionService.reactivarSuscripcion(s.id)
        showToast('Suscripción reactivada', 'success')
      }
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Error al cambiar estado', 'error')
    }
  }

  const handleDelete = async (s: Suscripcion) => {
    if (s.estado !== 'cancelada') {
      if (!confirm('¿Seguro que querés cancelar esta suscripción? Dejará de procesarse el cobro.')) return
      try {
        await suscripcionService.cancelarSuscripcion(s.id)
        showToast('Suscripción cancelada', 'success')
        loadData()
      } catch (error) {
        showToast('Error al cancelar', 'error')
      }
    } else {
      if (!confirm('¿Eliminar permanentemente? Esta acción no se puede deshacer.')) return
      try {
        await suscripcionService.deleteSuscripcion(s.id)
        showToast('Suscripción eliminada', 'success')
        loadData()
      } catch (error) {
        showToast('Error al eliminar', 'error')
      }
    }
  }

  const handleUpdatePrecio = (s: Suscripcion) => {
    // Por ahora abrimos edición, en Fase 3 haremos el mini drawer de precios
    handleEdit(s)
  }

  if (loading && suscripciones.length === 0) {
    return (
      <div className={styles.root} style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Suscripciones</h1>
          <p className={styles.subtitle}>
            {activas.length} activas · Total mensual: {formatMonto(totales?.total_ars || 0, 'ARS')}
            {totales?.total_usd ? ` + ${formatMonto(totales.total_usd, 'USD')}` : ''}
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus size={18} />}>Nueva suscripción</Button>
      </header>

      {/* Totales Card */}
      <div className={styles.totalsCard}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Total mensual ARS</span>
          <span className={styles.totalValue}>{formatMonto(totales?.total_ars || 0, 'ARS')}</span>
        </div>
        <div className={styles.totalDivider} />
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Total mensual USD</span>
          <span className={styles.totalValue}>{formatMonto(totales?.total_usd || 0, 'USD')}</span>
        </div>
        <div className={styles.totalDivider} />
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Activas</span>
          <span className={styles.totalValue}>{activas.length}</span>
        </div>
      </div>

      {/* Activas */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Activas</h2>
          <span className={styles.sectionCount}>{activas.length}</span>
        </div>
        {activas.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} strokeWidth={1} />
            <p>No tenés suscripciones activas.<br/>Agregá una para controlar mejor tus gastos fijos.</p>
            <Button variant="outline" onClick={handleCreate}>Agregar mi primera suscripción</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {activas.map(s => (
              <SuscripcionCard 
                key={s.id} 
                suscripcion={s}
                billeteras={billeteras}
                tarjetas={tarjetas}
                onEdit={handleEdit}
                onUpdatePrecio={handleUpdatePrecio}
                onToggleEstado={handleToggleEstado}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pausadas */}
      {pausadas.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pausadas</h2>
            <span className={styles.sectionCount}>{pausadas.length}</span>
          </div>
          <div className={styles.grid}>
            {pausadas.map(s => (
              <SuscripcionCard 
                key={s.id} 
                suscripcion={s}
                billeteras={billeteras}
                tarjetas={tarjetas}
                onEdit={handleEdit}
                onUpdatePrecio={handleUpdatePrecio}
                onToggleEstado={handleToggleEstado}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Canceladas */}
      {canceladas.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Canceladas</h2>
            <span className={styles.sectionCount}>{canceladas.length}</span>
            <button className={styles.collapseBtn} onClick={() => setShowCanceladas(!showCanceladas)}>
              {showCanceladas ? <><ChevronUp size={16} /> Ocultar</> : <><ChevronDown size={16} /> Ver canceladas</>}
            </button>
          </div>
          {showCanceladas && (
            <div className={styles.grid}>
              {canceladas.map(s => (
                <SuscripcionCard 
                  key={s.id} 
                  suscripcion={s}
                  billeteras={billeteras}
                  tarjetas={tarjetas}
                  onEdit={handleEdit}
                  onUpdatePrecio={handleUpdatePrecio}
                  onToggleEstado={handleToggleEstado}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <SuscripcionModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        suscripcion={selectedSuscripcion}
        onSuccess={loadData}
      />
    </div>
  )
}

export default SuscripcionesPage
