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
  valueClassName?: string;
  desc: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  valueClassName = '',
  desc
}) => {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2 min-w-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
        {label}
      </span>
      <span className={`text-xl font-bold text-foreground leading-tight break-words ${valueClassName}`}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground leading-snug">
        {desc}
      </span>
    </div>
  );
};

export const CanAffordResult: React.FC<CanAffordResultProps> = ({
  resultado,
  ciclosConHistoria,
  onReset
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
    ingreso_es_manual
  } = resultado;

  const getSemaphoreStyles = () => {
    switch (semaforo) {
      case 'verde':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          text: 'text-green-900 dark:text-green-200',
          descText: 'text-green-600 dark:text-green-500',
          border: 'border border-green-200 dark:border-green-800',
          icon: <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
        };
      case 'amarillo':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          text: 'text-amber-900 dark:text-amber-200',
          descText: 'text-amber-600 dark:text-amber-500',
          border: 'border border-amber-200 dark:border-amber-800',
          icon: <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        };
      case 'rojo':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-900 dark:text-red-200',
          descText: 'text-red-600 dark:text-red-500',
          border: 'border border-red-200 dark:border-red-800',
          icon: <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
        };
      case 'negro':
        return {
          bg: 'bg-slate-50 dark:bg-slate-900/60',
          text: 'text-slate-800 dark:text-slate-200',
          descText: 'text-slate-500 dark:text-slate-500',
          border: 'border border-slate-200 dark:border-slate-700',
          icon: <XCircle className="w-7 h-7 text-slate-500 dark:text-slate-400" />
        };
      case 'gris':
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/40',
          text: 'text-slate-800 dark:text-slate-200',
          descText: 'text-slate-500 dark:text-slate-500',
          border: 'border border-slate-200 dark:border-slate-700/50',
          icon: <HelpCircle className="w-7 h-7 text-slate-500 dark:text-slate-400" />
        };
    }
  };

  const semStyles = getSemaphoreStyles();

  // Progress bar color based on percentage of income (Contado mode)
  const getProgressBarColor = (pct: number) => {
    if (pct <= 20) return 'bg-green-500';
    if (pct <= 50) return 'bg-amber-500';
    if (pct <= 100) return 'bg-red-500';
    return 'bg-slate-800 dark:bg-slate-400';
  };

  // Dynamic Margen Libre color based on its percentage relative to total income
  const getMargenLibreColor = () => {
    if (margen_libre_post_compra === null || margen_libre_post_compra === undefined) return 'text-foreground';
    if (!ingreso_promedio_usado || ingreso_promedio_usado <= 0) return 'text-foreground';
    
    if (margen_libre_post_compra > ingreso_promedio_usado * 0.3) {
      return 'text-green-600 dark:text-green-400';
    } else if (margen_libre_post_compra > ingreso_promedio_usado * 0.1) {
      return 'text-amber-600 dark:text-amber-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className={`${styles.card} animate-fadeIn flex flex-col gap-6`}>
      <h2 className={styles.cardTitle}>Resultado del Análisis</h2>

      {/* Semaphore banner */}
      <div className={`flex items-start gap-4 p-5 rounded-xl border ${semStyles.bg} ${semStyles.border} transition-colors duration-300`}>
        <div className="flex-shrink-0 mt-0.5">
          {semStyles.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={`text-xs font-semibold tracking-wide uppercase ${semStyles.descText}`}>
            ESTADO DE SALUD FINANCIERA
          </span>
          <p className={`text-lg font-bold ${semStyles.text} leading-snug`}>
            {mensaje_principal}
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      {modo === 'contado' ? (
        <div className="flex flex-col gap-5">
          {/* Contado Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard
              label="Precio de contado"
              value={formatMonto(precio_total, 'ARS')}
              desc="Pago único hoy"
            />
            <MetricCard
              label="Te quedaría"
              value={formatMonto(saldo_restante_post_compra ?? 0, 'ARS')}
              valueClassName={(saldo_restante_post_compra ?? 0) >= 0 ? '' : 'text-red-600 dark:text-red-400'}
              desc="Saldo post-compra"
            />
            <MetricCard
              label="% de tu disponible"
              value={(porcentaje_del_saldo ?? 0) >= 999 ? '>100%' : `${porcentaje_del_saldo?.toFixed(1)}%`}
              desc="De tu saldo líquido"
            />
          </div>

          {/* Income progress bar in contado mode */}
          {porcentaje_del_ingreso_mensual !== null && porcentaje_del_ingreso_mensual !== undefined && (
            <div className="flex flex-col gap-2 mt-2 bg-slate-50 dark:bg-[#161B24] p-5 rounded-xl border border-border">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">
                  Equivalencia de ingreso mensual
                </span>
                <span className="font-bold text-foreground">
                  {porcentaje_del_ingreso_mensual.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  ref={el => { if (el) el.style.width = `${Math.min(100, porcentaje_del_ingreso_mensual)}%`; }}
                  className={`h-full ${getProgressBarColor(porcentaje_del_ingreso_mensual)} transition-all duration-500`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Esta compra equivale al {porcentaje_del_ingreso_mensual.toFixed(1)}% de tu ingreso mensual promedio ({formatMonto(ingreso_promedio_usado || 0, 'ARS')}).
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Cuotas Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Cuota nueva"
              value={formatMonto(monto_cuota ?? 0, 'ARS')}
              desc={`Por mes (${cantidad_cuotas} cuotas)`}
            />
            <MetricCard
              label="Comprometido previo"
              value={formatMonto(carga_mensual_previa ?? 0, 'ARS')}
              valueClassName="text-muted-foreground"
              desc="Cuotas y suscripciones"
            />
            <MetricCard
              label="Nueva carga total"
              value={formatMonto(carga_mensual_nueva_total ?? 0, 'ARS')}
              desc="Tu nuevo costo fijo"
            />
            <MetricCard
              label="Margen libre"
              value={margen_libre_post_compra !== null && margen_libre_post_compra !== undefined
                ? formatMonto(margen_libre_post_compra, 'ARS')
                : 'N/A'
              }
              valueClassName={getMargenLibreColor()}
              desc="Sobrante estimado/mes"
            />
          </div>

          {/* Banner de interés total si aplica */}
          {resultado.tiene_interes && resultado.interes_total !== undefined && resultado.interes_total > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <Info size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-300">
                Con la TNA de {resultado.tna_usada}%, el costo total financiado es{' '}
                <strong>{formatMonto(resultado.precio_total_real ?? 0, 'ARS')}</strong>
                {' '}— pagás{' '}
                <strong>{formatMonto(resultado.interes_total, 'ARS')}</strong>
                {' '}de interés en total.
              </span>
            </div>
          )}

          {/* Income Distribution Bar (cuotas mode) */}
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

      {/* Footer Notes */}
      <div className="flex items-start gap-2 border-t border-border pt-4 mt-2 text-xs text-muted-foreground">
        <Info size={12} className="mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span>
            {ingreso_es_manual
              ? 'Análisis basado en el ingreso que ingresaste manualmente. Registrá tus ingresos en Argentum para un análisis automático.'
              : 'Análisis basado en tu historial real de los últimos 3 ciclos en Argentum.'}
          </span>
          {ciclosConHistoria < 2 && (
            <span className="text-amber-500 font-semibold mt-0.5">
              ⚠️ Tenés poco historial. El análisis se vuelve más preciso con el tiempo.
            </span>
          )}
        </div>
      </div>

      {/* Recalculate Button */}
      <div className="flex justify-center w-full">
        <Button 
          variant="ghost" 
          onClick={onReset} 
          type="button" 
          className="w-full mt-2 text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          <span>Calcular de nuevo</span>
        </Button>
      </div>
    </div>
  );
};

export default CanAffordResult;
