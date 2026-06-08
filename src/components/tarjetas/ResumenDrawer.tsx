import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import type { TarjetaCredito, ResumenTarjeta, CuotaResumen } from '@/types'
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
    } catch (err) {
      console.error('Error fetching resumen:', err)
      setError('No pudimos cargar el resumen. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [tarjeta.id])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        fetchResumen()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, fetchResumen])

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

  const getProximoMesDateStr = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = parseLocalDate(dateStr)
    d.setMonth(d.getMonth() + 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDayMonth = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
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

  const renderCuotaRow = (cuota: CuotaResumen) => (
    <div key={cuota.id} className={styles.cuotaItem}>
      <div className={styles.cuotaIcon}>
        <CategoriaIcon 
          nombre={cuota.descripcion}
          size={32} 
        />
      </div>
      <div className={styles.cuotaInfo}>
        <span className={styles.cuotaDesc}>{cuota.descripcion}</span>
        <span className={styles.cuotaNum}>Cuota {cuota.numero_cuota}/{cuota.total_cuotas}</span>
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
    emptyMsg: string
  ) => {
    const alert = isVencePronto(vencDate)
    
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <span className={styles.sectionDateLabel}>Cierra el {formatDayMonth(cierreDate)}</span>
        </div>
        
        <div className={styles.cuotasList}>
          {cuotas.length > 0 ? (
            cuotas.map(renderCuotaRow)
          ) : (
            <div className={styles.emptySection}>{emptyMsg}</div>
          )}
        </div>

        <div className={styles.sectionFooter}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{formatMonto(total, tarjeta.moneda)}</span>
          </div>
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
      title="Resumen de Tarjeta"
    >
      <div className={styles.drawerContent}>
        {/* Header con Card Preview */}
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
            <div className={styles.skeleton} ref={el => { if (el) el.style.height = '200px' }} />
            <div className={styles.skeleton} ref={el => { if (el) el.style.height = '200px' }} />
            <div className={styles.skeleton} ref={el => { if (el) el.style.height = '100px' }} />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <AlertCircle size={48} color="var(--error)" />
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
              "Sin gastos en este resumen"
            )}

            {renderSection(
              "Próximo Resumen",
              getProximoMesDateStr(resumen.fecha_cierre_proximo),
              getProximoMesDateStr(resumen.fecha_vencimiento_proximo),
              resumen.cuotas_resumen_siguiente,
              resumen.total_comprometido_resumen_siguiente,
              "Sin gastos comprometidos"
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
                      <span className={styles.futuroTotal}>{formatMonto(fut.total, fut.moneda)}</span>
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
