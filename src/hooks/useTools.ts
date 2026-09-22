import { useState, useEffect, useCallback } from 'react';
import toolsService from '@/services/toolsService';
import type { IPCData, ConvenienciaResult, FinancialContext, CanAffordResult } from '@/types/tools';
import { sileo } from 'sileo';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';

const calcularCuotaConInteres = (capital: number, n: number, tnaVal: number): number => {
  const i = tnaVal / 100 / 12;
  if (i === 0) return capital / n;
  return capital * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
};

export const useTools = () => {
  // Tab switching: 'conveniencia' is the Cuotas vs Contado tab, 'can-afford' is the "¿Me lo puedo permitir?" tab, 'importar-resumen' is the Importación de resúmenes tab
  const [activeTab, setActiveTab] = useState<'conveniencia' | 'can-afford' | 'importar-resumen'>('conveniencia');
  
  // ── Tab 1: Cuotas vs Contado ─────────────────────────────────────────────
  const [ipcData, setIpcData] = useState<IPCData | null>(null);
  const [ipcLoading, setIpcLoading] = useState(true);
  const [ipcError, setIpcError] = useState(false);
  
  const [formData, setFormData] = useState<{
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
  }>({
    precio_contado: null,
    precio_total_cuotas: null,
    cantidad_cuotas: 12,
    inflacion_mensual: '',
    tiene_interes: false,
    tna: ''
  });
  
  const [resultado, setResultado] = useState<ConvenienciaResult | null>(null);
  const [calculando, setCalculando] = useState(false);

  const loadIPC = useCallback(async () => {
    try {
      const data = await toolsService.getIPCActual();
      setIpcData(data);
      setFormData(prev => ({
        ...prev,
        inflacion_mensual: data.valor_mensual.toString()
      }));
      setIpcError(false);
    } catch (err) {
      console.error('Error al cargar IPC:', err);
      setIpcError(true);
    } finally {
      setIpcLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadIPC();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadIPC]);

  const calcular = async () => {
    const contado = formData.precio_contado;
    const cuotasTotal = formData.precio_total_cuotas;
    const inflacion = parseFloat(formData.inflacion_mensual);
    const cuotas = formData.cantidad_cuotas;
    const tiene_interes = formData.tiene_interes;
    const tnaVal = formData.tna;
    
    if (contado === null || isNaN(contado) || contado <= 0) {
      sileo.error({ title: 'El precio de contado debe ser mayor a 0' });
      return;
    }
    if (contado > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio de contado excede el límite permitido' });
      return;
    }
    if (!tiene_interes && (cuotasTotal === null || isNaN(cuotasTotal) || cuotasTotal <= 0)) {
      sileo.error({ title: 'El precio total en cuotas debe ser mayor a 0' });
      return;
    }
    if (!tiene_interes && cuotasTotal !== null && cuotasTotal > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio en cuotas excede el límite permitido' });
      return;
    }
    if (cuotas === null || isNaN(cuotas) || cuotas < 1 || cuotas > 120) {
      sileo.error({ title: 'La cantidad de cuotas debe estar entre 1 y 120' });
      return;
    }
    if (isNaN(inflacion) || inflacion < 0 || inflacion > 100) {
      sileo.error({ title: 'La inflación mensual debe estar entre 0% y 100%' });
      return;
    }
    if (tiene_interes) {
      const parsedTna = parseFloat(tnaVal);
      if (isNaN(parsedTna) || parsedTna < 0.1 || parsedTna > 3000) {
        sileo.error({ title: 'Debe ingresar una TNA válida entre 0.1% y 3000%' });
        return;
      }
    }
    
    setCalculando(true);
    try {
      const res = await toolsService.calcularConveniencia({
        precio_contado: contado,
        precio_total_cuotas: (tiene_interes || cuotasTotal === null) ? undefined : cuotasTotal,
        cantidad_cuotas: cuotas,
        inflacion_mensual: inflacion,
        tiene_interes,
        tna: tiene_interes ? parseFloat(tnaVal) : undefined
      });
      setResultado(res);
      sileo.success({ title: 'Cálculo realizado con éxito' });
    } catch (err: unknown) {
      console.error(err);
      const error = err as import('axios').AxiosError<{ error?: { message?: string } }>;
      const detail = error.response?.data?.error?.message || 'No pudimos calcular. Verificá los datos ingresados.';
      sileo.error({ title: detail });
    } finally {
      setCalculando(false);
    }
  };

  const resetCalculadora = () => {
    setResultado(null);
  };

  const cuotaCalculada = (() => {
    if (!formData.cantidad_cuotas) return null;
    if (formData.tiene_interes) {
      const parsedTna = parseFloat(formData.tna);
      if (!formData.precio_contado || isNaN(parsedTna) || parsedTna <= 0) return null;
      return calcularCuotaConInteres(formData.precio_contado, formData.cantidad_cuotas, parsedTna);
    }
    return formData.precio_total_cuotas ? formData.precio_total_cuotas / formData.cantidad_cuotas : null;
  })();

  // ── Tab 2: ¿Me lo puedo permitir? ────────────────────────────────────────
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [financialContextLoading, setFinancialContextLoading] = useState(false);
  const [financialContextError, setFinancialContextError] = useState(false);

  const [canAffordForm, setCanAffordForm] = useState<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
    ingreso_manual: number | null;
  }>({
    precio_total: null,
    modo: 'contado',
    cantidad_cuotas: 12,
    ingreso_manual: null
  });

  const [canAffordResult, setCanAffordResult] = useState<CanAffordResult | null>(null);
  const [canAffordCalculando, setCanAffordCalculando] = useState(false);
  const [tieneInteres, setTieneInteres] = useState<boolean>(false);
  const [tna, setTna] = useState<string>('');

  const handleSetTieneInteres = (val: boolean) => {
    setTieneInteres(val);
    if (!val) {
      setTna('');
    }
  };


  const loadFinancialContext = useCallback(async () => {
    setFinancialContextLoading(true);
    setFinancialContextError(false);
    try {
      const data = await toolsService.getFinancialContext();
      setFinancialContext(data);
    } catch (err) {
      console.error('Error al cargar contexto financiero:', err);
      setFinancialContextError(true);
      sileo.error({ title: 'No pudimos cargar tu contexto financiero real.' });
    } finally {
      setFinancialContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'can-afford' && !financialContext && !financialContextLoading && !financialContextError) {
      const timer = setTimeout(() => {
        void loadFinancialContext();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, financialContext, financialContextLoading, financialContextError, loadFinancialContext]);


  const canAffordCalcular = async () => {
    const precio = canAffordForm.precio_total;
    if (precio === null || isNaN(precio) || precio <= 0) {
      sileo.error({ title: 'El precio de la compra debe ser mayor a 0' });
      return;
    }
    if (precio > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio de la compra excede el límite permitido' });
      return;
    }
    if (canAffordForm.modo === 'cuotas' && (canAffordForm.cantidad_cuotas === null || isNaN(canAffordForm.cantidad_cuotas) || canAffordForm.cantidad_cuotas < 2 || canAffordForm.cantidad_cuotas > 120)) {
      sileo.error({ title: 'La cantidad de cuotas debe estar entre 2 y 120' });
      return;
    }
    if (canAffordForm.modo === 'cuotas' && tieneInteres) {
      const parsedTna = parseFloat(tna);
      if (isNaN(parsedTna) || parsedTna < 0.1 || parsedTna > 3000) {
        sileo.error({ title: 'Debe ingresar una TNA válida entre 0.1% y 3000%' });
        return;
      }
    }
    if (canAffordForm.ingreso_manual !== null && canAffordForm.ingreso_manual !== undefined) {
      if (canAffordForm.ingreso_manual <= 0) {
        sileo.error({ title: 'El ingreso mensual estimado debe ser mayor a 0' });
        return;
      }
      if (canAffordForm.ingreso_manual > MAX_MONTO_INTEGRIDAD) {
        sileo.error({ title: 'El ingreso mensual estimado excede el límite permitido' });
        return;
      }
    }

    setCanAffordCalculando(true);
    try {
      const res = await toolsService.calculateCanAfford({
        precio_total: precio,
        modo: canAffordForm.modo,
        cantidad_cuotas: canAffordForm.modo === 'cuotas' ? (canAffordForm.cantidad_cuotas || 2) : 1,
        tiene_interes: canAffordForm.modo === 'cuotas' ? tieneInteres : false,
        tna: canAffordForm.modo === 'cuotas' && tieneInteres && tna ? parseFloat(tna) : undefined,
        ingreso_manual: canAffordForm.ingreso_manual
      });
      setCanAffordResult(res);
      sileo.success({ title: 'Análisis realizado con éxito' });
    } catch (err: unknown) {
      console.error(err);
      const error = err as import('axios').AxiosError<{ error?: { message?: string } }>;
      const detail = error.response?.data?.error?.message || 'No pudimos realizar el análisis de compra.';
      sileo.error({ title: detail });
    } finally {
      setCanAffordCalculando(false);
    }
  };

  const resetCanAfford = () => {
    setCanAffordResult(null);
  };

  return {
    activeTab,
    setActiveTab,
    // Conveniencia (Cuotas vs Contado)
    ipcData,
    ipcLoading,
    ipcError,
    formData,
    setFormData,
    resultado,
    calculando,
    calcular,
    resetCalculadora,
    cuotaCalculada,
    loadIPC,
    // Can Afford (¿Me lo puedo permitir?)
    financialContext,
    financialContextLoading,
    financialContextError,
    loadFinancialContext,
    canAffordForm,
    setCanAffordForm,
    canAffordResult,
    canAffordCalculando,
    canAffordCalcular,
    resetCanAfford,
    tieneInteres,
    setTieneInteres: handleSetTieneInteres,
    tna,
    setTna,
    calcularCuotaConInteres
  };
};

export default useTools;

