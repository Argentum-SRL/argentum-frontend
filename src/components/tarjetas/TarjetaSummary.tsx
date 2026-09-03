import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Edit2, Trash2, ChevronDown, ChevronUp, CreditCard } from 'lucide-react'
import type { TarjetaCredito, ResumenTarjeta, CuotaResumen, Billetera, Categoria, ItemSaldoArrastrado, PagarTarjetaPayload } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import transaccionService from '@/services/transaccion.service'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatMonto } from '@/utils/format'
import { EmptyState } from '@/components/ui'
import PagarResumenModal from './PagarResumenModal'
import styles from './TarjetaSummary.module.css'

interface TarjetaSummaryProps {
  tarjeta: TarjetaCredito
  billeteras: Billetera[]
  categorias: Categoria[]
  todasLasTarjetas: TarjetaCredito[]
  onRefresh?: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

interface TicketData {
  title: string
  cierre: string
  vencimiento: string
  cuotas: CuotaResumen[]
  total: number
  totalOriginal?: number
  totalVencidoAnterior?: number
  saldoArrastrado?: number
  itemsSaldoArrastrado?: ItemSaldoArrastrado[]
  totalAPagar?: number
  pagoMinimoEstimado?: number
  pagoMinimoAclaracion?: string
  isFuture?: boolean
  isPast?: boolean
  pagado?: boolean
  // Multimoneda
  totalARS?: number
  totalUSD?: number
  totalVencidoAnteriorARS?: number
  totalVencidoAnteriorUSD?: number
  saldoArrastradoARS?: number
  saldoArrastradoUSD?: number
  itemsSaldoArrastradoARS?: ItemSaldoArrastrado[]
  itemsSaldoArrastradoUSD?: ItemSaldoArrastrado[]
  totalAPagarARS?: number
  totalAPagarUSD?: number
  pagoMinimoARS?: number
  pagoMinimoUSD?: number
  cotizacionOficialUSD?: number | null
  porcentajePercepcionUSD?: number | null
  totalEstimadoARSUSD?: number | null
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
  onRefresh,
  isExpanded = false,
  onToggleExpand
}) => {
  const [resumen, setResumen] = useState<ResumenTarjeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaying, setIsPaying] = useState(false)
  const [isPagarModalOpen, setIsPagarModalOpen] = useState(false)
  const [payingTicket, setPayingTicket] = useState<TicketData | null>(null)
  const [payingMoneda, setPayingMoneda] = useState<'ARS' | 'USD'>('ARS')
  const { open, confirm } = useModal()
  const { showToast } = useToast()

  const handleOpenPagarModal = (ticket: TicketData, moneda: 'ARS' | 'USD' = 'ARS') => {
    setPayingTicket(ticket)
    setPayingMoneda(moneda)
    setIsPagarModalOpen(true)
  }

  const handleConfirmarPago = async (payload: PagarTarjetaPayload) => {
    if (!payingTicket) return
    setIsPaying(true)
    try {
      await tarjetaService.pagarResumenTarjeta(tarjeta.id, {
        ...payload,
        fecha_resumen: payingTicket.vencimiento
      })
      showToast('Pago de resumen registrado con éxito', 'success')
      setIsPagarModalOpen(false)
      fetchResumen()
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      console.error(err)
      showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    } finally {
      setIsPaying(false)
    }
  }

  const fetchResumen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tarjetaService.getResumenTarjeta(tarjeta.id)
      setResumen(data)
      const actualIdx = data.resumenes_anteriores?.length || 0
      setActiveIndex(actualIdx)
    } catch (err: unknown) {
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

    // 1. Prepend past statements
    if (resumen.resumenes_anteriores) {
      resumen.resumenes_anteriores.forEach(ant => {
        list.push({
          title: ant.mes,
          cierre: ant.fecha_cierre,
          vencimiento: ant.fecha_vencimiento,
          cuotas: ant.cuotas,
          total: Number(ant.total),
          totalARS: ant.total_ars !== undefined ? Number(ant.total_ars) : (ant.moneda === 'ARS' ? Number(ant.total) : 0),
          totalUSD: ant.total_usd !== undefined ? Number(ant.total_usd) : (ant.moneda === 'USD' ? Number(ant.total) : 0),
          isPast: true,
          pagado: ant.pagado
        })
      })
    }

    // 2. Add current statement
    const bARS = resumen.totales_por_moneda?.ARS
    const bUSD = resumen.totales_por_moneda?.USD

    const tPagarARS = bARS ? Number(bARS.total_a_pagar) : (resumen.total_actual_ars !== undefined ? Number(resumen.total_actual_ars) : 0)
    const tPagarUSD = bUSD ? Number(bUSD.total_a_pagar) : (resumen.total_actual_usd !== undefined ? Number(resumen.total_actual_usd) : 0)

    list.push({
      title: 'Resumen Actual',
      cierre: resumen.fecha_cierre_proximo,
      vencimiento: resumen.fecha_vencimiento_proximo,
      cuotas: resumen.cuotas_resumen_actual,
      total: Number(resumen.total_comprometido_resumen_actual),
      totalOriginal: resumen.total_original_resumen_actual !== undefined ? Number(resumen.total_original_resumen_actual) : undefined,
      totalVencidoAnterior: resumen.total_deuda_vencida_anterior !== undefined ? Number(resumen.total_deuda_vencida_anterior) : undefined,
      saldoArrastrado: resumen.saldo_arrastrado_impago !== undefined ? Number(resumen.saldo_arrastrado_impago) : 0,
      itemsSaldoArrastrado: resumen.items_saldo_arrastrado || [],
      totalAPagar: resumen.total_a_pagar_resumen_actual !== undefined ? Number(resumen.total_a_pagar_resumen_actual) : undefined,
      pagoMinimoEstimado: resumen.pago_minimo_estimado !== undefined ? Number(resumen.pago_minimo_estimado) : 0,
      pagoMinimoAclaracion: resumen.pago_minimo_aclaracion,
      // Multimoneda
      totalARS: bARS ? Number(bARS.total_cuotas_periodo) : Number(resumen.total_actual_ars || 0),
      totalUSD: bUSD ? Number(bUSD.total_cuotas_periodo) : Number(resumen.total_actual_usd || 0),
      totalVencidoAnteriorARS: bARS ? Number(bARS.total_deuda_vencida_anterior) : 0,
      totalVencidoAnteriorUSD: bUSD ? Number(bUSD.total_deuda_vencida_anterior) : 0,
      saldoArrastradoARS: bARS ? Number(bARS.saldo_arrastrado_impago) : 0,
      saldoArrastradoUSD: bUSD ? Number(bUSD.saldo_arrastrado_impago) : 0,
      itemsSaldoArrastradoARS: bARS?.items_saldo_arrastrado || [],
      itemsSaldoArrastradoUSD: bUSD?.items_saldo_arrastrado || [],
      totalAPagarARS: tPagarARS,
      totalAPagarUSD: tPagarUSD,
      pagoMinimoARS: bARS ? Number(bARS.pago_minimo_estimado) : 0,
      pagoMinimoUSD: bUSD ? Number(bUSD.pago_minimo_estimado) : 0,
      cotizacionOficialUSD: bUSD?.cotizacion_oficial_estimada,
      porcentajePercepcionUSD: bUSD?.porcentaje_percepcion,
      totalEstimadoARSUSD: bUSD?.total_estimado_ars ? Number(bUSD.total_estimado_ars) : null
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

    // 3. Add next statement
    list.push({
      title: 'Próximo Resumen',
      cierre: toLocalYMD(proxCierre),
      vencimiento: toLocalYMD(proxVenc),
      cuotas: resumen.cuotas_resumen_siguiente,
      total: Number(resumen.total_comprometido_resumen_siguiente),
      totalOriginal: resumen.total_original_resumen_siguiente !== undefined ? Number(resumen.total_original_resumen_siguiente) : undefined
    })

    // 4. Add future statements
    resumen.resumenes_futuros.forEach(fut => {
      list.push({
        title: fut.mes,
        cierre: '',
        vencimiento: '',
        cuotas: fut.cuotas || [],
        total: Number(fut.total),
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
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
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
        } catch (err: unknown) {
          showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
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
          aria-label="Resumen anterior"
          title="Resumen anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <h4 className={styles.monthTitle}>{currentTicket.title}</h4>
        <button 
          className={styles.navBtn} 
          onClick={handleNext} 
          disabled={activeIndex === tickets.length - 1}
          aria-label="Siguiente resumen"
          title="Siguiente resumen"
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

        {isExpanded && (
          <div className={styles.ticketContent}>
            {/* Saldo Arrastrado (Financiado) diferenciado de consumos (Tarea 3.2 y 7.5) */}
            {currentTicket.itemsSaldoArrastrado && currentTicket.itemsSaldoArrastrado.length > 0 && (
              currentTicket.itemsSaldoArrastrado.map((item) => (
                <div key={item.id} className={`${styles.itemRow} ${styles.itemRowFinanciado}`}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitleWrapper}>
                      <span className={styles.itemTitle}>{item.descripcion}</span>
                      <span className={styles.badgeFinanciado}>Deuda refinanciada</span>
                    </div>
                    <span className={styles.itemSub}>
                      Monto inicial: {formatMonto(item.monto_inicial, item.moneda)} • Saldo impago restante
                    </span>
                  </div>
                  <div className={styles.itemMontoContainer}>
                    <span className={styles.itemMonto}>{formatMonto(item.monto_restante, item.moneda)}</span>
                  </div>
                </div>
              ))
            )}

            {currentTicket.cuotas.length > 0 ? (
              currentTicket.cuotas.map((cuota, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={`${styles.itemTitle} ${cuota.pagada ? styles.itemTitlePaid : ''}`}>{cuota.descripcion}</span>
                    <span className={styles.itemSub}>
                      Cuota {cuota.numero_cuota}/{cuota.total_cuotas}
                      {(cuota.subcategoria_nombre || 'General') !== cuota.descripcion && (
                        <> • {cuota.subcategoria_nombre || 'General'}</>
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
            ) : (!currentTicket.itemsSaldoArrastrado || currentTicket.itemsSaldoArrastrado.length === 0) ? (
              <EmptyState
                variant="compact"
                icon={CreditCard}
                title="Sin movimientos"
              />
            ) : null}
          </div>
        )}

        <div className={styles.ticketFooter}>
          {(() => {
            const hasARS = (currentTicket.totalARS && currentTicket.totalARS > 0) || (currentTicket.totalAPagarARS && currentTicket.totalAPagarARS > 0)
            const hasUSD = (currentTicket.totalUSD && currentTicket.totalUSD > 0) || (currentTicket.totalAPagarUSD && currentTicket.totalAPagarUSD > 0)
            const isBimonetario = hasARS && hasUSD

            if (isBimonetario) {
              return (
                <>
                  {/* Bloque ARS */}
                  <div className={styles.monedaBlock}>
                    <div className={styles.monedaBlockHeader}>
                      <span className={styles.monedaBadge}>Pesos (ARS)</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total cuotas (ARS)</span>
                      <span className={styles.totalValue}>{formatMonto(currentTicket.totalARS || 0, 'ARS')}</span>
                    </div>
                    {currentTicket.totalVencidoAnteriorARS !== undefined && currentTicket.totalVencidoAnteriorARS > 0 && (
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Deuda vencida anterior</span>
                        <span className={styles.totalValue}>{formatMonto(currentTicket.totalVencidoAnteriorARS, 'ARS')}</span>
                      </div>
                    )}
                    {currentTicket.saldoArrastradoARS !== undefined && currentTicket.saldoArrastradoARS > 0 && (
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Saldo financiado anterior</span>
                        <span className={styles.totalValue}>{formatMonto(currentTicket.saldoArrastradoARS, 'ARS')}</span>
                      </div>
                    )}
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel} style={{ fontWeight: 800 }}>Total a pagar (ARS)</span>
                      <span className={styles.totalValue} style={{ fontWeight: 800 }}>{formatMonto(currentTicket.totalAPagarARS || 0, 'ARS')}</span>
                    </div>
                    {currentTicket.pagoMinimoARS !== undefined && currentTicket.pagoMinimoARS > 0 && (
                      <div className={styles.minimoRow}>
                        <div className={styles.minimoTop}>
                          <span className={styles.minimoLabel}>
                            Pago mínimo estimado (ARS)
                            <span className={styles.minimoTag}>Estimado</span>
                          </span>
                          <span className={styles.minimoVal}>{formatMonto(currentTicket.pagoMinimoARS, 'ARS')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloque USD */}
                  <div className={styles.monedaBlock}>
                    <div className={styles.monedaBlockHeader}>
                      <span className={styles.monedaBadge}>Dólares (USD)</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total cuotas (USD)</span>
                      <span className={styles.totalValue}>{formatMonto(currentTicket.totalUSD || 0, 'USD')}</span>
                    </div>
                    {currentTicket.totalVencidoAnteriorUSD !== undefined && currentTicket.totalVencidoAnteriorUSD > 0 && (
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Deuda vencida anterior</span>
                        <span className={styles.totalValue}>{formatMonto(currentTicket.totalVencidoAnteriorUSD, 'USD')}</span>
                      </div>
                    )}
                    {currentTicket.saldoArrastradoUSD !== undefined && currentTicket.saldoArrastradoUSD > 0 && (
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Saldo financiado anterior</span>
                        <span className={styles.totalValue}>{formatMonto(currentTicket.saldoArrastradoUSD, 'USD')}</span>
                      </div>
                    )}
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel} style={{ fontWeight: 800 }}>Total a pagar (USD)</span>
                      <span className={styles.totalValue} style={{ fontWeight: 800 }}>{formatMonto(currentTicket.totalAPagarUSD || 0, 'USD')}</span>
                    </div>
                    {currentTicket.totalEstimadoARSUSD !== undefined && currentTicket.totalEstimadoARSUSD !== null && (
                      <div className={styles.monedaEstimacionRow}>
                        <span className={styles.monedaEstimacionVal}>
                          ≈ {formatMonto(currentTicket.totalEstimadoARSUSD, 'ARS')}
                        </span>
                        <span className={styles.monedaEstimacionTag}>
                          (Estimación oficial {currentTicket.cotizacionOficialUSD ? `$${currentTicket.cotizacionOficialUSD}` : ''} + {currentTicket.porcentajePercepcionUSD ?? 30}% percepción)
                        </span>
                      </div>
                    )}
                    {currentTicket.pagoMinimoUSD !== undefined && currentTicket.pagoMinimoUSD > 0 && (
                      <div className={styles.minimoRow}>
                        <div className={styles.minimoTop}>
                          <span className={styles.minimoLabel}>
                            Pago mínimo estimado (USD)
                            <span className={styles.minimoTag}>Estimado</span>
                          </span>
                          <span className={styles.minimoVal}>{formatMonto(currentTicket.pagoMinimoUSD, 'USD')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            }

            const ticketMoneda = (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda
            return (
              <>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>
                    {currentTicket.totalOriginal !== undefined && currentTicket.totalOriginal > currentTicket.total
                      ? 'Total cuotas pendiente'
                      : 'Total cuotas'}
                  </span>
                  <span className={styles.totalValue}>
                    {formatMonto(currentTicket.total, ticketMoneda)}
                  </span>
                </div>

                {currentTicket.totalVencidoAnterior !== undefined && currentTicket.totalVencidoAnterior > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Deuda vencida anterior</span>
                    <span className={styles.totalValue}>
                      {formatMonto(currentTicket.totalVencidoAnterior, ticketMoneda)}
                    </span>
                  </div>
                )}

                {currentTicket.saldoArrastrado !== undefined && currentTicket.saldoArrastrado > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Saldo financiado anterior</span>
                    <span className={styles.totalValue}>
                      {formatMonto(currentTicket.saldoArrastrado, ticketMoneda)}
                    </span>
                  </div>
                )}

                {currentTicket.totalAPagar !== undefined && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total a pagar</span>
                    <span className={styles.totalValue}>
                      {formatMonto(currentTicket.totalAPagar, ticketMoneda)}
                    </span>
                  </div>
                )}

                {ticketMoneda === 'USD' && currentTicket.totalEstimadoARSUSD !== undefined && currentTicket.totalEstimadoARSUSD !== null && (
                  <div className={styles.monedaEstimacionRow}>
                    <span className={styles.monedaEstimacionVal}>
                      ≈ {formatMonto(currentTicket.totalEstimadoARSUSD, 'ARS')}
                    </span>
                    <span className={styles.monedaEstimacionTag}>
                      (Estimación oficial {currentTicket.cotizacionOficialUSD ? `$${currentTicket.cotizacionOficialUSD}` : ''} + {currentTicket.porcentajePercepcionUSD ?? 30}% percepción)
                    </span>
                  </div>
                )}

                {currentTicket.pagoMinimoEstimado !== undefined && currentTicket.pagoMinimoEstimado > 0 && (
                  <div className={styles.minimoRow}>
                    <div className={styles.minimoTop}>
                      <span className={styles.minimoLabel}>
                        Pago mínimo estimado
                        <span className={styles.minimoTag}>Estimado</span>
                      </span>
                      <span className={styles.minimoVal}>
                        {formatMonto(currentTicket.pagoMinimoEstimado, ticketMoneda)}
                      </span>
                    </div>
                    <span className={styles.minimoAclaracion}>
                      {currentTicket.pagoMinimoAclaracion || 'Monto de referencia orientativo. El valor definitivo lo establece la entidad bancaria en el resumen de cuenta.'}
                    </span>
                  </div>
                )}
              </>
            )
          })()}
          
          {currentTicket.vencimiento && (
            <div className={`${styles.vencimientoRow} ${isVencePronto(currentTicket.vencimiento) ? styles.vencimientoUrgent : ''}`}>
              <span className={styles.vencimientoLabel}>Vencimiento</span>
              <span className={styles.vencimientoValue}>
                {formatDate(currentTicket.vencimiento)}
              </span>
            </div>
          )}

          {(currentTicket.isPast || currentTicket.title === 'Resumen Actual') && (
            (() => {
              const hasARS = (currentTicket.totalARS && currentTicket.totalARS > 0) || (currentTicket.totalAPagarARS && currentTicket.totalAPagarARS > 0)
              const hasUSD = (currentTicket.totalUSD && currentTicket.totalUSD > 0) || (currentTicket.totalAPagarUSD && currentTicket.totalAPagarUSD > 0)
              const isBimonetario = hasARS && hasUSD

              const isPaid = currentTicket.pagado || (
                currentTicket.cuotas.length > 0 && 
                currentTicket.cuotas.every(c => c.pagada) && 
                (!currentTicket.saldoArrastrado || currentTicket.saldoArrastrado === 0)
              )
              if (isPaid) {
                return (
                  <div className={styles.paidBadge}>
                    Resumen Pagado
                  </div>
                )
              }

              if (isBimonetario) {
                return (
                  <div className={styles.buttonsRow}>
                    {(currentTicket.totalAPagarARS || 0) > 0 && (
                      <button
                        type="button"
                        className={styles.payBtn}
                        onClick={() => handleOpenPagarModal(currentTicket, 'ARS')}
                        disabled={isPaying}
                      >
                        {isPaying ? 'Procesando...' : 'Pagar Pesos'}
                      </button>
                    )}
                    {(currentTicket.totalAPagarUSD || 0) > 0 && (
                      <button
                        type="button"
                        className={styles.payBtnSecondary}
                        onClick={() => handleOpenPagarModal(currentTicket, 'USD')}
                        disabled={isPaying}
                      >
                        {isPaying ? 'Procesando...' : 'Pagar Dólares'}
                      </button>
                    )}
                  </div>
                )
              }

              const targetMoneda = (hasUSD && !hasARS) ? 'USD' : 'ARS'
              return (
                <button 
                  type="button" 
                  className={styles.payBtn} 
                  onClick={() => handleOpenPagarModal(currentTicket, targetMoneda)}
                  disabled={isPaying}
                >
                  {isPaying ? 'Procesando...' : (targetMoneda === 'USD' ? 'Pagar Dólares' : 'Pagar Tarjeta')}
                </button>
              )
            })()
          )}

          {onToggleExpand && (
            <button 
              type="button" 
              className={styles.expandBtn} 
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <>Ocultar detalle <ChevronUp size={14} /></>
              ) : (
                <>Ver resumen completo <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>
      </div>

      {payingTicket && (
        <PagarResumenModal
          isOpen={isPagarModalOpen}
          onClose={() => setIsPagarModalOpen(false)}
          tarjeta={tarjeta}
          monedaAPagar={payingMoneda}
          billeteras={billeteras}
          totalAPagar={
            payingMoneda === 'USD'
              ? (payingTicket.totalAPagarUSD ?? payingTicket.totalUSD ?? 0)
              : (payingTicket.totalAPagarARS ?? payingTicket.totalAPagar ?? payingTicket.total)
          }
          cuotasPeriodo={payingMoneda === 'USD' ? (payingTicket.totalUSD || 0) : (payingTicket.totalARS || payingTicket.total)}
          deudaVencidaAnterior={payingMoneda === 'USD' ? (payingTicket.totalVencidoAnteriorUSD || 0) : (payingTicket.totalVencidoAnteriorARS || payingTicket.totalVencidoAnterior || 0)}
          saldoArrastrado={payingMoneda === 'USD' ? (payingTicket.saldoArrastradoUSD || 0) : (payingTicket.saldoArrastradoARS || payingTicket.saldoArrastrado || 0)}
          pagoMinimoEstimado={payingMoneda === 'USD' ? (payingTicket.pagoMinimoUSD || 0) : (payingTicket.pagoMinimoARS || payingTicket.pagoMinimoEstimado || 0)}
          pagoMinimoAclaracion={payingTicket.pagoMinimoAclaracion}
          cotizacionOficialPropuesta={payingTicket.cotizacionOficialUSD}
          porcentajePercepcion={payingTicket.porcentajePercepcionUSD}
          onConfirm={handleConfirmarPago}
          isPaying={isPaying}
        />
      )}
    </div>
  )
}

export default TarjetaSummary
