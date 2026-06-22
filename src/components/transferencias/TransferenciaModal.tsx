import React, { useState } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera } from '@/types'
import transferenciaService from '@/services/transferencia.service'
import { useToast } from '@/hooks/useToast'
import styles from './TransferenciaModal.module.css'
import { DateInput, SelectInput } from '@/components/ui'

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  billeteras: Billetera[]
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const TransferenciaModal: React.FC<TransferenciaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  billeteras
}) => {
  const { showToast } = useToast()

  const [billeteraOrigenId, setBilleteraOrigenId] = useState('')
  const [billeteraDestinoId, setBilleteraDestinoId] = useState('')
  const [monto, setMonto] = useState<number | ''>('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [fecha, setFecha] = useState(todayLocal())
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMonedaToggle = () => {
    const nextMoneda = moneda === 'ARS' ? 'USD' : 'ARS'
    setMoneda(nextMoneda)
    setBilleteraOrigenId('')
    setBilleteraDestinoId('')
  }

  const activeWalletsOfCurrency = billeteras.filter(b => b.estado === 'activa' && b.moneda === moneda)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!billeteraOrigenId) {
      showToast('Seleccioná la cuenta de origen', 'error')
      return
    }
    if (!billeteraDestinoId) {
      showToast('Seleccioná la cuenta de destino', 'error')
      return
    }
    if (billeteraOrigenId === billeteraDestinoId) {
      showToast('La cuenta de origen y destino no pueden ser la misma', 'error')
      return
    }
    if (monto === '' || isNaN(monto) || monto <= 0) {
      showToast('Ingresá un monto mayor a 0', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await transferenciaService.createTransferencia({
        billetera_origen_id: billeteraOrigenId,
        billetera_destino_id: billeteraDestinoId,
        monto: Number(monto),
        moneda,
        fecha: fecha,
        notas: notas.trim() || null
      })

      showToast('Transferencia realizada con éxito', 'success')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al procesar la transferencia.'
      showToast(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const flags: Record<'ARS' | 'USD', string> = {
    ARS: '🇦🇷',
    USD: '🇺🇸'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Transferencia interna">
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <h2 className={styles.headerTitle}>Pasar plata entre cuentas</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className={styles.formBody}>
          {/* Monto e Indicador de Moneda */}
          <div className={styles.montoHero}>
            <button
              type="button"
              className={styles.monedaToggleChip}
              onClick={handleMonedaToggle}
              title={`Alternar moneda (actual: ${moneda})`}
            >
              <span className={styles.monedaChipFlag}>{flags[moneda]}</span>
              <span className={styles.monedaChipLabel}>{moneda}</span>
            </button>
            <div className={styles.montoDivider} />
            <div className={styles.montoHeroInput}>
              <span className={styles.montoHeroPrefix}>$</span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                className={styles.montoHeroField}
                value={monto}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setMonto(val)
                }}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Billetera Origen */}
          <SelectInput
            id="tf-origen"
            label="Desde (Cuenta origen)"
            placeholder="-- Seleccioná cuenta de origen --"
            value={billeteraOrigenId}
            onChange={setBilleteraOrigenId}
            options={activeWalletsOfCurrency
              .filter(b => b.id !== billeteraDestinoId)
              .map(b => ({
                value: b.id,
                label: `${b.nombre} (${moneda} ${b.saldo_actual.toLocaleString('es-AR')})`
              }))}
          />

          {/* Billetera Destino */}
          <SelectInput
            id="tf-destino"
            label="Hacia (Cuenta destino)"
            placeholder="-- Seleccioná cuenta de destino --"
            value={billeteraDestinoId}
            onChange={setBilleteraDestinoId}
            options={activeWalletsOfCurrency
              .filter(b => b.id !== billeteraOrigenId)
              .map(b => ({
                value: b.id,
                label: `${b.nombre} (${moneda} ${b.saldo_actual.toLocaleString('es-AR')})`
              }))}
          />

          {/* Fecha */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="tf-fecha">Fecha</label>
            <DateInput
              id="tf-fecha"
              className={styles.fieldInput}
              value={fecha}
              onChange={(val) => setFecha(val)}
              required
            />
          </div>

          {/* Notas */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="tf-notas">
              Notas <span className={styles.fieldOptional}>(opcional)</span>
            </label>
            <textarea
              id="tf-notas"
              className={`${styles.fieldInput} ${styles.notesTextarea}`}
              placeholder="Ej: Traspaso de fondos..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            <ArrowRightLeft size={16} />
            {isSubmitting ? 'Procesando...' : 'Pasar plata'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default TransferenciaModal
