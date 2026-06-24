import React from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { AnalisisIA } from '@/types'
import AnalisisSeccion from './AnalisisSeccion'
import styles from './AnalisisCard.module.css'

interface AnalisisCardProps {
  analisis: AnalisisIA
}

const formatFechaShort = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const cleanStr = dateStr.split('T')[0]
    const parts = cleanStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } catch (e) {
    console.error('Error formatting date', e)
  }
  return dateStr
}

const formatFechaHora = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const [datePart, timePart] = dateStr.split('T')
    const dParts = datePart.split('-')
    const tParts = timePart ? timePart.split(':') : []
    
    if (dParts.length === 3) {
      const dateStrFormatted = `${dParts[2]}/${dParts[1]}/${dParts[0]}`
      if (tParts.length >= 2) {
        return `${dateStrFormatted} ${tParts[0]}:${tParts[1]}`
      }
      return dateStrFormatted
    }
  } catch (e) {
    console.error('Error formatting date time', e)
  }
  return dateStr
}

export const AnalisisCard: React.FC<AnalisisCardProps> = ({ analisis }) => {
  if (analisis.estado === 'pendiente') {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={`${styles.spinner} animate-spin`} size={32} />
        <p className={styles.loadingText}>Procesando análisis...</p>
        <p className={styles.loadingSubtext}>Esto puede tardar hasta 30 segundos.</p>
      </div>
    )
  }

  if (analisis.estado === 'error') {
    return (
      <div className={styles.errorContainer}>
        <h3 className={styles.errorTitle}>Error al generar el análisis</h3>
        <p className={styles.errorText}>
          {analisis.error_detalle || 'Ocurrió un error inesperado al procesar los datos.'}
        </p>
      </div>
    )
  }

  const { resultado_secciones } = analisis
  const tokensTotales = (analisis.input_tokens || 0) + (analisis.output_tokens || 0)

  return (
    <div className={styles.card}>
      {/* Header Info */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerBlock}>
            <span className={styles.metaLabel}>Período analizado</span>
            <span className={styles.metaValue}>
              {formatFechaShort(analisis.periodo_inicio)} → {formatFechaShort(analisis.periodo_fin)}
            </span>
          </div>
          <div className={styles.headerBlock}>
            <span className={styles.metaLabel}>Ciclos</span>
            <span className={styles.metaValue}>{analisis.ciclos_analizados} ciclos</span>
          </div>
          <div className={styles.headerBlock}>
            <span className={styles.metaLabel}>Generado el</span>
            <span className={styles.metaValue}>{formatFechaHora(analisis.creado_en)}</span>
          </div>
        </div>

        <div className={styles.modelInfo}>
          <span>Modelo: {analisis.modelo_usado}</span>
          {tokensTotales > 0 && (
            <span className={styles.tokensDot}>
              · {tokensTotales} tokens totales
            </span>
          )}
          {analisis.costo_usd && (
            <span className={styles.costoDot}>
              · Costo: US$ {Number(analisis.costo_usd).toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Warning parseo */}
      {resultado_secciones?.error_parseo && (
        <div className={styles.warningContainer}>
          <div className={styles.warningHeader}>
            <AlertTriangle className={styles.warningIcon} size={16} />
            <strong>Advertencia de formato:</strong> El análisis no pudo estructurarse automáticamente.
          </div>
          <p className={styles.warningSubtext}>
            Se muestra el texto completo retornado por la IA para tu lectura:
          </p>
          {resultado_secciones.texto_crudo && (
            <pre className={styles.rawText}>{resultado_secciones.texto_crudo}</pre>
          )}
        </div>
      )}

      {/* Sections List */}
      {resultado_secciones && !resultado_secciones.error_parseo && (
        <div className={styles.body}>
          <AnalisisSeccion 
            titulo="Resumen" 
            contenido={resultado_secciones.resumen_ejecutivo} 
          />
          <AnalisisSeccion 
            titulo="Salud financiera" 
            contenido={resultado_secciones.salud_financiera} 
          />
          <AnalisisSeccion 
            titulo="Gastos hormiga" 
            contenido={resultado_secciones.gastos_hormiga} 
          />
          <AnalisisSeccion 
            titulo="Suscripciones" 
            contenido={resultado_secciones.suscripciones} 
          />
          <AnalisisSeccion 
            titulo="Fondo de emergencias" 
            contenido={resultado_secciones.fondo_emergencias} 
          />
          <AnalisisSeccion 
            titulo="Oportunidades" 
            contenido={resultado_secciones.oportunidades} 
          />
          <AnalisisSeccion 
            titulo="Capacidad de ahorro" 
            contenido={resultado_secciones.capacidad_ahorro_adicional} 
          />
          <AnalisisSeccion 
            titulo="Limitaciones del análisis" 
            contenido={resultado_secciones.limitaciones_analisis} 
          />
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className={styles.footer}>
        <p className={styles.disclaimer}>
          Este análisis es orientativo y depende de los datos que registraste. No constituye asesoramiento financiero profesional.
        </p>
      </div>
    </div>
  )
}

export default AnalisisCard
