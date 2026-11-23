import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, afterEach } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    is_admin: false,
    usuario: { moneda_principal: 'ARS' },
  }),
}));

vi.mock('@/components/tools/importacion/ImportacionResumenSection', () => ({
  default: () => null,
}));

import ConvenienciaForm from './ConvenienciaForm';
import ConvenienciaSidebar from './ConvenienciaSidebar';
import CanAffordForm from './CanAffordForm';
import GastoFijoForm from './GastoFijoForm';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import ParametersSummaryBar from './ParametersSummaryBar';
import type { ConvenienciaFormState } from './ConvenienciaWizard';
import type { ConvenienciaResult, FinancialContext } from '@/types/tools';
import { HelpCircle } from '@/components/ui/icons';

// Convierte HTML renderizado a texto legible normalizando espacios no separables
function htmlATexto(html: string): string {
  return html
    .replace(/<\/?(?:strong|b|em|i)[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function crearFormBase(overrides: Partial<ConvenienciaFormState> = {}): ConvenienciaFormState {
  return {
    precio_contado: 100000,
    precio_total_cuotas: 120000,
    valor_cuota: 10000,
    sin_interes: false,
    cantidad_cuotas: 12,
    inflacion_mensual: '3',
    usar_inflacion_propia: false,
    tiene_interes: false,
    tna: '',
    hasCapitalToInvest: false,
    investmentTna: '',
    moneda_contado: 'ARS',
    moneda_cuotas: 'ARS',
    ...overrides,
  };
}

function crearResultadoBase(overrides: Partial<ConvenienciaResult> = {}): ConvenienciaResult {
  return {
    resultado: 'conviene_contado',
    precio_contado: 100000,
    precio_total_cuotas_nominal: 150000,
    costo_real_cuotas: 128767.06,
    ahorro_real: 28767.06,
    porcentaje_ahorro: 5.75,
    monto_cuota: 12500,
    cantidad_cuotas: 12,
    inflacion_mensual_usada: 2,
    detalle_por_mes: [
      { mes: 1, cuota_nominal: 12500, cuota_valor_presente: 12254.9 },
      { mes: 2, cuota_nominal: 12500, cuota_valor_presente: 12014.61 },
    ],
    moneda: 'ARS',
    ...overrides,
  };
}

// Recorre un árbol JSX simple (para el test de montaje de ToolsPage con hooks simulados)
function jsxATexto(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(jsxATexto).join(' ');
  if (typeof node === 'object') {
    const el = node as { type?: unknown; props?: Record<string, unknown> };
    if (typeof el.type === 'function') {
      const fn = el.type as (p: Record<string, unknown>) => unknown;
      return jsxATexto(fn(el.props ?? {}));
    }
    if (el.props && 'children' in el.props) {
      return jsxATexto(el.props.children);
    }
  }
  return '';
}

function normalizarEspacios(s: string): string {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('Herramientas V3 — Correcciones del front (V3.1 a V3.6)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('V3.1: ToolsPage con ?tab=can-afford llama getFinancialContext exactamente 1 vez al montar y muestra "$ 300.000"', async () => {
    vi.useFakeTimers();
    vi.resetModules();

    const getFinancialContextMock = vi.fn().mockResolvedValue({
      saldo_disponible: 300000,
      carga_mensual_comprometida: 0,
      ars: {
        total_billeteras: 300000,
        cuotas_comprometidas: 0,
        suscripciones_mensuales: 0,
        saldo_disponible: 300000,
      },
      usd: {
        total_billeteras: 0,
        cuotas_comprometidas: 0,
        suscripciones_mensuales: 0,
        saldo_disponible: 0,
      },
      ingreso_promedio_mensual: 800000,
      ingreso_es_estimacion_parcial: false,
      gasto_promedio_variable: 200000,
      ciclos_con_historia: 3,
      margen_libre_mensual: 600000,
    } satisfies FinancialContext);

    const getInflacionEsperadaMock = vi.fn().mockResolvedValue({
      valor_mensual: 2.5,
      meses: [2.5, 2.3],
      fuente_texto: 'REM',
      es_respaldo: false,
    });

    // Harness liviano de hooks de React en Node para verificar montaje y efectos
    const states: unknown[] = [];
    const refs: Array<{ current: unknown }> = [];
    const effects: Array<{ deps?: unknown[]; prevDeps?: unknown[]; fn: () => void | (() => void); cleanup?: () => void }> = [];
    let stateIdx = 0;
    let refIdx = 0;
    let effectIdx = 0;
    let needRerender = false;

    const resetCursors = () => {
      stateIdx = 0;
      refIdx = 0;
      effectIdx = 0;
    };

    const depsIguales = (a?: unknown[], b?: unknown[]) => {
      if (!a || !b || a.length !== b.length) return false;
      return a.every((v, i) => Object.is(v, b[i]));
    };

    vi.doMock('react', async () => {
      const realReact = await vi.importActual<typeof import('react')>('react');
      return {
        ...realReact,
        default: realReact,
        useState: (init: unknown) => {
          const i = stateIdx++;
          if (!(i in states)) {
            states[i] = typeof init === 'function' ? (init as () => unknown)() : init;
          }
          const setter = (val: unknown) => {
            const next = typeof val === 'function' ? (val as (p: unknown) => unknown)(states[i]) : val;
            if (!Object.is(states[i], next)) {
              states[i] = next;
              needRerender = true;
            }
          };
          return [states[i], setter];
        },
        useRef: (init: unknown) => {
          const i = refIdx++;
          if (!(i in refs)) {
            refs[i] = { current: init };
          }
          return refs[i];
        },
        useCallback: (fn: unknown) => fn,
        useMemo: (fn: () => unknown) => fn(),
        useEffect: (fn: () => void | (() => void), deps?: unknown[]) => {
          const i = effectIdx++;
          const prev = effects[i];
          if (!prev || !depsIguales(prev.deps, deps)) {
            effects[i] = { fn, deps, prevDeps: prev?.deps, cleanup: prev?.cleanup };
          }
        },
      };
    });

    vi.doMock('react-router-dom', () => ({
      useSearchParams: () => [new URLSearchParams('tab=can-afford'), vi.fn()],
    }));

    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({
        is_admin: false,
        usuario: { moneda_principal: 'ARS' },
      }),
    }));

    vi.doMock('@/components/tools/importacion/ImportacionResumenSection', () => ({
      default: () => null,
    }));

    vi.doMock('@/hooks/useSimularCuotas', () => ({
      useSimularCuotas: () => ({ simulacion: null }),
    }));

    vi.doMock('@/services/toolsService', () => ({
      default: {
        getInflacionEsperada: getInflacionEsperadaMock,
        getFinancialContext: getFinancialContextMock,
        calcularConveniencia: vi.fn(),
        calculateCanAfford: vi.fn().mockResolvedValue({
          modo: 'mensual',
          resultado: 'bien',
          titulo: 'Te entra',
          linea_principal: 'Tenés margen.',
          libre: 300000,
          precio_total: 10000,
        }),
      },
      getUsaDolaresContexto: () => false,
    }));

    vi.doMock('sileo', () => ({
      sileo: { error: vi.fn(), success: vi.fn() },
    }));

    const { default: ToolsPage } = await import('@/pages/app/tools/ToolsPage');

    const flushEffects = async () => {
      for (const ef of effects) {
        if (ef && !depsIguales(ef.prevDeps, ef.deps)) {
          ef.cleanup?.();
          const c = ef.fn();
          ef.cleanup = typeof c === 'function' ? c : undefined;
          ef.prevDeps = ef.deps;
        }
      }
      await vi.runAllTimersAsync();
    };

    let tree: unknown;
    const render = () => {
      resetCursors();
      needRerender = false;
      tree = ToolsPage();
    };

    render();
    await flushEffects();
    for (let paso = 0; paso < 4 && needRerender; paso++) {
      render();
      await flushEffects();
    }

    expect(getFinancialContextMock).toHaveBeenCalledTimes(1);

    const textoMontado = normalizarEspacios(jsxATexto(tree));
    expect(textoMontado).toContain('$ 300.000');

    // También verificamos la barra de resumen de compra y gasto fijo con el contexto cargado
    const barraCompra = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ParametersSummaryBar, {
          title: '¿Me lo puedo permitir?',
          icon: HelpCircle,
          items: [
            { label: 'Precio', value: '$ 100.000' },
            { label: 'Modalidad', value: 'Contado' },
            { label: 'Plata disponible', value: '$ 300.000' },
          ],
          onEdit: () => {},
        })
      )
    );
    expect(barraCompra).toContain('Plata disponible: $ 300.000');
  });

  it('V3.2: barra de resumen muestra Precio en USD ("US$ 1.000") o ARS ("$ 450.000") según moneda de la compra', async () => {
    vi.resetModules();

    const makeToolsMock = (precioTotal: number, moneda: 'ARS' | 'USD') => ({
      activeTab: 'can-afford' as const,
      setActiveTab: vi.fn(),
      ipcData: null,
      ipcLoading: false,
      ipcError: false,
      formData: crearFormBase(),
      setFormData: vi.fn(),
      resultado: null,
      calculando: false,
      calcular: vi.fn(),
      resetCalculadora: vi.fn(),
      planCuotas: null,
      cuotaCalculada: null,
      financialContext: {
        saldo_disponible: 300000,
        carga_mensual_comprometida: 0,
        ars: { total_billeteras: 300000, cuotas_comprometidas: 0, suscripciones_mensuales: 0, saldo_disponible: 300000 },
        usd: { total_billeteras: 0, cuotas_comprometidas: 0, suscripciones_mensuales: 0, saldo_disponible: 0 },
        ingreso_promedio_mensual: 500000,
        ingreso_es_estimacion_parcial: false,
        gasto_promedio_variable: 0,
        ciclos_con_historia: 3,
        margen_libre_mensual: 500000,
      },
      financialContextLoading: false,
      financialContextError: false,
      canAffordForm: {
        precio_total: precioTotal,
        modo: 'contado' as const,
        cantidad_cuotas: 12,
        moneda,
      },
      setCanAffordForm: vi.fn(),
      canAffordResult: {
        modo: 'contado' as const,
        resultado: 'bien' as const,
        titulo: 'Te entra sin problema',
        linea_principal: 'Te alcanza bien.',
        libre: 300000,
        precio_total: precioTotal,
      },
      canAffordCalculando: false,
      canAffordCalcular: vi.fn(),
      resetCanAfford: vi.fn(),
      tieneInteres: false,
      setTieneInteres: vi.fn(),
      tna: '',
      setTna: vi.fn(),
      gastoFijoAbierto: false,
      gastoFijoMonto: null,
      setGastoFijoMonto: vi.fn(),
      gastoFijoResult: null,
      gastoFijoCalculando: false,
      abrirGastoFijo: vi.fn(),
      volverGastoFijo: vi.fn(),
      gastoFijoCalcular: vi.fn(),
    });

    vi.doMock('react-router-dom', () => ({
      useSearchParams: () => [new URLSearchParams('tab=can-afford'), vi.fn()],
    }));
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({ is_admin: false, usuario: { moneda_principal: 'ARS' } }),
    }));
    vi.doMock('@/components/tools/importacion/ImportacionResumenSection', () => ({
      default: () => null,
    }));

    const useToolsMock = vi.fn().mockReturnValue(makeToolsMock(1000, 'USD'));
    vi.doMock('@/hooks/useTools', () => ({
      default: useToolsMock,
      useTools: useToolsMock,
    }));

    const { default: ToolsPage } = await import('@/pages/app/tools/ToolsPage');
    const htmlUsd = renderToStaticMarkup(React.createElement(ToolsPage));
    const txtUsd = htmlATexto(htmlUsd);
    expect(txtUsd).toContain('Precio: US$ 1.000');
    expect(txtUsd).toContain('Plata disponible: $ 300.000');

    useToolsMock.mockReturnValue(makeToolsMock(450000, 'ARS'));
    const htmlArs = renderToStaticMarkup(React.createElement(ToolsPage));
    const txtArs = htmlATexto(htmlArs);
    expect(txtArs).toContain('Precio: $ 450.000');
  });

  it('V3.3: Sidebar con conviene_contado o conviene_cuotas y ahorro_real 28767.06 no muestra "-$" ni "+$"', () => {
    const formData = crearFormBase();
    const resContado = crearResultadoBase({
      resultado: 'conviene_contado',
      ahorro_real: 28767.06,
    });
    const txtContado = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaSidebar, {
          currentStep: 3,
          formData,
          totalFinanciadoDisplay: 150000,
          cuotaEstimada: 12500,
          contadoBarPct: 70,
          cuotasBarPct: 100,
          recargoNominal: null,
          hasFinancingCondition: true,
          resultado: resContado,
          showDetailedReport: false,
          setShowDetailedReport: () => {},
        })
      )
    );
    expect(txtContado).toContain('$ 28.767,06');
    expect(txtContado).not.toContain('-$');
    expect(txtContado).not.toContain('+$');

    const resCuotas = crearResultadoBase({
      resultado: 'conviene_cuotas',
      ahorro_real: 28767.06,
    });
    const txtCuotas = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaSidebar, {
          currentStep: 3,
          formData,
          totalFinanciadoDisplay: 150000,
          cuotaEstimada: 12500,
          contadoBarPct: 70,
          cuotasBarPct: 100,
          recargoNominal: null,
          hasFinancingCondition: true,
          resultado: resCuotas,
          showDetailedReport: false,
          setShowDetailedReport: () => {},
        })
      )
    );
    expect(txtCuotas).toContain('$ 28.767,06');
    expect(txtCuotas).not.toContain('-$');
    expect(txtCuotas).not.toContain('+$');
  });

  it('V3.4: porcentaje 5.75 se muestra como "5,8%" en tarjeta y sidebar, y ningún texto renderizado tiene número con punto seguido de "%"', () => {
    const formData = crearFormBase();
    const resultado = crearResultadoBase({
      resultado: 'conviene_contado',
      porcentaje_ahorro: 5.75,
    });

    const txtCard = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaForm, {
          currentStep: 3,
          setCurrentStep: () => {},
          canGoToStep2: true,
          canGoToStep3: true,
          canCalculate: true,
          formData,
          handleChange: () => {},
          ipcData: { valor_mensual: 2.5, meses: [2.5], fuente_texto: 'REM', es_respaldo: false },
          ipcLoading: false,
          ipcError: false,
          isIpcOfficialUsed: true,
          syncIpc: () => {},
          isRotating: false,
          isCustomCuotas: false,
          setIsCustomCuotas: () => {},
          fixedMode: 'cuota',
          setFixedMode: () => {},
          cuotaInputValue: 10000,
          handleCuotaValChange: () => {},
          handleTotalValChange: () => {},
          handleCuotasCountChange: () => {},
          cuotaEstimada: 10000,
          totalFinanciadoDisplay: 120000,
          calculando: false,
          onCalcular: () => {},
          resultado,
          onReset: () => {},
        })
      )
    );
    expect(txtCard).toContain('5,8%');

    const txtSidebarStep2 = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaSidebar, {
          currentStep: 2,
          formData,
          totalFinanciadoDisplay: 105750,
          cuotaEstimada: 8812.5,
          contadoBarPct: 95,
          cuotasBarPct: 100,
          recargoNominal: { diff: 5750, pct: 5.75 },
          hasFinancingCondition: true,
          resultado: null,
          showDetailedReport: false,
          setShowDetailedReport: () => {},
        })
      )
    );
    expect(txtSidebarStep2).toContain('5,8%');

    // Revisar también paso 3 sin calcular (IPC con decimal), CanAffordForm con tasa inválida y GastoFijoForm
    const txtStep3Pre = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaForm, {
          currentStep: 3,
          setCurrentStep: () => {},
          canGoToStep2: true,
          canGoToStep3: true,
          canCalculate: true,
          formData: crearFormBase({ usar_inflacion_propia: true, inflacion_mensual: '3.5' }),
          handleChange: () => {},
          ipcData: { valor_mensual: 2.5, meses: [2.5], fuente_texto: 'REM', es_respaldo: false },
          ipcLoading: false,
          ipcError: false,
          isIpcOfficialUsed: false,
          syncIpc: () => {},
          isRotating: false,
          isCustomCuotas: false,
          setIsCustomCuotas: () => {},
          fixedMode: 'cuota',
          setFixedMode: () => {},
          cuotaInputValue: 10000,
          handleCuotaValChange: () => {},
          handleTotalValChange: () => {},
          handleCuotasCountChange: () => {},
          cuotaEstimada: 10000,
          totalFinanciadoDisplay: 120000,
          calculando: false,
          onCalcular: () => {},
          resultado: null,
          onReset: () => {},
        })
      )
    );

    const txtCanAfford = htmlATexto(
      renderToStaticMarkup(
        React.createElement(CanAffordForm, {
          formData: { precio_total: 1000, modo: 'cuotas', cantidad_cuotas: 6, moneda: 'ARS' },
          setFormData: () => {},
          calculando: false,
          calcular: () => {},
          tieneInteres: true,
          setTieneInteres: () => {},
          tna: '0',
          setTna: () => {},
        })
      )
    );

    const textos = [txtCard, txtSidebarStep2, txtStep3Pre, txtCanAfford];
    for (const t of textos) {
      // Rechaza decimales con punto antes de % (ej. 5.8% o 0.1%), permitiendo miles es-AR (3.000%)
      expect(t).not.toMatch(/\b\d+\.(?!\d{3}(?!\d))\d+\s*%/);
    }
  });

  it('V3.5: contado USD 1000 con cuotas ARS muestra "$ 1.450.000" y "US$ 1.000 al dólar oficial ($1.450)"; misma moneda omite "al dólar oficial"', () => {
    const formMixto = crearFormBase({
      precio_contado: 1000,
      moneda_contado: 'USD',
      moneda_cuotas: 'ARS',
    });
    const resMixto = crearResultadoBase({
      precio_contado: 1000,
      contado_usado: 1450000,
      cotizacion: 1450,
      moneda: 'ARS',
    });

    const txtCardMixto = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaForm, {
          currentStep: 3,
          setCurrentStep: () => {},
          canGoToStep2: true,
          canGoToStep3: true,
          canCalculate: true,
          formData: formMixto,
          handleChange: () => {},
          ipcData: null,
          ipcLoading: false,
          ipcError: false,
          isIpcOfficialUsed: false,
          syncIpc: () => {},
          isRotating: false,
          isCustomCuotas: false,
          setIsCustomCuotas: () => {},
          fixedMode: 'cuota',
          setFixedMode: () => {},
          cuotaInputValue: 130000,
          handleCuotaValChange: () => {},
          handleTotalValChange: () => {},
          handleCuotasCountChange: () => {},
          cuotaEstimada: 130000,
          totalFinanciadoDisplay: 1560000,
          calculando: false,
          onCalcular: () => {},
          resultado: resMixto,
          onReset: () => {},
        })
      )
    );
    expect(txtCardMixto).toContain('$ 1.450.000');
    expect(txtCardMixto).toContain('US$ 1.000 al dólar oficial ($1.450)');

    const txtSidebarMixto = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaSidebar, {
          currentStep: 3,
          formData: formMixto,
          totalFinanciadoDisplay: 1560000,
          cuotaEstimada: 130000,
          contadoBarPct: 90,
          cuotasBarPct: 100,
          recargoNominal: null,
          hasFinancingCondition: true,
          resultado: resMixto,
          showDetailedReport: false,
          setShowDetailedReport: () => {},
        })
      )
    );
    expect(txtSidebarMixto).toContain('$ 1.450.000');
    expect(txtSidebarMixto).toContain('US$ 1.000 al dólar oficial ($1.450)');

    // Misma moneda: ARS y ARS
    const formMisma = crearFormBase({
      precio_contado: 100000,
      moneda_contado: 'ARS',
      moneda_cuotas: 'ARS',
    });
    const resMisma = crearResultadoBase({
      precio_contado: 100000,
      moneda: 'ARS',
    });
    const txtCardMisma = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaForm, {
          currentStep: 3,
          setCurrentStep: () => {},
          canGoToStep2: true,
          canGoToStep3: true,
          canCalculate: true,
          formData: formMisma,
          handleChange: () => {},
          ipcData: null,
          ipcLoading: false,
          ipcError: false,
          isIpcOfficialUsed: false,
          syncIpc: () => {},
          isRotating: false,
          isCustomCuotas: false,
          setIsCustomCuotas: () => {},
          fixedMode: 'cuota',
          setFixedMode: () => {},
          cuotaInputValue: 12500,
          handleCuotaValChange: () => {},
          handleTotalValChange: () => {},
          handleCuotasCountChange: () => {},
          cuotaEstimada: 12500,
          totalFinanciadoDisplay: 150000,
          calculando: false,
          onCalcular: () => {},
          resultado: resMisma,
          onReset: () => {},
        })
      )
    );
    const txtSidebarMisma = htmlATexto(
      renderToStaticMarkup(
        React.createElement(ConvenienciaSidebar, {
          currentStep: 3,
          formData: formMisma,
          totalFinanciadoDisplay: 150000,
          cuotaEstimada: 12500,
          contadoBarPct: 70,
          cuotasBarPct: 100,
          recargoNominal: null,
          hasFinancingCondition: true,
          resultado: resMisma,
          showDetailedReport: false,
          setShowDetailedReport: () => {},
        })
      )
    );
    expect(txtCardMisma).not.toContain('al dólar oficial');
    expect(txtSidebarMisma).not.toContain('al dólar oficial');
  });

  it('V3.6: todos los textos nuevos del punto 7 aparecen tal cual y ninguno de los viejos aparece', async () => {
    vi.resetModules();
    vi.doMock('react-router-dom', () => ({
      useSearchParams: () => [new URLSearchParams(''), vi.fn()],
    }));
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({ is_admin: false, usuario: { moneda_principal: 'ARS' } }),
    }));
    vi.doMock('@/components/tools/importacion/ImportacionResumenSection', () => ({
      default: () => null,
    }));
    const useToolsMock = vi.fn().mockReturnValue({
      activeTab: 'conveniencia',
      setActiveTab: vi.fn(),
      ipcData: null,
      ipcLoading: false,
      ipcError: false,
      formData: crearFormBase(),
      setFormData: vi.fn(),
      resultado: null,
      calculando: false,
      calcular: vi.fn(),
      resetCalculadora: vi.fn(),
      planCuotas: null,
      cuotaCalculada: null,
      financialContext: null,
      financialContextLoading: false,
      financialContextError: false,
      canAffordForm: { precio_total: null, modo: 'contado', cantidad_cuotas: 12, moneda: 'ARS' },
      setCanAffordForm: vi.fn(),
      canAffordResult: null,
      canAffordCalculando: false,
      canAffordCalcular: vi.fn(),
      resetCanAfford: vi.fn(),
      tieneInteres: false,
      setTieneInteres: vi.fn(),
      tna: '',
      setTna: vi.fn(),
      gastoFijoAbierto: false,
      gastoFijoMonto: null,
      setGastoFijoMonto: vi.fn(),
      gastoFijoResult: null,
      gastoFijoCalculando: false,
      abrirGastoFijo: vi.fn(),
      volverGastoFijo: vi.fn(),
      gastoFijoCalcular: vi.fn(),
    });
    vi.doMock('@/hooks/useTools', () => ({ default: useToolsMock, useTools: useToolsMock }));
    const { default: ToolsPage } = await import('@/pages/app/tools/ToolsPage');

    const renderForm = (props: Partial<React.ComponentProps<typeof ConvenienciaForm>>) =>
      htmlATexto(
        renderToStaticMarkup(
          React.createElement(ConvenienciaForm, {
            currentStep: 1,
            setCurrentStep: () => {},
            canGoToStep2: true,
            canGoToStep3: true,
            canCalculate: true,
            formData: crearFormBase(),
            handleChange: () => {},
            ipcData: { valor_mensual: 2.5, meses: [2.5], fuente_texto: 'REM', es_respaldo: false },
            ipcLoading: false,
            ipcError: false,
            isIpcOfficialUsed: true,
            syncIpc: () => {},
            isRotating: false,
            isCustomCuotas: false,
            setIsCustomCuotas: () => {},
            fixedMode: 'cuota',
            setFixedMode: () => {},
            cuotaInputValue: 50000,
            handleCuotaValChange: () => {},
            handleTotalValChange: () => {},
            handleCuotasCountChange: () => {},
            cuotaEstimada: 50000,
            totalFinanciadoDisplay: 600000,
            calculando: false,
            onCalcular: () => {},
            resultado: null,
            onReset: () => {},
            ...props,
          })
        )
      );

    const renderSidebar = (props: Partial<React.ComponentProps<typeof ConvenienciaSidebar>>) =>
      htmlATexto(
        renderToStaticMarkup(
          React.createElement(ConvenienciaSidebar, {
            currentStep: 1,
            formData: crearFormBase(),
            fixedMode: 'cuota',
            totalFinanciadoDisplay: 600000,
            cuotaEstimada: 50000,
            contadoBarPct: 80,
            cuotasBarPct: 100,
            recargoNominal: null,
            hasFinancingCondition: true,
            resultado: null,
            showDetailedReport: false,
            setShowDetailedReport: () => {},
            ...props,
          })
        )
      );

    const txtPage = htmlATexto(renderToStaticMarkup(React.createElement(ToolsPage)));
    const txtPaso1 = renderForm({ currentStep: 1 });
    const txtPaso2 = renderForm({ currentStep: 2 });
    const txtPaso3Pre = renderForm({ currentStep: 3, resultado: null, cuotaEstimada: 50000 });
    const txtPaso3PreEst = renderForm({ currentStep: 3, resultado: null, fixedMode: 'total', cuotaEstimada: 50000 });
    const txtPaso3Cuotas = renderForm({
      currentStep: 3,
      resultado: crearResultadoBase({ resultado: 'conviene_cuotas', porcentaje_ahorro: 5.75 }),
    });
    const txtPaso3Contado = renderForm({
      currentStep: 3,
      resultado: crearResultadoBase({ resultado: 'conviene_contado', porcentaje_ahorro: 5.75 }),
    });
    const txtPaso3Empate = renderForm({
      currentStep: 3,
      resultado: crearResultadoBase({ resultado: 'indiferente', porcentaje_ahorro: 0.4 }),
    });

    const txtSidePaso1 = renderSidebar({ currentStep: 1, hasFinancingCondition: false, recargoNominal: null });
    const txtSideRecargo = renderSidebar({ currentStep: 2, recargoNominal: { diff: 50000, pct: 10 } });
    const txtSideDescuento = renderSidebar({ currentStep: 2, recargoNominal: { diff: -20000, pct: -5 } });
    const txtSideSinRecargo = renderSidebar({ currentStep: 2, recargoNominal: { diff: 0, pct: 0 } });
    const txtSideResCuotas = renderSidebar({
      currentStep: 3,
      resultado: crearResultadoBase({ resultado: 'conviene_cuotas' }),
    });
    const txtSideResContado = renderSidebar({
      currentStep: 3,
      resultado: crearResultadoBase({ resultado: 'conviene_contado' }),
    });
    const txtSideResUsd = renderSidebar({
      currentStep: 3,
      formData: crearFormBase({ moneda_contado: 'USD', moneda_cuotas: 'USD' }),
      resultado: crearResultadoBase({ resultado: 'conviene_cuotas', moneda: 'USD' }),
    });

    const txtCanAffordArs = htmlATexto(
      renderToStaticMarkup(
        React.createElement(CanAffordForm, {
          formData: { precio_total: null, modo: 'contado', cantidad_cuotas: 12, moneda: 'ARS' },
          setFormData: () => {},
          calculando: false,
          calcular: () => {},
          tieneInteres: false,
          setTieneInteres: () => {},
          tna: '',
          setTna: () => {},
        })
      )
    );
    const txtCanAffordUsd = htmlATexto(
      renderToStaticMarkup(
        React.createElement(CanAffordForm, {
          formData: { precio_total: null, modo: 'contado', cantidad_cuotas: 12, moneda: 'USD' },
          setFormData: () => {},
          calculando: false,
          calcular: () => {},
          tieneInteres: false,
          setTieneInteres: () => {},
          tna: '',
          setTna: () => {},
        })
      )
    );
    const txtGastoFijo = htmlATexto(
      renderToStaticMarkup(
        React.createElement(GastoFijoForm, {
          monto: null,
          setMonto: () => {},
          calculando: false,
          calcular: () => {},
        })
      )
    );
    const txtChart = htmlATexto(
      renderToStaticMarkup(
        React.createElement(DetalleCuotasChart, {
          detallePorMes: [{ mes: 1, cuota_nominal: 10000, cuota_valor_presente: 9500 }],
          resultado: 'conviene_cuotas',
        })
      )
    );
    const txtExplicacion = htmlATexto(renderToStaticMarkup(React.createElement(ExplicacionCalculo)));

    // Textos nuevos exactos
    expect(txtPage).toContain('Para decidir antes de comprar.');
    expect(txtPaso1).toContain('Contado');
    expect(txtPaso1).toContain('Poné lo que pagarías hoy en un solo pago.');
    expect(txtPaso1).toContain('En efectivo o transferencia, en un solo pago.');
    expect(txtPaso2).toContain('Cuotas');
    expect(txtPaso2).toContain('Poné las cuotas que te ofrece el comercio.');
    expect(txtPaso3Pre).toContain('Inflación');
    expect(txtPaso3Pre).toContain('Revisá los datos antes de ver qué te conviene.');
    expect(txtPaso3Pre).toContain('Si dejás la plata invertida mientras pagás las cuotas.');
    expect(txtPaso3Pre).toContain('12x de $ 50.000');
    expect(txtPaso3Pre).not.toContain('12x de ~$ 50.000');
    expect(txtPaso3PreEst).toContain('12x de ~$ 50.000');

    expect(txtPaso3Cuotas).toContain('Te ahorrás');
    expect(txtPaso3Cuotas).toContain('5,8% menos que de contado');
    expect(txtPaso3Contado).toContain('Pagás de más');
    expect(txtPaso3Contado).toContain('5,8% más que de contado');
    expect(txtPaso3Empate).toContain('0,4% de diferencia');

    expect(txtSidePaso1).toContain('Resumen');
    expect(txtSidePaso1).toContain('Precio de contado');
    expect(txtSidePaso1).toContain('Cómo lo calculo');
    expect(txtSidePaso1).toContain('Contado: lo que pagás hoy en un solo pago.');
    expect(txtSidePaso1).toContain('Cuotas: cuántas son y cuánto suman.');
    expect(txtSidePaso1).toContain('Inflación: cuánto valen esas cuotas en plata de hoy.');
    expect(txtSidePaso1).toContain('Se actualiza mientras completás los datos.');
    expect(txtSidePaso1).toContain('12x de $ 50.000');
    expect(txtSidePaso1).not.toContain('12x de ~$ 50.000');

    expect(txtSideRecargo).toContain('Aproximado');
    expect(txtSideRecargo).toContain('Las cuotas suman 10% más que de contado. En el paso 3 vemos si la inflación lo compensa.');
    expect(txtSideDescuento).toContain('Las cuotas suman 5% menos que de contado. En el paso 3 lo pasamos a plata de hoy.');
    expect(txtSideSinRecargo).toContain('Las cuotas suman lo mismo que de contado. En el paso 3 vemos cuánto te ahorrás con la inflación.');

    expect(txtSideResCuotas).toContain('RESULTADO');
    expect(txtSideResCuotas).toContain('Un pago hoy');
    expect(txtSideResCuotas).toContain('12 cuotas');
    expect(txtSideResCuotas).toContain('Te ahorrás');
    expect(txtSideResCuotas).toContain('En plata de hoy');
    expect(txtSideResCuotas).toContain('Montos en plata de hoy.');
    expect(txtSideResContado).toContain('Pagás de más');
    expect(txtSideResUsd).toContain('Montos en dólares, sin inflación.');

    expect(txtCanAffordArs).toContain('Lo que sale, en pesos');
    expect(txtCanAffordUsd).toContain('Lo que sale, en dólares');
    expect(txtGastoFijo).toContain('Lo que pagarías cada mes, en pesos');

    const todoRenderizado = [
      txtPage,
      txtPaso1,
      txtPaso2,
      txtPaso3Pre,
      txtPaso3Cuotas,
      txtPaso3Contado,
      txtPaso3Empate,
      txtSidePaso1,
      txtSideRecargo,
      txtSideDescuento,
      txtSideSinRecargo,
      txtSideResCuotas,
      txtSideResContado,
      txtSideResUsd,
      txtCanAffordArs,
      txtCanAffordUsd,
      txtGastoFijo,
      txtChart,
      txtExplicacion,
    ].join('\n');

    const textosViejos = [
      'Simuladores inteligentes y calculadoras para optimizar tus decisiones de compra',
      'Referencia base',
      'Empecemos por el importe que pagarías hoy',
      'Importe en un único pago',
      'Condiciones comerciales',
      'calcular el recargo comercial',
      'Parámetros finales',
      'supuestos económicos',
      'Permite simular el saldo',
      'Ahorro Real Neto',
      'Sobrecosto Real',
      'de variación',
      'Balance Financiero',
      'RESUMEN EJECUTIVO',
      'Desembolso hoy',
      'pagos nominales',
      'Ahorro neto real',
      'Sobrecosto neto',
      'Comparativa en plata de hoy',
      'Referencia fijada',
      'Criterio de evaluación financiera',
      'Orientativo · Sujeto a supuestos',
      'Cifras ajustadas por la inflación elegida',
      'El balance se actualiza en tiempo real',
      'El importe en pesos a evaluar',
      'El importe en dólares a evaluar',
    ];

    for (const viejo of textosViejos) {
      expect(todoRenderizado).not.toContain(viejo);
    }
  });
});
