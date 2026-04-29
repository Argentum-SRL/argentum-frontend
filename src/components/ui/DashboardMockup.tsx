import { useEffect, useId, useState } from 'react'
import { CreditCard, Target, TrendingUp } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────
const TARGET_BALANCE = 1247350
const COUNT_DURATION = 1500
const TX_DELAYS = [300, 500, 700]

const TRANSACTIONS = [
  { name: 'Coto Almagro', sub: 'Supermercado', amount: '− $ 12.480',    positive: false },
  { name: 'Sueldo abril',  sub: 'Ingreso',       amount: '+ USD $ 2.100', positive: true  },
  { name: 'SUBE',          sub: 'Transporte',    amount: '− $ 2.000',    positive: false },
]

// ─── Decorative moons ─────────────────────────────────────────────────────────
interface DecoMoonDef {
  id: string; top: string; left?: string; right?: string
  size: number; opacity: number; anim: string
}

const DECO_MOONS: DecoMoonDef[] = [
  { id: 'd1', top: '8%',  right: '8%',  size: 80,  opacity: 0.08, anim: 'float-slow 9s ease-in-out infinite' },
  { id: 'd2', top: '65%', left:  '5%',  size: 48,  opacity: 0.12, anim: 'float-medium 7s ease-in-out infinite 1.5s' },
  { id: 'd3', top: '80%', right: '12%', size: 120, opacity: 0.05, anim: 'float-slow 11s ease-in-out infinite 3s' },
  { id: 'd4', top: '25%', left:  '3%',  size: 32,  opacity: 0.15, anim: 'float-medium 8s ease-in-out infinite 0.8s' },
  { id: 'd5', top: '45%', right: '3%',  size: 64,  opacity: 0.07, anim: 'float-slow 13s ease-in-out infinite 2s' },
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function fmtARS(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

// ─── Components ───────────────────────────────────────────────────────────────
function DecoMoon({ id, top, left, right, size, opacity, anim }: DecoMoonDef) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"
      style={{ position: 'absolute', top, left, right, opacity, pointerEvents: 'none', animation: reducedMotion ? 'none' : anim }}
    >
      <defs>
        <mask id={`deco-${id}`}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver)" mask={`url(#deco-${id})`} />
    </svg>
  )
}

function MoonIcon({ size, color = 'var(--silver)' }: { size: number; color?: string }) {
  const maskId = `m${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill={color} mask={`url(#${maskId})`} />
    </svg>
  )
}

function TxRow({ name, sub, amount, positive, delay }: typeof TRANSACTIONS[0] & { delay: number }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        animation: `fade-tx 300ms ease-out ${delay}ms forwards`,
      }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--surface-alt)' }}>
        <MoonIcon size={16} color="var(--text-3)" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{name}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{sub}</p>
      </div>
      <p className="flex-shrink-0" style={{ fontSize: '13px', fontWeight: 600, color: positive ? 'var(--secondary)' : 'var(--text)' }}>
        {amount}
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardMockup() {
  const [balance, setBalance] = useState(reducedMotion ? TARGET_BALANCE : 0)
  const [showTx, setShowTx] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) return

    const raf = { id: 0 }
    const start = performance.now()

    function tick(now: number) {
      const t = Math.min((now - start) / COUNT_DURATION, 1)
      setBalance(Math.round(easeOutQuart(t) * TARGET_BALANCE))
      if (t < 1) {
        raf.id = requestAnimationFrame(tick)
      } else {
        setShowTx(true)
      }
    }

    raf.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.id)
  }, [])

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 60% 40%, #1a3a6e 0%, #0D2045 55%, #070f24 100%)',
        padding: '40px 48px',
      }}
    >
      {DECO_MOONS.map((m) => <DecoMoon key={m.id} {...m} />)}

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <MoonIcon size={64} />
          <span style={{ fontWeight: 700, fontSize: '32px', color: 'var(--silver)', letterSpacing: '-0.5px' }}>
            Argentum
          </span>
        </div>
        <p style={{ fontSize: '16px', color: 'var(--silver)', opacity: 0.7 }}>
          Tu dashboard financiero, siempre al día.
        </p>
      </div>

      {/* Dashboard card */}
      <div className="flex-1 flex items-center justify-center relative z-10 py-4">
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            borderRadius: '16px',
            padding: '20px',
            background: 'var(--surface)',
            boxShadow: '0 2px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Balance */}
          <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Balance del ciclo
          </p>
          <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text)', margin: '4px 0', lineHeight: 1.1 }}>
            {fmtARS(balance)},80
          </p>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--secondary)', marginBottom: '16px' }}>
            + $ 84.200 este mes
          </p>

          <div style={{ height: '1px', background: 'var(--surface-alt)', marginBottom: '12px' }} />

          {/* Tabs */}
          <div className="flex gap-4 mb-4" style={{ borderBottom: '1px solid var(--surface-alt)', paddingBottom: '8px' }}>
            {['Hoy', 'Semana', 'Mes', 'USD'].map((tab) => (
              <button
                key={tab}
                className="outline-none bg-transparent p-0 cursor-default"
                style={{
                  fontSize: '12px',
                  fontWeight: tab === 'Hoy' ? 600 : 400,
                  color: tab === 'Hoy' ? 'var(--primary)' : 'var(--text-3)',
                  border: 'none',
                  borderBottom: tab === 'Hoy' ? '2px solid var(--primary)' : '2px solid transparent',
                  paddingBottom: '4px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Transactions */}
          {showTx && (
            <div className="flex flex-col gap-3">
              {TRANSACTIONS.map((tx, i) => (
                <TxRow key={tx.name} {...tx} delay={TX_DELAYS[i]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bullets — lg+ only */}
      <div className="relative z-10 hidden lg:flex flex-col gap-3">
        {[
          { Icon: Target,    text: 'Metas de ahorro con progreso en tiempo real' },
          { Icon: CreditCard, text: 'Control de cuotas y suscripciones' },
          { Icon: TrendingUp, text: 'Proyecciones basadas en tus patrones reales' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon size={16} style={{ color: 'var(--silver)', opacity: 0.7, flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: 'var(--silver)', opacity: 0.7 }}>{text}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fade-tx {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
