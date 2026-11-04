import React from 'react';
import { Pencil, Check, type LucideIcon } from '@/components/ui/icons';
import styles from './ToolsComponents.module.css';

export interface SummaryItem {
  label: string;
  value: string;
}

interface ParametersSummaryBarProps {
  title: string;
  icon: LucideIcon;
  items: SummaryItem[];
  onEdit: () => void;
  editLabel?: string;
  showStepper?: boolean;
}

export const ParametersSummaryBar: React.FC<ParametersSummaryBarProps> = ({
  title,
  icon: Icon,
  items,
  onEdit,
  editLabel = 'Modificar datos',
  showStepper = false,
}) => {
  return (
    <div className={styles.summaryBarCard}>
      {/* ── Stepper Line (if enabled) ── */}
      {showStepper && (
        <div className={styles.stepperTrack}>
          <div className={`${styles.stepBadge} ${styles.stepBadgeDone}`} onClick={onEdit} role="button" title="Volver a modificar precio">
            <Check size={12} strokeWidth={3} />
            <span>01 Compra</span>
          </div>
          <span className={styles.stepSeparator}>→</span>
          <div className={`${styles.stepBadge} ${styles.stepBadgeDone}`} onClick={onEdit} role="button" title="Volver a modificar financiación">
            <Check size={12} strokeWidth={3} />
            <span>02 Financiación</span>
          </div>
          <span className={styles.stepSeparator}>→</span>
          <div className={`${styles.stepBadge} ${styles.stepBadgeActive}`}>
            <span>03 Análisis</span>
          </div>
        </div>
      )}

      <div className={styles.summaryBarMain}>
        <div className={styles.summaryBarHeader}>
          <div className={styles.summaryBarIconBox}>
            <Icon size={16} strokeWidth={2.2} />
          </div>
          <span className={styles.summaryBarTitle}>{title}</span>
        </div>

        <div className={styles.summaryPills}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.summaryPill}>
              <span className={styles.summaryPillLabel}>{item.label}:</span>
              <span className={styles.summaryPillValue}>{item.value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className={styles.summaryEditBtn}
          title={editLabel}
          aria-label={editLabel}
        >
          <Pencil size={14} />
          <span className={styles.summaryEditBtnText}>{editLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default ParametersSummaryBar;
