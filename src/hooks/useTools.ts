import { useState, useEffect, useCallback, useMemo } from 'react';
import toolsService from '@/services/toolsService';
import type { InflacionEsperadaData, ConvenienciaResult, FinancialContext, CanAffordResult } from '@/types/tools';
import { useSimularCuotas } from '@/hooks/useSimularCuotas';
import { useAuth } from '@/hooks/useAuth';
import { sileo } from 'sileo';
import { getErrorMessage } from '@/utils/errorMessages';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';

export const useTools = () => {
  const { usuario } = useAuth();
  const monedaDefault: 'ARS' | 'USD' = usuario?.moneda_principal === 'USD' ? 'USD' : 'ARS';
  // Tab switching: 'conveniencia' is the Cuotas vs Contado tab, 'can-afford' is the "¿Me lo puedo permitir?" tab, 'importar-resumen' is the Importación de resúmenes tab
  const [activeTab, setActiveTab] = useState<'conveniencia' | 'can-afford' | 'importar-resumen'>('conveniencia');
  
  // ── Tab 1: Cuotas vs Contado ─────────────────────────────────────────────
  const [ipcData, setIpcData] = useState<InflacionEsperadaData | null>(null);
  const [ipcLoading, setIpcLoading] = useState(true);
  const [ipcError, setIpcError] = useState(false);
  
  const [formData, setFormData] = useState<{
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
    hasCapitalToInvest: boolean;
    investmentTna: string;
  }>({
    precio_contado: null,
    precio_total_cuotas: null,
    cantidad_cuotas: 12,
    inflacion_mensual: '',
    tiene_interes: false,
    tna: '',
    hasCapitalToInvest: false,
    investmentTna: '',
  });
  
  const [resultado, setResultado] = useState<ConvenienciaResult | null>(null);
  const [calculando, setCalculando] = useState(false);

  const loadIPC = useCallback(async () => {
    setIpcLoading(true);
    try {
      const data = await toolsService.getInflacionEsperada();
      if (data && data.valor_mensual != null) {
        setIpcData(data);
        setFormData(prev => ({
          ...prev,
          inflacion_mensual: data.valor_mensual.toString()
        }));
        setIpcError(false);
      } else {
        setIpcData(null);
        setFormData(prev => ({
          ...prev,
          inflacion_mensual: ''
        }));
        setIpcError(true);
      }
    } catch (err) {
      console.error('Error al cargar inflación esperada:', err);
      setIpcData(null);
      setFormData(prev => ({
        ...prev,
        inflacion_mensual: ''
      }));
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
      sileo.error({ title: 'Ingresá un precio de contado mayor a 0.' });
      return false;
    }
    if (contado > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio de contado es demasiado alto. Revisá el número.' });
      return false;
    }
    if (!tiene_interes && (cuotasTotal === null || isNaN(cuotasTotal) || cuotasTotal <= 0)) {
      sileo.error({ title: 'Ingresá un precio en cuotas mayor a 0.' });
      return false;
    }
    if (!tiene_interes && cuotasTotal !== null && cuotasTotal > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio en cuotas es demasiado alto. Revisá el número.' });
      return false;
    }
    if (cuotas === null || isNaN(cuotas) || cuotas < 1 || cuotas > 120) {
      sileo.error({ title: 'Las cuotas tienen que ser entre 1 y 120.' });
      return false;
    }
    if (isNaN(inflacion) || inflacion < 0 || inflacion > 100) {
      sileo.error({ title: 'La inflación por mes tiene que ser entre 0% y 100%.' });
      return false;
    }
    if (tiene_interes) {
      const parsedTna = parseFloat(tnaVal);
      if (isNaN(parsedTna) || parsedTna < 0.1 || parsedTna > 3000) {
        sileo.error({ title: 'Ingresá una tasa de entre 0,1% y 3.000% por año.' });
        return false;
      }
    }
    if (formData.hasCapitalToInvest) {
      const parsedInvTna = parseFloat(formData.investmentTna);
      if (isNaN(parsedInvTna) || parsedInvTna < 0.1 || parsedInvTna > 3000) {
                sileo.error({
          title: 'Ingresá una tasa de la inversión de entre 0,1% y 3.000% por año.',
        });
        return false;
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
        tna: tiene_interes ? parseFloat(tnaVal) : undefined,
        tna_billetera_inversion: formData.hasCapitalToInvest ? parseFloat(formData.investmentTna) : undefined
      });
      setResultado(res);
      sileo.success({ title: 'Cálculo listo.' });
      return true;
    } catch (err: unknown) {
      console.error(err);
      sileo.error({
        title: getErrorMessage(err, 'No se pudo calcular. Revisá los datos y probá de nuevo.'),
      });
      return false;
    } finally {
      setCalculando(false);
    }
  };

  const resetCalculadora = () => {
    setResultado(null);
  };

  // Simulación unificada para Calculadora Cuotas vs Contado (Decisión 3.f)
  const parsedTnaConveniencia = formData.tiene_interes ? parseFloat(formData.tna) : null;
  const montoTotalConveniencia = formData.tiene_interes ? formData.precio_contado : formData.precio_total_cuotas;
  const cantidadesConveniencia = useMemo(() => (formData.cantidad_cuotas ? [formData.cantidad_cuotas] : []), [formData.cantidad_cuotas]);

  const { simulacion: simulacionConveniencia } = useSimularCuotas({
    montoTotal: montoTotalConveniencia,
    cantidades: cantidadesConveniencia,
    tasaTna: formData.tiene_interes && parsedTnaConveniencia && parsedTnaConveniencia > 0 ? parsedTnaConveniencia : null,
    precioContado: formData.precio_contado ?? null,
    enabled: Boolean(montoTotalConveniencia && montoTotalConveniencia > 0 && cantidadesConveniencia.length > 0),
  });

  const planCuotas = simulacionConveniencia?.planes?.[0] ?? null;
  const cuotaCalculada = planCuotas?.monto_cuota ?? null;

  // ── Tab 2: ¿Me lo puedo permitir? ────────────────────────────────────────
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [financialContextLoading, setFinancialContextLoading] = useState(false);
  const [financialContextError, setFinancialContextError] = useState(false);

  const [canAffordForm, setCanAffordForm] = useState<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
    moneda?: 'ARS' | 'USD';
  }>({
    precio_total: null,
    modo: 'contado',
    cantidad_cuotas: 12,
  });

  // ── Bloque Gasto Fijo (Decisión Sebastián 04/11) ──
  const [gastoFijoAbierto, setGastoFijoAbierto] = useState<boolean>(false);
  const [gastoFijoMonto, setGastoFijoMonto] = useState<number | null>(null);
  const [gastoFijoResult, setGastoFijoResult] = useState<CanAffordResult | null>(null);
  const [gastoFijoCalculando, setGastoFijoCalculando] = useState<boolean>(false);

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
      sileo.error({ title: 'No se pudieron cargar tus datos. Probá de nuevo.' });
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
      sileo.error({ title: 'Ingresá un precio mayor a 0.' });
      return;
    }
    if (precio > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio es demasiado alto. Revisá el número.' });
      return;
    }
    if (canAffordForm.modo === 'cuotas' && (canAffordForm.cantidad_cuotas === null || isNaN(canAffordForm.cantidad_cuotas) || canAffordForm.cantidad_cuotas < 2 || canAffordForm.cantidad_cuotas > 120)) {
      sileo.error({ title: 'Las cuotas tienen que ser entre 2 y 120.' });
      return;
    }
    if (canAffordForm.modo === 'cuotas' && tieneInteres) {
      const parsedTna = parseFloat(tna);
      if (isNaN(parsedTna) || parsedTna < 0.1 || parsedTna > 3000) {
        sileo.error({ title: 'Ingresá una tasa de entre 0,1% y 3.000% por año.' });
        return;
      }
    }

    setCanAffordCalculando(true);
    try {
      const monedaElegida = canAffordForm.moneda ?? monedaDefault;
      const res = await toolsService.calculateCanAfford({
        precio_total: precio,
        modo: canAffordForm.modo,
        cantidad_cuotas: canAffordForm.modo === 'cuotas' ? (canAffordForm.cantidad_cuotas || 2) : 1,
        tiene_interes: canAffordForm.modo === 'cuotas' ? tieneInteres : false,
        tna: canAffordForm.modo === 'cuotas' && tieneInteres && tna ? parseFloat(tna) : undefined,
        moneda: monedaElegida,
      });
      cerrarGastoFijo();
      setCanAffordResult(res);
      sileo.success({ title: 'Cálculo listo.' });
    } catch (err: unknown) {
      console.error(err);
      sileo.error({
        title: getErrorMessage(err, 'No se pudo hacer el cálculo. Probá de nuevo.'),
      });
    } finally {
      setCanAffordCalculando(false);
    }
  };

  const abrirGastoFijo = () => {
    setGastoFijoAbierto(true);
  };

  const cerrarGastoFijo = () => {
    setGastoFijoAbierto(false);
    setGastoFijoResult(null);
    setGastoFijoMonto(null);
  };

  const volverGastoFijo = () => {
    setGastoFijoResult(null);
  };

  const gastoFijoCalcular = async () => {
    const monto = gastoFijoMonto;
    if (monto === null || isNaN(monto) || monto <= 0) {
      sileo.error({ title: 'Ingresá un precio mayor a 0.' });
      return;
    }
    if (monto > MAX_MONTO_INTEGRIDAD) {
      sileo.error({ title: 'El precio es demasiado alto. Revisá el número.' });
      return;
    }

    setGastoFijoCalculando(true);
    try {
      const res = await toolsService.calculateCanAfford({
        precio_total: monto,
        modo: 'mensual',
        cantidad_cuotas: 1,
        tiene_interes: false,
      });
      setGastoFijoResult(res);
      sileo.success({ title: 'Cálculo listo.' });
    } catch (err: unknown) {
      console.error(err);
      sileo.error({
        title: getErrorMessage(err, 'No se pudo hacer el cálculo. Probá de nuevo.'),
      });
    } finally {
      setGastoFijoCalculando(false);
    }
  };

  const resetCanAfford = () => {
    setCanAffordResult(null);
    cerrarGastoFijo();
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
    planCuotas,
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
    // Gasto Fijo
    gastoFijoAbierto,
    gastoFijoMonto,
    setGastoFijoMonto,
    gastoFijoResult,
    gastoFijoCalculando,
    abrirGastoFijo,
    cerrarGastoFijo,
    volverGastoFijo,
    gastoFijoCalcular,
  };
};

export default useTools;
