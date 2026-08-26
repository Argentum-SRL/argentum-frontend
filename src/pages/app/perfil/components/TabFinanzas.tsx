import React, { useState } from 'react'
import { Coins, Calendar, Save, Check } from 'lucide-react'
import type { Usuario } from '@/types'
import usuarioService from '@/services/usuario.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { SelectInput, type SelectOption } from '@/components/ui'
import styles from '../PerfilPage.module.css'

interface TabFinanzasProps {
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
}

const OPCIONES_REGLA_CICLO: SelectOption[] = [
  { value: '', label: 'Seleccionar regla...' },
  { value: 'primer_lunes', label: 'Primer Lunes de cada mes' },
  { value: 'primer_martes', label: 'Primer Martes de cada mes' },
  { value: 'primer_miercoles', label: 'Primer Miércoles de cada mes' },
  { value: 'primer_jueves', label: 'Primer Jueves de cada mes' },
  { value: 'primer_viernes', label: 'Primer Viernes de cada mes' },
  { value: 'ultimo_lunes', label: 'Último Lunes de cada mes' },
  { value: 'ultimo_martes', label: 'Último Martes de cada mes' },
  { value: 'ultimo_miercoles', label: 'Último Miércoles de cada mes' },
  { value: 'ultimo_jueves', label: 'Último Jueves de cada mes' },
  { value: 'ultimo_viernes', label: 'Último Viernes de cada mes' },
]

const OPCIONES_TIPO_DOLAR: { value: string; label: string; desc: string }[] = [
  { value: 'blue', label: 'Dólar Blue', desc: 'Cotización informal de mercado libre' },
  { value: 'mep', label: 'Dólar MEP / Bolsa', desc: 'Cotización financiera mediante bonos' },
  { value: 'oficial', label: 'Dólar Oficial (BNA)', desc: 'Cotización formal del Banco Nación' },
  { value: 'tarjeta', label: 'Dólar Tarjeta', desc: 'Oficial + impuestos para consumos del exterior' },
]

export const TabFinanzas: React.FC<TabFinanzasProps> = ({ usuario, updateUsuario }) => {
  const { showToast } = useToast()

  // Currency form
  const [monedaPrincipal, setMonedaPrincipal] = useState<'ARS' | 'USD'>(
    (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'
  )
  const [monedaSecundariaActiva, setMonedaSecundariaActiva] = useState(
    !!usuario?.moneda_secundaria_activa
  )
  const [tipoDolar, setTipoDolar] = useState(usuario?.tipo_dolar || 'blue')
  const [isSavingMoneda, setIsSavingMoneda] = useState(false)

  // Cycle form
  const [cicloTipo, setCicloTipo] = useState<'dia_fijo' | 'regla'>(
    (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo'
  )
  const [cicloValor, setCicloValor] = useState(usuario?.ciclo_valor || '1')
  const [isSavingCiclo, setIsSavingCiclo] = useState(false)

  const handleSaveMoneda = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingMoneda(true)
    try {
      const updated = await usuarioService.actualizarMoneda({
        moneda_principal: monedaPrincipal,
        moneda_secundaria_activa: monedaSecundariaActiva,
        tipo_dolar: tipoDolar,
      })
      updateUsuario(updated)
      showToast('Preferencias de moneda actualizadas correctamente', 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No se pudo actualizar la configuración de moneda.'), 'error')
    } finally {
      setIsSavingMoneda(false)
    }
  }

  const handleSaveCiclo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingCiclo(true)
    try {
      const updated = await usuarioService.actualizarCicloFinanciero({
        ciclo_tipo: cicloTipo,
        ciclo_valor: cicloValor,
      })
      updateUsuario(updated)
      showToast('Ciclo contable actualizado correctamente', 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No se pudo actualizar el ciclo contable.'), 'error')
    } finally {
      setIsSavingCiclo(false)
    }
  }

  return (
    <div className={styles.tabGrid}>
      {/* 1. Configuración de Moneda */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Coins size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Moneda & Divisas</h3>
            <p>Elegí la moneda base de tus balances y la cotización para conversiones</p>
          </div>
        </div>

        <form onSubmit={handleSaveMoneda} className={styles.formInsideCard}>
          {/* Selector Moneda Principal */}
          <div className={styles.formGroup}>
            <label className={styles.formGroupLabel}>Moneda Principal</label>
            <div className={styles.currencySelectGrid}>
              <button
                type="button"
                className={`${styles.currencyOptionCard} ${
                  monedaPrincipal === 'ARS' ? styles.currencySelected : ''
                }`}
                onClick={() => setMonedaPrincipal('ARS')}
              >
                <div className={styles.currencyTop}>
                  <span className={styles.currencyCode}>ARS ($)</span>
                  {monedaPrincipal === 'ARS' && <Check size={16} className={styles.checkIcon} />}
                </div>
                <span className={styles.currencyName}>Peso Argentino</span>
              </button>

              <button
                type="button"
                className={`${styles.currencyOptionCard} ${
                  monedaPrincipal === 'USD' ? styles.currencySelected : ''
                }`}
                onClick={() => setMonedaPrincipal('USD')}
              >
                <div className={styles.currencyTop}>
                  <span className={styles.currencyCode}>USD (US$)</span>
                  {monedaPrincipal === 'USD' && <Check size={16} className={styles.checkIcon} />}
                </div>
                <span className={styles.currencyName}>Dólar Estadounidense</span>
              </button>
            </div>
          </div>

          {/* Toggle Moneda Secundaria */}
          <div className={styles.featureToggleRow}>
            <div className={styles.featureToggleInfo}>
              <span className={styles.featureToggleTitle}>Activar Moneda Secundaria</span>
              <span className={styles.featureToggleDesc}>
                Permite registrar transacciones y visualizar balances duales en ARS y USD
              </span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={monedaSecundariaActiva}
                onChange={(e) => setMonedaSecundariaActiva(e.target.checked)}
                aria-label="Activar moneda secundaria"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {/* Tipo de Dólar (si está activa la moneda secundaria) */}
          {monedaSecundariaActiva && (
            <div className={styles.tipoDolarSection}>
              <label className={styles.formGroupLabel}>Cotización de referencia para Dólar</label>
              <div className={styles.dolarOptionsGrid}>
                {OPCIONES_TIPO_DOLAR.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.dolarOptionCard} ${
                      tipoDolar === opt.value ? styles.dolarOptionSelected : ''
                    }`}
                    onClick={() => setTipoDolar(opt.value)}
                  >
                    <div className={styles.dolarTop}>
                      <span className={styles.dolarTitle}>{opt.label}</span>
                      {tipoDolar === opt.value && <Check size={14} className={styles.checkIcon} />}
                    </div>
                    <span className={styles.dolarDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.cardFooterActions}>
            <button
              type="submit"
              disabled={isSavingMoneda}
              className={styles.saveBtnPrimary}
            >
              <Save size={15} />
              <span>{isSavingMoneda ? 'Guardando...' : 'Guardar moneda'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. Ciclo Financiero */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Calendar size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Ciclo de Ingresos y Cobro</h3>
            <p>Definí cuándo comienza y cierra tu período contable mensual</p>
          </div>
        </div>

        <form onSubmit={handleSaveCiclo} className={styles.formInsideCard}>
          {/* Selector de modo: Día fijo vs Regla */}
          <div className={styles.formGroup}>
            <label className={styles.formGroupLabel}>Tipo de cálculo</label>
            <div className={styles.segmentedToggle}>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${
                  cicloTipo === 'dia_fijo' ? styles.segmentedActive : ''
                }`}
                onClick={() => setCicloTipo('dia_fijo')}
              >
                Día fijo del mes
              </button>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${
                  cicloTipo === 'regla' ? styles.segmentedActive : ''
                }`}
                onClick={() => setCicloTipo('regla')}
              >
                Regla de día hábil
              </button>
            </div>
          </div>

          {/* Configuración según modo */}
          {cicloTipo === 'dia_fijo' ? (
            <div className={styles.formGroup}>
              <label htmlFor="ciclo-dia-input" className={styles.formGroupLabel}>
                Día de corte mensual (1 al 31)
              </label>
              <div className={styles.dayInputWrapper}>
                <input
                  id="ciclo-dia-input"
                  type="number"
                  min={1}
                  max={31}
                  value={cicloValor}
                  onChange={(e) => setCicloValor(e.target.value)}
                  className={styles.cleanNumberInput}
                  required
                />
                <span className={styles.inputSuffix}>de cada mes</span>
              </div>
              <p className={styles.fieldHelpText}>
                Tus presupuestos y balances mensuales se computarán desde el día {cicloValor || '1'} de cada mes.
              </p>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <SelectInput
                id="ciclo-regla-select"
                label="Regla de inicio"
                value={cicloValor}
                onChange={(val) => setCicloValor(val)}
                options={OPCIONES_REGLA_CICLO}
              />
              <p className={styles.fieldHelpText}>
                Ideal si tus ingresos o cobros varían según el primer o último día de la semana.
              </p>
            </div>
          )}

          <div className={styles.cardFooterActions}>
            <button
              type="submit"
              disabled={isSavingCiclo}
              className={styles.saveBtnPrimary}
            >
              <Save size={15} />
              <span>{isSavingCiclo ? 'Guardando...' : 'Guardar ciclo'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
