import React from 'react';
import { CheckCircle, Lightbulb, HelpCircle, Pencil, RotateCcw } from '@/components/ui/icons';
import { formatMonto } from '@/utils/format';
import { Button } from '@/components/ui';
import type { ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import styles from './ToolsComponents.module.css';

interface ConvenienciaResultProps {
  resultado: IConvenienciaResult;
  onEditFinanciacion?: () => void;
  onNuevaConsulta?: () => void;
  inWizard?: boolean;
}

export const ConvenienciaResult: React.FC<ConvenienciaResultProps> = ({
  resultado,
  onEditFinanciacion,
  onNuevaConsulta,
  inWizard = false,
}) => {
  const {
    resultado: veredicto,
    precio_contado,
    costo_real_cuotas,
    ahorro_real,
    porcentaje_ahorro,
    cantidad_cuotas,
    detalle_por_mes,
  } = resultado;

  const isCuotas = veredicto === 'conviene_cuotas';
  const isContado = veredicto === 'conviene_contado';

  const renderVerdictBanner = () => {
    switch (veredicto) {
      case 'conviene_cuotas':
        return (
          <div className={`${styles.resultBanner} ${styles.bannerCuotas}`}>
            <div className={styles.bannerIconContainer}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Pagar en cuotas</h3>
              <div className={styles.bannerHighlight}>
                Ahorrás {formatMonto(ahorro_real, 'ARS')} en términos reales
              </div>
              <p className={styles.bannerDesc}>
                La inflación trabaja a tu favor licuando las cuotas futuras frente al pago al contado.
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
              <h3 className={styles.bannerTitle}>Pagar de contado</h3>
              <div className={styles.bannerHighlight}>
                Ahorrás {formatMonto(ahorro_real, 'ARS')} frente a financiar
              </div>
              <p className={styles.bannerDesc}>
                El recargo o tasa de interés es mayor al efecto erosivo de la inflación estimada.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${styles.resultBanner} ${styles.bannerIndiferente}`}>
            <div className={styles.bannerIconContainer}>
              <HelpCircle size={24} />
            </div>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>Da prácticamente lo mismo</h3>
              <div className={styles.bannerHighlight}>
                Diferencia: {formatMonto(ahorro_real, 'ARS')} ({porcentaje_ahorro.toFixed(1)}%)
              </div>
              <p className={styles.bannerDesc}>
                La brecha es menor al 1%. Elegí la alternativa según tu disponibilidad de efectivo hoy.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderComparisonBand = () => {
    return (
      <div className={styles.comparisonBand}>
        <div className={styles.comparisonItem}>
          <span className={styles.comparisonLabel}>Contado</span>
          <span className={styles.comparisonValue}>{formatMonto(precio_contado, 'ARS')}</span>
          <span className={styles.comparisonDesc}>Pago único hoy</span>
        </div>

        <div className={styles.comparisonSeparator}>vs.</div>

        <div className={styles.comparisonItem}>
          <span className={styles.comparisonLabel}>Cuotas (Costo Real)</span>
          <span className={styles.comparisonValue}>{formatMonto(costo_real_cuotas, 'ARS')}</span>
          <span className={styles.comparisonDesc}>Ajustado por inflación</span>
        </div>

        <div className={styles.comparisonSeparator}>=</div>

        <div className={`${styles.comparisonItem} ${styles.comparisonHighlight}`}>
          <span className={styles.comparisonLabel}>
            {isCuotas ? 'Ahorro real' : isContado ? 'Sobrecosto real' : 'Diferencia'}
          </span>
          <span
            className={styles.comparisonValue}
            style={{
              color: isCuotas ? 'var(--success)' : isContado ? 'var(--error)' : 'var(--text)',
              fontSize: '20px',
            }}
          >
            {formatMonto(ahorro_real, 'ARS')}
          </span>
          <span className={styles.comparisonDesc}>
            {isCuotas
              ? `${porcentaje_ahorro.toFixed(1)}% de ahorro real`
              : isContado
              ? `${porcentaje_ahorro.toFixed(1)}% más que contado`
              : `${porcentaje_ahorro.toFixed(1)}% de diferencia`}
          </span>
        </div>
      </div>
    );
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* 1. Título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: 18 }}>
          ¿Qué conviene más?
        </h2>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>
          {cantidad_cuotas} cuotas evaluadas
        </span>
      </div>

      {/* 2. Verdict Banner */}
      {renderVerdictBanner()}

      {/* 3 & 4. Comparación Contado vs Cuotas y Ahorro */}
      {renderComparisonBand()}

      {/* 5. Información secundaria (si tiene interés) */}
      {resultado.tiene_interes && (
        <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div className={styles.metricBox} style={{ padding: '10px 14px' }}>
            <span className={styles.metricLabel}>Interés total financiado</span>
            <span className={styles.metricValue} style={{ fontSize: 16 }}>
              {formatMonto(resultado.interes_total ?? 0, 'ARS')}
            </span>
            {resultado.tna_usada && (
              <span className={styles.metricDesc}>Tasa TNA {resultado.tna_usada}%</span>
            )}
          </div>
          <div className={styles.metricBox} style={{ padding: '10px 14px' }}>
            <span className={styles.metricLabel}>Total nominal financiado</span>
            <span className={styles.metricValue} style={{ fontSize: 16 }}>
              {formatMonto(resultado.precio_total_cuotas_con_interes ?? 0, 'ARS')}
            </span>
            <span className={styles.metricDesc}>
              En {cantidad_cuotas} cuotas de {formatMonto(resultado.monto_cuota, 'ARS')}
            </span>
          </div>
        </div>
      )}

      {/* 6. Gráfico compacto de cuotas */}
      {cantidad_cuotas <= 24 && (
        <DetalleCuotasChart detallePorMes={detalle_por_mes} resultado={veredicto} />
      )}

      {/* 7. Explicación educativa colapsable */}
      <ExplicacionCalculo />

      {/* Acciones de navegación */}
      {(onEditFinanciacion || onNuevaConsulta) && (
        <div className={styles.wizardResultActions}>
          {onEditFinanciacion && (
            <Button
              variant="secondary"
              onClick={onEditFinanciacion}
              type="button"
            >
              <Pencil size={14} style={{ marginRight: 6 }} />
              <span>Modificar financiación</span>
            </Button>
          )}
          {onNuevaConsulta && (
            <Button
              variant="ghost"
              onClick={onNuevaConsulta}
              type="button"
            >
              <RotateCcw size={14} style={{ marginRight: 6 }} />
              <span>Nueva simulación</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (inWizard) {
    return content;
  }

  return (
    <div className={`${styles.card} ${styles.animateFadeIn}`}>
      {content}
    </div>
  );
};

export default ConvenienciaResult;
