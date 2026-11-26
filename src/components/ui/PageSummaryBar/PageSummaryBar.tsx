import React from 'react';
import MontoFit from '../MontoFit/MontoFit';
import styles from './PageSummaryBar.module.css';

export type SummaryBarTone = 'default' | 'positive' | 'warning' | 'negative';

export interface SummaryBarNotice {
  icon?: React.ReactNode;
  text: React.ReactNode;
  tooltip?: string;
}

export interface SummaryBarItem {
  label: string;
  value: string;
  valorCorto?: string;
  subValue?: string;
  highlight?: boolean;
  tone?: SummaryBarTone;
  notice?: SummaryBarNotice;
}

export interface PageSummaryBarProps {
  items: SummaryBarItem[];
  mobileVariant?: 'grid' | 'none' | 'strip';
  mobileItems?: SummaryBarItem[];
  mobileNotice?: SummaryBarNotice;
  className?: string;
}

const getDesktopToneClass = (tone: SummaryBarTone) => {
  if (tone === 'positive') return styles.colorGreen;
  if (tone === 'warning') return styles.colorOrange;
  if (tone === 'negative') return styles.colorRed;
  return '';
};

const getStripToneClass = (tone: SummaryBarTone) => {
  if (tone === 'positive') return styles.stripColorGreen;
  if (tone === 'warning') return styles.stripColorOrange;
  if (tone === 'negative') return styles.stripColorRed;
  return '';
};

export default function PageSummaryBar({
  items,
  mobileVariant = 'grid',
  mobileItems,
  mobileNotice,
  className = '',
}: PageSummaryBarProps) {
  const hideOnMobile = mobileVariant === 'none' || mobileVariant === 'strip';
  const stripItems = mobileItems ?? items;
  const stripNotice = mobileNotice ?? items.find((i) => i.notice)?.notice;
  const renderValue = (item: SummaryBarItem) =>
    item.valorCorto ? <MontoFit completo={item.value} corto={item.valorCorto} /> : item.value;

  return (
    <>
      {mobileVariant === 'strip' && (
        <div className={`${styles.mobileStrip} ${className}`.trim()}>
          <div className={styles.mobileStripGrid}>
            {stripItems.map((item, index) => {
              const toneClass = getStripToneClass(item.tone ?? 'default');
              return (
                <React.Fragment key={index}>
                  {index > 0 && <div className={styles.stripDivider} />}
                  <div className={styles.stripItem}>
                    <span className={styles.stripLabel}>{item.label}</span>
                    <span className={`${styles.stripValue} ${toneClass}`.trim()}>
                      {renderValue(item)}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {stripNotice && (
            <div className={styles.mobileStripNotice} title={stripNotice.tooltip}>
              {stripNotice.icon && (
                <span className={styles.mobileStripNoticeIcon} aria-hidden="true">
                  {stripNotice.icon}
                </span>
              )}
              <span className={styles.mobileStripNoticeText}>{stripNotice.text}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={`${styles.container} ${
          hideOnMobile ? styles.hideMobile : ''
        } ${className}`.trim()}
      >
        {items.map((item, index) => {
          const colorClass = getDesktopToneClass(item.tone ?? 'default');
          const hasNotice = Boolean(item.notice);

          return (
            <div
              key={index}
              className={`${styles.item} ${index === 0 ? styles.itemFirst : ''} ${
                item.highlight ? styles.itemHighlight : ''
              } ${hasNotice ? styles.itemWithNotice : ''}`.trim()}
            >
              {hasNotice ? (
                <>
                  <div className={styles.itemMain}>
                    <span className={styles.label}>{item.label}</span>
                    <span
                      className={`${styles.value} ${
                        item.highlight ? styles.valueHighlight : ''
                      } ${colorClass}`.trim()}
                    >
                      {renderValue(item)}
                    </span>
                    {item.subValue && <span className={styles.subValue}>{item.subValue}</span>}
                  </div>
                  {item.notice && (
                    <div className={styles.notice} title={item.notice.tooltip}>
                      {item.notice.icon && (
                        <span className={styles.noticeIcon} aria-hidden="true">
                          {item.notice.icon}
                        </span>
                      )}
                      <p className={styles.noticeText}>{item.notice.text}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className={styles.label}>{item.label}</span>
                  <span
                    className={`${styles.value} ${
                      item.highlight ? styles.valueHighlight : ''
                    } ${colorClass}`.trim()}
                  >
                    {renderValue(item)}
                  </span>
                  {item.subValue && <span className={styles.subValue}>{item.subValue}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
