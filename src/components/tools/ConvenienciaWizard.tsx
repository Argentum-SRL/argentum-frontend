import React, { useState, useEffect } from 'react';
import type { IPCData, ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import type { PlanCuotas } from '@/types';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import ConvenienciaForm from './ConvenienciaForm';
import ConvenienciaSidebar from './ConvenienciaSidebar';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

export interface ConvenienciaWizardProps {
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
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
    hasCapitalToInvest: boolean;
    investmentTna: string;
  }>>;
  resultado: IConvenienciaResult | null;
  calculando: boolean;
  calcular: () => Promise<boolean>;
  resetCalculadora: () => void;
  cuotaCalculada: number | null;
  planCuotas?: PlanCuotas | null;
  ipcData: IPCData | null;
  ipcLoading: boolean;
  ipcError: boolean;
}

export const ConvenienciaWizard: React.FC<ConvenienciaWizardProps> = ({
  formData,
  setFormData,
  resultado,
  calculando,
  calcular,
  resetCalculadora,
  cuotaCalculada,
  planCuotas = null,
  ipcData,
  ipcLoading,
  ipcError,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => (resultado ? 3 : 1));
  const [isRotating, setIsRotating] = useState(false);
  const [isCustomCuotas, setIsCustomCuotas] = useState<boolean>(
    Boolean(formData.cantidad_cuotas && !QUICK_CUOTAS.includes(formData.cantidad_cuotas))
  );
  const [showDetailedReport, setShowDetailedReport] = useState<boolean>(false);

  // Modo de ingreso para cuotas fijas: 'cuota' | 'total'
  const [fixedMode, setFixedMode] = useState<'cuota' | 'total'>('total');
  const [cuotaInputValue, setCuotaInputValue] = useState<number | null>(() => {
    if (formData.precio_total_cuotas && formData.cantidad_cuotas) {
      return Math.round((formData.precio_total_cuotas / formData.cantidad_cuotas) * 100) / 100;
    }
    return null;
  });

  // Reset handler completo
  const handleReset = () => {
    resetCalculadora();
    setFormData({
      precio_contado: null,
      precio_total_cuotas: null,
      cantidad_cuotas: 12,
      inflacion_mensual: ipcData?.valor_mensual ? ipcData.valor_mensual.toString() : '',
      tiene_interes: false,
      tna: '',
      hasCapitalToInvest: false,
      investmentTna: '',
    });
    setFixedMode('total');
    setCuotaInputValue(null);
    setShowDetailedReport(false);
    setCurrentStep(1);
  };

  const handleChange = (field: string, value: string | number | boolean | null) => {
    // Si hay un resultado previo y se modifican datos, invalidar el resultado anterior
    if (resultado) {
      resetCalculadora();
    }

    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tiene_interes') {
        if (value === true) next.precio_total_cuotas = null;
        else next.tna = '';
      }
      if (field === 'hasCapitalToInvest' && value === false) {
        next.investmentTna = '';
      }
      return next;
    });
  };

  const syncIpc = () => {
    if (ipcData?.valor_mensual != null) {
      setIsRotating(true);
      handleChange('inflacion_mensual', ipcData.valor_mensual.toString());
      setTimeout(() => setIsRotating(false), 600);
    }
  };

  useEffect(() => {
    if (ipcData?.valor_mensual != null) {
      setFormData(prev => {
        if (!prev.inflacion_mensual) {
          return { ...prev, inflacion_mensual: ipcData.valor_mensual.toString() };
        }
        return prev;
      });
    }
  }, [ipcData?.valor_mensual, setFormData]);

  const handleFixedModeChange = (mode: 'total' | 'cuota') => {
    setFixedMode(mode);
    if (mode === 'cuota' && formData.precio_total_cuotas && formData.cantidad_cuotas) {
      setCuotaInputValue(Math.round((formData.precio_total_cuotas / formData.cantidad_cuotas) * 100) / 100);
    }
  };

  const handleCuotaValChange = (val: number | null) => {
    setCuotaInputValue(val);
    if (val !== null && val > 0 && formData.cantidad_cuotas) {
      handleChange('precio_total_cuotas', Math.round(val * formData.cantidad_cuotas));
    } else {
      handleChange('precio_total_cuotas', null);
    }
  };

  const handleTotalValChange = (val: number | null) => {
    handleChange('precio_total_cuotas', val);
    if (val !== null && val > 0 && formData.cantidad_cuotas) {
      setCuotaInputValue(Math.round((val / formData.cantidad_cuotas) * 100) / 100);
    } else {
      setCuotaInputValue(null);
    }
  };

  const handleCuotasCountChange = (n: number | null) => {
    handleChange('cantidad_cuotas', n);
    if (n && n > 0) {
      if (fixedMode === 'cuota' && cuotaInputValue) {
        handleChange('precio_total_cuotas', Math.round(cuotaInputValue * n));
      } else if (fixedMode === 'total' && formData.precio_total_cuotas) {
        setCuotaInputValue(Math.round((formData.precio_total_cuotas / n) * 100) / 100);
      }
    }
  };

  // ── Validaciones por Paso ────────────────────────────────────────────────
  const canGoToStep2 =
    formData.precio_contado !== null &&
    !isNaN(formData.precio_contado) &&
    formData.precio_contado > 0 &&
    formData.precio_contado <= MAX_MONTO_INTEGRIDAD;

  const hasCuotas =
    formData.cantidad_cuotas !== null &&
    !isNaN(formData.cantidad_cuotas) &&
    formData.cantidad_cuotas >= 1 &&
    formData.cantidad_cuotas <= 120;

  const hasFinancingCondition =
    (!formData.tiene_interes && (
      formData.precio_total_cuotas !== null &&
      !isNaN(formData.precio_total_cuotas) &&
      formData.precio_total_cuotas > 0 &&
      formData.precio_total_cuotas <= MAX_MONTO_INTEGRIDAD
    )) ||
    (formData.tiene_interes && (
      Boolean(formData.tna) &&
      !isNaN(parseFloat(formData.tna)) &&
      parseFloat(formData.tna) >= 0.1 &&
      parseFloat(formData.tna) <= 3000
    ));

  const canGoToStep3 = canGoToStep2 && hasCuotas && hasFinancingCondition;

  const hasInflation =
    Boolean(formData.inflacion_mensual) &&
    !isNaN(parseFloat(formData.inflacion_mensual)) &&
    parseFloat(formData.inflacion_mensual) >= 0 &&
    parseFloat(formData.inflacion_mensual) <= 100;

  const hasInvestmentCondition =
    !formData.hasCapitalToInvest ||
    (Boolean(formData.investmentTna) &&
      !isNaN(parseFloat(formData.investmentTna)) &&
      parseFloat(formData.investmentTna) >= 0.1 &&
      parseFloat(formData.investmentTna) <= 3000);

  const canCalculate = canGoToStep3 && hasInflation && hasInvestmentCondition;

  const handleCalcular = async () => {
    if (!canCalculate) return;
    const success = await calcular();
    if (success) {
      setShowDetailedReport(false);
      setCurrentStep(3);
    }
  };

  const cuotaEstimada = cuotaCalculada;

  const totalFinanciadoDisplay = (() => {
    if (!formData.tiene_interes) {
      return formData.precio_total_cuotas;
    }
    return planCuotas ? planCuotas.total_financiado : null;
  })();

  const recargoNominal = (() => {
    if (planCuotas && planCuotas.recargo !== null && planCuotas.recargo_porcentaje !== null) {
      return { diff: planCuotas.recargo, pct: planCuotas.recargo_porcentaje };
    }
    return null;
  })();

  const { contadoBarPct, cuotasBarPct } = (() => {
    const pContado = formData.precio_contado || 0;
    const pCuotas = totalFinanciadoDisplay || 0;
    const max = Math.max(pContado, pCuotas, 1);
    if (pContado === 0 && pCuotas === 0) return { contadoBarPct: 0, cuotasBarPct: 0 };
    return {
      contadoBarPct: Math.min(100, Math.max(8, Math.round((pContado / max) * 100))),
      cuotasBarPct: pCuotas > 0 ? Math.min(100, Math.max(8, Math.round((pCuotas / max) * 100))) : 0,
    };
  })();

  const isIpcOfficialUsed = Boolean(
    ipcData?.valor_mensual != null &&
    formData.inflacion_mensual === ipcData.valor_mensual.toString()
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-1 sm:py-2 flex flex-col gap-4">
      {/* ─────────────────────────────────────────────────────────────
          EXPERIENCIA GUIADA HORIZONTAL DE 2 COLUMNAS (65% / 35%)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch lg:h-[calc(100dvh-220px)] lg:min-h-[540px] lg:max-h-[760px]">
        {/* Columna Izquierda: Paso Activo Guiado (~65%) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <ConvenienciaForm
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            canGoToStep2={canGoToStep2}
            canGoToStep3={canGoToStep3}
            canCalculate={canCalculate}
            formData={formData}
            handleChange={handleChange}
            ipcData={ipcData}
            ipcLoading={ipcLoading}
            ipcError={ipcError}
            isIpcOfficialUsed={isIpcOfficialUsed}
            syncIpc={syncIpc}
            isRotating={isRotating}
            isCustomCuotas={isCustomCuotas}
            setIsCustomCuotas={setIsCustomCuotas}
            fixedMode={fixedMode}
            setFixedMode={handleFixedModeChange}
            cuotaInputValue={cuotaInputValue}
            handleCuotaValChange={handleCuotaValChange}
            handleTotalValChange={handleTotalValChange}
            handleCuotasCountChange={handleCuotasCountChange}
            cuotaEstimada={cuotaEstimada}
            totalFinanciadoDisplay={totalFinanciadoDisplay}
            calculando={calculando}
            onCalcular={handleCalcular}
            resultado={resultado}
            onReset={handleReset}
            showDetailedReport={showDetailedReport}
            setShowDetailedReport={setShowDetailedReport}
          />
        </div>

        {/* Columna Derecha: Balance Financiero Persistente (~35%) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <ConvenienciaSidebar
            currentStep={currentStep}
            formData={formData}
            totalFinanciadoDisplay={totalFinanciadoDisplay}
            cuotaEstimada={cuotaEstimada}
            contadoBarPct={contadoBarPct}
            cuotasBarPct={cuotasBarPct}
            recargoNominal={recargoNominal}
            hasFinancingCondition={hasFinancingCondition}
            resultado={resultado}
            showDetailedReport={showDetailedReport}
            setShowDetailedReport={setShowDetailedReport}
          />
        </div>
      </div>
    </div>
  );
};

export default ConvenienciaWizard;
