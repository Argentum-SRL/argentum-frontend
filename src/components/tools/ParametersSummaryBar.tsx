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
}

export const ParametersSummaryBar: React.FC<ParametersSummaryBarProps> = ({
  title,
  icon: Icon,
  items,
  onEdit,
  editLabel = 'Modificar datos',
}) => {
  return (
    <div className={styles.summaryBarCard} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
      {/* ── Stepper Line in Step 3 ── */}
      <div className={styles.stepperTrack} style={{ width: '100%', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 14, flexWrap: 'wrap' }}>
        <div className={styles.summaryBarLeft}>
          <div className={styles.summaryBarIconBox}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <div className={styles.summaryBarHeader}>
            <span className={styles.summaryBarTitle}>{title}</span>
            <div className={styles.summaryPills}>
              {items.map((item, idx) => (
                <div key={idx} className={styles.summaryPill}>
                  <span className={styles.summaryPillLabel}>{item.label}:</span>
                  <span className={styles.summaryPillValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className={styles.summaryEditBtn}
          title="Modificar parámetros ingresados"
        >
          <Pencil size={14} />
          <span>{editLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default ParametersSummaryBar;
