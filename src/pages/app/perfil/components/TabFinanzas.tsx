import React, { useState, useEffect } from 'react'
import { Coins, Calendar, Save, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Usuario, CotizacionesDolarResponse } from '@/types'
import usuarioService from '@/services/usuario.service'
import { getCotizaciones, getPreviewFechaCobro } from '@/services/onboarding.service'
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

const OPCIONES_TIPO_DOLAR: { value: 'blue' | 'mep' | 'oficial' | 'tarjeta'; label: string; desc: string }[] = [
  { value: 'blue', label: 'Dólar Blue', desc: 'Cotización informal de mercado libre' },
  { value: 'mep', label: 'Dólar MEP / Bolsa', desc: 'Cotización financiera mediante bonos' },
  { value: 'oficial', label: 'Dólar Oficial (BNA)', desc: 'Cotización formal del Banco Nación' },
  { value: 'tarjeta', label: 'Dólar Tarjeta', desc: 'Oficial + impuestos para consumos del exterior' },
]

function formatARS(valor: number | null | undefined): string {
  if (valor == null) return ''
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

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
  const [cotizaciones, setCotizaciones] = useState<CotizacionesDolarResponse | null>(null)
  const [isSavingMoneda, setIsSavingMoneda] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getCotizaciones(controller.signal)
      .then(setCotizaciones)
      .catch(() => setCotizaciones(null))
    return () => controller.abort()
  }, [])

  // Cycle form
  const [cicloTipo, setCicloTipo] = useState<'dia_fijo' | 'regla'>(
    (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo'
  )
  const [cicloValor, setCicloValor] = useState(usuario?.ciclo_valor || '1')
  const [cicloAjusteDireccion, setCicloAjusteDireccion] = useState<'anterior' | 'posterior'>(
    (usuario?.ciclo_ajuste_direccion as 'anterior' | 'posterior') || 'anterior'
  )
  const [isSavingCiclo, setIsSavingCiclo] = useState(false)

  // Preview state
  const [preview, setPreview] = useState<{
    proxima_fecha_cobro: string
    fue_ajustada: boolean
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    let isValid = false
    if (cicloTipo === 'dia_fijo') {
      const diaNum = parseInt(cicloValor, 10)
      isValid = !isNaN(diaNum) && diaNum >= 1 && diaNum <= 31
    } else if (cicloTipo === 'regla') {
      isValid = Boolean(cicloValor)
    }

    if (!isValid) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const data = await getPreviewFechaCobro({
          tipo: cicloTipo,
          valor: cicloValor,
          direccion: cicloAjusteDireccion,
        }, controller.signal)
        setPreview(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        setPreview(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false)
        }
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cicloTipo, cicloValor, cicloAjusteDireccion])

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
        ciclo_ajuste_direccion: cicloAjusteDireccion,
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
                {OPCIONES_TIPO_DOLAR.map((opt) => {
                  const cotiz = cotizaciones?.cotizaciones?.[opt.value]
                  return (
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

                      {cotiz && (cotiz.compra != null || cotiz.venta != null) && (
                        <div className={styles.dolarRatesRow}>
                          {cotiz.compra != null && (
                            <div className={styles.rateCol}>
                              <span className={styles.rateLabel}>Compra</span>
                              <span className={styles.rateValue}>{formatARS(cotiz.compra)}</span>
                            </div>
                          )}
                          {cotiz.venta != null && (
                            <div className={styles.rateCol}>
                              <span className={styles.rateLabel}>Venta</span>
                              <span className={`${styles.rateValue} ${styles.rateValuePrimary}`}>
                                {formatARS(cotiz.venta)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <span className={styles.dolarDesc}>{opt.desc}</span>
                    </button>
                  )
                })}
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

      {/* 2. Ciclo Financiero Rediseñado */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Calendar size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Ciclo de Ingresos y Cobro</h3>
          </div>
        </div>

        <form onSubmit={handleSaveCiclo} className={styles.cicloCompactForm}>
          <div className={styles.cicloGrid}>
            {/* Columna 1: Tipo de cálculo y Selección */}
            <div className={styles.cicloCol}>
              <div className={styles.compactGroup}>
                <label className={styles.compactLabel}>Tipo de cálculo</label>
                <div className={styles.segmentedToggleCompact}>
                  <button
                    type="button"
                    className={`${styles.segmentedBtnCompact} ${
                      cicloTipo === 'dia_fijo' ? styles.segmentedActiveCompact : ''
                    }`}
                    onClick={() => {
                      setCicloTipo('dia_fijo')
                      if (!cicloValor || isNaN(Number(cicloValor))) setCicloValor('1')
                    }}
                  >
                    Día fijo
                  </button>
                  <button
                    type="button"
                    className={`${styles.segmentedBtnCompact} ${
                      cicloTipo === 'regla' ? styles.segmentedActiveCompact : ''
                    }`}
                    onClick={() => {
                      setCicloTipo('regla')
                      if (!cicloValor || !isNaN(Number(cicloValor))) setCicloValor('primer_lunes')
                    }}
                  >
                    Regla semanal
                  </button>
                </div>
              </div>

              {cicloTipo === 'dia_fijo' ? (
                <div className={styles.compactGroup}>
                  <label htmlFor="ciclo-dia-input" className={styles.compactLabel}>
                    Día de corte mensual
                  </label>
                  <div className={styles.compactDayWrapper}>
                    <input
                      id="ciclo-dia-input"
                      type="number"
                      min={1}
                      max={31}
                      value={cicloValor}
                      onChange={(e) => setCicloValor(e.target.value)}
                      className={styles.compactNumberInput}
                      required
                    />
                    <span className={styles.compactInputSuffix}>de cada mes</span>
                  </div>
                </div>
              ) : (
                <div className={styles.compactGroup}>
                  <SelectInput
                    id="ciclo-regla-select"
                    label="Regla de corte"
                    value={cicloValor}
                    onChange={(val) => setCicloValor(val)}
                    options={OPCIONES_REGLA_CICLO}
                  />
                </div>
              )}
            </div>

            {/* Columna 2: Ajuste de día hábil */}
            <div className={styles.cicloCol}>
              <div className={styles.compactGroup}>
                <label className={styles.compactLabel}>
                  Ajuste si cae fin de semana / feriado
                </label>
                <div className={styles.segmentedToggleCompact}>
                  <button
                    type="button"
                    className={`${styles.segmentedBtnCompact} ${
                      cicloAjusteDireccion === 'anterior' ? styles.segmentedActiveCompact : ''
                    }`}
                    onClick={() => setCicloAjusteDireccion('anterior')}
                  >
                    <ArrowLeft size={13} />
                    <span>Hacia atrás</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.segmentedBtnCompact} ${
                      cicloAjusteDireccion === 'posterior' ? styles.segmentedActiveCompact : ''
                    }`}
                    onClick={() => setCicloAjusteDireccion('posterior')}
                  >
                    <span>Hacia adelante</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <p className={styles.compactExplainer}>
                {cicloAjusteDireccion === 'anterior'
                  ? 'Si cae en día no hábil, el cálculo retrocede al día hábil previo.'
                  : 'Si cae en día no hábil, el cálculo avanza al siguiente día hábil.'}
              </p>
            </div>
          </div>

          {/* Banner de Preview en vivo */}
          {preview && !loadingPreview && (
            <div className={styles.cicloPreviewCard}>
              <div className={styles.previewIconBox}>
                <Calendar size={15} />
              </div>
              <div className={styles.previewInfo}>
                <span className={styles.previewLabel}>Próximo inicio:</span>
                <span className={styles.previewDate}>
                  {new Date(preview.proxima_fecha_cobro + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {preview.fue_ajustada && (
                <span className={styles.adjustedPill}>
                  Ajustado por feriado / fin de semana
                </span>
              )}
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
