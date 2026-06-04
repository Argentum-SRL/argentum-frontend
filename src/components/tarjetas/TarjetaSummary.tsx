import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import type { TarjetaCredito, ResumenTarjeta, CuotaResumen, Billetera, Categoria } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import transaccionService from '@/services/transaccion.service'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import { formatMonto } from '@/utils/format'
import styles from './TarjetaSummary.module.css'

interface TarjetaSummaryProps {
  tarjeta: TarjetaCredito
  billeteras: Billetera[]
  categorias: Categoria[]
  todasLasTarjetas: TarjetaCredito[]
  onRefresh?: () => void
}

interface TicketData {
  title: string
  cierre: string
  vencimiento: string
  cuotas: CuotaResumen[]
  total: number
  isFuture?: boolean
}

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date()
  const cleanDateStr = dateStr.split('T')[0]
  const parts = cleanDateStr.split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    return new Date(year, month, day)
  }
  return new Date(dateStr)
}

const TarjetaSummary: React.FC<TarjetaSummaryProps> = ({ 
  tarjeta, 
  billeteras, 
  categorias, 
  todasLasTarjetas,
  onRefresh 
}) => {
  const [resumen, setResumen] = useState<ResumenTarjeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { open, confirm } = useModal()
  const { showToast } = useToast()

  const fetchResumen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tarjetaService.getResumenTarjeta(tarjeta.id)
      setResumen(data)
      setActiveIndex(0)
    } catch (err: any) {
      console.error('Error fetching resumen:', err)
      setError('Error al cargar resúmenes.')
    } finally {
      setLoading(false)
    }
  }, [tarjeta.id])

  useEffect(() => {
    fetchResumen()
  }, [fetchResumen])

  const tickets: TicketData[] = useMemo(() => {
    if (!resumen) return []
    const list: TicketData[] = []

    list.push({
      title: 'Resumen Actual',
      cierre: resumen.fecha_cierre_proximo,
      vencimiento: resumen.fecha_vencimiento_proximo,
      cuotas: resumen.cuotas_resumen_actual,
      total: resumen.total_comprometido_resumen_actual
    })

    const proxCierre = parseLocalDate(resumen.fecha_cierre_proximo)
    proxCierre.setMonth(proxCierre.getMonth() + 1)
    const proxVenc = parseLocalDate(resumen.fecha_vencimiento_proximo)
    proxVenc.setMonth(proxVenc.getMonth() + 1)

    const toLocalYMD = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    list.push({
      title: 'Próximo Resumen',
      cierre: toLocalYMD(proxCierre),
      vencimiento: toLocalYMD(proxVenc),
      cuotas: resumen.cuotas_resumen_siguiente,
      total: resumen.total_comprometido_resumen_siguiente
    })

    resumen.resumenes_futuros.forEach(fut => {
      list.push({
        title: fut.mes,
        cierre: '',
        vencimiento: '',
        cuotas: fut.cuotas,
        total: fut.total,
        isFuture: true
      })
    })

    return list
  }, [resumen])

  const currentTicket = tickets[activeIndex]
  const handlePrev = () => setActiveIndex(prev => Math.max(0, prev - 1))
  const handleNext = () => setActiveIndex(prev => Math.min(tickets.length - 1, prev + 1))

  const handleEdit = async (cuota: CuotaResumen) => {
    try {
      const fullTx = await transaccionService.getTransaccion(cuota.id)
      open('transaccion', {
        data: {
          transaccion: fullTx,
          billeteras,
          categorias,
          tarjetas: todasLasTarjetas,
          onSuccess: () => {
            fetchResumen()
            if (onRefresh) onRefresh()
          }
        }
      })
    } catch (err) {
      showToast('No se pudo cargar la transacción para editar', 'error')
    }
  }

  const handleDelete = (cuota: CuotaResumen) => {
    confirm({
      title: '¿Eliminar transacción?',
      description: `Se eliminarán todas las cuotas asociadas a "${cuota.descripcion}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(cuota.id)
          showToast('Transacción eliminada correctamente', 'success')
          fetchResumen()
          if (onRefresh) onRefresh()
        } catch (err) {
          showToast('Error al eliminar la transacción', 'error')
        }
      }
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const isVencePronto = (dateStr: string) => {
    if (!dateStr) return false
    const venc = parseLocalDate(dateStr)
    const hoy = new Date()
    venc.setHours(0, 0, 0, 0)
    hoy.setHours(0, 0, 0, 0)
    const diff = venc.getTime() - hoy.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 5
  }

  if (loading) return <div className={styles.loadingSkeleton} />

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={32} color="var(--error)" />
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchResumen}>Reintentar</button>
      </div>
    )
  }

  if (!currentTicket) return null

  return (
    <div className={styles.summaryContainer}>
      {/* Navegación Compacta */}
      <div className={styles.ticketNav}>
        <button 
          className={styles.navBtn} 
          onClick={handlePrev} 
          disabled={activeIndex === 0}
        >
          <ChevronLeft size={16} />
        </button>
        <h4 className={styles.monthTitle}>{currentTicket.title}</h4>
        <button 
          className={styles.navBtn} 
          onClick={handleNext} 
          disabled={activeIndex === tickets.length - 1}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Ticket Físico Compacto */}
      <div className={styles.ticket} key={activeIndex}>
        <div className={styles.ticketHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.ticketLabel}>Extracto Argentum</span>
            <span className={styles.ticketDate}>
              {currentTicket.cierre ? `Cierre: ${formatDate(currentTicket.cierre)}` : 'Estimación Futura'}
            </span>
          </div>
        </div>

        <div className={styles.ticketContent}>
          {currentTicket.cuotas.length > 0 ? (
            currentTicket.cuotas.map((cuota, idx) => (
              <div key={idx} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{cuota.descripcion}</span>
                  <span className={styles.itemSub}>
                    Cuota {cuota.numero_cuota}/{cuota.total_cuotas}
                    {cuota.subcategoria_nombre && cuota.subcategoria_nombre !== cuota.descripcion && (
                      <> • {cuota.subcategoria_nombre}</>
                    )}
                  </span>
                </div>
                <div className={styles.itemMontoContainer}>
                  <span className={styles.itemMonto}>{formatMonto(cuota.monto, cuota.moneda)}</span>
                  <div className={styles.itemActions}>
                    <button 
                      className={styles.actionBtn} 
                      onClick={() => handleEdit(cuota)}
                      title="Editar"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className={styles.actionBtn} 
                      onClick={() => handleDelete(cuota)}
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Sin movimientos</div>
          )}
        </div>

        <div className={styles.ticketFooter}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>
              {formatMonto(currentTicket.total, tarjeta.moneda)}
            </span>
          </div>
          
          {currentTicket.vencimiento && (
            <div className={`${styles.vencimientoRow} ${isVencePronto(currentTicket.vencimiento) ? styles.vencimientoUrgent : ''}`}>
              <span className={styles.vencimientoLabel}>Vencimiento</span>
              <span className={styles.vencimientoValue}>
                {formatDate(currentTicket.vencimiento)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TarjetaSummary
