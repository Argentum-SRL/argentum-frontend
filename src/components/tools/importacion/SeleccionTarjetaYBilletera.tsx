import React, { useEffect } from 'react'
import { SelectInput } from '@/components/ui'
import type { TarjetaCredito, Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import styles from './ImportacionResumenSection.module.css'

interface SeleccionTarjetaYBilleteraProps {
  tarjetas: TarjetaCredito[]
  billeteras: Billetera[]
  selectedTarjetaId: string
  selectedBilleteraId: string
  onChangeTarjetaId: (id: string) => void
  onChangeBilleteraId: (id: string) => void
}

export const SeleccionTarjetaYBilletera: React.FC<SeleccionTarjetaYBilleteraProps> = ({
  tarjetas,
  billeteras,
  selectedTarjetaId,
  selectedBilleteraId,
  onChangeTarjetaId,
  onChangeBilleteraId,
}) => {
  const activeTarjetas = tarjetas.filter(t => t.estado === 'activa')
  const activeArsBilleteras = billeteras.filter(b => b.estado === 'activa' && b.moneda === 'ARS')

  // Aplicar preselección automática si no hay valores seleccionados
  useEffect(() => {
    if (!selectedTarjetaId && activeTarjetas.length > 0) {
      onChangeTarjetaId(activeTarjetas[0].id)
    }
  }, [selectedTarjetaId, activeTarjetas, onChangeTarjetaId])

  useEffect(() => {
    if (!selectedBilleteraId && activeArsBilleteras.length > 0) {
      // Priorización "best wallet" adaptada a ARS:
      // 1. Principal con saldo > 0
      // 2. Cualquier otra con saldo > 0
      // 3. Principal (aunque sea 0)
      // 4. La primera activa que haya
      const best = activeArsBilleteras.find(b => b.es_principal && b.saldo_actual > 0) ||
        activeArsBilleteras.find(b => b.saldo_actual > 0) ||
        activeArsBilleteras.find(b => b.es_principal) ||
        activeArsBilleteras[0]

      if (best) {
        onChangeBilleteraId(best.id)
      }
    }
  }, [selectedBilleteraId, activeArsBilleteras, onChangeBilleteraId])

  // Opciones formateadas para los SelectInput
  const optionsTarjetas = activeTarjetas.map(t => ({
    value: t.id,
    label: `${t.nombre} (${t.moneda})`,
  }))

  const optionsBilleteras = activeArsBilleteras.map(b => ({
    value: b.id,
    label: `${b.nombre} - Saldo: ${formatMonto(b.saldo_actual, b.moneda)}`,
  }))

  return (
    <div className={styles.selectGrid}>
      <div className={styles.formField}>
        <SelectInput
          id="select-tarjeta"
          label="Tarjeta de Crédito del Resumen"
          placeholder="Seleccioná una tarjeta..."
          value={selectedTarjetaId}
          onChange={onChangeTarjetaId}
          options={optionsTarjetas}
        />
      </div>

      <div className={styles.formField}>
        <SelectInput
          id="select-billetera"
          label="Billetera de Pago (ARS)"
          placeholder="Seleccioná la billetera de débito..."
          value={selectedBilleteraId}
          onChange={onChangeBilleteraId}
          options={optionsBilleteras}
        />
      </div>
    </div>
  )
}

export default SeleccionTarjetaYBilletera
