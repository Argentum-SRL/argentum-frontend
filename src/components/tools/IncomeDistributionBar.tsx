import React from 'react';
import { formatMonto } from '@/utils/format';
import styles from './ToolsComponents.module.css';

interface IncomeDistributionBarProps {
  ingreso: number;
  cargaPrevia: number;
  montoCuota: number;
  gastoVariable: number;
  semaforo?: string;
}

export const IncomeDistributionBar: React.FC<IncomeDistributionBarProps> = ({
  ingreso,
  cargaPrevia,
  montoCuota,
  gastoVariable,
  semaforo,
}) => {
  if (ingreso <= 0) return null;

  const libre = Math.max(0, ingreso - cargaPrevia - montoCuota - gastoVariable);

  const cargaPreviaPct   = (cargaPrevia   / ingreso) * 100;
  const montoCuotaPct    = (montoCuota    / ingreso) * 100;
  const gastoVariablePct = (gastoVariable / ingreso) * 100;
  const librePct         = (libre         / ingreso) * 100;

  // normalise so bars sum ≤ 100 when total > income
  const sum   = cargaPreviaPct + montoCuotaPct + gastoVariablePct + librePct;
  const scale = sum > 100 ? 100 / sum : 1;

  const wPrevio   = cargaPreviaPct   * scale;
  const wCuota    = montoCuotaPct    * scale;
  const wVariable = gastoVariablePct * scale;
  const wLibre    = librePct         * scale;

  const cuotaSegmentClass = semaforo === 'verde' ? styles.distSegmentLibre : styles.distSegmentCuota;

  const legend = [
    {
      dotClass: styles.distSegmentPrevio,
      label: 'Comprometido previo',
      value: cargaPrevia,
      pct: cargaPreviaPct,
    },
    {
      dotClass: cuotaSegmentClass,
      label: 'Cuota nueva',
      value: montoCuota,
      pct: montoCuotaPct,
    },
    {
      dotClass: styles.distSegmentVariable,
      label: 'Gasto variable',
      value: gastoVariable,
      pct: gastoVariablePct,
    },
    {
      dotClass: styles.distSegmentLibre,
      label: 'Margen libre',
      value: libre,
      pct: librePct,
    },
  ];

  return (
    <div className={styles.distSection}>
      <div className={styles.distHeader}>
        <h4 className={styles.distTitle}>Distribución de tu ingreso mensual</h4>
        <p className={styles.distSubtitle}>Cómo quedaría dividido tu ingreso con esta nueva cuota</p>
      </div>

      {/* Stacked bar */}
      <div className={styles.distBar}>
        {wPrevio   > 0 && <div className={`${styles.distSegment} ${styles.distSegmentPrevio}`}   style={{ width: `${wPrevio}%` }} />}
        {wCuota    > 0 && <div className={`${styles.distSegment} ${cuotaSegmentClass}`}          style={{ width: `${wCuota}%` }} />}
        {wVariable > 0 && <div className={`${styles.distSegment} ${styles.distSegmentVariable}`} style={{ width: `${wVariable}%` }} />}
        {wLibre    > 0 && <div className={`${styles.distSegment} ${styles.distSegmentLibre}`}    style={{ width: `${wLibre}%` }} />}
      </div>

      {/* Legend */}
      <div className={styles.distLegend}>
        {legend.map((item) => (
          <div key={item.label} className={styles.distLegendItem}>
            <div className={`${styles.distDot} ${item.dotClass}`} />
            <div className={styles.distLegendInfo}>
              <span className={styles.distLegendLabel}>{item.label}</span>
              <span className={styles.distLegendValue}>{formatMonto(item.value, 'ARS')}</span>
              <span className={styles.distLegendPct}>{item.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeDistributionBar;
