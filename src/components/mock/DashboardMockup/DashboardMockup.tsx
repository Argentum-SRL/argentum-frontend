import { useEffect, useId, useState } from 'react'
import { CreditCard, Target, TrendingUp } from '@/components/ui/icons'
import { ConstellationCanvas } from '@/components/ui'
import styles from './DashboardMockup.module.css'

// ─── Data ─────────────────────────────────────────────────────────────────────
const TARGET_BALANCE = 1247350
const COUNT_DURATION = 1500
const TX_DELAYS = [300, 500, 700]

const TRANSACTIONS = [
  { name: 'Coto Almagro', sub: 'Supermercado', amount: '− $ 12.480',    positive: false },
  { name: 'Sueldo abril',  sub: 'Ingreso',       amount: '+ US$ 2.100',    positive: true  },
  { name: 'SUBE',          sub: 'Transporte',    amount: '− $ 2.000',    positive: false },
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
      <ConstellationCanvas intensity="hero" themeOverride="dark" />

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
            {['Hoy', 'Semana', 'Mes', 'Dólares'].map((tab) => (
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
