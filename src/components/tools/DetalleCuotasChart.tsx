import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DetalleCuota } from '@/types/tools';
import styles from './ToolsComponents.module.css';

interface TooltipPayloadItem {
  value: number;
  payload: { mes: string; 'Cuota Nominal': number; 'Valor Real': number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  formatValue: (v: number) => string;
  resultado: 'conviene_cuotas' | 'conviene_contado' | 'indiferente';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, formatValue, resultado }) => {
  if (!active || !payload || payload.length < 2) return null;

  const nominal = payload[0].value;
  const real = payload[1].value;
  const diff = Math.abs(nominal - real);

  const realColor =
    resultado === 'conviene_cuotas'
      ? 'var(--success)'
      : resultado === 'conviene_contado'
      ? 'var(--error)'
      : 'var(--text-3)';

  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>{payload[0].payload.mes}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 12 }}>
          <span style={{ color: 'var(--text-3)' }}>Cuota nominal:</span>
          <strong style={{ color: 'var(--text)' }}>{formatValue(nominal)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 12 }}>
          <span style={{ color: 'var(--text-3)' }}>Valor real ajustado:</span>
          <strong style={{ color: realColor }}>{formatValue(real)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2 }}>
          <span style={{ color: 'var(--text-3)' }}>Diferencia:</span>
          <strong style={{ color: 'var(--text)' }}>{formatValue(diff)}</strong>
        </div>
      </div>
    </div>
  );
};

interface DetalleCuotasChartProps {
  detallePorMes: DetalleCuota[];
  resultado: 'conviene_cuotas' | 'conviene_contado' | 'indiferente';
}

export const DetalleCuotasChart: React.FC<DetalleCuotasChartProps> = ({
  detallePorMes,
  resultado,
}) => {
  const formatValue = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const realBarColor =
    resultado === 'conviene_cuotas'
      ? 'var(--success)'
      : resultado === 'conviene_contado'
      ? 'var(--error)'
      : 'var(--text-3)';

  const nominalBarColor = '#94A3B8';

  const chartData = detallePorMes.map((item) => ({
    mes: `Mes ${item.mes}`,
    'Cuota Nominal': item.cuota_nominal,
    'Valor Real': item.cuota_valor_presente,
  }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>¿Cómo pierde valor cada cuota con el tiempo?</h3>
      <p className={styles.chartSubtitle}>
        Comparación entre el valor nominal de la cuota y su valor real ajustado por inflación.
      </p>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-3)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toLocaleString('es-AR')}`}
              tick={{ fontSize: 10, fill: 'var(--text-3)' }}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} resultado={resultado} />}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="Cuota Nominal" fill={nominalBarColor} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Valor Real" fill={realBarColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetalleCuotasChart;
