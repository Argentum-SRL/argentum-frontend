import { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale, HelpCircle, FileSpreadsheet, Repeat } from '@/components/ui/icons';
import useTools from '@/hooks/useTools';
import ConvenienciaWizard from '@/components/tools/ConvenienciaWizard';
import FinancialContextBanner from '@/components/tools/FinancialContextBanner';
import CanAffordForm from '@/components/tools/CanAffordForm';
import CanAffordResult from '@/components/tools/CanAffordResult';
import GastoFijoForm from '@/components/tools/GastoFijoForm';
import ParametersSummaryBar from '@/components/tools/ParametersSummaryBar';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Button, ConvenienciaWizardSkeleton } from '@/components/ui';
import pageStyles from './ToolsPage.module.css';
import toolsStyles from '@/components/tools/ToolsComponents.module.css';
import { useAuth } from '@/hooks/useAuth';
import ImportacionResumenSection from '@/components/tools/importacion/ImportacionResumenSection';
import { formatMonto } from '@/utils/format';
import { mostrarLinkGastoFijo } from '@/utils/permitirse';

type TabId = 'conveniencia' | 'can-afford' | 'importar-resumen';

interface TabItem {
  id: TabId;
  title: string;
  icon: typeof Scale;
  adminOnly?: boolean;
}

const TOOL_TABS: TabItem[] = [
  {
    id: 'conveniencia',
    title: 'Cuotas vs Contado',
    icon: Scale,
  },
  {
    id: 'can-afford',
    title: '¿Me lo puedo permitir?',
    icon: HelpCircle,
  },
  {
    id: 'importar-resumen',
    title: 'Importar Resumen',
    icon: FileSpreadsheet,
    adminOnly: true,
  },
];

export default function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as TabId | null;
  const initialTab: TabId = (rawTab === 'can-afford' || rawTab === 'importar-resumen' || rawTab === 'conveniencia')
    ? rawTab
    : 'conveniencia';

  const {
    activeTab,
    setActiveTab,
    // Tab 1: Conveniencia
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
    // Tab 2: Can Afford
    financialContext,
    financialContextLoading,
    financialContextError,
    canAffordForm,
    setCanAffordForm,
    canAffordResult,
    canAffordCalculando,
    canAffordCalcular,
    resetCanAfford,
    tieneInteres,
    setTieneInteres,
    tna,
    setTna,
    // Gasto Fijo
    gastoFijoAbierto,
    gastoFijoMonto,
    setGastoFijoMonto,
    gastoFijoResult,
    gastoFijoCalculando,
    abrirGastoFijo,
    volverGastoFijo,
    gastoFijoCalcular,
  } = useTools();

  const { is_admin } = useAuth();

  // Sync tab with URL if needed
  const currentTab = rawTab || activeTab || initialTab;

  const handleSelectTab = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tabId === 'conveniencia') {
        next.delete('tab');
      } else {
        next.set('tab', tabId);
      }
      return next;
    }, { replace: true });
  };

    // ── Mobile Carousel Auto-scroll ──────────────────────────────────────────
  const controlsRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = controlsRowRef.current;
    if (!container) return;
    const activePill = container.querySelector('[aria-checked="true"]') as HTMLElement | null;
    if (activePill) {
      const containerRect = container.getBoundingClientRect();
      const pillRect = activePill.getBoundingClientRect();
      if (pillRect.left < containerRect.left || pillRect.right > containerRect.right) {
        const scrollOffset = activePill.offsetLeft - 16;
        container.scrollTo({ left: Math.max(0, scrollOffset), behavior: 'smooth' });
      }
    }
  }, [currentTab]);

  const visibleTabs = TOOL_TABS.filter(t => !t.adminOnly || is_admin);

  return (
    <div className={pageStyles.page}>

      {/* ── Page Header (Title on left, Tool Switcher on right) ─────────────── */}
      <div className={pageStyles.header}>
        <div className={pageStyles.titleGroup}>
          <h1>Herramientas Financieras</h1>
          <p className={pageStyles.subtitle}>
            Simuladores inteligentes y calculadoras para optimizar tus decisiones de compra
          </p>
        </div>

        <div ref={controlsRowRef} className={pageStyles.controlsRow}>
          <SegmentedControl
            className={pageStyles.navTrack}
            options={visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return {
                value: tab.id,
                label: tab.title,
                icon: <Icon size={16} strokeWidth={2.2} />,
              };
            })}
            value={currentTab}
            onChange={(val) => handleSelectTab(val as TabId)}
            ariaLabel="Herramientas disponibles"
            layout="inline"
          />
        </div>
      </div>

      {/* ── Tab: Cuotas vs Contado (Financial Wizard Shell) ─────────────── */}
      {currentTab === 'conveniencia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {ipcLoading ? (
            <ConvenienciaWizardSkeleton />
          ) : (
            <ConvenienciaWizard
              formData={formData}
              setFormData={setFormData}
              resultado={resultado}
              calculando={calculando}
              calcular={calcular}
              resetCalculadora={resetCalculadora}
              cuotaCalculada={cuotaCalculada}
              planCuotas={planCuotas}
              ipcData={ipcData}
              ipcLoading={ipcLoading}
              ipcError={ipcError}
            />
          )}
        </div>
      )}

      {/* ── Tab: ¿Me lo puedo permitir? ─────────────────────────────────── */}
      {currentTab === 'can-afford' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {!canAffordResult ? (
            /* Estado 1: Contexto Financiero + Formulario de Carga + Bloque Gasto Fijo */
            <>
              <FinancialContextBanner
                context={financialContext}
                loading={financialContextLoading}
                error={financialContextError}
              />

              <CanAffordForm
                formData={canAffordForm}
                setFormData={setCanAffordForm}
                calculando={canAffordCalculando}
                calcular={canAffordCalcular}
                tieneInteres={tieneInteres}
                setTieneInteres={setTieneInteres}
                tna={tna}
                setTna={setTna}
              />

              {/* Bloque gasto fijo: link si está cerrado, formulario o resultado si está abierto */}
              {mostrarLinkGastoFijo(Boolean(canAffordResult), gastoFijoAbierto) && (
                <Button
                  variant="ghost"
                  fullWidth
                  type="button"
                  onClick={abrirGastoFijo}
                  className={toolsStyles.btnLinkGastoFijo}
                >
                  <span className={toolsStyles.btnResetContent}>
                    <Repeat size={16} />
                    <span>¿Querés ver si te entra un gasto fijo?</span>
                  </span>
                </Button>
              )}

              {gastoFijoAbierto && (
                !gastoFijoResult ? (
                  <GastoFijoForm
                    monto={gastoFijoMonto}
                    setMonto={setGastoFijoMonto}
                    calculando={gastoFijoCalculando}
                    calcular={gastoFijoCalcular}
                  />
                ) : (
                  <>
                    <ParametersSummaryBar
                      title="¿Te entra un gasto fijo?"
                      icon={Repeat}
                      items={[
                        {
                          label: 'Gasto por mes',
                          value: formatMonto(gastoFijoMonto || 0, 'ARS'),
                        },
                        {
                          label: 'Saldo líquido',
                          value: formatMonto(financialContext?.saldo_disponible || 0, 'ARS'),
                        },
                      ]}
                      onEdit={volverGastoFijo}
                      editLabel="Cambiar monto"
                    />

                    <CanAffordResult
                      resultado={gastoFijoResult}
                      onReset={volverGastoFijo}
                      textoReset="Probar otro monto"
                    />
                  </>
                )
              )}
            </>
          ) : (
            /* Estado 2: Modo Análisis de Compra (sin gasto fijo) */
            <>
              <ParametersSummaryBar
                title="¿Me lo puedo permitir?"
                icon={HelpCircle}
                items={[
                  { label: 'Precio compra', value: formatMonto(canAffordForm.precio_total || 0, 'ARS') },
                  {
                    label: 'Modalidad',
                    value: canAffordForm.modo === 'contado' ? 'Contado' : `${canAffordForm.cantidad_cuotas} cuotas`
                  },
                  {
                    label: 'Saldo líquido',
                    value: formatMonto(financialContext?.saldo_disponible || 0, 'ARS')
                  }
                ]}
                onEdit={resetCanAfford}
                editLabel="Modificar compra"
              />

              <CanAffordResult
                resultado={canAffordResult}
                onReset={resetCanAfford}
              />
            </>
          )}
        </div>
      )}

      {/* ── Tab: Importar resumen (Admin) ────────────────────────────────── */}
      {currentTab === 'importar-resumen' && <ImportacionResumenSection />}
    </div>
  );
}

