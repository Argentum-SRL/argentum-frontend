import React, { useState, useEffect } from 'react'
import { Coins, Calendar, Save, Check } from '@/components/ui/icons'
import type { Usuario, CotizacionesDolarResponse } from '@/types'
import usuarioService from '@/services/usuario.service'
import { getCotizaciones } from '@/services/onboarding.service'
import { invalidateDashboardCache } from '@/services/dashboard.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { CicloFinancieroSelector, type CicloValue } from '@/components/ciclo/CicloFinancieroSelector'
import styles from '../PerfilPage.module.css'

interface TabFinanzasProps {
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
}

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

  // Cycle form state
  const [ciclo, setCiclo] = useState<CicloValue>({
    tipo: (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo',
    valor: usuario?.ciclo_valor || '1',
    direccion: usuario?.ciclo_tipo === 'regla'
      ? null
      : ((usuario?.ciclo_ajuste_direccion as 'anterior' | 'posterior' | null) ?? 'anterior'),
  })
  const [isSavingCiclo, setIsSavingCiclo] = useState(false)


  const handleSaveMoneda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (monedaPrincipal === 'USD' || monedaSecundariaActiva) {
      if (!tipoDolar) {
        sileo.error({ title: 'Debés seleccionar una cotización de referencia para el dólar.' })
        return
      }
    }

    setIsSavingMoneda(true)
    try {
      const updated = await usuarioService.actualizarMoneda({
        moneda_principal: monedaPrincipal,
        moneda_secundaria_activa: monedaSecundariaActiva,
        tipo_dolar: tipoDolar,
      })
      invalidateDashboardCache()
      updateUsuario(updated)
      sileo.success({ title: 'Preferencias de moneda actualizadas correctamente' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar la configuración de moneda.') })
    } finally {
      setIsSavingMoneda(false)
    }
  }

  const handleSaveCiclo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ciclo.tipo === 'dia_fijo') {
      const diaNum = parseInt(ciclo.valor, 10)
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        sileo.error({ title: 'El día de corte debe ser un número entero entre 1 y 31.' })
        return
      }
    } else if (ciclo.tipo === 'regla') {
      if (!ciclo.valor) {
        sileo.error({ title: 'Seleccioná un día hábil válido.' })
        return
      }
    }

    setIsSavingCiclo(true)
    try {
      const updated = await usuarioService.actualizarCicloFinanciero({
        ciclo_tipo: ciclo.tipo,
        ciclo_valor: ciclo.valor,
        ciclo_ajuste_direccion: ciclo.tipo === 'regla' ? null : ciclo.direccion,
      })
      invalidateDashboardCache()
      updateUsuario(updated)
      sileo.success({ title: 'Ciclo financiero actualizado correctamente' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar el ciclo financiero.') })
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
            <p>Definí cuándo comienza tu mes financiero para presupuestos y balances</p>
          </div>
        </div>

        <form onSubmit={handleSaveCiclo} className={styles.formInsideCard}>
          <CicloFinancieroSelector
            value={ciclo}
            onChange={setCiclo}
            disabled={isSavingCiclo}
          />

          <div className={styles.cardFooterActions} style={{ marginTop: '20px' }}>
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

export default TabFinanzas
