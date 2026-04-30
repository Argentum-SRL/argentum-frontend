import { useEffect, useRef, useState } from 'react'
import { Plus, Wallet, Banknote, X, Check } from 'lucide-react'
import styles from './BilleterasPage.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

interface Billetera {
  id: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_actual: number
  saldo_inicial: number
  es_principal: boolean
  es_efectivo: boolean
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_BILLETERAS: Billetera[] = [
  { id: '1', nombre: 'Galicia',      moneda: 'ARS', saldo_actual: 892500,  saldo_inicial: 850000, es_principal: true,  es_efectivo: false },
  { id: '2', nombre: 'Mercado Pago', moneda: 'ARS', saldo_actual: 24750,   saldo_inicial: 0,      es_principal: false, es_efectivo: false },
  { id: '3', nombre: 'Efectivo',     moneda: 'ARS', saldo_actual: 15000,   saldo_inicial: 15000,  es_principal: false, es_efectivo: true  },
  { id: '4', nombre: 'Efectivo USD', moneda: 'USD', saldo_actual: 200,     saldo_inicial: 200,    es_principal: false, es_efectivo: true  },
]

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtSaldo(n: number, moneda: 'ARS' | 'USD'): string {
  if (moneda === 'USD') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={styles.toast}>
      <Check size={16} strokeWidth={2} className={styles.toastIcon} />
      <span>{message}</span>
    </div>
  )
}

// ── Billetera card ─────────────────────────────────────────────────────────

function BilleteraCard({ billetera }: { billetera: Billetera }) {
  const isPrimary = billetera.es_principal
  return (
    <div className={[styles.card, isPrimary ? styles.cardPrimary : ''].filter(Boolean).join(' ')}>
      <div className={styles.cardTop}>
        <div className={[styles.cardIconWrap, isPrimary ? styles.cardIconWrapPrimary : ''].filter(Boolean).join(' ')}>
          {billetera.es_efectivo
            ? <Banknote size={20} strokeWidth={1.75} />
            : <Wallet size={20} strokeWidth={1.75} />
          }
        </div>
        {isPrimary && <span className={styles.principalBadge}>Principal</span>}
      </div>

      <p className={[styles.cardNombre, isPrimary ? styles.cardNombrePrimary : ''].filter(Boolean).join(' ')}>
        {billetera.nombre}
      </p>
      <p className={[styles.cardMoneda, isPrimary ? styles.cardMonedaPrimary : ''].filter(Boolean).join(' ')}>
        {billetera.moneda}
      </p>

      <p className={[styles.cardSaldoLabel, isPrimary ? styles.cardSaldoLabelPrimary : ''].filter(Boolean).join(' ')}>
        Saldo actual
      </p>
      <p className={[styles.cardSaldo, isPrimary ? styles.cardSaldoPrimary : ''].filter(Boolean).join(' ')}>
        {fmtSaldo(billetera.saldo_actual, billetera.moneda)}
      </p>
    </div>
  )
}

// ── Create form ────────────────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void
  onCreate: (b: Billetera) => void
}

function CreateForm({ onClose, onCreate }: CreateFormProps) {
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [saldo, setSaldo] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nombreRef.current?.focus()
  }, [])

  function handleSaldoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setSaldo(raw)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    const saldoNum = parseFloat(saldo) || 0
    const nueva: Billetera = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      moneda,
      saldo_actual: saldoNum,
      saldo_inicial: saldoNum,
      es_principal: esPrincipal,
      es_efectivo: false,
    }
    onCreate(nueva)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <p className={styles.formTitle}>Nueva billetera</p>
        <button type="button" className={styles.formClose} onClick={onClose} aria-label="Cerrar">
          <X size={20} strokeWidth={1.75} />
        </button>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Nombre</label>
        <input
          ref={nombreRef}
          className={[styles.formInput, error ? styles.formInputError : ''].filter(Boolean).join(' ')}
          type="text"
          placeholder="Ej: Galicia, Mercado Pago…"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setError(null) }}
          maxLength={40}
        />
        {error && <p className={styles.formError}>{error}</p>}
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Moneda</label>
        <div className={styles.monedaPills}>
          {(['ARS', 'USD'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={[styles.monedaPill, moneda === m ? styles.monedaPillActive : ''].filter(Boolean).join(' ')}
              onClick={() => setMoneda(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Saldo inicial</label>
        <div className={styles.saldoWrap}>
          <span className={styles.saldoCurrency}>{moneda === 'ARS' ? '$' : 'U$D'}</span>
          <input
            className={styles.saldoInput}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={saldo}
            onChange={handleSaldoChange}
          />
        </div>
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          className={styles.checkInput}
          checked={esPrincipal}
          onChange={(e) => setEsPrincipal(e.target.checked)}
        />
        <span className={styles.checkLabel}>Marcar como billetera principal</span>
      </label>

      <div className={styles.infoBox}>
        <p className={styles.infoText}>
          Cuando el backend esté disponible, esta billetera se sincronizará automáticamente.
        </p>
      </div>

      <button type="submit" className={styles.submitBtn}>
        Crear billetera
      </button>
    </form>
  )
}

// ── BilleterasPage ─────────────────────────────────────────────────────────

export default function BilleterasPage() {
  const [billeteras, setBilleteras] = useState<Billetera[]>(MOCK_BILLETERAS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    if (drawerOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  function handleCreate(nueva: Billetera) {
    setBilleteras((prev) => {
      let updated = prev
      if (nueva.es_principal) {
        updated = prev.map((b) => ({ ...b, es_principal: false }))
      }
      return [...updated, nueva]
    })
    setDrawerOpen(false)
    setToast('Billetera creada. Cuando el backend esté disponible, se sincronizará automáticamente.')
  }

  const total = billeteras
    .filter((b) => b.moneda === 'ARS')
    .reduce((acc, b) => acc + b.saldo_actual, 0)

  return (
    <div className={styles.root}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Billeteras</h1>
          <p className={styles.pageSubtitle}>
            Total ARS: {fmtSaldo(total, 'ARS')}
          </p>
        </div>
        <button
          className={styles.newBtn}
          onClick={() => setDrawerOpen(true)}
        >
          <Plus size={18} strokeWidth={2} />
          <span>Nueva</span>
        </button>
      </div>

      {/* Cards grid */}
      {billeteras.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Wallet size={32} strokeWidth={1.5} />
          </div>
          <p className={styles.emptyTitle}>Sin billeteras</p>
          <p className={styles.emptySub}>Agregá tu primera billetera para empezar a registrar tus saldos.</p>
          <button className={styles.emptyBtn} onClick={() => setDrawerOpen(true)}>
            <Plus size={16} strokeWidth={2} />
            Agregar billetera
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {billeteras.map((b) => (
            <BilleteraCard key={b.id} billetera={b} />
          ))}
        </div>
      )}

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer / bottom sheet */}
      <div className={[styles.drawer, drawerOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}>
        <CreateForm onClose={() => setDrawerOpen(false)} onCreate={handleCreate} />
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
