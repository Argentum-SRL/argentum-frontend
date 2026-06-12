import React from 'react';
import styles from './PageSummaryBar.module.css';

export interface SummaryBarItem {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
  valueColor?: string;
}

export interface PageSummaryBarProps {
  items: SummaryBarItem[];
  leftSlot?: React.ReactNode;
  className?: string;
}

const getColorClass = (color?: string) => {
  if (!color) return '';
  const lowerColor = color.toLowerCase();
  if (lowerColor === '#4caf7d') return styles.colorGreen;
  if (lowerColor === '#f5a623') return styles.colorOrange;
  if (lowerColor === '#ff8a65') return styles.colorRed;
  return '';
};

export default function PageSummaryBar({ items, leftSlot, className = '' }: PageSummaryBarProps) {
  return (
    <div className={`${styles.container} ${leftSlot ? styles.hasLeftSlot : ''} ${className}`}>
      {leftSlot && <div className={styles.leftSlot}>{leftSlot}</div>}
      {items.map((item, index) => {
        const colorClass = getColorClass(item.valueColor);
        return (
          <div
            key={index}
            className={`${styles.item} ${index === 0 ? styles.itemFirst : ''}`}
          >
            <span className={styles.label}>{item.label}</span>
            <span
              className={`${styles.value} ${item.highlight ? styles.valueHighlight : ''} ${colorClass}`}
            >
              {item.value}
            </span>
            {item.subValue && <span className={styles.subValue}>{item.subValue}</span>}
          </div>
        );
      })}
    </div>
  );
}

