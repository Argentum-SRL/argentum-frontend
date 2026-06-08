import { useState, useEffect, useCallback } from 'react';
import toolsService from '@/services/toolsService';
import type { IPCData, ConvenienciaResult, FinancialContext, CanAffordResult } from '@/types/tools';
import { useToast } from '@/hooks/useToast';

export const useTools = () => {
  const { showToast } = useToast();
  
  // Tab switching: 'conveniencia' is the Cuotas vs Contado tab, 'can-afford' is the "¿Me lo puedo permitir?" tab
  const [activeTab, setActiveTab] = useState<'conveniencia' | 'can-afford'>('conveniencia');
  
  // ── Tab 1: Cuotas vs Contado ─────────────────────────────────────────────
  const [ipcData, setIpcData] = useState<IPCData | null>(null);
  const [ipcLoading, setIpcLoading] = useState(true);
  const [ipcError, setIpcError] = useState(false);
  
  const [formData, setFormData] = useState<{
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number;
    inflacion_mensual: string;
  }>({
    precio_contado: null,
    precio_total_cuotas: null,
    cantidad_cuotas: 12,
    inflacion_mensual: ''
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
    
    if (contado === null || isNaN(contado) || contado <= 0) {
      showToast('El precio de contado debe ser mayor a 0', 'error');
      return;
    }
    if (cuotasTotal === null || isNaN(cuotasTotal) || cuotasTotal <= 0) {
      showToast('El precio total en cuotas debe ser mayor a 0', 'error');
      return;
    }
    if (isNaN(inflacion) || inflacion < 0 || inflacion > 100) {
      showToast('La inflación mensual debe estar entre 0% y 100%', 'error');
      return;
    }
    
    setCalculando(true);
    try {
      const res = await toolsService.calcularConveniencia({
        precio_contado: contado,
        precio_total_cuotas: cuotasTotal,
        cantidad_cuotas: formData.cantidad_cuotas,
        inflacion_mensual: inflacion
      });
      setResultado(res);
      showToast('Cálculo realizado con éxito', 'success');
    } catch (err: unknown) {
      console.error(err);
      const error = err as import('axios').AxiosError<{ error?: { message?: string } }>;
      const detail = error.response?.data?.error?.message || 'No pudimos calcular. Verificá los datos ingresados.';
      showToast(detail, 'error');
    } finally {
      setCalculando(false);
    }
  };

  const resetCalculadora = () => {
    setResultado(null);
  };

  const cuotaCalculada = formData.precio_total_cuotas && formData.cantidad_cuotas
    ? formData.precio_total_cuotas / formData.cantidad_cuotas
    : null;

  // ── Tab 2: ¿Me lo puedo permitir? ────────────────────────────────────────
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [financialContextLoading, setFinancialContextLoading] = useState(false);
  const [financialContextError, setFinancialContextError] = useState(false);

  const [canAffordForm, setCanAffordForm] = useState<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number;
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

  const calcularCuotaConInteres = (capital: number, n: number, tnaVal: number): number => {
    const i = tnaVal / 100 / 12;
    if (i === 0) return capital / n;
    return capital * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
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
      showToast('No pudimos cargar tu contexto financiero real.', 'error');
    } finally {
      setFinancialContextLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'can-afford' && !financialContext && !financialContextLoading) {
      const timer = setTimeout(() => {
        void loadFinancialContext();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, financialContext, financialContextLoading, loadFinancialContext]);


  const canAffordCalcular = async () => {
    const precio = canAffordForm.precio_total;
    if (precio === null || isNaN(precio) || precio <= 0) {
      showToast('El precio de la compra debe ser mayor a 0', 'error');
      return;
    }
    if (canAffordForm.modo === 'cuotas' && (canAffordForm.cantidad_cuotas < 1 || canAffordForm.cantidad_cuotas > 60)) {
      showToast('La cantidad de cuotas debe estar entre 1 y 60', 'error');
      return;
    }
    if (canAffordForm.modo === 'cuotas' && tieneInteres) {
      const parsedTna = parseFloat(tna);
      if (isNaN(parsedTna) || parsedTna <= 0 || parsedTna > 3000) {
        showToast('Debe ingresar una TNA válida entre 0.1% y 3000%', 'error');
        return;
      }
    }

    setCanAffordCalculando(true);
    try {
      const res = await toolsService.calculateCanAfford({
        precio_total: precio,
        modo: canAffordForm.modo,
        cantidad_cuotas: canAffordForm.modo === 'cuotas' ? canAffordForm.cantidad_cuotas : 1,
        tiene_interes: canAffordForm.modo === 'cuotas' ? tieneInteres : false,
        tna: canAffordForm.modo === 'cuotas' && tieneInteres && tna ? parseFloat(tna) : undefined,
        ingreso_manual: canAffordForm.ingreso_manual
      });
      setCanAffordResult(res);
      showToast('Análisis realizado con éxito', 'success');
    } catch (err: unknown) {
      console.error(err);
      const error = err as import('axios').AxiosError<{ error?: { message?: string } }>;
      const detail = error.response?.data?.error?.message || 'No pudimos realizar el análisis de compra.';
      showToast(detail, 'error');
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

