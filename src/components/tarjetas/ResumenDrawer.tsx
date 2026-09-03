import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import type { TarjetaCredito, ResumenTarjeta, CuotaResumen, ItemSaldoArrastrado, BloqueResumenMoneda } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import Drawer from '@/components/ui/Drawer/Drawer'
import RealCardPreview from './RealCardPreview'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './ResumenDrawer.module.css'

interface ResumenDrawerProps {
  open: boolean
  onClose: () => void
  tarjeta: TarjetaCredito
}

const ResumenDrawer: React.FC<ResumenDrawerProps> = ({ open, onClose, tarjeta }) => {
  const [resumen, setResumen] = useState<ResumenTarjeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResumen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tarjetaService.getResumenTarjeta(tarjeta.id)
      setResumen(data)
    } catch (err: unknown) {
      console.error('Error fetching resumen:', err)
      setError('No pudimos cargar el resumen. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [tarjeta.id])

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        void fetchResumen()
      })
    }
  }, [open, fetchResumen])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDayMonth = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  const isVencePronto = (dateStr: string) => {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  const getProximoMesDateStr = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    d.setMonth(d.getMonth() + 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const renderCuotaRow = (cuota: CuotaResumen) => (
    <div key={cuota.id} className={styles.cuotaItem}>
      <div className={styles.cuotaIcon}>
        <CategoriaIcon nombre={cuota.subcategoria_nombre || 'Tarjeta de crédito'} size={32} />
      </div>
      <div className={styles.cuotaInfo}>
        <span className={styles.cuotaDesc}>{cuota.descripcion}</span>
        <span className={styles.cuotaNum}>
          Cuota {cuota.numero_cuota}/{cuota.total_cuotas}
          {cuota.subcategoria_nombre && ` • ${cuota.subcategoria_nombre}`}
        </span>
      </div>
      <div className={styles.cuotaMonto}>
        {formatMonto(cuota.monto, cuota.moneda)}
      </div>
    </div>
  )

  const renderSection = (
    title: string, 
    cierreDate: string, 
    vencDate: string, 
    cuotas: CuotaResumen[], 
    total: number,
    emptyMsg: string,
    totalOriginal?: number,
    totalVencidoAnterior?: number,
    totalAPagar?: number,
    itemsSaldoArrastrado?: ItemSaldoArrastrado[],
    saldoArrastrado?: number,
    pagoMinimoEstimado?: number,
    pagoMinimoAclaracion?: string,
    bloquesMoneda?: Record<string, BloqueResumenMoneda>
  ) => {
    const alert = isVencePronto(vencDate)
    const hayPagadas = totalOriginal !== undefined && totalOriginal > total
    
    const bARS = bloquesMoneda?.ARS
    const bUSD = bloquesMoneda?.USD
    const hasARS = bARS && (bARS.total_a_pagar > 0 || bARS.total_cuotas_periodo > 0)
    const hasUSD = bUSD && (bUSD.total_a_pagar > 0 || bUSD.total_cuotas_periodo > 0)
    const isBimonetario = hasARS && hasUSD

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <span className={styles.sectionDateLabel}>Cierra el {formatDayMonth(cierreDate)}</span>
        </div>
        
        <div className={styles.cuotasList}>
          {itemsSaldoArrastrado && itemsSaldoArrastrado.length > 0 && (
            itemsSaldoArrastrado.map((item) => (
              <div key={item.id} className={styles.saldoFinanciadoItem}>
                <div className={styles.cuotaIcon}>
                  <CategoriaIcon nombre="Tarjeta de crédito" size={32} />
                </div>
                <div className={styles.cuotaInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.cuotaDesc}>{item.descripcion}</span>
                    <span className={styles.badgeFinanciado}>Deuda refinanciada</span>
                  </div>
                  <span className={styles.cuotaNum}>
                    Monto inicial: {formatMonto(item.monto_inicial, item.moneda)} • Saldo impago restante
                  </span>
                </div>
                <div className={styles.cuotaMonto}>
                  {formatMonto(item.monto_restante, item.moneda)}
                </div>
              </div>
            ))
          )}

          {cuotas.length > 0 ? (
            cuotas.map(renderCuotaRow)
          ) : (!itemsSaldoArrastrado || itemsSaldoArrastrado.length === 0) ? (
            <div className={styles.emptySection}>{emptyMsg}</div>
          ) : null}
        </div>

        <div className={styles.sectionFooter}>
          {isBimonetario ? (
            <>
              {/* Bloque ARS */}
              <div className={styles.monedaBlock}>
                <div className={styles.monedaBlockHeader}>
                  <span className={styles.monedaBadge}>Pesos (ARS)</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total Cuotas (ARS)</span>
                  <span className={styles.totalValue}>{formatMonto(bARS.total_cuotas_periodo, 'ARS')}</span>
                </div>
                {bARS.total_deuda_vencida_anterior > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Deuda vencida anterior</span>
                    <span className={styles.totalValue}>{formatMonto(bARS.total_deuda_vencida_anterior, 'ARS')}</span>
                  </div>
                )}
                {bARS.saldo_arrastrado_impago > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Saldo financiado anterior</span>
                    <span className={styles.totalValue}>{formatMonto(bARS.saldo_arrastrado_impago, 'ARS')}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel} style={{ fontWeight: 800 }}>Total a pagar (ARS)</span>
                  <span className={styles.totalValue} style={{ fontWeight: 800 }}>{formatMonto(bARS.total_a_pagar, 'ARS')}</span>
                </div>
                {bARS.pago_minimo_estimado > 0 && (
                  <div className={styles.minimoRow}>
                    <div className={styles.minimoTop}>
                      <span className={styles.minimoLabel}>
                        Pago mínimo estimado (ARS)
                        <span className={styles.minimoTag}>Estimado</span>
                      </span>
                      <span className={styles.minimoVal}>{formatMonto(bARS.pago_minimo_estimado, 'ARS')}</span>
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
                  <span className={styles.totalLabel}>Total Cuotas (USD)</span>
                  <span className={styles.totalValue}>{formatMonto(bUSD.total_cuotas_periodo, 'USD')}</span>
                </div>
                {bUSD.total_deuda_vencida_anterior > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Deuda vencida anterior</span>
                    <span className={styles.totalValue}>{formatMonto(bUSD.total_deuda_vencida_anterior, 'USD')}</span>
                  </div>
                )}
                {bUSD.saldo_arrastrado_impago > 0 && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Saldo financiado anterior</span>
                    <span className={styles.totalValue}>{formatMonto(bUSD.saldo_arrastrado_impago, 'USD')}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel} style={{ fontWeight: 800 }}>Total a pagar (USD)</span>
                  <span className={styles.totalValue} style={{ fontWeight: 800 }}>{formatMonto(bUSD.total_a_pagar, 'USD')}</span>
                </div>
                {bUSD.total_estimado_ars !== undefined && bUSD.total_estimado_ars !== null && (
                  <div className={styles.monedaEstimacionRow}>
                    <span className={styles.monedaEstimacionVal}>
                      ≈ {formatMonto(bUSD.total_estimado_ars, 'ARS')}
                    </span>
                    <span className={styles.monedaEstimacionTag}>
                      (Estimación oficial {bUSD.cotizacion_oficial_estimada ? `$${bUSD.cotizacion_oficial_estimada}` : ''} + {bUSD.porcentaje_percepcion ?? 30}% percepción)
                    </span>
                  </div>
                )}
                {bUSD.pago_minimo_estimado > 0 && (
                  <div className={styles.minimoRow}>
                    <div className={styles.minimoTop}>
                      <span className={styles.minimoLabel}>
                        Pago mínimo estimado (USD)
                        <span className={styles.minimoTag}>Estimado</span>
                      </span>
                      <span className={styles.minimoVal}>{formatMonto(bUSD.pago_minimo_estimado, 'USD')}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>{hayPagadas ? 'Total Cuotas Pendiente' : 'Total Cuotas'}</span>
                <span className={styles.totalValue}>{formatMonto(total, (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda)}</span>
              </div>

              {totalVencidoAnterior !== undefined && totalVencidoAnterior > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Deuda vencida anterior</span>
                  <span className={styles.totalValue}>{formatMonto(totalVencidoAnterior, (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda)}</span>
                </div>
              )}

              {saldoArrastrado !== undefined && saldoArrastrado > 0 && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Saldo financiado anterior</span>
                  <span className={styles.totalValue}>{formatMonto(saldoArrastrado, (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda)}</span>
                </div>
              )}

              {totalAPagar !== undefined && (
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total a pagar</span>
                  <span className={styles.totalValue}>{formatMonto(totalAPagar, (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda)}</span>
                </div>
              )}

              {(hasUSD && !hasARS) && bUSD?.total_estimado_ars !== undefined && bUSD?.total_estimado_ars !== null && (
                <div className={styles.monedaEstimacionRow}>
                  <span className={styles.monedaEstimacionVal}>
                    ≈ {formatMonto(bUSD.total_estimado_ars, 'ARS')}
                  </span>
                  <span className={styles.monedaEstimacionTag}>
                    (Estimación oficial {bUSD.cotizacion_oficial_estimada ? `$${bUSD.cotizacion_oficial_estimada}` : ''} + {bUSD.porcentaje_percepcion ?? 30}% percepción)
                  </span>
                </div>
              )}

              {pagoMinimoEstimado !== undefined && pagoMinimoEstimado > 0 && (
                <div className={styles.minimoRow}>
                  <div className={styles.minimoTop}>
                    <span className={styles.minimoLabel}>
                      Pago mínimo estimado
                      <span className={styles.minimoTag}>Estimado</span>
                    </span>
                    <span className={styles.minimoVal}>{formatMonto(pagoMinimoEstimado, (hasUSD && !hasARS) ? 'USD' : tarjeta.moneda)}</span>
                  </div>
                  <span className={styles.minimoAclaracion}>
                    {pagoMinimoAclaracion || 'Monto de referencia orientativo. El valor definitivo lo establece la entidad bancaria en el resumen de cuenta.'}
                  </span>
                </div>
              )}
            </>
          )}

          <div className={styles.vencimientoInfo}>
            <span className={`${styles.vencimientoDate} ${alert ? styles.vencimientoAlerta : ''}`}>
              Vence el {formatDate(vencDate)}
            </span>
            {alert && <span className={styles.venceProntoChip}>Vence pronto</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Drawer 
      open={open} 
      onClose={onClose} 
      title={`Resumen de Tarjeta — ${tarjeta.nombre}`}
    >
      <div className={styles.drawerContent}>
        <div className={styles.headerCard}>
          <div className={styles.cardScaleWrapper}>
            <RealCardPreview 
              ultimos4={tarjeta.nombre.replace('•••• ', '').slice(-4)}
              red={tarjeta.red}
              titular={tarjeta.nombre}
              diaCierre={tarjeta.dia_cierre}
              diaVencimiento={tarjeta.dia_vencimiento}
              color={tarjeta.color || '#0D2045'}
              billeteraNombre=""
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={`${styles.skeleton}`} style={{ height: '32px', width: '40%' }} />
            <div className={`${styles.skeleton}`} style={{ height: '60px' }} />
            <div className={`${styles.skeleton}`} style={{ height: '60px' }} />
            <div className={`${styles.skeleton}`} style={{ height: '40px', width: '60%' }} />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <AlertCircle size={40} className="text-red-500 mb-2" />
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchResumen}>
              Reintentar
            </button>
          </div>
        ) : resumen ? (
          <>
            {renderSection(
              "Resumen Actual",
              resumen.fecha_cierre_proximo,
              resumen.fecha_vencimiento_proximo,
              resumen.cuotas_resumen_actual,
              resumen.total_comprometido_resumen_actual,
              "Sin gastos en este resumen",
              resumen.total_original_resumen_actual,
              resumen.total_deuda_vencida_anterior,
              resumen.total_a_pagar_resumen_actual,
              resumen.items_saldo_arrastrado,
              resumen.saldo_arrastrado_impago,
              resumen.pago_minimo_estimado,
              resumen.pago_minimo_aclaracion,
              resumen.totales_por_moneda
            )}

            {renderSection(
              "Próximo Resumen",
              getProximoMesDateStr(resumen.fecha_cierre_proximo),
              getProximoMesDateStr(resumen.fecha_vencimiento_proximo),
              resumen.cuotas_resumen_siguiente,
              resumen.total_comprometido_resumen_siguiente,
              "Sin gastos comprometidos",
              resumen.total_original_resumen_siguiente
            )}

            {resumen.resumenes_futuros.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Compromisos Futuros</h3>
                </div>
                <div className={styles.futurosList}>
                  {resumen.resumenes_futuros.map((fut, idx) => (
                    <div key={idx} className={styles.futuroItem}>
                      <span className={styles.futuroMes}>
                        {fut.mes}
                        <span className={styles.futuroCuotas}>({fut.cantidad_cuotas} {fut.cantidad_cuotas === 1 ? 'cuota' : 'cuotas'})</span>
                      </span>
                      <span className={styles.futuroTotal}>
                        {fut.totales_por_moneda && (fut.totales_por_moneda.ARS !== undefined || fut.totales_por_moneda.USD !== undefined) ? (
                          <>
                            {fut.totales_por_moneda.ARS !== undefined && fut.totales_por_moneda.ARS > 0 && (
                              <span>{formatMonto(fut.totales_por_moneda.ARS, 'ARS')} </span>
                            )}
                            {fut.totales_por_moneda.USD !== undefined && fut.totales_por_moneda.USD > 0 && (
                              <span>{formatMonto(fut.totales_por_moneda.USD, 'USD')}</span>
                            )}
                          </>
                        ) : (
                          formatMonto(fut.total, fut.moneda)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Drawer>
  )
}

export default ResumenDrawer
