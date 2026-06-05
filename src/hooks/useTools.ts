import { useState, useEffect, useCallback } from 'react';
import toolsService from '@/services/toolsService';
import type { IPCData, ConvenienciaResult } from '@/types/tools';
import { useToast } from '@/hooks/useToast';

export const useTools = () => {
  const { showToast } = useToast();
  
  const [ipcData, setIpcData] = useState<IPCData | null>(null);
  const [ipcLoading, setIpcLoading] = useState(true);
  const [ipcError, setIpcError] = useState(false);
  
  const [formData, setFormData] = useState({
    precio_contado: '',
    precio_total_cuotas: '',
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
      // No bloqueamos, permitimos al usuario ingresar manualmente
    } finally {
      setIpcLoading(false);
    }
  }, []);

  // Cargar IPC al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadIPC();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadIPC]);

  const calcular = async () => {
    const contado = parseFloat(formData.precio_contado);
    const cuotasTotal = parseFloat(formData.precio_total_cuotas);
    const inflacion = parseFloat(formData.inflacion_mensual);
    
    if (isNaN(contado) || contado <= 0) {
      showToast('El precio de contado debe ser mayor a 0', 'error');
      return;
    }
    if (isNaN(cuotasTotal) || cuotasTotal <= 0) {
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
    ? parseFloat(formData.precio_total_cuotas) / formData.cantidad_cuotas
    : null;

  return {
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
    loadIPC
  };
};
export default useTools;
