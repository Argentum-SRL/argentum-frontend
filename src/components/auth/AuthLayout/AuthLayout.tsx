import { type ReactNode } from 'react'
import { AtmosphericBackground, AtmosphericMoonIcon, ThemeToggle } from '@/components/ui'
import styles from './AuthLayout.module.css'

interface FormContentProps {
  title: string
  children: ReactNode
  compact?: boolean
}

function FormContent({ title, children, compact }: FormContentProps) {
  const logoCls = [styles.logo, compact ? styles.logoCompact : '']
    .filter(Boolean)
    .join(' ')
  const logoTextCls = [styles.logoText, compact ? styles.logoTextCompact : '']
    .filter(Boolean)
    .join(' ')
  const titleCls = [styles.title, compact ? styles.titleCompact : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={logoCls}>
        <AtmosphericMoonIcon size={compact ? 36 : 56} />
        <span className={logoTextCls}>Argentum</span>
      </div>
      <h1 className={titleCls}>{title}</h1>
      {children}
    </>
  )
}

interface AuthLayoutProps {
  title: string
  children: ReactNode
  leftPanel?: ReactNode
  cardMaxWidth?: number | string
  cardPadding?: string
  compact?: boolean
}

export default function AuthLayout({
  title,
  children,
  leftPanel,
  cardMaxWidth,
  cardPadding,
  compact,
}: AuthLayoutProps) {
  const themeBtn = <ThemeToggle variant="floating" />

  if (leftPanel) {
    return (
      <>
        {/* Desktop: split 50/50 */}
        <div className={styles.desktop}>
          {themeBtn}
          <div className={styles.leftPanel}>{leftPanel}</div>
          <div className={styles.rightPanel}>
            <div className={styles.formWrap}>
              <FormContent title={title} compact>{children}</FormContent>
            </div>
          </div>
        </div>

        {/* Mobile: full screen */}
        <div className={styles.mobile}>
          {themeBtn}
          <div className={styles.mobileInner}>
            <FormContent title={title}>{children}</FormContent>
          </div>
        </div>
      </>
    )
  }

  return (
    <AtmosphericBackground
      fullScreen={false}
      centered
      compensateBottomNav={false}
      className={styles.standalone}
    >
      {themeBtn}
      <div
        className={styles.standaloneCard}
        style={
          cardMaxWidth || cardPadding
            ? ({
                ...(cardMaxWidth
                  ? {
                      '--card-max-width':
                        typeof cardMaxWidth === 'number' ? `${cardMaxWidth}px` : cardMaxWidth,
                    }
                  : {}),
                ...(cardPadding ? { '--card-padding': cardPadding } : {}),
              } as React.CSSProperties)
            : undefined
        }
      >
        <FormContent title={title} compact={compact}>{children}</FormContent>
      </div>
    </AtmosphericBackground>
  )
}
