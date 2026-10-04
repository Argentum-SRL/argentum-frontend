import React from 'react'
import { ArrowRightLeft, Search } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui'
import type { TransferenciaInterna, Billetera } from '@/types'
import TransferenciasFilterBar from './TransferenciasFilterBar'
import TransferenciaRow from './TransferenciaRow'
import { useTransferenciasFilters, getDayLabel } from './useTransferenciasFilters'
import styles from './TransferenciasTab.module.css'

interface TransferenciasTabProps {
  transferencias: TransferenciaInterna[]
  billeteras: Billetera[]
  loading: boolean
  onDelete: (id: string) => void
  onOpenTransferModal: () => void
}

export const TransferenciasTab: React.FC<TransferenciasTabProps> = ({
  transferencias,
  billeteras,
  loading,
  onDelete,
  onOpenTransferModal,
}) => {
  const {
    busqueda,
    setBusqueda,
    tipoOperacion,
    setTipoOperacion,
    billeteraId,
    setBilleteraId,
    periodoPreset,
    setPeriodoPreset,
    counts,
    hasActiveFilters,
    clearFilters,
    hasCicloConfigurado,
    gruposTransferencias,
  } = useTransferenciasFilters({
    transferencias,
    billeteras,
  })

  return (
    <div className={styles.container}>
      {/* ── Barra de Búsqueda y Segmentación (Estilo Transacciones) ── */}
      <TransferenciasFilterBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        tipoOperacion={tipoOperacion}
        onTipoOperacionChange={setTipoOperacion}
        billeteraId={billeteraId}
        onBilleteraChange={setBilleteraId}
        periodoPreset={periodoPreset}
        onPeriodoPresetChange={setPeriodoPreset}
        billeteras={billeteras}
        counts={counts}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        hasCicloConfigurado={hasCicloConfigurado}
      />

      {/* ── Estado de Carga / Vacío / Listado Agrupado ── */}
      {loading ? (
        <div className={styles.loadingState}>Cargando transferencias...</div>
      ) : transferencias.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="Transferir entre cuentas"
          description="Pasá saldo entre tus cuentas o registrá compra y venta de dólares de forma simple."
          actionLabel="Nueva transferencia"
          onActionClick={onOpenTransferModal}
        />
      ) : gruposTransferencias.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No encontramos transferencias"
          description="No hay movimientos que coincidan con la búsqueda o los filtros seleccionados."
          actionLabel="Limpiar filtros"
          onActionClick={clearFilters}
        />
      ) : (
        gruposTransferencias.map(([fecha, txs]) => (
          <div key={fecha} className={styles.dayGroupContainer}>
            <div className={styles.dayGroupHeader}>
              <h3 className={styles.dayGroupTitle}>{getDayLabel(fecha)}</h3>
            </div>
            <div className={styles.dayGroupList}>
              {txs.map((tx, idx) => {
                const orig = billeteras.find((b) => b.id === tx.billetera_origen_id)
                const dest = billeteras.find((b) => b.id === tx.billetera_destino_id)
                return (
                  <div
                    key={tx.id}
                    className={idx < txs.length - 1 ? styles.rowWrapperBorder : styles.rowWrapper}
                  >
                    <TransferenciaRow
                      transferencia={tx}
                      billeteraOrigen={orig}
                      billeteraDestino={dest}
                      onDelete={onDelete}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default TransferenciasTab
