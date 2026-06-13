import React, { useState, useEffect, useCallback, useImperativeHandle } from 'react'
import { 
  Plus, 
  Pause, 
  Play, 
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
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { EmptyState } from '@/components/ui'

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

  const renderRow = (rec: TransaccionRecurrente) => {
    const isIngreso = rec.tipo === 'ingreso'
    const isPausada = rec.estado === 'pausada'
    const cat = categorias.find(c => c.id === rec.categoria_id)
    const wallet = billeteras.find(b => b.id === rec.billetera_id)

    return (
      <div 
        key={rec.id}
        onClick={() => handleOpenModal(rec)}
        className={`${styles.row} ${isPausada ? styles.rowPausada : ''}`}
      >
        <div className={styles.iconContainer}>
          <CategoriaIcon nombre={cat?.nombre || 'general'} size={40} />
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <span className={styles.description}>
              {rec.descripcion || cat?.nombre || 'Sin descripción'}
            </span>
            {isPausada && (
              <span className={styles.badgePausada}>
                Pausada
              </span>
            )}
          </div>
          <span className={styles.meta}>
            <span>{cat?.nombre || 'General'}</span>
            <span> · </span>
            <span>{getFriendlyFrequency(rec)}</span>
          </span>
        </div>

        <div className={styles.amountArea}>
          <span className={`${styles.amount} ${isIngreso ? styles.amountPos : styles.amountNeg}`}>
            {isIngreso ? '+' : '-'}{formatMonto(rec.monto, rec.moneda)}
          </span>
          <span className={styles.walletName}>
            {wallet?.nombre || 'Billetera eliminada'}
          </span>
        </div>

        <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
          <button 
            className={styles.actionBtn} 
            title={isPausada ? 'Reanudar' : 'Pausar'}
            onClick={() => handleToggleEstado(rec)}
          >
            {isPausada ? <Play size={15} strokeWidth={2} /> : <Pause size={15} strokeWidth={2} />}
            <span className={styles.btnText}>{isPausada ? 'Reanudar' : 'Pausar'}</span>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => handleDelete(rec)}
            aria-label="Eliminar recurrente"
            title="Eliminar recurrente"
          >
            <Trash2 size={15} strokeWidth={1.75} />
            <span className={styles.btnText}>Eliminar</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? styles.embeddedContainer : styles.container}>
      {!embedded ? (
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1>Recurrentes</h1>
            <p className={styles.subtitle}>Controlá tus cobros y pagos periódicos</p>
          </div>
          <button className={styles.nuevaBtn} onClick={() => handleOpenModal()}>
            <Plus size={16} strokeWidth={2.5} /> Nueva recurrente
          </button>
        </header>
      ) : null}

      {loading ? (
        <div className={styles.loadingState}>Cargando...</div>
      ) : recurrentes.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No hay transacciones recurrentes"
          description="Automatizá tus cobros y pagos regulares (alquileres, suscripciones, sueldos) para que se registren solos según la frecuencia que elijas."
          actionLabel="Configurar recurrente"
          onActionClick={() => handleOpenModal()}
        />

      ) : (
        <>
          <section className={styles.section}>
            <h2>
              Activas <span className={styles.count}>{activas.length}</span>
            </h2>
            <div className={styles.list}>
              {activas.map(renderRow)}
            </div>
          </section>

          {pausadas.length > 0 && (
            <section className={styles.section}>
              <h2>
                Pausadas <span className={styles.count}>{pausadas.length}</span>
              </h2>
              <div className={styles.list}>
                {pausadas.map(renderRow)}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  )
})

export default RecurrentesPage
