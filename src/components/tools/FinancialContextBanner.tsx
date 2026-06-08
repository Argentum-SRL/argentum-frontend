import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
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
  error
}) => {
  if (loading) {
    return (
      <div className={`${styles.card} animate-pulse bg-muted`}>
        <div className="h-4 bg-muted rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !context) {
    return null;
  }

  const {
    saldo_disponible,
    ingreso_promedio_mensual,
    ingreso_es_estimacion_parcial,
    carga_mensual_comprometida,
    ciclos_con_historia,
    margen_libre_mensual
  } = context;

  const showPocoHistorial = ciclos_con_historia < 2;

  return (
    <div className={`${styles.card} border-primary/20 bg-blue-500/5 dark:bg-blue-500/10`}>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Tu situación financiera actual</h3>
        <p className="text-xs text-muted-foreground">Punto de partida basado en tus datos registrados en la app</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo disponible */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saldo disponible</span>
          <span className={`text-xl font-extrabold ${saldo_disponible >= 0 ? 'text-foreground' : 'text-red-500'}`}>
            {formatMonto(saldo_disponible, 'ARS')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Dinero líquido en billeteras ARS</span>
        </div>

        {/* Carga mensual comprometida */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Carga mensual comprometida</span>
          <span className="text-xl font-extrabold text-foreground">
            {formatMonto(carga_mensual_comprometida, 'ARS')}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Cuotas y suscripciones activas</span>
        </div>

        {/* Ingreso promedio mensual */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Ingreso promedio
            {ingreso_promedio_mensual === null && (
              <span className="text-muted-foreground cursor-help animate-pulse" title="Podés ingresarlo manualmente en el formulario">
                <Info size={11} className="text-slate-400" />
              </span>
            )}
          </span>
          {ingreso_promedio_mensual !== null ? (
            <span className="text-xl font-extrabold text-foreground">
              {formatMonto(ingreso_promedio_mensual, 'ARS')}
              {ingreso_es_estimacion_parcial && <span className="text-xs font-medium text-amber-500 ml-1">(parcial)</span>}
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 py-1">
              Sin ingresos registrados
            </span>
          )}
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {ciclos_con_historia > 0 
              ? `Promedio últimos ${Math.min(ciclos_con_historia, 3)} ciclos`
              : 'Estimación actual'
            }
          </span>
        </div>

        {/* Margen libre mensual */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Margen libre mensual</span>
          {margen_libre_mensual !== null ? (
            <span className={`text-xl font-extrabold ${margen_libre_mensual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {formatMonto(margen_libre_mensual, 'ARS')}
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 py-1">
              No calculable
            </span>
          )}
          <span className="text-[10px] text-muted-foreground mt-0.5">Ingreso menos carga y gastos promedio</span>
        </div>
      </div>

      {showPocoHistorial && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-3 py-2 rounded-xl mt-2 animate-fadeIn">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>Tenés poco historial en Argentum. El análisis financiero puede ser menos preciso hasta que registres más ciclos.</span>
        </div>
      )}
    </div>
  );
};

export default FinancialContextBanner;
