import SegmentedControl from '@/components/ui/SegmentedControl'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { DateInput } from '@/components/ui'
import { formatMonto } from '@/utils/format'
import { BadgePercent } from 'lucide-react'
import type { useReintegro } from './useReintegro'
import styles from './ReintegroBloque.module.css'

function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
}

export interface ReintegroSwitchCardProps {
  tieneReintegro: boolean
  onToggle: () => void
  disabled?: boolean
}

/**
 * Switch Card oficial con dimensiones exactas a las de Billetera (BankPickerModal)
 */
export function ReintegroSwitchCard({ tieneReintegro, onToggle, disabled }: ReintegroSwitchCardProps) {
  return (
    <button
      type="button"
      className={`${styles.settingCard} ${styles.settingCardClickable} ${
        tieneReintegro ? styles.settingCardActiveGreen : ''
      }`}
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={tieneReintegro}
      aria-label="Me devolvieron plata (reintegro o devolución)"
    >
      <div
        className={`${styles.settingIconBox} ${
          tieneReintegro ? styles.iconBoxGreen : styles.iconBoxDefault
        }`}
      >
        <BadgePercent size={18} strokeWidth={2} />
      </div>

      <div className={styles.settingInfo}>
        <div className={styles.settingLabelRow}>
          <span className={styles.settingLabel}>Me devolvieron plata (reintegro o devolución)</span>
          {tieneReintegro && <span className={styles.badgePillGreen}>Activo</span>}
        </div>
        <span className={styles.settingSub}>
          {tieneReintegro
            ? 'Se registrará para esta compra'
            : 'Activalo si tenés una promoción o te devolvieron la compra'}
        </span>
      </div>

      <div
        className={`${styles.customSwitch} ${tieneReintegro ? styles.switchActiveGreen : ''}`}
        aria-hidden="true"
      >
        <div
          className={`${styles.customSwitchThumb} ${
            tieneReintegro ? styles.switchThumbActive : ''
          }`}
        />
      </div>
    </button>
  )
}

export interface ReintegroBloqueProps {
  reintegro: ReturnType<typeof useReintegro>
  isEdit: boolean
  onToggleOff?: () => void
}

export function ReintegroBloque({ reintegro, isEdit, onToggleOff }: ReintegroBloqueProps) {
  const {
    tieneReintegro,
    setTieneReintegro,
    modoMonto,
    setModoMonto,
    montoManual,
    setMontoManual,
    porcentaje,
    setPorcentaje,
    yaRecibido,
    setYaRecibido,
    fechaRecibido,
    setFechaRecibido,
    montoCalculadoPorcentaje,
    isCompraRecibida,
    reintegroExistente,
    isQuitting,
    quitarReintegroInmediato,
    moneda,
    montoCompra,
  } = reintegro

  const handleToggle = () => {
    if (isCompraRecibida && reintegroExistente && tieneReintegro) {
      quitarReintegroInmediato()
      onToggleOff?.()
    } else {
      const next = !tieneReintegro
      setTieneReintegro(next)
      if (!next && onToggleOff) {
        onToggleOff()
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Tarjeta con switch estilo iOS en la solapa de configuración */}
      <ReintegroSwitchCard
        tieneReintegro={tieneReintegro}
        onToggle={handleToggle}
      />

      {/* Contenido con el switch activado */}
      {tieneReintegro && (
        <div className={styles.bloqueCampos}>
          {isCompraRecibida && reintegroExistente ? (
            /* Al EDITAR una compra recibida: texto y botón para quitar reintegro */
            <div className={styles.recibidoCard}>
              <span className={styles.recibidoTexto}>
                Te devolvieron {formatMonto(reintegroExistente.monto, moneda)} el{' '}
                {formatDDMM(reintegroExistente.fecha_recibido)}.
              </span>
              <button
                type="button"
                className={styles.quitarBtn}
                onClick={async () => {
                  await quitarReintegroInmediato()
                  onToggleOff?.()
                }}
                disabled={isQuitting}
              >
                {isQuitting ? 'Quitando...' : 'Quitar reintegro'}
              </button>
            </div>
          ) : (
            <>
              {/* ¿Cuánto te devuelven? */}
              <div className={styles.preguntaGrupo}>
                <label className={styles.preguntaLabel}>¿Cuánto te devuelven?</label>
                <SegmentedControl<'monto' | 'porcentaje' | 'todo'>
                  ariaLabel="¿Cuánto te devuelven?"
                  fullWidth
                  value={modoMonto}
                  onChange={setModoMonto}
                  options={[
                    { value: 'monto', label: 'Monto' },
                    { value: 'porcentaje', label: 'Porcentaje' },
                    { value: 'todo', label: 'Todo' },
                  ]}
                />
                {modoMonto === 'todo' ? (
                  montoCompra != null && (
                    <div className={styles.porcentajeWrapper}>
                      <span className={styles.sonMontoTexto}>
                        Son{' '}
                        <strong className={styles.sonMontoValor}>
                          {formatMonto(montoCompra, moneda)}
                        </strong>
                      </span>
                    </div>
                  )
                ) : modoMonto === 'monto' ? (
                  <MontoInput
                    value={montoManual}
                    onChange={setMontoManual}
                    moneda={moneda}
                    placeholder="0"
                    allowDecimals={true}
                  />
                ) : (
                  <div className={styles.porcentajeWrapper}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={porcentaje ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value)
                        setPorcentaje(val)
                      }}
                      placeholder="Ej: 25"
                      className={styles.porcentajeInput}
                    />
                    {montoCalculadoPorcentaje != null && (
                      <span className={styles.sonMontoTexto}>
                        Son{' '}
                        <strong className={styles.sonMontoValor}>
                          {formatMonto(montoCalculadoPorcentaje, moneda)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ¿Ya te lo devolvieron? */}
              <div className={styles.preguntaGrupo}>
                <label className={styles.preguntaLabel}>¿Ya te lo devolvieron?</label>
                <SegmentedControl<'si' | 'no'>
                  ariaLabel="¿Ya te lo devolvieron?"
                  fullWidth
                  value={yaRecibido ? 'si' : 'no'}
                  onChange={(val) => setYaRecibido(val === 'si')}
                  options={[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'Todavía no' },
                  ]}
                />
              </div>

              {/* Al EDITAR una compra pendiente y elegir "Sí": aparece DateInput "¿Cuándo llegó?" con hoy por defecto */}
              {isEdit && yaRecibido && (
                <div className={styles.preguntaGrupo}>
                  <label className={styles.preguntaLabel}>¿Cuándo llegó?</label>
                  <DateInput
                    id="reintegro-fecha-llegada"
                    value={fechaRecibido}
                    onChange={setFechaRecibido}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ReintegroBloque
