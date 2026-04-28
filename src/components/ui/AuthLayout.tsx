import type { ReactNode } from 'react'

function MoonLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id="moon-mask">
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver)" mask="url(#moon-mask)" />
    </svg>
  )
}

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-[100dvh] flex flex-col md:items-center md:justify-center"
      style={{ background: 'var(--page)' }}
    >
      <div
        className="flex-1 md:flex-none w-full md:max-w-[400px] px-6 pt-16 pb-10 md:p-10 md:rounded-2xl md:shadow-[0_2px_24px_rgba(13,32,69,0.08)] md:bg-[var(--surface)]"
      >
        <div className="flex items-center gap-3 mb-8">
          <MoonLogo />
          <span style={{ fontWeight: 700, fontSize: '32px', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            argentum
          </span>
        </div>

        <h1
          className="mb-6 md:text-[28px]"
          style={{ fontWeight: 700, fontSize: '24px', color: 'var(--text)' }}
        >
          {title}
        </h1>

        {children}
      </div>
    </div>
  )
}
