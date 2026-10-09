import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CreditCard, Calendar, Clock, CheckCircle2 } from '@/components/ui/icons'
import type { TarjetaCredito, ResumenTarjeta, CuotaResumen, Billetera, ItemSaldoArrastrado, PagarTarjetaPayload } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatMonto } from '@/utils/format'
import { EmptyState } from '@/components/ui'
import PagarResumenModal from './PagarResumenModal'
import DebitoAutomaticoBadge from '@/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge'
import styles from './TarjetaSummary.module.css'

interface TarjetaSummaryProps {
  tarjeta: TarjetaCredito
  billeteras: Billetera[]
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

  const handleOpenPagarModal = (ticket: TicketData, moneda: 'ARS' | 'USD' = 'ARS') => {
    setPayingTicket(ticket)
    setPayingMoneda(moneda)
    setIsPagarModalOpen(true)
  }

  const handleConfirmarPago = async (payload: PagarTarjetaPayload) => {
    if (!payingTicket) return
    setIsPaying(true)
    try {
      const res = await tarjetaService.pagarResumenTarjeta(tarjeta.id, {
        ...payload,
        fecha_resumen: payingTicket.vencimiento
      })
      // Aviso de éxito según respuesta del servidor
      if (res?.monto_diferencia && Number(res.monto_diferencia) > 0) {
        const tipoLabel = payload.diferencia_tipo === 'cargos_banco' ? 'Cargos del banco' : 'Compras no cargadas'
        sileo.success({
          title: `Pago registrado. ${formatMonto(res.monto_diferencia, payload.moneda || 'ARS')} quedaron como ${tipoLabel}.`
        })
      } else {
        sileo.success({ title: 'Pago de resumen registrado con éxito' })
      }
      setIsPagarModalOpen(false)
      fetchResumen()
      if (onRefresh) onRefresh()
      return res
    } catch (err: unknown) {
      console.error(err)
      sileo.error({ title: getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.') })
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

    // 3. Append next statement
    const bFutureUSD = resumen.totales_por_moneda?.USD
    const futARS = Number(resumen.total_siguiente_ars ?? (tarjeta.moneda === 'ARS' ? resumen.total_comprometido_resumen_siguiente : 0))
    const futUSD = Number(resumen.total_siguiente_usd ?? (tarjeta.moneda === 'USD' ? resumen.total_comprometido_resumen_siguiente : 0))

    list.push({
      title: 'Próximo Resumen',
      cierre: proxCierre.toISOString(),
      vencimiento: proxVenc.toISOString(),
      cuotas: resumen.cuotas_resumen_siguiente || [],
      total: Number(resumen.total_comprometido_resumen_siguiente),
      isFuture: true,
      totalARS: futARS,
      totalUSD: futUSD,
      cotizacionOficialUSD: bFutureUSD?.cotizacion_oficial_estimada,
      porcentajePercepcionUSD: bFutureUSD?.porcentaje_percepcion,
      totalEstimadoARSUSD: bFutureUSD?.total_estimado_ars ? Number(bFutureUSD.total_estimado_ars) : null
    })

    return list
  }, [resumen, tarjeta.moneda])

  const currentTicket = tickets[activeIndex]

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(i => i - 1)
  }

  const handleNext = () => {
    if (activeIndex < tickets.length - 1) setActiveIndex(i => i + 1)
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

  const totalConsumosCount = currentTicket.cuotas.length + (currentTicket.itemsSaldoArrastrado?.length || 0)

  return (
    <div className={styles.summaryContainer}>
      {/* Selector de Mes / Ciclo */}
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
        <div className={styles.navCenter}>
          <h4 className={styles.monthTitle}>{currentTicket.title}</h4>
          <span className={styles.navSubtitle}>
            {currentTicket.cierre ? `Cierre: ${formatDate(currentTicket.cierre)}` : 'Estimación Futura'}
          </span>
        </div>
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

      {/* Tarjeta de Resumen */}
      <div className={styles.summaryCard} key={activeIndex}>
        {/* Lista de consumos (solo cuando está expandido) */}
        {isExpanded && (
          <div className={styles.itemListContainer}>
            <div className={styles.itemsHeaderRow}>
              <span className={styles.itemsHeaderTitle}>Consumos del período</span>
              <span className={styles.itemsCountBadge}>
                {totalConsumosCount} {totalConsumosCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            <div className={styles.itemList}>
              {/* Saldo Arrastrado / Financiado */}
              {currentTicket.itemsSaldoArrastrado && currentTicket.itemsSaldoArrastrado.length > 0 && (
                currentTicket.itemsSaldoArrastrado.map((item) => (
                  <div key={item.id} className={`${styles.itemRow} ${styles.itemRowFinanciado}`}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>{item.descripcion}</span>
                        <span className={styles.badgeFinanciado}>Financiado</span>
                      </div>
                      <span className={styles.itemSub}>
                        Monto inicial: {formatMonto(item.monto_inicial, item.moneda)} • Saldo impago restante
                      </span>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={styles.itemMonto}>{formatMonto(item.monto_restante, item.moneda)}</span>
                    </div>
                  </div>
                ))
              )}

              {/* Cuotas del período */}
              {currentTicket.cuotas.length > 0 ? (
                currentTicket.cuotas.map((cuota, idx) => (
                  <div key={cuota.id || idx} className={styles.itemRow}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitleRow}>
                        <span className={`${styles.itemTitle} ${cuota.pagada ? styles.itemTitlePaid : ''}`}>
                          {cuota.descripcion}
                        </span>
                        {Boolean(cuota.suscripcion_id) && <DebitoAutomaticoBadge />}
                      </div>
                      <span className={styles.itemSub}>
                        Cuota {cuota.numero_cuota}/{cuota.total_cuotas}
                        {(cuota.subcategoria_nombre || 'General') !== cuota.descripcion && (
                          <> • {cuota.subcategoria_nombre || 'General'}</>
                        )}
                      </span>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={styles.itemMonto}>{formatMonto(cuota.monto, cuota.moneda)}</span>
                    </div>
                  </div>
                ))
              ) : (!currentTicket.itemsSaldoArrastrado || currentTicket.itemsSaldoArrastrado.length === 0) ? (
                <EmptyState
                  variant="compact"
                  icon={CreditCard}
                  title="Sin movimientos en este período"
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Totales y Liquidación */}
        <div className={styles.summaryFooter}>
          {(() => {
            const hasARS = (currentTicket.totalARS && currentTicket.totalARS > 0) || (currentTicket.totalAPagarARS && currentTicket.totalAPagarARS > 0)
            const hasUSD = (currentTicket.totalUSD && currentTicket.totalUSD > 0) || (currentTicket.totalAPagarUSD && currentTicket.totalAPagarUSD > 0)
            const isBimonetario = hasARS && hasUSD

            if (isBimonetario) {
              return (
                <div className={styles.bimonedaContainer}>
                  {/* Bloque Pesos */}
                  <div className={styles.monedaBlock}>
                    <div className={styles.monedaBlockHeader}>
                      <span className={styles.monedaBadge}>Pesos (ARS)</span>
                    </div>
                    {/* Solo mostrar desglose si hay deuda anterior o saldo financiado */}
                    {((currentTicket.totalVencidoAnteriorARS || 0) > 0 || (currentTicket.saldoArrastradoARS || 0) > 0) && (
                      <div className={styles.breakdownList}>
                        <div className={styles.breakdownRow}>
                          <span>Cuotas del período</span>
                          <span>{formatMonto(currentTicket.totalARS || 0, 'ARS')}</span>
                        </div>
                        {(currentTicket.totalVencidoAnteriorARS || 0) > 0 && (
                          <div className={styles.breakdownRow}>
                            <span>Deuda anterior</span>
                            <span className={styles.debtValue}>+{formatMonto(currentTicket.totalVencidoAnteriorARS!, 'ARS')}</span>
                          </div>
                        )}
                        {(currentTicket.saldoArrastradoARS || 0) > 0 && (
                          <div className={styles.breakdownRow}>
                            <span>Saldo financiado</span>
                            <span className={styles.debtValue}>+{formatMonto(currentTicket.saldoArrastradoARS!, 'ARS')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={styles.heroTotalRow}>
                      <span className={styles.heroTotalLabel}>Total a pagar</span>
                      <span className={styles.heroTotalValue}>{formatMonto(currentTicket.totalAPagarARS || 0, 'ARS')}</span>
                    </div>
                    {currentTicket.pagoMinimoARS !== undefined && currentTicket.pagoMinimoARS > 0 && (
                      <div className={styles.minimoRow}>
                        <span className={styles.minimoLabel}>
                          Pago mínimo
                          <span className={styles.minimoTag}>Estimado</span>
                        </span>
                        <span className={styles.minimoVal}>{formatMonto(currentTicket.pagoMinimoARS, 'ARS')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bloque Dólares */}
                  <div className={styles.monedaBlock}>
                    <div className={styles.monedaBlockHeader}>
                      <span className={styles.monedaBadge}>Dólares (USD)</span>
                    </div>
                    {/* Solo mostrar desglose si hay deuda anterior o saldo financiado */}
                    {((currentTicket.totalVencidoAnteriorUSD || 0) > 0 || (currentTicket.saldoArrastradoUSD || 0) > 0) && (
                      <div className={styles.breakdownList}>
                        <div className={styles.breakdownRow}>
                          <span>Cuotas del período</span>
                          <span>{formatMonto(currentTicket.totalUSD || 0, 'USD')}</span>
                        </div>
                        {(currentTicket.totalVencidoAnteriorUSD || 0) > 0 && (
                          <div className={styles.breakdownRow}>
                            <span>Deuda anterior</span>
                            <span className={styles.debtValue}>+{formatMonto(currentTicket.totalVencidoAnteriorUSD!, 'USD')}</span>
                          </div>
                        )}
                        {(currentTicket.saldoArrastradoUSD || 0) > 0 && (
                          <div className={styles.breakdownRow}>
                            <span>Saldo financiado</span>
                            <span className={styles.debtValue}>+{formatMonto(currentTicket.saldoArrastradoUSD!, 'USD')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={styles.heroTotalRow}>
                      <span className={styles.heroTotalLabel}>Total a pagar</span>
                      <span className={styles.heroTotalValue}>{formatMonto(currentTicket.totalAPagarUSD || 0, 'USD')}</span>
                    </div>
                    {currentTicket.totalEstimadoARSUSD !== undefined && currentTicket.totalEstimadoARSUSD !== null && (
                      <div className={styles.monedaEstimacionRow}>
                        <span className={styles.monedaEstimacionVal}>
                          ≈ {formatMonto(currentTicket.totalEstimadoARSUSD, 'ARS')}
                        </span>
                        <span className={styles.monedaEstimacionTag}>
                          (Oficial ${currentTicket.cotizacionOficialUSD || ''} + {currentTicket.porcentajePercepcionUSD ?? 30}%)
                        </span>
                      </div>
                    )}
                    {currentTicket.pagoMinimoUSD !== undefined && currentTicket.pagoMinimoUSD > 0 && (
                      <div className={styles.minimoRow}>
                        <span className={styles.minimoLabel}>
                          Pago mínimo
                          <span className={styles.minimoTag}>Estimado</span>
                        </span>
                        <span className={styles.minimoVal}>{formatMonto(currentTicket.pagoMinimoUSD, 'USD')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            const ticketMoneda = (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda
            const hasPriorDebt = (currentTicket.totalVencidoAnterior !== undefined && currentTicket.totalVencidoAnterior > 0)
            const hasRefinanced = (currentTicket.saldoArrastrado !== undefined && currentTicket.saldoArrastrado > 0)
            const hasBreakdown = hasPriorDebt || hasRefinanced
            const displayTotal = currentTicket.totalAPagar !== undefined ? currentTicket.totalAPagar : currentTicket.total

            return (
              <div className={styles.singleMonedaBlock}>
                {/* Desglose solo si hay diferencias reales que justifiquen sumar */}
                {hasBreakdown && (
                  <div className={styles.breakdownList}>
                    <div className={styles.breakdownRow}>
                      <span>Cuotas del período</span>
                      <span>{formatMonto(currentTicket.total, ticketMoneda)}</span>
                    </div>
                    {hasPriorDebt && (
                      <div className={styles.breakdownRow}>
                        <span>Deuda anterior</span>
                        <span className={styles.debtValue}>+{formatMonto(currentTicket.totalVencidoAnterior!, ticketMoneda)}</span>
                      </div>
                    )}
                    {hasRefinanced && (
                      <div className={styles.breakdownRow}>
                        <span>Saldo financiado</span>
                        <span className={styles.debtValue}>+{formatMonto(currentTicket.saldoArrastrado!, ticketMoneda)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total principal unificado */}
                <div className={styles.heroTotalRow}>
                  <span className={styles.heroTotalLabel}>Total a pagar</span>
                  <span className={styles.heroTotalValue}>
                    {formatMonto(displayTotal, ticketMoneda)}
                  </span>
                </div>

                {ticketMoneda === 'USD' && currentTicket.totalEstimadoARSUSD !== undefined && currentTicket.totalEstimadoARSUSD !== null && (
                  <div className={styles.monedaEstimacionRow}>
                    <span className={styles.monedaEstimacionVal}>
                      ≈ {formatMonto(currentTicket.totalEstimadoARSUSD, 'ARS')}
                    </span>
                    <span className={styles.monedaEstimacionTag}>
                      (Oficial ${currentTicket.cotizacionOficialUSD || ''} + {currentTicket.porcentajePercepcionUSD ?? 30}%)
                    </span>
                  </div>
                )}

                {currentTicket.pagoMinimoEstimado !== undefined && currentTicket.pagoMinimoEstimado > 0 && (
                  <div className={styles.minimoRow}>
                    <span className={styles.minimoLabel}>
                      Pago mínimo
                      <span className={styles.minimoTag}>Estimado</span>
                    </span>
                    <span className={styles.minimoVal}>
                      {formatMonto(currentTicket.pagoMinimoEstimado, ticketMoneda)}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}
          
          {(() => {
            const hasARS = Boolean((currentTicket.totalARS && currentTicket.totalARS > 0) || (currentTicket.totalAPagarARS && currentTicket.totalAPagarARS > 0))
            const hasUSD = Boolean((currentTicket.totalUSD && currentTicket.totalUSD > 0) || (currentTicket.totalAPagarUSD && currentTicket.totalAPagarUSD > 0))
            const isPaid = Boolean(
              currentTicket.pagado || (
                currentTicket.cuotas.length > 0 && 
                currentTicket.cuotas.every(c => c.pagada) && 
                (!currentTicket.saldoArrastrado || currentTicket.saldoArrastrado === 0)
              )
            )
            const sinNadaParaPagar = !hasARS && !hasUSD && !isPaid
            const esUrgente = isVencePronto(currentTicket.vencimiento) && !sinNadaParaPagar

            return (
              <>
                {/* Fila de Vencimiento */}
                {currentTicket.vencimiento && (
                  <div className={`${styles.vencimientoRow} ${esUrgente ? styles.vencimientoUrgent : ''}`}>
                    <div className={styles.vencimientoLeft}>
                      {esUrgente ? (
                        <Clock size={14} className={styles.vencimientoIcon} />
                      ) : (
                        <Calendar size={14} className={styles.vencimientoIcon} />
                      )}
                      <span className={styles.vencimientoLabel}>Vencimiento</span>
                    </div>
                    <span className={styles.vencimientoValue}>
                      {formatDate(currentTicket.vencimiento)}
                      {esUrgente && (
                        <span className={styles.urgentBadge}>¡Próximo!</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Botones de Pago */}
                {(currentTicket.isPast || currentTicket.title === 'Resumen Actual') && (
                  (() => {
                    if (isPaid) {
                      return (
                        <div className={styles.paidBadge}>
                          <CheckCircle2 size={16} strokeWidth={2.5} />
                          <span>Resumen Pagado</span>
                        </div>
                      )
                    }

                    if (sinNadaParaPagar) {
                      return (
                        <div className={styles.sinDeudaText}>
                          No hay nada para pagar en este resumen.
                        </div>
                      )
                    }

                    const isBimonetario = hasARS && hasUSD

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
              </>
            )
          })()}

          {/* Toggle Expandir / Contraer */}
          {onToggleExpand && (
            <button 
              type="button" 
              className={styles.expandBtn} 
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <>Ocultar detalle <ChevronUp size={14} /></>
              ) : (
                <>Ver detalle ({totalConsumosCount} {totalConsumosCount === 1 ? 'consumo' : 'consumos'}) <ChevronDown size={14} /></>
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
