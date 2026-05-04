import React, { useState, useEffect, useCallback, useImperativeHandle } from 'react'
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Pause, 
  Play, 
  Edit3, 
  Trash2,
  Clock
} from 'lucide-react'
import styles from './RecurrentesPage.module.css'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import recurrenteService from '@/services/recurrente.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import type { TransaccionRecurrente, Billetera, Categoria } from '@/types'
import { formatMonto } from '@/utils/format'
import Button from '@/components/ui/Button/Button'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'

interface RecurrentesPageProps {
  embedded?: boolean
}

export interface RecurrentesPageRef {
  openNew: () => void
}

const RecurrentesPage = React.forwardRef<RecurrentesPageRef, RecurrentesPageProps>(({ embedded = false }, ref) => {
  const [recurrentes, setRecurrentes] = useState<TransaccionRecurrente[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const { open, confirm } = useModal()

  useImperativeHandle(ref, () => ({
    openNew: () => handleOpenModal()
  }))

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const [r, b, c] = await Promise.all([
        recurrenteService.getRecurrentes(),
        billeteraService.list(),
        categoriaService.getCategorias()
      ])
      setRecurrentes(r)
      setBilleteras(b.filter((w: Billetera) => w.estado === 'activa'))
      setCategorias(c)
    } catch (err) {
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchInitialData])

  const handleOpenModal = (rec?: TransaccionRecurrente) => {
    open('recurrente', {
      data: {
        recurrente: rec ?? null,
        billeteras,
        categorias,
        onSuccess: fetchInitialData,
      },
    })
  }

  const handleToggleEstado = async (rec: TransaccionRecurrente) => {
    try {
      if (rec.estado === 'activa') {
        await recurrenteService.pausarRecurrente(rec.id)
      } else {
        await recurrenteService.reanudarRecurrente(rec.id)
      }
      showToast(rec.estado === 'activa' ? 'Recurrente pausada' : 'Recurrente reanudada', 'success')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      showToast('Error al cambiar el estado', 'error')
    }
  }

  const handleDelete = (rec: TransaccionRecurrente) => {
    confirm({
      title: 'Eliminar recurrente',
      description: '¿Estás seguro de eliminar esta transacción recurrente? Dejará de generar transacciones automáticas.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await recurrenteService.deleteRecurrente(rec.id)
          showToast('Recurrente eliminada', 'success')
          fetchInitialData()
        } catch (err) {
          console.error(err)
          showToast('Error al eliminar', 'error')
        }
      },
    })
  }

  const getFriendlyFrequency = (rec: TransaccionRecurrente) => {
    if (rec.frecuencia === 'semanal') {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      return `Cada semana (${dias[rec.dia_registro]})`
    }
    if (rec.frecuencia === 'quincenal') return 'Cada 15 días'
    if (rec.frecuencia === 'mensual') return `Cada mes el día ${rec.dia_registro}`
    return rec.frecuencia
  }

  const activas = recurrentes.filter(r => r.estado === 'activa')
  const pausadas = recurrentes.filter(r => r.estado === 'pausada')

  const renderCard = (rec: TransaccionRecurrente) => (
    <div key={rec.id} className={`${styles.card} ${rec.estado === 'pausada' ? styles.pausada : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.mainInfo}>
          <div className={`${styles.iconWrapper} ${rec.tipo === 'ingreso' ? styles.ingresoIcon : styles.egresoIcon}`}>
            {(() => {
              const cat = categorias.find(c => c.id === rec.categoria_id)
              if (cat) {
                return <CategoriaIcon nombre={cat.nombre} size={32} />
              }
              const IconComp = rec.tipo === 'ingreso' ? ArrowUpRight : ArrowDownLeft
              return <IconComp size={20} strokeWidth={1.75} />
            })()}
          </div>
          <div className={styles.titleArea}>
            <h3>{rec.descripcion}</h3>
            <span className={styles.monto}>
              {formatMonto(rec.monto, rec.moneda)}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton} 
            title={rec.estado === 'activa' ? 'Pausar' : 'Reanudar'}
            onClick={() => handleToggleEstado(rec)}
          >
            {rec.estado === 'activa' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            className={styles.actionButton} 
            onClick={() => handleOpenModal(rec)}
            title="Editar recurrente"
          >
            <Edit3 size={16} />
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteAction}`} 
            onClick={() => handleDelete(rec)}
            title="Eliminar recurrente"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.frequencyArea}>
        <div className={styles.detailItem}>
          <Clock size={14} />
          <span>{getFriendlyFrequency(rec)}</span>
        </div>
        <div className={styles.detailItem}>
          <Wallet size={14} />
          <span>{billeteras.find(b => b.id === rec.billetera_id)?.nombre || 'Billetera desconocida'}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={embedded ? styles.embeddedContainer : styles.container}>
      {!embedded ? (
        <header className={styles.header}>
          <h1>Recurrentes</h1>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} /> Nueva recurrente
          </Button>
        </header>
      ) : null}

      {loading ? (
        <div className={styles.loadingState}>Cargando...</div>
      ) : recurrentes.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={40} className={styles.emptyStateIcon} />
          <p>No tienes transacciones recurrentes configuradas.</p>
          <p className={styles.emptyStateSubtext}>Las recurrentes generan movimientos automáticos según la frecuencia que elijas.</p>
        </div>

      ) : (
        <>
          <section className={styles.section}>
            <h2>
              Activas <span className={styles.count}>{activas.length}</span>
            </h2>
            <div className={styles.grid}>
              {activas.map(renderCard)}
            </div>
          </section>

          {pausadas.length > 0 && (
            <section className={styles.section}>
              <h2>
                Pausadas <span className={styles.count}>{pausadas.length}</span>
              </h2>
              <div className={styles.grid}>
                {pausadas.map(renderCard)}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  )
})

export default RecurrentesPage
