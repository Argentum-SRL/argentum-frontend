import { useEffect, useRef, useState } from 'react'
import { Plus, Wallet, Banknote, X, Check } from 'lucide-react'
import styles from './BilleterasPage.module.css'
import billeteraService from '@/services/billetera.service'
import { useFinancial } from '@/hooks/useFinancial'

// ── Types ──────────────────────────────────────────────────────────────────

interface Billetera {
  id: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_actual: number
  saldo_inicial: number
  es_principal: boolean
  es_efectivo: boolean
  estado?: 'activa' | 'archivada'
}

// Billeteras reales serán cargadas desde la API

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

function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={[styles.toast, type === 'error' ? styles.toastError : ''].filter(Boolean).join(' ')}>
      {type === 'success' ? (
        <Check size={16} strokeWidth={2} className={styles.toastIcon} />
      ) : (
        <X size={16} strokeWidth={2} className={styles.toastIconError} />
      )}
      <span>{message}</span>
    </div>
  )
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
      <div className={styles.grid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${styles.skel} ${styles.skelCard}`} />
        ))}
      </div>
    </div>
  )
}

// ── Billetera card ─────────────────────────────────────────────────────────

function BilleteraCard({ billetera, onEdit, onArchiveToggle, onDelete }: { billetera: Billetera; onEdit: (b: Billetera) => void; onArchiveToggle: (b: Billetera) => void; onDelete: (id: string) => void }) {
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
      <div className={styles.cardActions}>
        <button type="button" className={styles.actionBtn} onClick={() => onEdit(billetera)}>Editar</button>
        <button type="button" className={styles.actionBtn} onClick={() => onArchiveToggle(billetera)}>
          {billetera.estado === 'archivada' ? 'Desarchivar' : 'Archivar'}
        </button>
        {!billetera.es_efectivo && (
          <button type="button" className={[styles.actionBtn, styles.actionBtnDanger].filter(Boolean).join(' ')} onClick={() => onDelete(billetera.id)}>Borrar</button>
        )}
      </div>
    </div>
  )
}

// ── Create form ────────────────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void
  onCreate: (payload: { nombre: string; moneda: 'ARS' | 'USD'; saldo_inicial: number; es_principal: boolean }) => Promise<void>
}

function CreateForm({ onClose, onCreate, initial, onSave }: CreateFormProps & { initial?: { nombre?: string; moneda?: 'ARS' | 'USD'; saldo_inicial?: number; es_principal?: boolean; es_efectivo?: boolean }; onSave?: (payload: { nombre: string; moneda: 'ARS' | 'USD'; saldo_inicial: number; es_principal: boolean }) => Promise<void> }) {
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [saldo, setSaldo] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [esEfectivo, setEsEfectivo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nombreRef.current?.focus()
  }, [])

  // Sync initial props in render
  const [prevInitial, setPrevInitial] = useState(initial)
  if (initial !== prevInitial) {
    setPrevInitial(initial)
    if (initial) {
      if (initial.nombre) setNombre(initial.nombre)
      if (initial.moneda) setMoneda(initial.moneda)
      if (typeof initial.saldo_inicial === 'number') setSaldo(String(initial.saldo_inicial))
      if (typeof initial.es_principal === 'boolean') setEsPrincipal(initial.es_principal)
      if (typeof initial.es_efectivo === 'boolean') setEsEfectivo(initial.es_efectivo)
    } else {
      setNombre('')
      setMoneda('ARS')
      setSaldo('')
      setEsPrincipal(false)
      setEsEfectivo(false)
    }
  }

  function handleSaldoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setSaldo(raw)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    const saldoNum = parseFloat(saldo) || 0
    try {
      if (onSave) {
        await onSave({ nombre: nombre.trim(), moneda, saldo_inicial: saldoNum, es_principal: esPrincipal })
      } else {
        await onCreate({ nombre: nombre.trim(), moneda, saldo_inicial: saldoNum, es_principal: esPrincipal })
      }
      onClose()
    } catch (err: unknown) {
      setError('No se pudo guardar la billetera. Intentá de nuevo.')
      throw err
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <p className={styles.formTitle}>{onSave ? 'Editar billetera' : 'Nueva billetera'}</p>
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
              disabled={esEfectivo}
              className={[styles.monedaPill, moneda === m ? styles.monedaPillActive : '', esEfectivo ? styles.monedaPillDisabled : ''].filter(Boolean).join(' ')}
              onClick={() => setMoneda(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {!onSave && (
        <div className={styles.formField}>
          <label className={styles.formLabel}>Saldo inicial <span className={styles.optional}>(opcional)</span></label>
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
      )}

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          disabled={esEfectivo}
          className={styles.checkInput}
          checked={esPrincipal}
          onChange={(e) => setEsPrincipal(e.target.checked)}
        />
        <span className={[styles.checkLabel, esEfectivo ? styles.checkLabelDisabled : ''].filter(Boolean).join(' ')}>Marcar como billetera principal</span>
      </label>

      <div className={styles.infoBox}>
        <p className={styles.infoText}>
          {onSave ? 'Los cambios se guardarán en tu cuenta.' : 'El saldo inicial se utiliza para establecer el balance de apertura de esta billetera.'}
        </p>
      </div>

      <button type="submit" className={styles.submitBtn}>
        {onSave ? 'Guardar cambios' : 'Crear billetera'}
      </button>
    </form>
  )
}

// ── BilleterasPage ─────────────────────────────────────────────────────────

export default function BilleterasPage() {
  const { billeteras, isLoading, setBilleteras } = useFinancial()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Billetera | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    if (drawerOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  async function handleCreate(payload: { nombre: string; moneda: 'ARS' | 'USD'; saldo_inicial: number; es_principal: boolean }) {
    try {
      const created = await billeteraService.create(payload)
      const parsed = { ...created, saldo_actual: Number(created.saldo_actual), saldo_inicial: Number(created.saldo_inicial) }
      setBilleteras((prev) => {
        let updated = prev
        if (parsed.es_principal) {
          updated = prev.map((b) => ({ ...b, es_principal: false }))
        }
        return [...updated, parsed]
      })
      setToast({ msg: 'Billetera creada correctamente', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ msg: 'Error al crear billetera', type: 'error' })
      throw err
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmás que querés eliminar esta billetera? Esta acción no se puede deshacer.')) return
    try {
      await billeteraService.remove(id)
      setBilleteras((prev) => prev.filter((b) => b.id !== id))
      setToast({ msg: 'Billetera eliminada', type: 'success' })
    } catch (err: unknown) {
      console.error(err)
      const errorData = err as { response?: { data?: { detail?: string } } }
      const detail = errorData.response?.data?.detail
      
      // LOGICA DE TRANSACCIONES ASOCIADAS:
      // Si el backend detecta transacciones, informamos al usuario que debe archivar.
      // Esto previene que se pierda el historial financiero en el futuro módulo de transacciones.
      if (detail && detail.includes('transacciones')) {
        setToast({ 
          msg: detail, 
          type: 'error' 
        })
      } else {
        setToast({ msg: 'Error al eliminar billetera', type: 'error' })
      }
    }
  }

  async function handleArchiveToggle(b: Billetera) {
    try {
      if (b.estado === 'archivada') {
        const res = await billeteraService.desarchivar(b.id)
        const parsed = { ...res, saldo_actual: Number(res.saldo_actual), saldo_inicial: Number(res.saldo_inicial) }
        setBilleteras((prev) => prev.map((x) => x.id === parsed.id ? parsed : x))
        setToast({ msg: 'Billetera desarchivada', type: 'success' })
      } else {
        const res = await billeteraService.archivar(b.id)
        const parsed = { ...res, saldo_actual: Number(res.saldo_actual), saldo_inicial: Number(res.saldo_inicial) }
        setBilleteras((prev) => prev.map((x) => x.id === parsed.id ? parsed : x))
        setToast({ msg: 'Billetera archivada', type: 'success' })
      }
    } catch (err) {
      console.error(err)
      setToast({ msg: 'Error actualizando estado', type: 'error' })
    }
  }

  function handleEdit(b: Billetera) {
    setEditTarget(b)
    setDrawerOpen(true)
  }

  async function handleSave(payload: { nombre: string; moneda: 'ARS' | 'USD'; saldo_inicial: number; es_principal: boolean }) {
    if (!editTarget) return
    try {
      const res = await billeteraService.update(editTarget.id, payload)
      const parsed = { ...res, saldo_actual: Number(res.saldo_actual), saldo_inicial: Number(res.saldo_inicial) }
      setBilleteras((prev) => prev.map((x) => x.id === parsed.id ? parsed : x))
      setToast({ msg: 'Billetera actualizada', type: 'success' })
      setEditTarget(null)
      setDrawerOpen(false)
    } catch (err) {
      console.error(err)
      setToast({ msg: 'Error actualizando billetera', type: 'error' })
      throw err
    }
  }

  const total = billeteras
    .filter((b) => b.moneda === 'ARS' && b.estado !== 'archivada')
    .reduce((acc, b) => acc + b.saldo_actual, 0)

  if (isLoading && billeteras.length === 0) return <Skeleton />

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
        <div className={styles.headerActions}>
          <button type="button" className={styles.archivedToggle} onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? 'Ocultar archivadas' : `Archivadas (${billeteras.filter((b) => b.estado === 'archivada').length})`}
          </button>
          <button
            className={styles.newBtn}
            onClick={() => { setEditTarget(null); setDrawerOpen(true); setShowArchived(false) }}
          >
            <Plus size={18} strokeWidth={2} />
            <span>Nueva</span>
          </button>
        </div>
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
            {billeteras.filter((b) => showArchived ? b.estado === 'archivada' : b.estado !== 'archivada').map((b) => (
              <BilleteraCard
                key={b.id}
                billetera={b}
                onEdit={handleEdit}
                onArchiveToggle={handleArchiveToggle}
                onDelete={b.es_efectivo ? () => {} : handleDelete}
              />
            ))}
          </div>
      )}

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer / bottom sheet */}
      <div className={[styles.drawer, drawerOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}>
        {editTarget ? (
          <CreateForm
            onClose={() => { setDrawerOpen(false); setEditTarget(null) }}
            initial={{ 
              nombre: editTarget.nombre, 
              moneda: editTarget.moneda, 
              saldo_inicial: editTarget.saldo_inicial, 
              es_principal: editTarget.es_principal,
              es_efectivo: editTarget.es_efectivo
            }}
            onCreate={handleCreate}
            onSave={handleSave}
          />
        ) : (
          <CreateForm onClose={() => setDrawerOpen(false)} onCreate={handleCreate} />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
