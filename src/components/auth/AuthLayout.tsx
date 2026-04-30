import { useId } from 'react'
import type { ReactNode } from 'react'

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
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <MoonIcon size={compact ? 40 : 56} />
        <span
          style={{
            fontWeight: 700,
            fontSize: compact ? '22px' : '32px',
            color: 'var(--primary)',
            letterSpacing: '-0.5px',
          }}
        >
          Argentum
        </span>
      </div>
      <h1
        className="mb-6"
        style={{ fontWeight: 700, fontSize: compact ? '28px' : '24px', color: 'var(--text)' }}
      >
        {title}
      </h1>
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
        <div className="hidden md:flex h-screen">
          <div className="w-1/2 h-full relative overflow-hidden">
            {leftPanel}
          </div>
          <div
            className="w-1/2 h-full flex items-center justify-center overflow-y-auto"
            style={{ background: 'var(--page)' }}
          >
            <div className="w-full max-w-[440px] px-10 py-12">
              <FormContent title={title} compact>{children}</FormContent>
            </div>
          </div>
        </div>

        {/* Mobile: full screen */}
        <div className="md:hidden min-h-[100dvh] flex flex-col" style={{ background: 'var(--page)' }}>
          <div className="flex-1 w-full px-6 pt-16 pb-10">
            <FormContent title={title}>{children}</FormContent>
          </div>
        </div>
      </>
    )
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:items-center md:justify-center"
      style={{ background: 'var(--page)' }}
    >
      <div className="flex-1 md:flex-none w-full md:max-w-[400px] px-6 pt-16 pb-10 md:p-10 md:rounded-2xl md:shadow-[0_2px_24px_rgba(13,32,69,0.08)] md:bg-[var(--surface)]">
        <FormContent title={title}>{children}</FormContent>
      </div>
    </div>
  )
}
