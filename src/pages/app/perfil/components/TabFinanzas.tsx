import React, { useState, useEffect, useMemo } from 'react'
import { Coins, Calendar, Receipt, Save, Check, ChevronDown } from '@/components/ui/icons'
import type { Usuario, CotizacionesDolarResponse } from '@/types'
import usuarioService from '@/services/usuario.service'
import { getCotizaciones } from '@/services/onboarding.service'
import { invalidateDashboardCache } from '@/services/dashboard.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { CicloFinancieroSelector, type CicloValue } from '@/components/ciclo/CicloFinancieroSelector'
import SegmentedControl from '@/components/ui/SegmentedControl'
import ComerciosRecordados from './ComerciosRecordados'
import { Skeleton, LunarLoader } from '@/components/ui'
import perfilStyles from '../PerfilPage.module.css'
import localStyles from './TabFinanzas.module.css'

interface TabFinanzasProps {
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
}

const MONEDA_PRINCIPAL_OPTIONS = [
  { value: 'ARS', label: 'Pesos ($)' },
  { value: 'USD', label: 'Dólares (US$)' },
]

const OPCIONES_TIPO_DOLAR: { value: 'oficial' | 'mep' | 'blue' | 'tarjeta'; label: string; desc: string }[] = [
  { value: 'oficial', label: 'Dólar Oficial', desc: 'Banco Nación Argentina' },
  { value: 'mep', label: 'Dólar MEP', desc: 'Bolsa financiera en bonos' },
  { value: 'blue', label: 'Dólar Blue', desc: 'Mercado libre informal' },
  { value: 'tarjeta', label: 'Dólar Tarjeta', desc: 'Oficial + percepción exterior' },
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
  // ── 1. Moneda & Divisas State ───────────────────────────────────────────
  const initialMonedaPrincipal = (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'
  const initialMonedaSecundaria = !!usuario?.moneda_secundaria_activa
  const initialTipoDolar = (usuario?.tipo_dolar as 'oficial' | 'mep' | 'blue' | 'tarjeta') || 'oficial'

  const [monedaPrincipal, setMonedaPrincipal] = useState<'ARS' | 'USD'>(initialMonedaPrincipal)
  const [monedaSecundariaActiva, setMonedaSecundariaActiva] = useState(initialMonedaSecundaria)
  const [tipoDolar, setTipoDolar] = useState(initialTipoDolar)
  const [cotizaciones, setCotizaciones] = useState<CotizacionesDolarResponse | null>(null)
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(true)

  // ── 2. Ciclo Financiero State ───────────────────────────────────────────
  // "Día hábil bancario" en primera posición y seleccionado por defecto
  const initialCicloTipo: 'dia_fijo' | 'regla' =
    (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'regla'
  const initialCicloValor =
    usuario?.ciclo_valor || (initialCicloTipo === 'regla' ? 'primer_dia_habil' : '1')
  const initialCicloDir =
    initialCicloTipo === 'regla'
      ? null
      : ((usuario?.ciclo_ajuste_direccion as 'anterior' | 'posterior' | null) ?? 'anterior')

  const [ciclo, setCiclo] = useState<CicloValue>({
    tipo: initialCicloTipo,
    valor: initialCicloValor,
    direccion: initialCicloDir,
  })

  // Estado unificado de guardado
  const [isSaving, setIsSaving] = useState(false)

  // En móvil (< 1024px), colapsar comercios por defecto para no abrumar la pantalla
  const [comerciosExpanded, setComerciosExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })

  // Sync state if usuario prop changes
  const [prevUsuario, setPrevUsuario] = useState(usuario)
  if (usuario !== prevUsuario) {
    setPrevUsuario(usuario)
    setMonedaPrincipal((usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS')
    setMonedaSecundariaActiva(!!usuario?.moneda_secundaria_activa)
    setTipoDolar((usuario?.tipo_dolar as 'oficial' | 'mep' | 'blue' | 'tarjeta') || 'oficial')
    const syncTipo: 'dia_fijo' | 'regla' =
      (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'regla'
    setCiclo({
      tipo: syncTipo,
      valor: usuario?.ciclo_valor || (syncTipo === 'regla' ? 'primer_dia_habil' : '1'),
      direccion:
        syncTipo === 'regla'
          ? null
          : ((usuario?.ciclo_ajuste_direccion as 'anterior' | 'posterior' | null) ?? 'anterior'),
    })
  }

  // Fetch dollar quotes
  useEffect(() => {
    const controller = new AbortController()
    getCotizaciones(controller.signal)
      .then(setCotizaciones)
      .catch(() => setCotizaciones(null))
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingCotizaciones(false)
        }
      })
    return () => controller.abort()
  }, [])

  // Detect dirty state for Moneda
  const isMonedaDirty = useMemo(() => {
    const origPrincipal = (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'
    const origSecundaria = !!usuario?.moneda_secundaria_activa
    const origDolar = usuario?.tipo_dolar || 'oficial'

    return (
      monedaPrincipal !== origPrincipal ||
      monedaSecundariaActiva !== origSecundaria ||
      (monedaSecundariaActiva && tipoDolar !== origDolar)
    )
  }, [monedaPrincipal, monedaSecundariaActiva, tipoDolar, usuario])

  // Detect dirty state for Ciclo
  const isCicloDirty = useMemo(() => {
    const origTipo = (usuario?.ciclo_tipo as 'dia_fijo' | 'regla') || 'regla'
    const origValor =
      usuario?.ciclo_valor || (origTipo === 'regla' ? 'primer_dia_habil' : '1')
    const origDir =
      origTipo === 'regla'
        ? null
        : ((usuario?.ciclo_ajuste_direccion as 'anterior' | 'posterior' | null) ?? 'anterior')

    return (
      ciclo.tipo !== origTipo ||
      ciclo.valor !== origValor ||
      ciclo.direccion !== origDir
    )
  }, [ciclo, usuario])

  const isDirty = isMonedaDirty || isCicloDirty

  // ── 3. Guardado Unificado (Cero duplicidad de botones) ─────────────────────
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isDirty || isSaving) return

    if ((monedaPrincipal === 'USD' || monedaSecundariaActiva) && !tipoDolar) {
      sileo.error({ title: 'Debés seleccionar una cotización de referencia para el dólar.' })
      return
    }

    if (ciclo.tipo === 'dia_fijo') {
      const diaNum = parseInt(ciclo.valor, 10)
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        sileo.error({ title: 'El día de corte debe ser un número entero entre 1 y 31.' })
        return
      }
    } else if (ciclo.tipo === 'regla' && !ciclo.valor) {
      sileo.error({ title: 'Seleccioná un día hábil válido.' })
      return
    }

    setIsSaving(true)
    try {
      let updatedUser = usuario
      if (isMonedaDirty) {
        const u1 = await usuarioService.actualizarMoneda({
          moneda_principal: monedaPrincipal,
          moneda_secundaria_activa: monedaSecundariaActiva,
          tipo_dolar: tipoDolar,
        })
        updatedUser = u1
      }
      if (isCicloDirty) {
        const u2 = await usuarioService.actualizarCicloFinanciero({
          ciclo_tipo: ciclo.tipo,
          ciclo_valor: ciclo.valor,
          ciclo_ajuste_direccion: ciclo.tipo === 'regla' ? null : ciclo.direccion,
        })
        updatedUser = u2
      }
      invalidateDashboardCache()
      if (updatedUser) {
        updateUsuario(updatedUser)
      }
      sileo.success({ title: 'Configuración financiera guardada' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo guardar la configuración financiera.') })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={localStyles.tabContainer}>
      <form onSubmit={handleSaveAll} className={localStyles.tabForm}>
        {/* ── SECCIONES PRINCIPALES (2 cols en desktop / 1 col optimizada en mobile) ── */}
        <div className={localStyles.mainGrid}>
          {/* Card 1: Moneda & Mercado Cambiario */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#2563eb' }}>
                <Coins size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Moneda de cuenta</h3>
              </div>
            </div>

            <div className={localStyles.formStack}>
              {/* Fila Moneda Principal (Adaptativa y 100% libre de espacio muerto en móvil) */}
              <div className={localStyles.monedaBlock}>
                <span className={localStyles.settingLabel}>Moneda principal</span>
                <div className={localStyles.monedaControlWrap}>
                  <SegmentedControl
                    options={MONEDA_PRINCIPAL_OPTIONS}
                    value={monedaPrincipal}
                    onChange={(val) => setMonedaPrincipal(val as 'ARS' | 'USD')}
                    ariaLabel="Moneda Principal"
                    fullWidth
                  />
                </div>
              </div>

              {/* Fila Operar en Dólares (Conciso y sin wrap en mobile) */}
              <div className={localStyles.settingRow}>
                <span className={localStyles.settingLabel}>Operar también en dólares</span>
                <label className={localStyles.switch}>
                  <input
                    type="checkbox"
                    checked={monedaSecundariaActiva}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setMonedaSecundariaActiva(checked)
                      if (checked) {
                        setTipoDolar('oficial')
                      }
                    }}
                    aria-label="Operar también en dólares"
                  />
                  <span className={localStyles.slider} />
                </label>
              </div>

              {/* Grid 2x2 Compacto de Cotizaciones (Cero scroll excesivo en mobile) */}
              {monedaSecundariaActiva && (
                <div className={localStyles.dolarSection}>
                  <div className={localStyles.dolarGrid}>
                    {OPCIONES_TIPO_DOLAR.map((opt) => {
                      const cotiz = cotizaciones?.cotizaciones?.[opt.value]
                      const isSelected = tipoDolar === opt.value

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`${localStyles.dolarCard} ${isSelected ? localStyles.dolarCardActive : ''}`}
                          onClick={() => setTipoDolar(opt.value)}
                          aria-checked={isSelected}
                          role="radio"
                        >
                          <div className={localStyles.dolarCardTop}>
                            <span className={localStyles.dolarName}>{opt.label}</span>
                            <div className={localStyles.radioIndicator}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>

                          <div className={localStyles.dolarPricesGroup}>
                            {loadingCotizaciones ? (
                              <Skeleton variant="text" width={56} height={18} />
                            ) : cotiz?.venta ? (
                              <span className={localStyles.dolarPriceVenta}>{formatARS(cotiz.venta)}</span>
                            ) : (
                              <span className={localStyles.dolarPriceCompra}>No disponible</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Ciclo de Ingresos y Cobro (Inmediatamente accesible en mobile) */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#10b981' }}>
                <Calendar size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Ciclo de ingresos y cobro</h3>
              </div>
            </div>

            <div className={localStyles.formStack}>
              <CicloFinancieroSelector
                value={ciclo}
                onChange={setCiclo}
                disabled={isSaving}
              />
            </div>
          </section>
        </div>

        {/* ── BARRA UNIFICADA DE GUARDADO (Cero botones duplicados en pantalla) ── */}
        <div className={localStyles.unifiedActionBar}>
          <div className={localStyles.dirtyStatusText}>
            {isDirty ? (
              <>
                <span className={localStyles.dirtyDotAmber} />
                <span>Cambios pendientes</span>
              </>
            ) : (
              <span>Preferencias al día</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className={`${localStyles.saveButton} ${!isDirty ? localStyles.saveButtonClean : ''}`}
          >
            {isSaving ? (
              <>
                <LunarLoader size={16} />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── 3. MEMORIA DE COMERCIOS (Sección Secundaria / Abajo en mobile y desktop) ── */}
      <section className={`${perfilStyles.sectionCard} ${localStyles.comerciosSection}`}>
        <div
          className={localStyles.comerciosHeader}
          onClick={() => setComerciosExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setComerciosExpanded((prev) => !prev)
            }
          }}
          aria-expanded={comerciosExpanded}
          aria-label="Alternar visibilidad de comercios recordados"
        >
          <div className={perfilStyles.sectionHeader}>
            <div className={perfilStyles.sectionIconWrap} style={{ color: '#8b5cf6' }}>
              <Receipt size={18} />
            </div>
            <div className={perfilStyles.sectionHeaderText}>
              <div className={localStyles.comerciosTitleRow}>
                <h3>Comercios recordados</h3>
                <span className={localStyles.comerciosBadge}>
                  {comerciosExpanded ? 'Ocultar' : 'Ver lista'}
                </span>
              </div>
            </div>
            <div className={`${localStyles.chevronIcon} ${comerciosExpanded ? localStyles.chevronExpanded : ''}`}>
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {comerciosExpanded && (
          <div className={localStyles.comerciosContent}>
            <ComerciosRecordados />
          </div>
        )}
      </section>
    </div>
  )
}

export default TabFinanzas
