import { useEffect, useId, useState } from 'react'
import { CreditCard, Target, TrendingUp } from 'lucide-react'
import styles from './DashboardMockup.module.css'

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
      className={styles.decoMoon}
      style={{ 
        '--top': top, 
        '--left': left, 
        '--right': right, 
        '--opacity': opacity, 
        '--anim': reducedMotion ? 'none' : anim 
      } as React.CSSProperties}
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
      className={styles.txRow}
      style={{
        '--delay': `${delay}ms`,
      } as React.CSSProperties}
    >
      <div className={styles.txIconWrap}>
        <MoonIcon size={16} color="var(--text-3)" />
      </div>
      <div className={styles.txMeta}>
        <p className={styles.txName}>{name}</p>
        <p className={styles.txSub}>{sub}</p>
      </div>
      <p className={`${styles.txAmount} ${positive ? styles.txAmountPositive : ''}`}>
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
    <div className={styles.root}>
      {DECO_MOONS.map((m) => <DecoMoon key={m.id} {...m} />)}

      {/* Logo */}
      <div className={styles.logoArea}>
        <div className="flex items-center gap-3 mb-3">
          <MoonIcon size={64} />
          <span className={styles.logoText}>
            Argentum
          </span>
        </div>
        <p className={styles.logoSubtitle}>
          Tu dashboard financiero, siempre al día.
        </p>
      </div>

      {/* Dashboard card */}
      <div className={styles.cardArea}>
        <div className={styles.card}>
          {/* Balance */}
          <p className={styles.balanceLabel}>
            Balance del ciclo
          </p>
          <p className={styles.balanceValue}>
            {fmtARS(balance)},80
          </p>
          <p className={styles.balanceDelta}>
            + $ 84.200 este mes
          </p>

          <div className={styles.divider} />

          {/* Tabs */}
          <div className={styles.tabs}>
            {['Hoy', 'Semana', 'Mes', 'USD'].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${tab === 'Hoy' ? styles.tabActive : ''}`}
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
      <div className={styles.bullets}>
        {[
          { Icon: Target,    text: 'Metas de ahorro con progreso en tiempo real' },
          { Icon: CreditCard, text: 'Control de cuotas y suscripciones' },
          { Icon: TrendingUp, text: 'Proyecciones basadas en tus patrones reales' },
        ].map(({ Icon, text }) => (
          <div key={text} className={styles.bullet}>
            <Icon size={16} className={styles.bulletIcon} />
            <span className={styles.bulletText}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
