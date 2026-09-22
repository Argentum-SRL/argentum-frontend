import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, HelpCircle, RotateCcw, Info } from 'lucide-react';
import { formatMonto } from '@/utils/format';
import { Button } from '@/components/ui';
import type { CanAffordResult as ICanAffordResult } from '@/types/tools';
import IncomeDistributionBar from './IncomeDistributionBar';
import styles from './ToolsComponents.module.css';

interface CanAffordResultProps {
  resultado: ICanAffordResult;
  ciclosConHistoria: number;
  onReset: () => void;
}

interface MetricCardProps {
  label: string;
  value: string;
  valueClass?: string;
  desc: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, valueClass = '', desc }) => (
  <div className={styles.metricBox}>
    <span className={styles.metricLabel}>{label}</span>
    <span className={`${styles.metricValue} ${valueClass}`}>{value}</span>
    <span className={styles.metricDesc}>{desc}</span>
  </div>
);

type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'negro' | 'gris';

const SEM_CONFIG: Record<Semaforo, {
  bannerClass: string;
  icon: React.ReactNode;
}> = {
  verde: {
    bannerClass: styles.semVerde,
    icon: <CheckCircle2 size={22} className={styles.semIcon} />,
  },
  amarillo: {
    bannerClass: styles.semAmarillo,
    icon: <AlertTriangle size={22} className={styles.semIcon} />,
  },
  rojo: {
    bannerClass: styles.semRojo,
    icon: <AlertCircle size={22} className={styles.semIcon} />,
  },
  negro: {
    bannerClass: styles.semNegro,
    icon: <XCircle size={22} className={styles.semIcon} />,
  },
  gris: {
    bannerClass: styles.semGris,
    icon: <HelpCircle size={22} className={styles.semIcon} />,
  },
};

export const CanAffordResult: React.FC<CanAffordResultProps> = ({
  resultado,
  ciclosConHistoria,
  onReset,
}) => {
  const {
    modo,
    precio_total,
    saldo_restante_post_compra,
    porcentaje_del_saldo,
    porcentaje_del_ingreso_mensual,
    monto_cuota,
    cantidad_cuotas,
    carga_mensual_previa,
    carga_mensual_nueva_total,
    margen_libre_post_compra,
    gasto_variable_promedio,
    semaforo,
    mensaje_principal,
    ingreso_promedio_usado,
    ingreso_es_manual,
  } = resultado;

  const sem = SEM_CONFIG[semaforo as Semaforo] ?? SEM_CONFIG.gris;

  // Progress bar colour for contado mode
  const progressClass = (() => {
    const pct = porcentaje_del_ingreso_mensual ?? 0;
    if (pct <= 20) return styles.progressGreen;
    if (pct <= 50) return styles.progressAmbar;
    return styles.progressRed;
  })();

  // Margen libre colour class
  const margenClass = (() => {
    if (margen_libre_post_compra === null || margen_libre_post_compra === undefined) return '';
    if (!ingreso_promedio_usado || ingreso_promedio_usado <= 0) return '';
    if (margen_libre_post_compra > ingreso_promedio_usado * 0.3) return styles.valueGreen;
    if (margen_libre_post_compra > ingreso_promedio_usado * 0.1) return '';
    return styles.valueRed;
  })();

  return (
    <div className={`${styles.card} ${styles.animateFadeIn}`} style={{ gap: 20 }}>
      <h2 className={styles.cardTitle}>Resultado del Análisis</h2>

      {/* Semaphore banner */}
      <div className={`${styles.semBanner} ${sem.bannerClass}`}>
        {sem.icon}
        <div className={styles.semBody}>
          <span className={styles.semLabel}>Estado de salud financiera</span>
          <p className={styles.semTitle}>{mensaje_principal}</p>
        </div>
      </div>

      {/* Metrics */}
      {modo === 'contado' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className={`${styles.metricsGrid} ${styles.metricsGrid3}`} style={{ gridTemplateColumns: undefined }}>
            <MetricCard
              label="Precio de contado"
              value={formatMonto(precio_total, 'ARS')}
              desc="Pago único hoy"
            />
            <MetricCard
              label="Te quedaría"
              value={formatMonto(saldo_restante_post_compra ?? 0, 'ARS')}
              valueClass={(saldo_restante_post_compra ?? 0) >= 0 ? '' : styles.valueRed}
              desc="Saldo post-compra"
            />
            <MetricCard
              label="% de tu disponible"
              value={(porcentaje_del_saldo ?? 0) >= 999 ? '>100%' : `${porcentaje_del_saldo?.toFixed(1)}%`}
              desc="De tu saldo líquido"
            />
          </div>

          {porcentaje_del_ingreso_mensual !== null && porcentaje_del_ingreso_mensual !== undefined && (
            <div className={styles.metricBox} style={{ gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.metricLabel}>Equivalencia de ingreso mensual</span>
                <span className={styles.metricLabel} style={{ color: 'var(--text)' }}>
                  {porcentaje_del_ingreso_mensual.toFixed(1)}%
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${progressClass}`}
                  style={{ width: `${Math.min(100, porcentaje_del_ingreso_mensual)}%` }}
                />
              </div>
              <span className={styles.metricDesc}>
                Esta compra equivale al {porcentaje_del_ingreso_mensual.toFixed(1)}% de tu ingreso mensual promedio ({formatMonto(ingreso_promedio_usado || 0, 'ARS')}).
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className={`${styles.metricsGrid} ${styles.metricsGrid4}`}>
            <MetricCard
              label="Cuota nueva"
              value={formatMonto(monto_cuota ?? 0, 'ARS')}
              desc={`Por mes (${cantidad_cuotas} cuotas)`}
            />
            <MetricCard
              label="Comprometido previo"
              value={formatMonto(carga_mensual_previa ?? 0, 'ARS')}
              valueClass={styles.valueMuted}
              desc="Cuotas y suscripciones"
            />
            <MetricCard
              label="Nueva carga total"
              value={formatMonto(carga_mensual_nueva_total ?? 0, 'ARS')}
              desc="Tu nuevo costo fijo"
            />
            <MetricCard
              label="Margen libre"
              value={
                margen_libre_post_compra !== null && margen_libre_post_compra !== undefined
                  ? formatMonto(margen_libre_post_compra, 'ARS')
                  : 'N/A'
              }
              valueClass={margenClass}
              desc="Sobrante estimado/mes"
            />
          </div>

          {/* Interés callout */}
          {resultado.tiene_interes && resultado.interes_total !== undefined && resultado.interes_total > 0 && (
            <div className={styles.interestCallout}>
              <Info size={16} className={styles.interestCalloutIcon} />
              <span>
                Con la TNA de {resultado.tna_usada}%, el costo total financiado es{' '}
                <strong>{formatMonto(resultado.precio_total_real ?? 0, 'ARS')}</strong>
                {' '}— pagás{' '}
                <strong>{formatMonto(resultado.interes_total, 'ARS')}</strong>
                {' '}de interés en total.
              </span>
            </div>
          )}

          {/* Distribution bar */}
          {ingreso_promedio_usado !== null && (
            <IncomeDistributionBar
              ingreso={ingreso_promedio_usado}
              cargaPrevia={carga_mensual_previa ?? 0}
              montoCuota={monto_cuota ?? 0}
              gastoVariable={gasto_variable_promedio ?? 0}
              semaforo={semaforo}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footerNote}>
        <Info size={13} className={styles.footerNoteIcon} />
        <div>
          <span>
            {ingreso_es_manual
              ? 'Análisis basado en el ingreso que ingresaste manualmente. Registrá tus ingresos en Argentum para un análisis automático.'
              : 'Análisis basado en tu historial real de los últimos 3 ciclos en Argentum.'}
          </span>
          {ciclosConHistoria < 2 && (
            <span className={styles.footerNoteWarn}>
              ⚠️ Tenés poco historial. El análisis se vuelve más preciso con el tiempo.
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onReset}
        type="button"
        fullWidth
      >
        <RotateCcw size={15} style={{ marginRight: 6 }} />
        Calcular de nuevo
      </Button>
    </div>
  );
};

export default CanAffordResult;
