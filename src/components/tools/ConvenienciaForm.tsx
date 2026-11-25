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
import { MontoInput, AyudaBoton } from '@/components/ui';
import SegmentedControl from '@/components/ui/SegmentedControl';
import type { InflacionEsperadaData, ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import { formatMonto, formatPorcentaje } from '@/utils/format';
import {
  TEXTO_AYUDA_CUOTAS_CONTADO,
  TEXTO_AYUDA_INFLACION_ESPERADA,
  textoContadoResultado,
  esCuotaEstimadaFormulario,
} from './conveniencia';
import type { ConvenienciaFormState } from './ConvenienciaWizard';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import styles from './ConvenienciaForm.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

const MONEDA_OPTIONS: { value: 'ARS' | 'USD'; label: string }[] = [
  { value: 'ARS', label: 'Pesos' },
  { value: 'USD', label: 'Dólares' },
];

export interface ConvenienciaFormProps {
  currentStep: 1 | 2 | 3;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  canGoToStep2: boolean;
  canGoToStep3: boolean;
  canCalculate: boolean;
  formData: ConvenienciaFormState;
  handleChange: (field: string, value: string | number | boolean | null) => void;
  ipcData: InflacionEsperadaData | null;
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

  const monedaContadoActual: 'ARS' | 'USD' = formData.moneda_contado === 'USD' ? 'USD' : 'ARS';
  const monedaCuotasEfectiva: 'ARS' | 'USD' = formData.sin_interes
    ? monedaContadoActual
    : (formData.moneda_cuotas === 'USD' ? 'USD' : 'ARS');
  const monedaResultado: 'ARS' | 'USD' =
    resultado?.moneda === 'USD' ? 'USD' : monedaCuotasEfectiva;
  const esCuotaEstimada = esCuotaEstimadaFormulario({
    tiene_interes: formData.tiene_interes,
    sin_interes: formData.sin_interes,
    fixedMode,
  });
  const contadoDisplay = resultado
    ? textoContadoResultado(resultado, monedaContadoActual, monedaResultado)
    : null;

  // ── Configuración del Veredicto Oficial (D-T2.3) ────────────────────────────
  const isCuotas = resultado?.resultado === 'conviene_cuotas';
  const isContado = resultado?.resultado === 'conviene_contado';

  const verdictConfig = resultado
    ? isCuotas
      ? {
          title: resultado.titulo || 'Te conviene en cuotas.',
          line2: resultado.linea_2 || '',
          line3: resultado.linea_3 || '',
          icon: CheckCircle,
          amountColor: 'text-emerald-600 dark:text-emerald-400',
        }
      : isContado
      ? {
          title: resultado.titulo || 'Te conviene de contado.',
          line2: resultado.linea_2 || '',
          line3: resultado.linea_3 || '',
          icon: Lightbulb,
          amountColor: 'text-amber-600 dark:text-amber-400',
        }
      : {
          title: resultado.titulo || 'Da casi lo mismo.',
          line2: resultado.linea_2 || '',
          line3: resultado.linea_3 || '',
          icon: HelpCircle,
          amountColor: 'text-slate-700 dark:text-slate-300',
        }
    : null;

  return (
    <div className="w-full h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-[#161B24] border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none p-4 sm:p-6 lg:p-7 transition-all lg:overflow-hidden">
      {/* ── Stepper Superior de Navegación ── */}
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <nav aria-label="Progreso de la simulación" className="w-full min-w-0">
          <ol className={`flex items-center w-full justify-between min-w-0 ${styles.stepperList}`}>
            {/* Paso 1: Contado */}
            <li className="flex-1 flex items-center min-w-0">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center group cursor-pointer text-left outline-none min-w-0 ${styles.stepperBtn}`}
              >
                <span
                  className={`${styles.stepperCircle} rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${
                    currentStep === 1
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : currentStep > 1
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className={`${styles.stepperKicker} text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none`}>
                    Paso 1
                  </span>
                  <span
                    className={`${styles.stepperLabel} font-bold transition-colors whitespace-nowrap ${
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
                className={`${styles.stepperLine} flex-1 h-0.5 rounded-full transition-colors ${
                  currentStep >= 2
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </li>

            {/* Paso 2: Financiación */}
            <li className="flex-1 flex items-center min-w-0">
              <button
                type="button"
                disabled={!canGoToStep2}
                onClick={() => canGoToStep2 && setCurrentStep(2)}
                className={`flex items-center group text-left outline-none min-w-0 ${styles.stepperBtn} ${
                  canGoToStep2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`${styles.stepperCircle} rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${
                    currentStep === 2
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : currentStep > 2
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className={`${styles.stepperKicker} text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none`}>
                    Paso 2
                  </span>
                  <span
                    className={`${styles.stepperLabel} font-bold transition-colors whitespace-nowrap ${
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
                className={`${styles.stepperLine} flex-1 h-0.5 rounded-full transition-colors ${
                  currentStep >= 3
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </li>

            {/* Paso 3: Análisis */}
            <li className="flex items-center min-w-0 shrink-0">
              <button
                type="button"
                disabled={!canGoToStep3}
                onClick={() => canGoToStep3 && setCurrentStep(3)}
                className={`flex items-center group text-left outline-none min-w-0 ${styles.stepperBtn} ${
                  canGoToStep3 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`${styles.stepperCircle} rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${
                    currentStep === 3 && resultado
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : currentStep === 3
                      ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep === 3 && resultado ? '✓' : '3'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className={`${styles.stepperKicker} text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none`}>
                    Paso 3
                  </span>
                  <span
                    className={`${styles.stepperLabel} font-bold transition-colors whitespace-nowrap ${
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
                Contado
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-[clamp(16px,4.5vw,24px)] sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                  ¿Cuánto cuesta de contado?
                </h2>
                <AyudaBoton
                  titulo="Cuotas vs contado"
                  texto={TEXTO_AYUDA_CUOTAS_CONTADO}
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                Poné lo que pagarías hoy en un solo pago.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="conv_precio_contado"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Precio de contado
                </label>
                <SegmentedControl<'ARS' | 'USD'>
                  options={MONEDA_OPTIONS}
                  value={monedaContadoActual}
                  onChange={(v) => handleChange('moneda_contado', v)}
                  ariaLabel="Moneda del precio de contado"
                  size="lg"
                />
              </div>
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
                En efectivo o transferencia, en un solo pago.
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
                Cuotas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                ¿Cómo te ofrecen financiarlo?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                Poné las cuotas que te ofrece el comercio.
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

            {/* B. Valor de cada cuota + "Sin interés" + "Sé la tasa" (D-T2.6) */}
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {!formData.tiene_interes ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={fixedMode === 'total' ? 'conv_total_cuotas' : 'conv_valor_cuota'}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      {fixedMode === 'total' ? 'Total en cuotas' : 'Valor de cada cuota'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {!formData.sin_interes && (
                        <SegmentedControl<'ARS' | 'USD'>
                          options={MONEDA_OPTIONS}
                          value={monedaCuotasEfectiva}
                          onChange={(v) => handleChange('moneda_cuotas', v)}
                          ariaLabel="Moneda de las cuotas"
                          size="lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleChange('sin_interes', !formData.sin_interes)}
                        aria-pressed={formData.sin_interes}
                        className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.sin_interes
                            ? 'bg-[#0D2045] dark:bg-[#4878B8] text-white border-transparent shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        Sin interés
                      </button>
                      <button
                        type="button"
                        onClick={() => setFixedMode(fixedMode === 'cuota' ? 'total' : 'cuota')}
                        className="text-[11px] font-bold text-primary dark:text-[#4878B8] hover:underline cursor-pointer"
                      >
                        {fixedMode === 'cuota' ? 'Prefiero poner el total' : 'Prefiero poner cada cuota'}
                      </button>
                    </div>
                  </div>

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
                    {formData.sin_interes && cuotaEstimada !== null && formData.cantidad_cuotas
                      ? `${formData.cantidad_cuotas} cuotas sin interés de ${formatMonto(cuotaEstimada, monedaCuotasEfectiva)} cada una.`
                      : fixedMode === 'total'
                      ? formData.cantidad_cuotas && formData.precio_total_cuotas
                        ? `Equivale a ${formData.cantidad_cuotas} cuotas de ~${formatMonto(cuotaEstimada || 0, monedaCuotasEfectiva)} cada una.`
                        : 'Total sumando todas las cuotas.'
                      : formData.cantidad_cuotas && cuotaInputValue
                      ? `${formData.cantidad_cuotas} cuotas de ${formatMonto(cuotaInputValue, monedaCuotasEfectiva)} son ${formatMonto(totalFinanciadoDisplay || 0, monedaCuotasEfectiva)}.`
                      : 'Es lo que te muestra el comercio por mes.'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      htmlFor="conv_tna"
                    >
                      Tasa anual (si la sabés)
                    </label>
                    <SegmentedControl<'ARS' | 'USD'>
                      options={MONEDA_OPTIONS}
                      value={monedaCuotasEfectiva}
                      onChange={(v) => handleChange('moneda_cuotas', v)}
                      ariaLabel="Moneda de las cuotas"
                      size="lg"
                    />
                  </div>
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
                      % por año
                    </span>
                  </div>
                  {formData.tna !== '' &&
                    (isNaN(parseFloat(formData.tna)) ||
                      parseFloat(formData.tna) < 0.1 ||
                      parseFloat(formData.tna) > 3000) && (
                      <span className="text-xs text-red-500 font-medium">
                        Ingresá una tasa de entre 0,1% y 3.000% por año.
                      </span>
                    )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {cuotaEstimada !== null && formData.cantidad_cuotas
                      ? `Quedan ${formData.cantidad_cuotas} cuotas de ~${formatMonto(
                          cuotaEstimada,
                          monedaCuotasEfectiva
                        )}${totalFinanciadoDisplay !== null ? ` (Total: ${formatMonto(totalFinanciadoDisplay, monedaCuotasEfectiva)})` : ''}`
                      : 'Calcula el valor aproximado de cada cuota.'}
                  </span>
                </div>
              )}

              {/* Opción "Sé la tasa" */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.tiene_interes}
                  onClick={() => handleChange('tiene_interes', !formData.tiene_interes)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary dark:text-[#4878B8] hover:underline cursor-pointer"
                >
                  <span>{formData.tiene_interes ? 'Volver al valor de cada cuota' : 'Sé la tasa'}</span>
                </button>
              </div>
            </div>
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
                    Inflación
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    Comparemos las alternativas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                    Revisá los datos antes de ver qué te conviene.
                  </p>
                </div>

                {/* Resumen Compacto de la Compra Previo al Análisis */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-800 dark:text-slate-200">
                    <span>
                      Contado: <strong>{formatMonto(formData.precio_contado || 0, monedaContadoActual)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span>
                      {formData.cantidad_cuotas}x de {esCuotaEstimada ? '~' : ''}<strong>{formatMonto(cuotaEstimada || 0, monedaCuotasEfectiva)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span>
                      Total: <strong>{formatMonto(totalFinanciadoDisplay || 0, monedaCuotasEfectiva)}</strong>
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

                {/* Grilla de Supuestos Económicos (oculta con cuotas en dólares, D-V1.7) */}
                {monedaCuotasEfectiva !== 'USD' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Supuesto 1: Inflación esperada vs propia (D-T2.6) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Inflación
                      </span>
                      <AyudaBoton
                        titulo="La inflación que se espera"
                        texto={TEXTO_AYUDA_INFLACION_ESPERADA}
                      />
                    </div>

                    <SegmentedControl<'esperada' | 'propia'>
                      options={[
                        { value: 'esperada', label: 'La que se espera para los próximos meses' },
                        { value: 'propia', label: 'Escribir una propia' },
                      ]}
                      value={formData.usar_inflacion_propia || ipcError ? 'propia' : 'esperada'}
                      onChange={(val) => {
                        handleChange('usar_inflacion_propia', val === 'propia');
                        if (val === 'esperada' && ipcData?.valor_mensual != null) {
                          handleChange('inflacion_mensual', ipcData.valor_mensual.toString());
                        }
                      }}
                      layout="stacked"
                      fullWidth
                      size="lg"
                      ariaLabel="Inflación para el cálculo"
                    />

                    {(formData.usar_inflacion_propia || ipcError) ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-stretch h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                          <input
                            id="conv_inflacion"
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            placeholder="Ej: 2"
                            value={formData.inflacion_mensual}
                            onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                            className="flex-1 px-3 text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                            inputMode="decimal"
                          />
                          <span className="flex items-center px-2.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-700/50 border-l border-slate-200 dark:border-slate-700">
                            % por mes
                          </span>
                        </div>

                        {!isIpcOfficialUsed && ipcData?.valor_mensual != null && (
                          <button
                            type="button"
                            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-primary text-xs font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            onClick={syncIpc}
                            title="Volver a la inflación que se espera"
                          >
                            <RefreshCcw size={12} className={isRotating ? 'animate-spin' : ''} />
                            <span>{formatPorcentaje(ipcData.valor_mensual)}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
                        {ipcLoading
                          ? 'Cargando proyección mensual…'
                          : ipcData?.meses?.length
                          ? `Usamos la proyección mes a mes (${formatPorcentaje(ipcData.valor_mensual)} el primer mes).`
                          : 'Usamos la proyección mensual automática.'}
                      </span>
                    )}
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
                            % por año
                          </span>
                        </div>
                        <span className="text-[11.5px] text-slate-400">
                          Rendimiento de billetera remunerada o fondo.
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-slate-400 leading-relaxed pt-1">
                        Si dejás la plata invertida mientras pagás las cuotas.
                      </span>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
                    En dólares no hay inflación que achique las cuotas.
                  </div>
                )}
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
                    {/* Veredicto Hero Card (3 líneas D-T2.3) */}
                    {verdictConfig && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${verdictConfig.amountColor}`}>
                            {verdictConfig.title}
                          </h3>
                          <div className="p-1 rounded-full text-slate-500 dark:text-slate-400 shrink-0">
                            {React.createElement(verdictConfig.icon, { size: 22 })}
                          </div>
                        </div>

                        {verdictConfig.line2 && (
                          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                            {verdictConfig.line2}
                          </p>
                        )}
                        {verdictConfig.line3 && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {verdictConfig.line3}
                          </p>
                        )}
                        {resultado?.linea_billetera && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {resultado.linea_billetera}
                          </p>
                        )}
                        {resultado?.linea_cotizacion && (
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {resultado.linea_cotizacion}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 3 Tarjetas Métricas Esenciales */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Precio de contado
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                          {contadoDisplay ? contadoDisplay.monto : formatMonto(resultado.precio_contado, monedaContadoActual)}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {contadoDisplay ? contadoDisplay.subtitulo : 'Un pago hoy'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          En plata de hoy
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                          {formatMonto(resultado.costo_real_cuotas, monedaResultado)}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {monedaResultado === 'USD' ? 'En dólares' : 'Con la inflación elegida'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {isCuotas ? 'Te ahorrás' : isContado ? 'Pagás de más' : 'Diferencia'}
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
                          {formatMonto(Math.abs(resultado.ahorro_real), monedaResultado)}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {isCuotas
                            ? `${formatPorcentaje(Math.abs(resultado.porcentaje_ahorro))} menos que de contado`
                            : isContado
                            ? `${formatPorcentaje(Math.abs(resultado.porcentaje_ahorro))} más que de contado`
                            : `${formatPorcentaje(Math.abs(resultado.porcentaje_ahorro))} de diferencia`}
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
