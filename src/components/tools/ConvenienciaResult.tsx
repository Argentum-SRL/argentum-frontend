import React from 'react';
import { CheckCircle, Lightbulb, HelpCircle } from 'lucide-react';
import { formatMonto } from '@/utils/format';
import type { ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import styles from './ToolsComponents.module.css';

interface ConvenienciaResultProps {
  resultado: IConvenienciaResult;
}

export const ConvenienciaResult: React.FC<ConvenienciaResultProps> = ({ resultado }) => {
  const {
    resultado: veredicto,
    precio_contado,
    costo_real_cuotas,
    ahorro_real,
    porcentaje_ahorro,
    cantidad_cuotas,
    detalle_por_mes
  } = resultado;

  const renderBanner = () => {
    switch (veredicto) {
      case 'conviene_cuotas':
        return (
          <div className={`${styles.resultBanner} ${styles.bannerCuotas}`}>
            <div className={styles.bannerIconContainer}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>¡Convienen las cuotas!</h3>
              <p className={styles.bannerDesc}>
                La inflación trabaja a tu favor. En términos reales, las cuotas te salen menos.
              </p>
            </div>
          </div>
        );
      case 'conviene_contado':
        return (
          <div className={`${styles.resultBanner} ${styles.bannerContado}`}>
            <div className={styles.bannerIconContainer}>
              <Lightbulb size={24} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Conviene pagar de contado</h3>
              <p className={styles.bannerDesc}>
                La inflación no alcanza a compensar el costo de las cuotas.
              </p>
            </div>
          </div>
        );
      case 'indiferente':
      default:
        return (
          <div className={`${styles.resultBanner} ${styles.bannerIndiferente}`}>
            <div className={styles.bannerIconContainer}>
              <HelpCircle size={24} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Da prácticamente lo mismo</h3>
              <p className={styles.bannerDesc}>
                La diferencia es menor al 1%. Elegí según tu liquidez disponible.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderMetrics = () => {
    switch (veredicto) {
      case 'conviene_cuotas':
        return (
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Costo real cuotas</span>
              <span className={styles.metricValue}>{formatMonto(costo_real_cuotas, 'ARS')}</span>
              <span className={styles.metricDesc}>A pesos de hoy</span>
            </div>
            
            <div className={`${styles.metricBox} ${styles.metricBoxFeatured}`}>
              <span className={styles.metricLabel}>Te ahorrás</span>
              <span className={`${styles.metricValue} ${styles.valueGreen}`}>
                {formatMonto(ahorro_real, 'ARS')}
              </span>
              <span className={styles.metricDesc}>({porcentaje_ahorro.toFixed(1)}% del contado)</span>
            </div>

            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Precio contado</span>
              <span className={styles.metricValue}>{formatMonto(precio_contado, 'ARS')}</span>
              <span className={styles.metricDesc}>Para comparar</span>
            </div>
          </div>
        );
      case 'conviene_contado':
        return (
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Costo real cuotas</span>
              <span className={styles.metricValue}>{formatMonto(costo_real_cuotas, 'ARS')}</span>
              <span className={styles.metricDesc}>A pesos de hoy</span>
            </div>
            
            <div className={`${styles.metricBox} ${styles.metricBoxFeatured}`}>
              <span className={styles.metricLabel}>Pagás de más</span>
              <span className={`${styles.metricValue} ${styles.valueRed}`}>
                {formatMonto(ahorro_real, 'ARS')}
              </span>
              <span className={styles.metricDesc}>({porcentaje_ahorro.toFixed(1)}% más que contado)</span>
            </div>

            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Precio contado</span>
              <span className={styles.metricValue}>{formatMonto(precio_contado, 'ARS')}</span>
              <span className={styles.metricDesc}>Opción más conveniente</span>
            </div>
          </div>
        );
      case 'indiferente':
      default:
        return (
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Costo real cuotas</span>
              <span className={styles.metricValue}>{formatMonto(costo_real_cuotas, 'ARS')}</span>
              <span className={styles.metricDesc}>A pesos de hoy</span>
            </div>
            
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Diferencia</span>
              <span className={styles.metricValue}>{formatMonto(ahorro_real, 'ARS')}</span>
              <span className={styles.metricDesc}>({porcentaje_ahorro.toFixed(1)}% de diferencia)</span>
            </div>

            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Precio contado</span>
              <span className={styles.metricValue}>{formatMonto(precio_contado, 'ARS')}</span>
              <span className={styles.metricDesc}>Para comparar</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`${styles.card} animate-fadeIn`}>
      <h2 className={styles.cardTitle}>Resultado del Análisis</h2>
      
      {renderBanner()}
      
      {renderMetrics()}

      {cantidad_cuotas <= 24 && (
        <DetalleCuotasChart 
          detallePorMes={detalle_por_mes}
          resultado={veredicto}
        />
      )}

      <ExplicacionCalculo />
    </div>
  );
};

export default ConvenienciaResult;
