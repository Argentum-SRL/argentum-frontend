import { useRef } from 'react'
import { formatMonto } from '@/utils/format'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { useDebitoEnDolares } from './useDebitoEnDolares'
import styles from './DebitoEnDolares.module.css'

interface DebitoEnDolaresProps {
  montoUsd: number | null
  montoPesos: number | null
  billeteraNombre?: string
  descripcion?: string
  categoriaNombre?: string
  onChangeMontoPesos: (monto: number | null) => void
  autoFocus?: boolean
}

export function DebitoEnDolares({
  montoUsd,
  montoPesos,
  billeteraNombre,
  onChangeMontoPesos,
  autoFocus = false,
}: DebitoEnDolaresProps) {
  const prevMontoUsdRef = useRef(montoUsd)

  const { cotizacion, cotizacionTarjeta, percepcion, montoPesosSugerido, loading, sinCotizacion } = useDebitoEnDolares({
    montoUsd,
    enabled: Boolean(montoUsd && montoUsd > 0),
    onMontoPesosCalculado: (sugerido) => {
      // Si el monto USD cambió o si todavía no hay monto en pesos asignado, aplicar sugerido
      if (montoUsd !== prevMontoUsdRef.current || montoPesos === null || montoPesos === 0) {
        prevMontoUsdRef.current = montoUsd
        onChangeMontoPesos(sugerido)
      }
    },
  })

  const esMontoSugerido =
    montoPesosSugerido != null && montoPesos === montoPesosSugerido

  const handleRestablecerSugerido = () => {
    if (montoPesosSugerido != null) {
      onChangeMontoPesos(montoPesosSugerido)
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. Encabezado limpio con contexto y estado */}
      <div className={styles.headerRow}>
        <div className={styles.labelGroup}>
          <span className={styles.fieldLabel}>Monto debitado en pesos</span>
          {billeteraNombre && (
            <span className={styles.walletHint}>
              en {billeteraNombre}
            </span>
          )}
        </div>

        {montoPesosSugerido != null && (
          <span
            className={esMontoSugerido ? styles.badgeSugerido : styles.badgeModificado}
            title={esMontoSugerido ? 'Monto calculado según la cotización oficial de hoy' : 'Monto editado manualmente'}
          >
            {esMontoSugerido ? 'Sugerido automático' : 'Modificado'}
          </span>
        )}
      </div>

      {/* 2. Tarjeta unificada: MontoInput arriba + Detalle de conversión abajo */}
      <div className={styles.unifiedCard}>
        {/* Entrada principal del monto en pesos */}
        <div className={styles.inputArea}>
          <MontoInput
            value={montoPesos}
            onChange={onChangeMontoPesos}
            moneda="ARS"
            placeholder="0"
            autoFocus={autoFocus}
            allowDecimals={false}
            className={styles.montoOverride}
          />
        </div>

        <div className={styles.cardDivider} />

        {/* Explicación de cómo se calcula este monto */}
        <div className={styles.calculationArea}>
          {loading ? (
            <div className={styles.loadingRow}>
              <span className={styles.pulseDot} />
              <span>Calculando cotización estimada de hoy...</span>
            </div>
          ) : cotizacion != null && cotizacionTarjeta != null ? (
            <div className={styles.calcBody}>
              <div className={styles.formulaRow}>
                <div className={styles.formulaText}>
                  <span>
                    <strong>US$ {montoUsd}</strong> × <strong>{formatMonto(cotizacionTarjeta)}</strong>
                  </span>
                  <span className={styles.formulaTag}>dólar tarjeta</span>
                </div>

                {!esMontoSugerido && montoPesosSugerido != null && (
                  <button
                    type="button"
                    className={styles.resetBtn}
                    onClick={handleRestablecerSugerido}
                  >
                    ↺ Volver al sugerido ({formatMonto(montoPesosSugerido)})
                  </button>
                )}
              </div>

              <div className={styles.rateDetailRow}>
                <span>
                  Oficial <strong>{formatMonto(cotizacion)}</strong> + <strong>{percepcion}%</strong> de percepción
                </span>
              </div>

              <p className={styles.disclaimerText}>
                Precompletamos el monto con la cotización estimada de hoy. Podés ajustarlo si en tu banco figura otro valor.
              </p>
            </div>
          ) : (
            <div className={styles.fallbackRow}>
              <span>
                {sinCotizacion
                  ? 'No pudimos obtener la cotización oficial de hoy. Ingresá el monto que figura en tu homebanking.'
                  : 'Ingresá el importe en pesos que te debitó el banco.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DebitoEnDolares
