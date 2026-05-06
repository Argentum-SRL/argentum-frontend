import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CreditCard, Plus, Loader2 } from 'lucide-react'
import type { Billetera, TarjetaCredito, Transaccion, Categoria } from '@/types'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import DayGroup from '@/components/transacciones/DayGroup'
import TarjetaCard from '@/components/tarjetas/TarjetaCard'
import { formatSaldo } from '@/lib/utils/billeteras.utils'
import styles from './BilleteraDetallePage.module.css'

const BilleteraDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { open } = useModal()

  const [billetera, setBilletera] = useState<Billetera | null>(null)
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [movimientos, setMovimientos] = useState<Transaccion[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  
  const [activeTab, setActiveTab] = useState<'movimientos' | 'tarjetas'>('movimientos')
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  // Cargar billetera inicial
  useEffect(() => {
    const loadBilletera = async () => {
      if (!id) return
      try {
        const data = await billeteraService.getById(id)
        setBilletera(data)
      } catch (error) {
        console.error(error)
        showToast('Billetera no encontrada', 'error')
        navigate('/app/billeteras')
      } finally {
        setLoading(false)
      }
    }
    loadBilletera()
  }, [id, navigate])

  // Cargar datos según el tab activo
  useEffect(() => {
    if (!id || !billetera) return

    const loadTabData = async () => {
      setLoadingData(true)
      try {
        if (activeTab === 'movimientos') {
          const [txs, cats] = await Promise.all([
            transaccionService.getTransacciones({ billetera_id: id }),
            categoriaService.getCategorias()
          ])
          setMovimientos(txs)
          setCategorias(cats)
        } else {
          const data = await tarjetaService.getTarjetasPorBilletera(id)
          setTarjetas(data)
        }
      } catch (error) {
        console.error(error)
        showToast('Error al cargar datos', 'error')
      } finally {
        setLoadingData(false)
      }
    }

    loadTabData()
  }, [id, activeTab, billetera])

  // Agrupar movimientos por día
  const groupedMovimientos = useMemo(() => {
    const groups: Record<string, Transaccion[]> = {}
    movimientos.forEach(tx => {
      const date = tx.fecha.split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [movimientos])

  const loadTarjetas = async () => {
    if (!id) return
    const data = await tarjetaService.getTarjetasPorBilletera(id)
    setTarjetas(data)
  }

  const handleCreateTarjeta = async () => {
    try {
      const allBilleteras = await billeteraService.list()
      open('tarjeta', {
        data: {
          tarjeta: null,
          billeteras: allBilleteras,
          billeteraId: id,
          onSuccess: loadTarjetas
        }
      })
    } catch (error) {
      showToast('Error al cargar billeteras', 'error')
    }
  }

  const handleEditTarjeta = async (tarjeta: TarjetaCredito) => {
    try {
      const allBilleteras = await billeteraService.list()
      open('tarjeta', {
        data: {
          tarjeta,
          billeteras: allBilleteras,
          onSuccess: loadTarjetas
        }
      })
    } catch (error) {
      showToast('Error al cargar billeteras', 'error')
    }
  }

  const handleArchiveTarjeta = async (tarjeta: TarjetaCredito) => {
    if (!confirm(`¿Estás seguro de archivar la tarjeta "${tarjeta.nombre}"?`)) return
    try {
      await tarjetaService.archivarTarjeta(tarjeta.id)
      showToast('Tarjeta archivada', 'success')
      // Refresh list
      const data = await tarjetaService.getTarjetasPorBilletera(id!)
      setTarjetas(data)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Error al archivar', 'error')
    }
  }

  const handleDeleteTarjeta = async (tarjeta: TarjetaCredito) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la tarjeta "${tarjeta.nombre}"?`)) return
    try {
      await tarjetaService.deleteTarjeta(tarjeta.id)
      showToast('Tarjeta eliminada', 'success')
      setTarjetas(tarjetas.filter(t => t.id !== tarjeta.id))
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'No se puede eliminar una tarjeta con transacciones', 'error')
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  if (!billetera) return null

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/app/billeteras')}>
          <ChevronLeft size={18} />
          Billeteras
        </button>
        
        <div className={styles.titleRow}>
          <div className={styles.billeteraInfo}>
            <h1 className={styles.name}>{billetera.nombre}</h1>
            <span className={styles.type}>
              {billetera.es_efectivo ? 'Efectivo' : 'Banco'} · {billetera.moneda}
            </span>
          </div>
          <div className={styles.saldoContainer}>
            <span className={styles.saldoLabel}>Saldo actual</span>
            <div className={styles.saldo}>
              {formatSaldo(billetera.saldo_actual, billetera.moneda)}
            </div>
          </div>
        </div>
      </header>

      <nav className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'movimientos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('movimientos')}
        >
          Movimientos
        </button>
        {!billetera.es_efectivo && (
          <button 
            className={`${styles.tab} ${activeTab === 'tarjetas' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('tarjetas')}
          >
            Tarjetas de crédito
          </button>
        )}
      </nav>

      <main>
        {activeTab === 'movimientos' ? (
          <div className={styles.movimientosSection}>
            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={24} color="var(--text-3)" />
              </div>
            ) : movimientos.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CreditCard size={48} />
                </div>
                <h3 className={styles.emptyTitle}>Sin movimientos</h3>
                <p className={styles.emptyText}>
                  Esta billetera aún no tiene transacciones registradas.
                </p>
              </div>
            ) : (
              <div className={styles.movimientosList}>
                {groupedMovimientos.map(([fecha, txs]) => (
                  <DayGroup
                    key={fecha}
                    fecha={fecha}
                    transacciones={txs}
                    categorias={categorias}
                    billeteras={[billetera]}
                    onEdit={() => {}} // TODO: implementar edicion si es necesario
                    onDelete={() => {}} // TODO: implementar borrado
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.tarjetasSection}>
            <div className={styles.sectionHeader}>
              <h2>Tarjetas de crédito</h2>
              <Button onClick={handleCreateTarjeta}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Nueva tarjeta
              </Button>
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={24} color="var(--text-3)" />
              </div>
            ) : tarjetas.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CreditCard size={48} />
                </div>
                <h3 className={styles.emptyTitle}>Sin tarjetas registradas</h3>
                <p className={styles.emptyText}>
                  Agregá una tarjeta para que el sistema calcule automáticamente los vencimientos de tus cuotas.
                </p>
                <Button onClick={handleCreateTarjeta}>Agregar tarjeta</Button>
              </div>
            ) : (
              <div className={styles.cardsGrid}>
                {tarjetas.map(tarjeta => (
                  <TarjetaCard 
                    key={tarjeta.id} 
                    tarjeta={tarjeta} 
                    onEdit={handleEditTarjeta}
                    onArchive={handleArchiveTarjeta}
                    onDelete={handleDeleteTarjeta}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default BilleteraDetallePage
