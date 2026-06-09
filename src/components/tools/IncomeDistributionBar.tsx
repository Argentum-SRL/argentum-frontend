import React from 'react';
import { formatMonto } from '@/utils/format';

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
  semaforo
}) => {
  if (ingreso <= 0) return null;

  // Raw values
  const totalCargaNueva = cargaPrevia + montoCuota;
  const libre = Math.max(0, ingreso - totalCargaNueva - gastoVariable);

  // Percentages relative to total income
  const cargaPreviaPct = (cargaPrevia / ingreso) * 100;
  const montoCuotaPct = (montoCuota / ingreso) * 100;
  const gastoVariablePct = (gastoVariable / ingreso) * 100;
  const librePct = (libre / ingreso) * 100;

  // Let's normalize to make sure the bar sums up to 100% nicely
  const sum = cargaPreviaPct + montoCuotaPct + gastoVariablePct + librePct;
  const scale = sum > 100 ? 100 / sum : 1;

  const wCargaPrevia = cargaPreviaPct * scale;
  const wMontoCuota = montoCuotaPct * scale;
  const wGastoVariable = gastoVariablePct * scale;
  const wLibre = librePct * scale;

  const isVerde = semaforo === 'verde';
  const cuotaColor = isVerde
    ? 'bg-green-500 dark:bg-green-400'
    : 'bg-amber-500 dark:bg-amber-400';

  return (
    <div className="flex flex-col w-full border-t border-border pt-5 animate-fadeIn">
      {/* Title */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Distribución de tu ingreso mensual
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cómo quedaría dividido tu ingreso con esta nueva cuota
        </p>
      </div>

      {/* The Stacked Bar */}
      <div className="w-full flex h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {wCargaPrevia > 0 && (
          <div
            ref={el => { if (el) el.style.width = `${wCargaPrevia}%`; }}
            className="bg-[#0D2045] dark:bg-[#4878B8] h-full transition-all duration-300"
            title={`Comprometido previo: ${cargaPreviaPct.toFixed(1)}%`}
          />
        )}
        {wMontoCuota > 0 && (
          <div
            ref={el => { if (el) el.style.width = `${wMontoCuota}%`; }}
            className={`${cuotaColor} h-full transition-all duration-300`}
            title={`Cuota nueva: ${montoCuotaPct.toFixed(1)}%`}
          />
        )}
        {wGastoVariable > 0 && (
          <div
            ref={el => { if (el) el.style.width = `${wGastoVariable}%`; }}
            className="bg-slate-300 dark:bg-slate-600 h-full transition-all duration-300"
            title={`Gastos variables: ${gastoVariablePct.toFixed(1)}%`}
          />
        )}
        {wLibre > 0 && (
          <div
            ref={el => { if (el) el.style.width = `${wLibre}%`; }}
            className="bg-emerald-200 dark:bg-emerald-800 h-full transition-all duration-300"
            title={`Margen libre: ${librePct.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-3">
        {/* Comprometido previo */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-[#0D2045] dark:bg-[#4878B8]" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Comprometido previo</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMonto(cargaPrevia, 'ARS')}
            </span>
            <span className="text-xs text-muted-foreground">({cargaPreviaPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Cuota nueva */}
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${cuotaColor}`} />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Cuota nueva</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMonto(montoCuota, 'ARS')}
            </span>
            <span className="text-xs text-muted-foreground">({montoCuotaPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Gasto variable */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-slate-300 dark:bg-slate-600" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Gasto variable</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMonto(gastoVariable, 'ARS')}
            </span>
            <span className="text-xs text-muted-foreground">({gastoVariablePct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Margen libre */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-emerald-200 dark:bg-emerald-800" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Margen libre</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMonto(libre, 'ARS')}
            </span>
            <span className="text-xs text-muted-foreground">({librePct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeDistributionBar;
