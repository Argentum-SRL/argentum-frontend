import React from 'react';
import { CheckCircle, Lightbulb, HelpCircle } from '@/components/ui/icons';
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
    detalle_por_mes,
  } = resultado;

  const renderBanner = () => {
    switch (veredicto) {
      case 'conviene_cuotas':
        return (
          <div className={`${styles.resultBanner} ${styles.bannerCuotas}`}>
            <div className={styles.bannerIconContainer}>
              <CheckCircle size={26} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Pagar en cuotas</h3>
              <div className={styles.bannerHighlight}>
                Ahorrás {formatMonto(ahorro_real, 'ARS')}
              </div>
              <p className={styles.bannerDesc}>
                La inflación trabaja a tu favor. En términos reales, el total en cuotas te sale menos.
              </p>
            </div>
          </div>
        );
      case 'conviene_contado':
        return (
          <div className={`${styles.resultBanner} ${styles.bannerContado}`}>
            <div className={styles.bannerIconContainer}>
              <Lightbulb size={26} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Pagar de contado</h3>
              <div className={styles.bannerHighlight}>
                Ahorrás {formatMonto(ahorro_real, 'ARS')} frente a financiar
              </div>
              <p className={styles.bannerDesc}>
                La inflación no alcanza a compensar el costo adicional o recargo de las cuotas.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${styles.resultBanner} ${styles.bannerIndiferente}`}>
            <div className={styles.bannerIconContainer}>
              <HelpCircle size={26} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Da prácticamente lo mismo</h3>
              <div className={styles.bannerHighlight}>
                Diferencia: {formatMonto(ahorro_real, 'ARS')} ({porcentaje_ahorro.toFixed(1)}%)
              </div>
              <p className={styles.bannerDesc}>
                La diferencia es mínima (menor al 1%). Elegí según tu disponibilidad de dinero en mano.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderComparison = () => {
    const isCuotas = veredicto === 'conviene_cuotas';
    const isContado = veredicto === 'conviene_contado';

    return (
      <div className={styles.comparisonBand}>
        <div className={styles.comparisonItem}>
          <span className={styles.comparisonLabel}>Costo real de las cuotas</span>
          <span className={styles.comparisonValue}>{formatMonto(costo_real_cuotas, 'ARS')}</span>
          <span className={styles.comparisonDesc}>A pesos de hoy (ajustado por inflación)</span>
        </div>

        <div className={styles.comparisonSeparator}>vs.</div>

        <div className={styles.comparisonItem}>
          <span className={styles.comparisonLabel}>Precio de contado</span>
          <span className={styles.comparisonValue}>{formatMonto(precio_contado, 'ARS')}</span>
          <span className={styles.comparisonDesc}>Si pagás todo hoy</span>
        </div>

        <div className={styles.comparisonSeparator}>=</div>

        <div className={`${styles.comparisonItem} ${styles.comparisonHighlight}`}>
          <span className={styles.comparisonLabel}>
            {isCuotas ? 'Te ahorrás' : isContado ? 'Pagás de más' : 'Diferencia'}
          </span>
          <span
            className={styles.comparisonValue}
            style={{
              color: isCuotas ? 'var(--success)' : isContado ? 'var(--error)' : 'var(--text)',
              fontSize: 21,
            }}
          >
            {formatMonto(ahorro_real, 'ARS')}
          </span>
          <span className={styles.comparisonDesc}>
            {isCuotas
              ? `(${porcentaje_ahorro.toFixed(1)}% de ahorro real)`
              : isContado
              ? `(${porcentaje_ahorro.toFixed(1)}% más que contado)`
              : `(${porcentaje_ahorro.toFixed(1)}% de diferencia)`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.card} ${styles.animateFadeIn}`}>
      <h2 className={styles.cardTitle}>¿Qué conviene más?</h2>

      {renderBanner()}

      {renderComparison()}

      {/* Interés total financiado */}
      {resultado.tiene_interes && (
        <div className={styles.metricsGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Interés total financiado</span>
            <span className={styles.metricValue}>{formatMonto(resultado.interes_total ?? 0, 'ARS')}</span>
            {resultado.tna_usada && (
              <span className={styles.metricDesc}>Calculado a TNA {resultado.tna_usada}%</span>
            )}
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Total financiado con interés</span>
            <span className={styles.metricValue}>
              {formatMonto(resultado.precio_total_cuotas_con_interes ?? 0, 'ARS')}
            </span>
            <span className={styles.metricDesc}>
              En {cantidad_cuotas} cuotas de {formatMonto(resultado.monto_cuota, 'ARS')}
            </span>
          </div>
        </div>
      )}

      {cantidad_cuotas <= 24 && (
        <DetalleCuotasChart detallePorMes={detalle_por_mes} resultado={veredicto} />
      )}

      <ExplicacionCalculo />
    </div>
  );
};

export default ConvenienciaResult;
