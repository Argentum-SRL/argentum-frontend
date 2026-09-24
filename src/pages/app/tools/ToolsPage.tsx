import { useSearchParams } from 'react-router-dom';
import { Scale, HelpCircle, FileSpreadsheet } from '@/components/ui/icons';
import useTools from '@/hooks/useTools';
import ConvenienciaForm from '@/components/tools/ConvenienciaForm';
import ConvenienciaResult from '@/components/tools/ConvenienciaResult';
import FinancialContextBanner from '@/components/tools/FinancialContextBanner';
import CanAffordForm from '@/components/tools/CanAffordForm';
import CanAffordResult from '@/components/tools/CanAffordResult';
import ParametersSummaryBar from '@/components/tools/ParametersSummaryBar';
import pageStyles from './ToolsPage.module.css';
import { useAuth } from '@/hooks/useAuth';
import ImportacionResumenSection from '@/components/tools/importacion/ImportacionResumenSection';
import { formatMonto } from '@/utils/format';

type TabId = 'conveniencia' | 'can-afford' | 'importar-resumen';

interface TabItem {
  id: TabId;
  title: string;
  subtitle: string;
  icon: typeof Scale;
  adminOnly?: boolean;
}

const TOOL_TABS: TabItem[] = [
  {
    id: 'conveniencia',
    title: 'Cuotas vs Contado',
    subtitle: 'Calculadora de inflación & TNA',
    icon: Scale,
  },
  {
    id: 'can-afford',
    title: '¿Me lo puedo permitir?',
    subtitle: 'Capacidad de pago & salud financiera',
    icon: HelpCircle,
  },
  {
    id: 'importar-resumen',
    title: 'Importar Resumen',
    subtitle: 'Extractos y resúmenes de tarjeta',
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
    calcularCuotaConInteres
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

        <div className={pageStyles.tabSwitcher} role="tablist" aria-label="Herramientas disponibles">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`${pageStyles.toolTabBtn} ${isActive ? pageStyles.toolTabBtnActive : ''}`}
                onClick={() => handleSelectTab(tab.id)}
                type="button"
              >
                <div className={`${pageStyles.toolTabIconBox} ${isActive ? pageStyles.toolTabIconBoxActive : ''}`}>
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <div className={pageStyles.toolTabTextGroup}>
                  <span className={pageStyles.toolTabTitle}>{tab.title}</span>
                  <span className={pageStyles.toolTabSubtitle}>{tab.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab: Cuotas vs Contado ───────────────────────────────────────── */}
      {currentTab === 'conveniencia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {ipcLoading ? (
            <div className={`${pageStyles.skeleton} ${pageStyles.skeletonCard}`} />
          ) : !resultado ? (
            /* Estado 1: Formulario de Carga (100% visible sin scroll) */
            <ConvenienciaForm
              formData={formData}
              setFormData={setFormData}
              calculando={calculando}
              calcular={calcular}
              cuotaCalculada={cuotaCalculada}
              ipcData={ipcData}
              ipcLoading={ipcLoading}
              ipcError={ipcError}
            />
          ) : (
            /* Estado 2: Modo Análisis (Barra Resumen Superior + Resultados Completos) */
            <>
              <ParametersSummaryBar
                title="Cuotas vs Contado"
                icon={Scale}
                items={[
                  { label: 'Contado', value: formatMonto(formData.precio_contado || 0, 'ARS') },
                  {
                    label: 'Financiación',
                    value: formData.tiene_interes
                      ? `${formData.cantidad_cuotas} cuotas (TNA ${formData.tna}%)`
                      : `${formData.cantidad_cuotas} cuotas fijas de ${formData.precio_total_cuotas && formData.cantidad_cuotas ? formatMonto(formData.precio_total_cuotas / formData.cantidad_cuotas, 'ARS') : '$0'}`
                  },
                  { label: 'Inflación esperada', value: `${formData.inflacion_mensual}% /mes` }
                ]}
                onEdit={resetCalculadora}
                editLabel="Modificar datos"
              />

              <ConvenienciaResult resultado={resultado} />
            </>
          )}
        </div>
      )}

      {/* ── Tab: ¿Me lo puedo permitir? ─────────────────────────────────── */}
      {currentTab === 'can-afford' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {!canAffordResult ? (
            /* Estado 1: Contexto Financiero + Formulario de Carga */
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
                ingresoPromedioContext={financialContext?.ingreso_promedio_mensual ?? null}
                saldoDisponibleContext={financialContext?.saldo_disponible ?? 0}
                tieneInteres={tieneInteres}
                setTieneInteres={setTieneInteres}
                tna={tna}
                setTna={setTna}
                calcularCuotaConInteres={calcularCuotaConInteres}
              />
            </>
          ) : (
            /* Estado 2: Modo Análisis (Barra Resumen Superior + Diagnóstico y Semáforo) */
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
                ciclosConHistoria={financialContext?.ciclos_con_historia ?? 0}
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

