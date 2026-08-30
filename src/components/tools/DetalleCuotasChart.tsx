import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import type { DetalleCuota } from '@/types/tools';
import styles from './ToolsComponents.module.css';

interface TooltipPayloadItem {
  value: number;
  payload: {
    mes: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatValue: (value: number) => string;
  resultado: 'conviene_cuotas' | 'conviene_contado' | 'indiferente';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  formatValue, 
  resultado 
}) => {
  if (active && payload && payload.length >= 2) {
    const getPresentValueClass = () => {
      if (resultado === 'conviene_cuotas') return styles.tooltipValueCuotas;
      if (resultado === 'conviene_contado') return styles.tooltipValueContado;
      return styles.tooltipValueIndiferente;
    };

    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{payload[0].payload.mes}</p>
        <p className={`${styles.tooltipValue} ${styles.tooltipNominal}`}>
          Nominal: {formatValue(payload[0].value)}
        </p>
        <p className={`${styles.tooltipValue} ${getPresentValueClass()}`}>
          Real a hoy: {formatValue(payload[1].value)}
        </p>
      </div>
    );
  }
  return null;
};

interface DetalleCuotasChartProps {
  detallePorMes: DetalleCuota[];
  resultado: 'conviene_cuotas' | 'conviene_contado' | 'indiferente';
}

export const DetalleCuotasChart: React.FC<DetalleCuotasChartProps> = ({ 
  detallePorMes, 
  resultado 
}) => {

  // Formateador para pesos argentinos
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Determinar colores basados en el resultado y el tema
  const getPresentValueColor = () => {
    if (resultado === 'conviene_cuotas') {
      return '#22c55e'; // Verde
    }
    if (resultado === 'conviene_contado') {
      return '#ef4444'; // Rojo/Naranja
    }
    return '#8a95a8'; // Gris / Muted
  };

  // Convertir los datos a formato plano adecuado para Recharts
  const chartData = detallePorMes.map(item => ({
    mes: `Mes ${item.mes}`,
    'Cuota Nominal': item.cuota_nominal,
    'Valor Real (A hoy)': item.cuota_valor_presente
  }));

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Valor real de cada cuota ajustado por inflación</h3>
      <p className={styles.chartSubtitle}>
        Las barras coloreadas representan el valor real en pesos de hoy (el poder de compra disminuye)
      </p>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis 
              dataKey="mes" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-3)' }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `$${v.toLocaleString('es-AR')}`}
              tick={{ fontSize: 9, fill: 'var(--text-3)' }} 
            />
            <Tooltip content={<CustomTooltip formatValue={formatValue} resultado={resultado} />} />
            <Legend 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            />
            <Bar 
              dataKey="Cuota Nominal" 
              fill="#0D2045" 
              opacity={0.35} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="Valor Real (A hoy)" 
              fill={getPresentValueColor()} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetalleCuotasChart;
