import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { formatMonto } from '@/utils/format';
import type { FinancialContext } from '@/types/tools';
import styles from './ToolsComponents.module.css';

interface FinancialContextBannerProps {
  context: FinancialContext | null;
  loading: boolean;
  error: boolean;
}

export const FinancialContextBanner: React.FC<FinancialContextBannerProps> = ({
  context,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.contextSkeleton}>
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonStat}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonDesc}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !context) return null;

  const {
    saldo_disponible,
    ingreso_promedio_mensual,
    ingreso_es_estimacion_parcial,
    carga_mensual_comprometida,
    ciclos_con_historia,
    margen_libre_mensual,
  } = context;

  const showPocoHistorial = ciclos_con_historia < 2;

  return (
    <div className={styles.contextCard}>
      <div className={styles.contextHeader}>
        <h3 className={styles.contextTitle}>Tu situación financiera actual</h3>
        <p className={styles.contextSubtitle}>Punto de partida basado en tus datos registrados en Argentum</p>
      </div>

      <div className={styles.contextGrid}>
        {/* Saldo disponible */}
        <div className={styles.contextStat}>
          <span className={styles.contextStatLabel}>Saldo disponible</span>
          <span className={`${styles.contextStatValue} ${saldo_disponible >= 0 ? '' : styles.contextStatValueNegative}`}>
            {formatMonto(saldo_disponible, 'ARS')}
          </span>
          <span className={styles.contextStatDesc}>Dinero líquido en billeteras ARS</span>
        </div>

        {/* Carga mensual comprometida */}
        <div className={styles.contextStat}>
          <span className={styles.contextStatLabel}>Carga mensual comprometida</span>
          <span className={styles.contextStatValue}>
            {formatMonto(carga_mensual_comprometida, 'ARS')}
          </span>
          <span className={styles.contextStatDesc}>Cuotas y suscripciones activas</span>
        </div>

        {/* Ingreso promedio */}
        <div className={styles.contextStat}>
          <span className={styles.contextStatLabel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Ingreso promedio
            {ingreso_promedio_mensual === null && (
              <span title="Podés ingresarlo manualmente en el formulario" style={{ lineHeight: 1, display: 'flex' }}>
                <Info size={11} />
              </span>
            )}
          </span>
          {ingreso_promedio_mensual !== null ? (
            <span className={styles.contextStatValue}>
              {formatMonto(ingreso_promedio_mensual, 'ARS')}
              {ingreso_es_estimacion_parcial && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', marginLeft: 6 }}>
                  (parcial)
                </span>
              )}
            </span>
          ) : (
            <span className={`${styles.contextStatValue} ${styles.contextStatValueMuted}`} style={{ fontSize: 14 }}>
              Sin ingresos registrados
            </span>
          )}
          <span className={styles.contextStatDesc}>
            {ciclos_con_historia > 0
              ? `Promedio últimos ${Math.min(ciclos_con_historia, 3)} ciclos`
              : 'Estimación actual'}
          </span>
        </div>

        {/* Margen libre */}
        <div className={styles.contextStat}>
          <span className={styles.contextStatLabel}>Margen libre mensual</span>
          {margen_libre_mensual !== null ? (
            <span className={`${styles.contextStatValue} ${margen_libre_mensual >= 0 ? styles.contextStatValuePositive : styles.contextStatValueNegative}`}>
              {formatMonto(margen_libre_mensual, 'ARS')}
            </span>
          ) : (
            <span className={`${styles.contextStatValue} ${styles.contextStatValueMuted}`} style={{ fontSize: 14 }}>
              No calculable
            </span>
          )}
          <span className={styles.contextStatDesc}>Ingreso menos carga y gastos promedio</span>
        </div>
      </div>

      {showPocoHistorial && (
        <div className={styles.contextWarn}>
          <AlertTriangle size={14} className={styles.contextWarnIcon} />
          <span>Tenés poco historial en Argentum. El análisis financiero puede ser menos preciso hasta que registres más ciclos.</span>
        </div>
      )}
    </div>
  );
};

export default FinancialContextBanner;
