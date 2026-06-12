import { Calculator } from 'lucide-react';
import useTools from '@/hooks/useTools';
import ConvenienciaForm from '@/components/tools/ConvenienciaForm';
import ConvenienciaResult from '@/components/tools/ConvenienciaResult';
import FinancialContextBanner from '@/components/tools/FinancialContextBanner';
import CanAffordForm from '@/components/tools/CanAffordForm';
import CanAffordResult from '@/components/tools/CanAffordResult';
import pageStyles from './ToolsPage.module.css';
import { EmptyState } from '@/components/ui';

export default function ToolsPage() {
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

  return (
    <div className={pageStyles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className={pageStyles.header}>
        <div className={pageStyles.titleGroup}>
          <h1>Herramientas</h1>
          <p className={pageStyles.subtitle}>
            Calculadoras para tomar mejores decisiones financieras
          </p>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className={pageStyles.tabsContainer}>
        <div className={pageStyles.tabs}>
          <button
            className={`${pageStyles.tab} ${activeTab === 'conveniencia' ? pageStyles.tabActive : ''}`}
            onClick={() => setActiveTab('conveniencia')}
            type="button"
          >
            💵 Cuotas vs Contado
          </button>
          <button
            className={`${pageStyles.tab} ${activeTab === 'can-afford' ? pageStyles.tabActive : ''}`}
            onClick={() => setActiveTab('can-afford')}
            type="button"
          >
            ❓ ¿Me lo puedo permitir?
          </button>
        </div>
      </div>
      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === 'conveniencia' && (
        <div className={pageStyles.grid}>
          {/* Left Column: Form */}
          <div className={pageStyles.formCol}>
            {ipcLoading ? (
              <div className={`${pageStyles.skeleton} ${pageStyles.skeletonCard}`} />
            ) : (
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
            )}
          </div>

          {/* Right Column: Result or Empty State */}
          <div className={pageStyles.resultCol}>
            {resultado ? (
              <ConvenienciaResult resultado={resultado} />
            ) : (
              <EmptyState
                icon={Calculator}
                title="Esperando datos"
                description='Ingresá los datos de la compra a la izquierda y hacé clic en "Calcular conveniencia" para ver el análisis financiero.'
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'can-afford' && (
        <div className="flex flex-col gap-6 w-full">
          <FinancialContextBanner
            context={financialContext}
            loading={financialContextLoading}
            error={financialContextError}
          />
          
          <div className={pageStyles.grid}>
            {/* Left Column: Form */}
            <div className={pageStyles.formCol}>
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
            </div>

            {/* Right Column: Result */}
            <div className={pageStyles.resultCol}>
              {canAffordResult ? (
                <CanAffordResult
                  resultado={canAffordResult}
                  ciclosConHistoria={financialContext?.ciclos_con_historia ?? 0}
                  onReset={resetCanAfford}
                />
              ) : (
                <EmptyState
                  icon={Calculator}
                  title="Esperando datos"
                  description='Ingresá los datos de la compra a la izquierda y hacé clic en "Analizar compra" para ver el análisis de salud financiera.'
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

