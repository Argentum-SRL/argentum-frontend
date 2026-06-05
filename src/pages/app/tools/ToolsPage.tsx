import { Calculator } from 'lucide-react';
import useTools from '@/hooks/useTools';
import ConvenienciaForm from '@/components/tools/ConvenienciaForm';
import ConvenienciaResult from '@/components/tools/ConvenienciaResult';
import pageStyles from './ToolsPage.module.css';
import componentStyles from '@/components/tools/ToolsComponents.module.css';

export default function ToolsPage() {
  const {
    ipcData,
    ipcLoading,
    ipcError,
    formData,
    setFormData,
    resultado,
    calculando,
    calcular,
    cuotaCalculada
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

      {/* ── Top Dark Banner ────────────────────────────────────────────── */}
      <div className={pageStyles.heroBanner}>
        <span className={pageStyles.heroLabel}>Herramienta Destacada</span>
        <h2 className={pageStyles.heroTitle}>
          Calculadora de Cuotas vs Contado con Inflación
        </h2>
        <p className={pageStyles.heroDesc}>
          Descubrí si te conviene pagar en cuotas o realizar un pago al contado. La calculadora 
          descuenta el valor real futuro de cada cuota usando la inflación mensual de Argentina.
        </p>
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────────── */}
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
            <div className={`${componentStyles.card} ${componentStyles.emptyStateCard}`}>
              <div className={componentStyles.emptyStateIconWrapper}>
                <Calculator size={32} />
              </div>
              <h3 className={componentStyles.cardTitle}>Esperando datos</h3>
              <p className={`${componentStyles.cardSubtitle} ${componentStyles.emptyStateSubtitle}`}>
                Ingresá los datos de la compra a la izquierda y hacé clic en "Calcular conveniencia" para ver el análisis financiero.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
