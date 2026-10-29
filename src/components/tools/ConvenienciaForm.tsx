import React, { useState } from 'react';
import { esPunteroFino } from '@/utils/foco'
import {
  RefreshCcw,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Lightbulb,
  HelpCircle,
  Edit3,
} from '@/components/ui/icons';
import { MontoInput } from '@/components/ui';
import SegmentedControl from '@/components/ui/SegmentedControl';
import type { IPCData, ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import { formatMonto } from '@/utils/format';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import styles from './ConvenienciaForm.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

export interface ConvenienciaFormProps {
  currentStep: 1 | 2 | 3;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  canGoToStep2: boolean;
  canGoToStep3: boolean;
  canCalculate: boolean;
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
  handleChange: (field: string, value: string | number | boolean | null) => void;
  ipcData: IPCData | null;
  ipcLoading: boolean;
  ipcError: boolean;
  isIpcOfficialUsed: boolean;
  syncIpc: () => void;
  isRotating: boolean;
  isCustomCuotas: boolean;
  setIsCustomCuotas: (val: boolean) => void;
  fixedMode: 'total' | 'cuota';
  setFixedMode: (val: 'total' | 'cuota') => void;
  cuotaInputValue: number | null;
  handleCuotaValChange: (val: number | null) => void;
  handleTotalValChange: (val: number | null) => void;
  handleCuotasCountChange: (n: number | null) => void;
  cuotaEstimada: number | null;
  totalFinanciadoDisplay: number | null;
  calculando: boolean;
  onCalcular: () => void;
  resultado: IConvenienciaResult | null;
  onReset: () => void;
  showDetailedReport?: boolean;
  setShowDetailedReport?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ConvenienciaForm: React.FC<ConvenienciaFormProps> = ({
  currentStep,
  setCurrentStep,
  canGoToStep2,
  canGoToStep3,
  canCalculate,
  formData,
  handleChange,
  ipcData,
  ipcLoading,
  ipcError,
  isIpcOfficialUsed,
  syncIpc,
  isRotating,
  isCustomCuotas,
  setIsCustomCuotas,
  fixedMode,
  setFixedMode,
  cuotaInputValue,
  handleCuotaValChange,
  handleTotalValChange,
  handleCuotasCountChange,
  cuotaEstimada,
  totalFinanciadoDisplay,
  calculando,
  onCalcular,
  resultado,
  onReset,
}) => {
  const [step3View, setStep3View] = useState<'resultado' | 'grafico'>('resultado');
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  const isContadoExceeded =
    formData.precio_contado !== null && formData.precio_contado > MAX_MONTO_INTEGRIDAD;
  const isCuotasExceeded =
    formData.precio_total_cuotas !== null && formData.precio_total_cuotas > MAX_MONTO_INTEGRIDAD;

  // ── Configuración del Veredicto Oficial ─────────────────────────────────────
  const isCuotas = resultado?.resultado === 'conviene_cuotas';
  const isContado = resultado?.resultado === 'conviene_contado';

  const verdictConfig = resultado
    ? isCuotas
      ? {
          badge: 'CONVIENE FINANCIAR EN CUOTAS',
          title: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} a valor de hoy`,
          sub:
            resultado.remanente_vpn != null && resultado.remanente_vpn > 0
              ? `Los rendimientos pagan el recargo y te sobran ${formatMonto(resultado.remanente_vpn, 'ARS')} en términos reales.`
              : 'El recargo comercial es menor a la pérdida de poder adquisitivo proyectada por la inflación.',
          icon: CheckCircle,
          badgeColor:
            'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
          amountColor: 'text-emerald-600 dark:text-emerald-400',
        }
      : isContado
      ? {
          badge: 'CONVIENE PAGAR DE CONTADO',
          title: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} pagando hoy`,
          sub: 'El recargo comercial nominal supera la erosión proyectada por la inflación durante el plazo.',
          icon: Lightbulb,
          badgeColor:
            'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
          amountColor: 'text-amber-600 dark:text-amber-400',
        }
      : {
          badge: 'DA PRÁCTICAMENTE LO MISMO',
          title: `Diferencia marginal de ${resultado.porcentaje_ahorro.toFixed(1)}%`,
          sub: 'La diferencia entre ambas opciones es insignificante. Podés elegir según tu disponibilidad de efectivo.',
          icon: HelpCircle,
          badgeColor:
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          amountColor: 'text-slate-700 dark:text-slate-300',
        }
    : null;

  return (
    <div className="w-full h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-[#161B24] border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none p-5 sm:p-6 lg:p-7 transition-all lg:overflow-hidden">
      {/* ── Stepper Superior de Navegación ── */}
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <nav aria-label="Progreso de la simulación" className="w-full">
          <ol className="flex items-center w-full justify-between gap-2 sm:gap-4">
            {/* Paso 1: Contado */}
            <li className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer text-left outline-none"
              >
                <span
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 1
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : currentStep > 1
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                    Paso 1
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors mt-0.5 ${
                      currentStep === 1
                        ? 'text-slate-900 dark:text-slate-100'
                        : currentStep > 1
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    Contado
                  </span>
                </div>
              </button>
              <div
                className={`flex-1 h-0.5 mx-2.5 rounded-full transition-colors ${
                  currentStep >= 2
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </li>

            {/* Paso 2: Financiación */}
            <li className="flex-1 flex items-center">
              <button
                type="button"
                disabled={!canGoToStep2}
                onClick={() => canGoToStep2 && setCurrentStep(2)}
                className={`flex items-center gap-2 sm:gap-2.5 group text-left outline-none ${
                  canGoToStep2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 2
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : currentStep > 2
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                    Paso 2
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors mt-0.5 ${
                      currentStep === 2
                        ? 'text-slate-900 dark:text-slate-100'
                        : currentStep > 2
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    Financiación
                  </span>
                </div>
              </button>
              <div
                className={`flex-1 h-0.5 mx-2.5 rounded-full transition-colors ${
                  currentStep >= 3
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </li>

            {/* Paso 3: Análisis */}
            <li className="flex items-center">
              <button
                type="button"
                disabled={!canGoToStep3}
                onClick={() => canGoToStep3 && setCurrentStep(3)}
                className={`flex items-center gap-2 sm:gap-2.5 group text-left outline-none ${
                  canGoToStep3 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 3 && resultado
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : currentStep === 3
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep === 3 && resultado ? '✓' : '3'}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                    Paso 3
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors mt-0.5 ${
                      currentStep === 3
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    Análisis
                  </span>
                </div>
              </button>
            </li>
          </ol>
        </nav>
      </div>

      {/* ── CUERPO DEL PASO ACTIVO (Espacioso y Proporcionado) ── */}
      <div className="flex-1 flex flex-col justify-center py-4 lg:overflow-y-auto lg:min-h-0 pr-1">
        {/* ═══════════════════════════════════════════════════════════════
            PASO 1: PRECIO DE CONTADO (AMPLIO, PROPORCIONADO, BANDERA ARS)
           ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div
            className="flex flex-col gap-5 max-w-2xl mx-auto w-full animate-fadeIn"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGoToStep2) {
                e.preventDefault();
                setCurrentStep(2);
              }
            }}
          >
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Referencia base
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                ¿Cuánto cuesta de contado?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                Empecemos por el importe que pagarías hoy en un único pago. Lo utilizaremos como base para contrastar cualquier alternativa financiada.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label
                htmlFor="conv_precio_contado"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Precio de contado
              </label>
              <MontoInput
                id="conv_precio_contado"
                className="w-full"
                variant="outlined"
                size="lg"
                placeholder="0"
                value={formData.precio_contado}
                onChange={(val) => handleChange('precio_contado', val)}
                allowDecimals
                autoFocus={esPunteroFino()}
              />
              {isContadoExceeded && (
                <span className="text-xs text-red-500 font-medium">
                  El precio de contado excede el límite permitido.
                </span>
              )}
              <span className="text-xs text-slate-400">
                Importe en un único pago en efectivo o transferencia inmediata.
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PASO 2: CONFIGURACIÓN DE LA FINANCIACIÓN (ÁREA ÚTIL AMPLIA)
           ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div
            className="flex flex-col gap-4 max-w-2xl mx-auto w-full animate-fadeIn"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGoToStep3) {
                e.preventDefault();
                setCurrentStep(3);
              }
            }}
          >
            {/* Header del Paso 2 */}
            <div className="flex flex-col gap-0.5 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Condiciones comerciales
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                ¿Cómo te ofrecen financiarlo?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                Indicá las cuotas y los importes informados por el comercio para calcular el recargo comercial.
              </p>
            </div>

            {/* A. Selector de cantidad de cuotas (Inline perfecto sin salto de layout) */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cantidad de cuotas
                </label>
                {formData.cantidad_cuotas && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formData.cantidad_cuotas} pagos mensuales
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {QUICK_CUOTAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`h-9 px-3.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formData.cantidad_cuotas === n && !isCustomCuotas
                        ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => {
                      setIsCustomCuotas(false);
                      handleCuotasCountChange(n);
                    }}
                  >
                    {n}x
                  </button>
                ))}

                {/* Cápsula de "Otra cantidad" in-place */}
                {!isCustomCuotas ? (
                  <button
                    type="button"
                    className="h-9 px-3 text-xs font-bold rounded-xl border bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => {
                      setIsCustomCuotas(true);
                      handleCuotasCountChange(9);
                    }}
                  >
                    Otra cantidad
                  </button>
                ) : (
                  <div className="inline-flex items-center h-9 rounded-xl border border-[#0D2045] dark:border-[#4878B8] bg-[#0D2045]/5 dark:bg-[#4878B8]/10 px-2.5 gap-1.5 transition-all">
                    <input
                      id="conv_cuotas_custom"
                      type="number"
                      placeholder="N°"
                      value={formData.cantidad_cuotas ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        handleCuotasCountChange(val);
                      }}
                      min="1"
                      max="120"
                      step="1"
                      className="w-12 h-6 text-xs font-bold text-center bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                      inputMode="numeric"
                      autoFocus={esPunteroFino()}
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">cuotas</span>
                  </div>
                )}
              </div>
            </div>

            {/* B & C. Grilla de 2 columnas amplia: Modalidad e Importe informado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              {/* Selector de Modalidad */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ¿Tiene recargo o interés?
                </label>
                <SegmentedControl<'fijas' | 'tna'>
                  options={[
                    { value: 'fijas', label: 'Cuotas fijas' },
                    { value: 'tna', label: 'Con interés (TNA)' },
                  ]}
                  value={formData.tiene_interes ? 'tna' : 'fijas'}
                  onChange={(val) => handleChange('tiene_interes', val === 'tna')}
                  fullWidth
                  ariaLabel="Modalidad de financiación"
                />
              </div>

              {/* Selector de Forma de Ingreso (solo si cuotas fijas) */}
              {!formData.tiene_interes ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ¿Qué valor te informaron?
                  </label>
                  <SegmentedControl<'total' | 'cuota'>
                    options={[
                      { value: 'total', label: 'Total financiado' },
                      { value: 'cuota', label: 'Valor por cuota' },
                    ]}
                    value={fixedMode}
                    onChange={(val) => setFixedMode(val)}
                    fullWidth
                    ariaLabel="¿Qué valor te informaron?"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 justify-end">
                  <span className="text-[11.5px] text-slate-400 leading-tight">
                    El cálculo estimará la amortización francesa según la TNA informada por el banco o comercio.
                  </span>
                </div>
              )}
            </div>

            {/* D. Input Unificado (Monto o TNA) con Microcopy Dinámico */}
            {!formData.tiene_interes ? (
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {fixedMode === 'total' ? 'Total financiado sumando todas las cuotas' : 'Valor de cada cuota mensual'}
                </label>
                <MontoInput
                  id={fixedMode === 'total' ? 'conv_total_cuotas' : 'conv_valor_cuota'}
                  className="w-full text-base sm:text-lg"
                  variant="outlined"
                  placeholder="0"
                  value={fixedMode === 'total' ? formData.precio_total_cuotas : cuotaInputValue}
                  onChange={fixedMode === 'total' ? handleTotalValChange : handleCuotaValChange}
                  allowDecimals
                />
                {isCuotasExceeded && (
                  <span className="text-xs text-red-500 font-medium">
                    El precio en cuotas excede el límite permitido.
                  </span>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {fixedMode === 'total'
                    ? formData.cantidad_cuotas && formData.precio_total_cuotas
                      ? `Equivale a ${formData.cantidad_cuotas} cuotas de ~${formatMonto(
                          cuotaEstimada || 0,
                          'ARS'
                        )} cada una.`
                      : 'Importe final que pagarías sumando todos los pagos.'
                    : formData.cantidad_cuotas && cuotaInputValue
                    ? `${formData.cantidad_cuotas} cuotas × ${formatMonto(
                        cuotaInputValue,
                        'ARS'
                      )} = Total financiado ${formatMonto(totalFinanciadoDisplay || 0, 'ARS')}.`
                    : 'Importe de cada pago mensual individual.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 pt-1">
                <label
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="conv_tna"
                >
                  Tasa Nominal Anual (TNA) de la compra
                </label>
                <div className="flex items-stretch h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <input
                    id="conv_tna"
                    type="number"
                    step="any"
                    min="0.1"
                    max="3000"
                    placeholder="Ej: 120"
                    value={formData.tna}
                    onChange={(e) => handleChange('tna', e.target.value)}
                    className="flex-1 px-3.5 text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                    inputMode="decimal"
                  />
                  <span className="flex items-center px-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border-l border-slate-200 dark:border-slate-700">
                    % anual
                  </span>
                </div>
                {formData.tna !== '' &&
                  (isNaN(parseFloat(formData.tna)) ||
                    parseFloat(formData.tna) < 0.1 ||
                    parseFloat(formData.tna) > 3000) && (
                    <span className="text-xs text-red-500 font-medium">TNA debe estar entre 0.1% y 3000%</span>
                  )}
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {cuotaEstimada !== null && formData.cantidad_cuotas
                    ? `Pagarás ${formData.cantidad_cuotas} cuotas de ~${formatMonto(
                        cuotaEstimada,
                        'ARS'
                      )}${totalFinanciadoDisplay !== null ? ` (Total: ${formatMonto(totalFinanciadoDisplay, 'ARS')})` : ''}`
                    : 'Figura en el resumen bancario o en la letra chica del comercio.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PASO 3: SUPUESTOS Y RESULTADO PRINCIPAL INMEDIATO
           ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full animate-fadeIn">
            {/* Si aún no se calculó resultado: pantalla de confirmación y supuestos */}
            {!resultado ? (
              <>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Parámetros finales
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    Comparemos las alternativas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                    Revisá los supuestos económicos antes de analizar qué opción te conviene.
                  </p>
                </div>

                {/* Resumen Compacto de la Compra Previo al Análisis */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-800 dark:text-slate-200">
                    <span>
                      Contado: <strong>{formatMonto(formData.precio_contado || 0, 'ARS')}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span>
                      {formData.cantidad_cuotas}x de ~<strong>{formatMonto(cuotaEstimada || 0, 'ARS')}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span>
                      Total: <strong>{formatMonto(totalFinanciadoDisplay || 0, 'ARS')}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-[#4878B8] hover:underline cursor-pointer shrink-0"
                  >
                    <Edit3 size={13} />
                    <span>Modificar</span>
                  </button>
                </div>

                {/* Grilla de Supuestos Económicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Supuesto 1: Inflación mensual */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                        htmlFor="conv_inflacion"
                      >
                        Inflación mensual esperada
                      </label>
                      {ipcLoading ? (
                        <span className="text-[10px] text-slate-400">Cargando…</span>
                      ) : isIpcOfficialUsed ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                          IPC · {ipcData?.valor_mensual}%
                        </span>
                      ) : ipcError ? (
                        <span className="text-[10px] text-slate-400">Sin datos</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Manual</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-stretch h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                        <input
                          id="conv_inflacion"
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          placeholder="Ej: 1.66"
                          value={formData.inflacion_mensual}
                          onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                          className="flex-1 px-3 text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          inputMode="decimal"
                        />
                        <span className="flex items-center px-2.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-700/50 border-l border-slate-200 dark:border-slate-700">
                          %/mes
                        </span>
                      </div>

                      {!isIpcOfficialUsed && ipcData?.valor_mensual != null && (
                        <button
                          type="button"
                          className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-primary text-xs font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          onClick={syncIpc}
                          title="Restablecer valor oficial del INDEC"
                        >
                          <RefreshCcw size={12} className={isRotating ? 'animate-spin' : ''} />
                          <span>{ipcData.valor_mensual}%</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[11.5px] text-slate-400">
                      Tasa mensual para descontar las cuotas futuras a hoy.
                    </span>
                  </div>

                  {/* Supuesto 2: Rendimiento alternativo del dinero */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Invertir el dinero hoy
                      </label>
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.hasCapitalToInvest}
                        className={`w-10 h-5 rounded-full border transition-all p-0.5 inline-flex items-center cursor-pointer shrink-0 outline-none ${
                          formData.hasCapitalToInvest
                            ? 'bg-primary border-primary'
                            : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                        }`}
                        onClick={() => handleChange('hasCapitalToInvest', !formData.hasCapitalToInvest)}
                        aria-label="Invertir el dinero hoy"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform ${
                            formData.hasCapitalToInvest ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {formData.hasCapitalToInvest ? (
                      <div className="flex flex-col gap-1 animate-fadeIn">
                        <div className="flex items-stretch h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                          <input
                            id="conv_tna_billetera"
                            type="number"
                            step="any"
                            min="0.1"
                            max="3000"
                            placeholder="Ej: 38"
                            value={formData.investmentTna}
                            onChange={(e) => handleChange('investmentTna', e.target.value)}
                            className="flex-1 px-3 text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                            inputMode="decimal"
                          />
                          <span className="flex items-center px-2.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-700/50 border-l border-slate-200 dark:border-slate-700">
                            % TNA
                          </span>
                        </div>
                        <span className="text-[11.5px] text-slate-400">
                          Rendimiento de billetera remunerada o fondo (FCI).
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-slate-400 leading-relaxed pt-1">
                        Permite simular el saldo si conservás el dinero invertido mes a mes.
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Si el cálculo ya fue realizado: ALTERNANCIA ENTRE RESULTADO Y GRÁFICO (MISMO ESPACIO) */
              <div
                key={step3View}
                className={`${styles.viewContainer} ${
                  slideDirection === 'forward' ? styles.slideFromRight : styles.slideFromLeft
                }`}
              >
                {step3View === 'resultado' ? (
                  /* ── VISTA A: RESULTADO DEL ANÁLISIS ── */
                  <div className="flex flex-col gap-4">
                    {/* Veredicto Hero Card (Sobrio, editorial, sin bloques agresivos) */}
                    {verdictConfig && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md border ${verdictConfig.badgeColor}`}
                          >
                            {verdictConfig.badge}
                          </span>
                          <div className="p-1 rounded-full text-slate-500 dark:text-slate-400">
                            {React.createElement(verdictConfig.icon, { size: 22 })}
                          </div>
                        </div>

                        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${verdictConfig.amountColor}`}>
                          {verdictConfig.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {verdictConfig.sub}
                        </p>
                      </div>
                    )}

                    {/* 3 Tarjetas Métricas Esenciales */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Precio Contado
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                          {formatMonto(resultado.precio_contado, 'ARS')}
                        </span>
                        <span className="text-[10.5px] text-slate-400">Desembolso único hoy</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Costo Real en Cuotas
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                          {formatMonto(resultado.costo_real_cuotas, 'ARS')}
                        </span>
                        <span className="text-[10.5px] text-slate-400">Valor presente VPN</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {isCuotas ? 'Ahorro Real Neto' : isContado ? 'Sobrecosto Real' : 'Diferencia'}
                        </span>
                        <span
                          className={`text-base sm:text-lg font-black mt-0.5 tabular-nums ${
                            isCuotas
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isContado
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatMonto(resultado.ahorro_real, 'ARS')}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {resultado.porcentaje_ahorro.toFixed(1)}% de variación
                        </span>
                      </div>
                    </div>

                    {/* Botón para acceder al Gráfico (Navegación horizontal de vistas) */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSlideDirection('forward');
                          setStep3View('grafico');
                        }}
                        className="w-full py-3 px-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0D2045] dark:focus-visible:ring-[#4878B8]"
                      >
                        <span>Ver evolución de las cuotas</span>
                        <ArrowRight size={16} className="text-slate-500 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── VISTA B: GRÁFICO DE EVOLUCIÓN DEDICADO Y DESGLOSE TÉCNICO ── */
                  <div className="flex flex-col gap-3.5">
                    {/* Encabezado de la Vista B con control de regreso */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSlideDirection('backward');
                          setStep3View('resultado');
                        }}
                        className="inline-flex items-center gap-1.5 py-1 px-2.5 -ml-2.5 rounded-lg text-xs font-bold text-primary dark:text-[#4878B8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ArrowLeft size={14} />
                        <span>Volver al resultado</span>
                      </button>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Evolución del poder adquisitivo
                      </span>
                    </div>

                    {/* Gráfico Dedicado que aprovecha el espacio disponible */}
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#161B24]">
                      <DetalleCuotasChart
                        detallePorMes={resultado.detalle_por_mes}
                        resultado={resultado.resultado}
                      />
                    </div>

                    {/* Explicación Técnica («¿Cómo calculamos esto?») */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#161B24]">
                      <ExplicacionCalculo />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BARRA INFERIOR DE ACCIONES STABLE (Anclada al pie) ── */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
        {/* Lado izquierdo: Botón Volver */}
        <div>
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none"
            >
              <ArrowLeft size={14} />
              <span>Volver a contado</span>
            </button>
          )}

          {currentStep === 3 && !resultado && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none"
            >
              <ArrowLeft size={14} />
              <span>Volver a financiación</span>
            </button>
          )}

          {currentStep === 3 && resultado && (
            <button
              type="button"
              onClick={() => {
                setStep3View('resultado');
                setCurrentStep(2);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none"
            >
              <ArrowLeft size={14} />
              <span>Modificar condiciones</span>
            </button>
          )}
        </div>

        {/* Lado derecho: Botón Continuar / Analizar / Nueva Simulación */}
        <div>
          {currentStep === 1 && (
            <button
              type="button"
              disabled={!canGoToStep2}
              onClick={() => canGoToStep2 && setCurrentStep(2)}
              className={`h-11 px-5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all outline-none ${
                canGoToStep2
                  ? 'bg-[#0D2045] hover:bg-[#1A3568] text-white dark:bg-[#4878B8] dark:hover:bg-[#3B6BA8] shadow-xs cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Continuar con la financiación</span>
              <ArrowRight size={14} />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              disabled={!canGoToStep3}
              onClick={() => canGoToStep3 && setCurrentStep(3)}
              className={`h-11 px-5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all outline-none ${
                canGoToStep3
                  ? 'bg-[#0D2045] hover:bg-[#1A3568] text-white dark:bg-[#4878B8] dark:hover:bg-[#3B6BA8] shadow-xs cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Continuar al análisis</span>
              <ArrowRight size={14} />
            </button>
          )}

          {currentStep === 3 && !resultado && (
            <button
              type="button"
              disabled={!canCalculate || calculando}
              onClick={onCalcular}
              className={`h-11 px-6 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all outline-none ${
                canCalculate && !calculando
                  ? 'bg-[#0D2045] hover:bg-[#1A3568] text-white dark:bg-[#4878B8] dark:hover:bg-[#3B6BA8] shadow-xs cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              {calculando ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculando…</span>
                </>
              ) : (
                <>
                  <span>Analizar alternativas</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}

          {currentStep === 3 && resultado && (
            <button
              type="button"
              onClick={() => {
                setStep3View('resultado');
                onReset();
                setCurrentStep(1);
              }}
              className="h-11 px-5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer outline-none"
            >
              <RotateCcw size={13} />
              <span>Nueva simulación</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConvenienciaForm;
