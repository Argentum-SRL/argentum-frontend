import { useState, useEffect, useCallback } from 'react'
import { X, Check } from 'lucide-react'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials, parseSaldoInput, formatSaldoInput } from '@/lib/utils/billeteras.utils'
import type { BankDefinition } from '@/lib/constants/banks'
import styles from './BankPickerModal.module.css'

export interface EditPayload {
  nombre: string
  saldo_inicial: number
  es_principal: boolean
}

interface EditBilleteraModalProps {
  isOpen: boolean
  onClose: () => void
  onEditar: (id: string, payload: EditPayload) => Promise<void>
  billetera: Billetera | null
  billeteraPrincipalActual: Billetera | undefined
}

function EditLogo({ bank, customNombre }: { bank?: BankDefinition, customNombre?: string }) {
  const [hasError, setHasError] = useState(false)
  const url = bank ? getBankLogoUrl(bank.logoPath) : ''

  const bg = bank ? `${bank.colorPrimario}22` : '#8A95A822'
  const color = bank ? bank.colorPrimario : '#8A95A8'

  if (bank && url && !hasError) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src={url} alt={bank.nombre} width={22} height={22} style={{ objectFit: 'contain' }} onError={() => setHasError(true)} />
      </div>
    )
  }

  const init = getInitials(bank ? bank.nombre : (customNombre || 'Mi'))
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{init}</span>
    </div>
  )
}

export default function EditBilleteraModal({
  isOpen,
  onClose,
  onEditar,
  billetera,
  billeteraPrincipalActual,
}: EditBilleteraModalProps) {
  const [nombre, setNombre] = useState('')
  const [saldoRaw, setSaldoRaw] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && billetera) {
      setNombre(billetera.nombre)
      setSaldoRaw(billetera.saldo_inicial ? formatSaldoInput(billetera.saldo_inicial) : '')
      setEsPrincipal(billetera.es_principal)
    }
  }, [isOpen, billetera])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !billetera) return null

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.,]/g, '')
    setSaldoRaw(raw)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onEditar(billetera.id, {
        nombre: nombre.trim(),
        saldo_inicial: parseSaldoInput(saldoRaw),
        es_principal: esPrincipal,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const bank = billetera.bank_id
    ? getBankById(billetera.bank_id)
    : !billetera.es_efectivo
      ? findBankByNombre(billetera.nombre)
      : undefined

  const muestraAdvertencia = esPrincipal && !billetera.es_principal && billeteraPrincipalActual

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Editar billetera"
    >
      <div className={styles.modal} style={{ height: 'auto', minHeight: 'auto', maxHeight: '90dvh' }}>
        <form onSubmit={handleSubmit} className={styles.formContainer} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div className={styles.formHeader}>
            <div className={styles.bankPreview} style={{ marginLeft: 0 }}>
              <EditLogo bank={bank} customNombre={billetera.nombre} />
              <div className={styles.bankPreviewInfo}>
                <p className={styles.bankPreviewNombre}>Editar Billetera</p>
                <p className={styles.bankPreviewTipo}>{billetera.nombre}</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          <div className={styles.formBody} style={{ overflowY: 'auto' }}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="edit-nombre">
                Nombre
              </label>
              <input
                id="edit-nombre"
                type="text"
                className={styles.fieldInput}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de tu billetera"
                required
                autoFocus
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="edit-saldo">
                Saldo inicial
              </label>
              <div className={styles.saldoWrap}>
                <span className={styles.saldoPrefix}>
                  {billetera.moneda === 'ARS' ? '$' : 'USD'}
                </span>
                <input
                  id="edit-saldo"
                  type="text"
                  inputMode="decimal"
                  className={styles.saldoInput}
                  value={saldoRaw}
                  onChange={handleSaldoChange}
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="button"
              className={styles.principalRow}
              onClick={() => setEsPrincipal((p) => !p)}
              role="checkbox"
              aria-checked={esPrincipal}
            >
              <div className={`${styles.checkbox} ${esPrincipal ? styles.checkboxActive : ''}`}>
                {esPrincipal && <Check size={11} strokeWidth={3} color="white" />}
              </div>
              <div className={styles.principalInfo}>
                <span className={styles.principalLabel}>Marcar como principal</span>
                <span className={styles.principalSub}>
                  Se usa por defecto al registrar transacciones
                </span>
              </div>
            </button>

            {muestraAdvertencia && (
              <div className={styles.warningBox}>
                <span className={styles.warningIcon}>⚠️</span>
                <p className={styles.warningText}>
                  Esto va a quitar el estado principal de{' '}
                  <strong>{billeteraPrincipalActual?.nombre}</strong>.
                </p>
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.crearBtn}
              disabled={!nombre.trim() || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
