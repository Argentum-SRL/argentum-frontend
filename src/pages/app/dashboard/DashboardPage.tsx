import { useEffect, useState } from 'react'
import { Bell, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { calcularPeriodoActual } from '@/lib/utils/ciclo'
import { getCategoriaMeta } from '@/lib/utils/categorias.utils'
import { mockDashboard } from '@/lib/mock/dashboard.mock'
import type { DashboardData, TransaccionMock, ProximoPagoMock, CategoriaMock } from '@/lib/mock/dashboard.mock'
import styles from './DashboardPage.module.css'

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtARS(n: number, decimales = 0): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n)
}

function fmtFecha(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function fmtDiasRestantes(iso: string): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(iso + 'T12:00:00')
  const diff = Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff < 0) return 'Vencido'
  return `en ${diff}d`
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <div className={`${styles.skel} ${styles.skelTitle}`} />
          <div className={`${styles.skel} ${styles.skelSubtitle}`} />
        </div>
      </div>
      <div className={`${styles.skel} ${styles.skelHero}`} />
      <div className={styles.grid}>
        <div className={`${styles.skel} ${styles.skelPanel}`} />
        <div className={`${styles.skel} ${styles.skelPanel}`} />
      </div>
    </div>
  )
}

// ── Donut chart ────────────────────────────────────────────────────────────

function DonutChart({ categorias }: { categorias: CategoriaMock[] }) {
  const r = 44
  const circ = 2 * Math.PI * r
  let cumAngle = -90

  return (
    <svg viewBox="0 0 120 120" className={styles.donut}>
      {categorias.map((cat) => {
        const len = (cat.porcentaje / 100) * circ
        const rotation = cumAngle
        cumAngle += (cat.porcentaje / 100) * 360
        return (
          <circle
            key={cat.nombre}
            cx={60} cy={60} r={r}
            fill="none"
            stroke={cat.color}
            strokeWidth={14}
            strokeDasharray={`${len} ${circ - len}`}
            transform={`rotate(${rotation}, 60, 60)`}
          />
        )
      })}
      <circle cx={60} cy={60} r={30} fill="var(--surface)" />
    </svg>
  )
}

// ── Hero card ──────────────────────────────────────────────────────────────

const PERIODO_TABS = ['Hoy', 'Semana', 'Mes', 'USD'] as const
type PeriodoTab = typeof PERIODO_TABS[number]

function HeroCard({ data, tab, onTab }: { data: DashboardData; tab: PeriodoTab; onTab: (t: PeriodoTab) => void }) {
  const positivo = data.balanceCambio >= 0
  return (
    <div className={styles.hero}>
      {/* Decorative circles */}
      <div className={styles.heroDecoA} aria-hidden="true" />
      <div className={styles.heroDecoB} aria-hidden="true" />

      <div className={styles.heroInner}>
        {/* Left: balance */}
        <div className={styles.heroLeft}>
          <p className={styles.heroLabel}>Balance del ciclo</p>
          <p className={styles.heroBalance}>{fmtARS(data.balance, 2)}</p>
          <div className={styles.heroBadge}>
            {positivo
              ? <TrendingUp size={14} strokeWidth={2} />
              : <TrendingDown size={14} strokeWidth={2} />
            }
            <span>{positivo ? '+' : ''}{data.balanceCambioPct}% vs ciclo ant.</span>
          </div>
        </div>

        {/* Right: pills + stats */}
        <div className={styles.heroRight}>
          <div className={styles.heroPills}>
            {PERIODO_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTab(t)}
                className={[styles.heroPill, tab === t ? styles.heroPillActive : ''].filter(Boolean).join(' ')}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Disponible real</span>
              <span className={styles.heroStatValue}>{fmtARS(data.disponibleReal)}</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Proyección cierre</span>
              <span className={styles.heroStatValue}>{fmtARS(data.proyeccion)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Transacciones list ─────────────────────────────────────────────────────

function TransaccionesList({ transacciones }: { transacciones: TransaccionMock[] }) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Últimos movimientos</p>
      <div className={styles.txList}>
        {transacciones.map((tx) => {
          const meta = getCategoriaMeta(tx.categoria)
          const positivo = tx.monto > 0
          return (
            <div key={tx.id} className={styles.txRow}>
              <div
                className={styles.txIcon}
                style={{ background: meta.bg, color: meta.stroke }}
              >
                {meta.icon}
              </div>
              <div className={styles.txMeta}>
                <p className={styles.txDesc}>{tx.descripcion}</p>
                <p className={styles.txSub}>{fmtFecha(tx.fecha)} · {tx.billetera}</p>
              </div>
              <p className={[styles.txMonto, positivo ? styles.txMontoPositivo : styles.txMontoNegativo].join(' ')}>
                {positivo ? '+' : ''}{fmtARS(tx.monto)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Próximos pagos ─────────────────────────────────────────────────────────

function ProximosPagos({ pagos }: { pagos: ProximoPagoMock[] }) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Próximos pagos</p>
      <div className={styles.pagosList}>
        {pagos.map((pago) => (
          <div key={pago.id} className={styles.pagoRow}>
            <div className={styles.pagoLeft}>
              <p className={styles.pagoNombre}>{pago.descripcion}</p>
              <p className={styles.pagoFecha}>{fmtFecha(pago.fechaVencimiento)} — {fmtDiasRestantes(pago.fechaVencimiento)}</p>
            </div>
            <div className={styles.pagoRight}>
              <p className={styles.pagoMonto}>{fmtARS(pago.monto)}</p>
              {pago.urgente && <span className={styles.pagoUrgente}>Urgente</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Categorías ─────────────────────────────────────────────────────────────

function Categorias({ categorias }: { categorias: CategoriaMock[] }) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Por categoría</p>
      <div className={styles.catWrap}>
        <DonutChart categorias={categorias} />
        <div className={styles.catList}>
          {categorias.map((cat) => (
            <div key={cat.nombre} className={styles.catRow}>
              <span className={styles.catDot} style={{ background: cat.color }} />
              <span className={styles.catNombre}>{cat.nombre}</span>
              <span className={styles.catPct}>{cat.porcentaje}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── DashboardPage ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [tab, setTab] = useState<PeriodoTab>('Mes')

  useEffect(() => {
    const t = setTimeout(() => {
      setData(mockDashboard)
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [])

  const periodo = calcularPeriodoActual(usuario ?? null)
  const nombre = usuario?.nombre ?? null

  if (isLoading) return <Skeleton />

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Buen día{nombre ? `, ${nombre}` : ''}
            <span className={styles.periodoBadge}>{periodo.label}</span>
          </h1>
          <p className={styles.pageSubtitle}>Tu panorama financiero</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} aria-label="Notificaciones">
            <Bell size={20} strokeWidth={1.75} />
          </button>
          <button className={styles.headerBtn} aria-label="Buscar">
            <Search size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <HeroCard data={data!} tab={tab} onTab={setTab} />

      {/* Content grid */}
      <div className={styles.grid}>
        <div className={styles.gridMain}>
          <TransaccionesList transacciones={data!.transacciones} />
        </div>
        <div className={styles.gridSide}>
          <ProximosPagos pagos={data!.proximosPagos} />
          <Categorias categorias={data!.categorias} />
        </div>
      </div>
    </div>
  )
}
