import React from 'react';
import { Check } from '@/components/ui/icons';
import { formatMonto } from '@/utils/format';
import styles from './ToolsComponents.module.css';

export interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  precioContado: number | null;
  cantidadCuotas?: number | null;
  isStep1Valid: boolean;
  hasResult: boolean;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  onStepClick,
  precioContado,
  cantidadCuotas,
  isStep1Valid,
  hasResult,
}) => {
  return (
    <nav className={styles.wizardProgressNav} aria-label="Progreso del simulador">
      <div className={styles.wizardProgressTrack} role="tablist">
        {/* Paso 1: Compra */}
        <button
          type="button"
          role="tab"
          aria-selected={currentStep === 1}
          aria-current={currentStep === 1 ? 'step' : undefined}
          className={`${styles.wizardStepBadge} ${
            currentStep === 1
              ? styles.wizardStepBadgeActive
              : styles.wizardStepBadgeDone
          }`}
          onClick={() => onStepClick(1)}
          title="Ir al paso 01: Precio de contado"
        >
          {currentStep > 1 ? (
            <span className={styles.wizardStepCheck} aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
          ) : (
            <span className={styles.wizardStepDotActive} aria-hidden="true">●</span>
          )}
          <span className={styles.wizardStepLabel}>
            01 Compra
          </span>
          {currentStep > 1 && precioContado !== null && precioContado > 0 && (
            <span className={styles.wizardStepDetail}>
              · {formatMonto(precioContado, 'ARS')}
            </span>
          )}
        </button>

        <span className={styles.wizardStepSeparator} aria-hidden="true">→</span>

        {/* Paso 2: Financiación */}
        <button
          type="button"
          role="tab"
          aria-selected={currentStep === 2}
          aria-current={currentStep === 2 ? 'step' : undefined}
          disabled={!isStep1Valid && currentStep < 2}
          className={`${styles.wizardStepBadge} ${
            currentStep === 2
              ? styles.wizardStepBadgeActive
              : currentStep > 2
              ? styles.wizardStepBadgeDone
              : styles.wizardStepBadgePending
          }`}
          onClick={() => isStep1Valid && onStepClick(2)}
          title={isStep1Valid ? "Ir al paso 02: Financiación" : "Ingresá el precio de compra primero"}
        >
          {currentStep > 2 ? (
            <span className={styles.wizardStepCheck} aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
          ) : currentStep === 2 ? (
            <span className={styles.wizardStepDotActive} aria-hidden="true">●</span>
          ) : (
            <span className={styles.wizardStepDotPending} aria-hidden="true">○</span>
          )}
          <span className={styles.wizardStepLabel}>
            02 Financiación
          </span>
          {currentStep === 3 && cantidadCuotas ? (
            <span className={styles.wizardStepDetail}>
              · {cantidadCuotas} cuotas
            </span>
          ) : null}
        </button>

        <span className={styles.wizardStepSeparator} aria-hidden="true">→</span>

        {/* Paso 3: Análisis */}
        <button
          type="button"
          role="tab"
          aria-selected={currentStep === 3}
          aria-current={currentStep === 3 ? 'step' : undefined}
          disabled={!hasResult && currentStep < 3}
          className={`${styles.wizardStepBadge} ${
            currentStep === 3
              ? styles.wizardStepBadgeActive
              : styles.wizardStepBadgePending
          }`}
          onClick={() => hasResult && onStepClick(3)}
          title={hasResult ? "Ver análisis financiero" : "Completá la financiación para calcular"}
        >
          {currentStep === 3 ? (
            <span className={styles.wizardStepDotActive} aria-hidden="true">●</span>
          ) : (
            <span className={styles.wizardStepDotPending} aria-hidden="true">○</span>
          )}
          <span className={styles.wizardStepLabel}>
            03 Análisis
          </span>
        </button>
      </div>
    </nav>
  );
};

export default WizardProgress;
