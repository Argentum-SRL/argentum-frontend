import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

function MoonIcon({ size }: { size: number }) {
  const maskId = `m${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver)" mask={`url(#${maskId})`} />
    </svg>
  )
}

interface FormContentProps {
  title: string
  children: ReactNode
  compact?: boolean
}

function FormContent({ title, children, compact }: FormContentProps) {
  const logoTextCls = [styles.logoText, compact ? styles.logoTextCompact : '']
    .filter(Boolean)
    .join(' ')
  const titleCls = [styles.title, compact ? styles.titleCompact : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={styles.logo}>
        <MoonIcon size={compact ? 40 : 56} />
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
}

export default function AuthLayout({ title, children, leftPanel }: AuthLayoutProps) {
  if (leftPanel) {
    return (
      <>
        {/* Desktop: split 50/50 */}
        <div className={styles.desktop}>
          <div className={styles.leftPanel}>{leftPanel}</div>
          <div className={styles.rightPanel}>
            <div className={styles.formWrap}>
              <FormContent title={title} compact>{children}</FormContent>
            </div>
          </div>
        </div>

        {/* Mobile: full screen */}
        <div className={styles.mobile}>
          <div className={styles.mobileInner}>
            <FormContent title={title}>{children}</FormContent>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={styles.standalone}>
      <div className={styles.standaloneCard}>
        <FormContent title={title}>{children}</FormContent>
      </div>
    </div>
  )
}
