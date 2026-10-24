import React from 'react';
import { ArgentumCrescent } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import type { ConvenienciaResult as IConvenienciaResult } from '@/types/tools';

export interface ConvenienciaSidebarProps {
  currentStep: 1 | 2 | 3;
  formData: {
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
    hasCapitalToInvest: boolean;
    investmentTna: string;
  };
  totalFinanciadoDisplay: number | null;
  cuotaEstimada: number | null;
  contadoBarPct: number;
  cuotasBarPct: number;
  recargoNominal: { diff: number; pct: number } | null;
  hasFinancingCondition: boolean;
  resultado: IConvenienciaResult | null;
  showDetailedReport: boolean;
  setShowDetailedReport: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ConvenienciaSidebar: React.FC<ConvenienciaSidebarProps> = ({
  currentStep,
  formData,
  totalFinanciadoDisplay,
  cuotaEstimada,
  contadoBarPct,
  cuotasBarPct,
  recargoNominal,
  hasFinancingCondition,
  resultado,
}) => {
  const hasContado = formData.precio_contado !== null && formData.precio_contado > 0;
  const isCuotas = resultado?.resultado === 'conviene_cuotas';
  const isContado = resultado?.resultado === 'conviene_contado';

  // Barras para el resultado: Contado vs Costo Real VPN
  const { contadoVpnBarPct, cuotasVpnBarPct } = (() => {
    if (!resultado) return { contadoVpnBarPct: 0, cuotasVpnBarPct: 0 };
    const pContado = resultado.precio_contado;
    const pVpn = resultado.costo_real_cuotas;
    const max = Math.max(pContado, pVpn, 1);
    return {
      contadoVpnBarPct: Math.min(100, Math.max(8, Math.round((pContado / max) * 100))),
      cuotasVpnBarPct: Math.min(100, Math.max(8, Math.round((pVpn / max) * 100))),
    };
  })();

  return (
    <aside className="h-full bg-white dark:bg-[#161B24] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none flex flex-col justify-between gap-5 transition-all lg:overflow-hidden">
      {/* ── PARTE SUPERIOR: Header del Sidebar ── */}
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <ArgentumCrescent size={16} className="text-[#0D2045] dark:text-[#A8B4C5]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Balance Financiero
            </span>
          </div>

          {resultado ? (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full">
              RESUMEN EJECUTIVO
            </span>
          ) : currentStep === 1 ? (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              PASO 1 DE 3
            </span>
          ) : currentStep === 2 ? (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              PASO 2 DE 3
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full">
              PASO 3 DE 3
            </span>
          )}
        </div>

        {/* ── CASO A: CUANDO HAY RESULTADOS (Resumen Financiero Ejecutivo Compacto) ── */}
        {resultado ? (
          <div className="flex flex-col gap-3.5 animate-fadeIn">
            {/* Cifras Fundamentales */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Contado
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 tabular-nums">
                  {formatMonto(resultado.precio_contado, 'ARS')}
                </span>
                <span className="text-[10.5px] text-slate-400">Desembolso hoy</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Cuotas
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 tabular-nums">
                  {formatMonto(resultado.precio_total_cuotas_con_interes ?? totalFinanciadoDisplay ?? 0, 'ARS')}
                </span>
                <span className="text-[10.5px] text-slate-400">
                  {formData.cantidad_cuotas} pagos nominales
                </span>
              </div>
            </div>

            {/* Costo Real vs Ahorro / Sobrecosto */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Costo real descontado (VPN)
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatMonto(resultado.costo_real_cuotas, 'ARS')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isCuotas ? 'Ahorro neto real' : isContado ? 'Sobrecosto neto' : 'Diferencia'}
                </span>
                <span
                  className={`text-xs font-black tabular-nums ${
                    isCuotas
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isContado
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isCuotas
                    ? `+${formatMonto(resultado.ahorro_real, 'ARS')}`
                    : `-${formatMonto(resultado.ahorro_real, 'ARS')}`}
                </span>
              </div>
            </div>

            {/* Comparativa visual de costo real */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>Comparativa a valor de hoy</span>
                <span className="font-semibold text-slate-400">VPN</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold text-slate-400 w-14 shrink-0">Contado</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-300"
                      style={{ width: `${contadoVpnBarPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold text-slate-400 w-14 shrink-0">Cuotas</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCuotas
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                      style={{ width: `${cuotasVpnBarPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── CASO B: DURANTE LA CONFIGURACIÓN (PASOS 1, 2 Y 3 PRE-CÁLCULO) ── */
          <div className="flex flex-col gap-3.5">
            {/* Fila Contado vs Financiación */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tarjeta Contado */}
              <div
                className={`flex flex-col p-3 rounded-xl transition-all ${
                  currentStep === 1
                    ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/40'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Contado
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 tabular-nums">
                  {formData.precio_contado !== null && hasContado
                    ? formatMonto(formData.precio_contado, 'ARS')
                    : '—'}
                </span>
                <span className="text-[10.5px] text-slate-400">
                  {hasContado ? 'Referencia fijada' : 'Ingresá el precio'}
                </span>
              </div>

              {/* Tarjeta Oferta Financiada */}
              <div
                className={`flex flex-col p-3 rounded-xl transition-all ${
                  currentStep === 2
                    ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/40'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Financiación
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 tabular-nums">
                  {totalFinanciadoDisplay != null ? formatMonto(totalFinanciadoDisplay, 'ARS') : '—'}
                </span>
                <span className="text-[10.5px] text-slate-400 truncate">
                  {cuotaEstimada !== null && formData.cantidad_cuotas
                    ? `${formData.cantidad_cuotas}x de ~${formatMonto(cuotaEstimada, 'ARS')}`
                    : 'Paso 2'}
                </span>
              </div>
            </div>

            {/* Si ambos están completos (en paso 2 o 3 pre-cálculo) */}
            {hasContado && hasFinancingCondition && recargoNominal ? (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {/* Fila de Diferencia Nominal Bruta */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Diferencia nominal
                    </span>
                    <span className="text-[10.5px] text-slate-400">Recargo sin inflación</span>
                  </div>
                  <span
                    className={`text-xs font-extrabold tracking-tight tabular-nums ${
                      recargoNominal.diff > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : recargoNominal.diff < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {recargoNominal.diff > 0
                      ? `+${formatMonto(recargoNominal.diff, 'ARS')} (+${recargoNominal.pct.toFixed(1)}%)`
                      : recargoNominal.diff < 0
                      ? `-${formatMonto(Math.abs(recargoNominal.diff), 'ARS')} (${recargoNominal.pct.toFixed(1)}%)`
                      : '$0 (Mismo importe)'}
                  </span>
                </div>

                {/* Barras comparativas proporcionales */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>Comparativa nominal</span>
                    <span>{formData.cantidad_cuotas} pagos</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold text-slate-400 w-14 shrink-0">Contado</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-300"
                          style={{ width: `${contadoBarPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold text-slate-400 w-14 shrink-0">Cuotas</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            recargoNominal.diff > 0
                              ? 'bg-amber-500 dark:bg-amber-400'
                              : 'bg-emerald-500 dark:bg-emerald-400'
                          }`}
                          style={{ width: `${cuotasBarPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nota orientativa sujeta a los supuestos del Paso 3 */}
                <div className="rounded-xl p-3 border bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/70 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Orientativo · Sujeto a supuestos
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Paso 2 de 3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                    {recargoNominal.diff > 0
                      ? `La financiación presenta un recargo comercial del +${recargoNominal.pct.toFixed(1)}% antes de inflación. En el Paso 3 se contrastará si la inflación proyectada licúa este costo frente al pago al contado.`
                      : recargoNominal.diff < 0
                      ? `La opción financiada tiene un descuento nominal del ${recargoNominal.pct.toFixed(1)}%. En el Paso 3 se evaluará el ahorro neto real a valor presente.`
                      : `Sin recargo comercial nominal. En el Paso 3 se calculará el beneficio financiero de diferir pagos bajo la inflación esperada.`}
                  </p>
                </div>
              </div>
            ) : (
              /* Composición Útil para Paso 1 o Paso 2 incompleto (Evita vacíos y repetición de guiones) */
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Criterio de evaluación financiera
                </span>
                <ul className="flex flex-col gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed list-none p-0 m-0">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">1.</span>
                    <span><strong>Referencia base:</strong> el desembolso total al pagar hoy en un pago.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">2.</span>
                    <span><strong>Oferta financiada:</strong> plazo de pagos y recargo comercial nominal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">3.</span>
                    <span><strong>Descuento por IPC:</strong> cuánto se licúan las cuotas a valor real.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PARTE INFERIOR: Pie del Sidebar (Alineado con el pie de la columna izquierda) ── */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        <span className="text-[10.5px] text-slate-400 leading-normal block">
          {resultado
            ? 'Cifras ajustadas por el IPC oficial proyectado a valor de hoy.'
            : 'El balance se actualiza en tiempo real conforme completás los campos.'}
        </span>
      </div>
    </aside>
  );
};

export default ConvenienciaSidebar;
