import React, { useState, useMemo } from 'react'
import {
  Bell,
  CreditCard,
  Activity,
  MessageSquare,
  Save,
  Minus,
  Plus,
} from '@/components/ui/icons'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useSonidoAvisos } from '@/hooks/useSonidoAvisos'
import type { ConfiguracionNotificacion } from '@/types'
import { TimeInput, LunarLoader, PerfilNotificacionesSkeleton } from '@/components/ui'
import { sileo } from 'sileo'
import perfilStyles from '../PerfilPage.module.css'
import localStyles from './TabNotificaciones.module.css'

const defaultNotificationFormState = {
  cuota_vence_anticipacion_dias: 3,
  cuota_vence_web: true,
  cuota_vence_whatsapp: false,
  presupuesto_umbral_1: 80,
  presupuesto_umbral_1_activo: true,
  presupuesto_umbral_1_web: true,
  presupuesto_umbral_1_whatsapp: false,
  presupuesto_umbral_2_web: true,
  presupuesto_umbral_2_whatsapp: false,
  suscripcion_hoy_web: true,
  suscripcion_hoy_whatsapp: false,
  suscripcion_recordatorio_activo: true,
  suscripcion_recordatorio_dias: 3,
  suscripcion_recordatorio_web: true,
  suscripcion_recordatorio_whatsapp: false,
  meta_alcanzada_activo: true,
  meta_alcanzada_web: true,
  meta_alcanzada_whatsapp: false,
  saldo_cero_web: true,
  saldo_cero_whatsapp: false,
  gasto_inusual_activo: true,
  gasto_inusual_web: true,
  gasto_inusual_whatsapp: false,
  resumen_semanal_activo: false,
  resumen_semanal_web: true,
  resumen_semanal_whatsapp: false,
  inactividad_activo: false,
  inactividad_dias: 7,
  inactividad_web: true,
  inactividad_whatsapp: false,
  resumen_ciclo_activo: true,
  resumen_ciclo_whatsapp: true,
  whatsapp_hora_envio: 9,
  whatsapp_minuto_envio: 0,
}

type NotificationFormState = typeof defaultNotificationFormState

const buildInitialState = (config: ConfiguracionNotificacion | null): NotificationFormState => {
  if (!config) return defaultNotificationFormState
  return {
    cuota_vence_anticipacion_dias: config.cuota_vence_anticipacion_dias ?? 3,
    cuota_vence_web: Boolean(config.cuota_vence_web),
    cuota_vence_whatsapp: Boolean(config.cuota_vence_whatsapp),
    presupuesto_umbral_1: config.presupuesto_umbral_1 ?? 80,
    presupuesto_umbral_1_activo: Boolean(config.presupuesto_umbral_1_activo),
    presupuesto_umbral_1_web: Boolean(config.presupuesto_umbral_1_web),
    presupuesto_umbral_1_whatsapp: Boolean(config.presupuesto_umbral_1_whatsapp),
    presupuesto_umbral_2_web: Boolean(config.presupuesto_umbral_2_web),
    presupuesto_umbral_2_whatsapp: Boolean(config.presupuesto_umbral_2_whatsapp),
    suscripcion_hoy_web: Boolean(config.suscripcion_hoy_web),
    suscripcion_hoy_whatsapp: Boolean(config.suscripcion_hoy_whatsapp),
    suscripcion_recordatorio_activo: Boolean(config.suscripcion_recordatorio_activo),
    suscripcion_recordatorio_dias: config.suscripcion_recordatorio_dias ?? 3,
    suscripcion_recordatorio_web: Boolean(config.suscripcion_recordatorio_web),
    suscripcion_recordatorio_whatsapp: Boolean(config.suscripcion_recordatorio_whatsapp),
    meta_alcanzada_activo: Boolean(config.meta_alcanzada_activo),
    meta_alcanzada_web: Boolean(config.meta_alcanzada_web),
    meta_alcanzada_whatsapp: Boolean(config.meta_alcanzada_whatsapp),
    saldo_cero_web: Boolean(config.saldo_cero_web),
    saldo_cero_whatsapp: Boolean(config.saldo_cero_whatsapp),
    gasto_inusual_activo: Boolean(config.gasto_inusual_activo),
    gasto_inusual_web: Boolean(config.gasto_inusual_web),
    gasto_inusual_whatsapp: Boolean(config.gasto_inusual_whatsapp),
    resumen_semanal_activo: Boolean(config.resumen_semanal_activo),
    resumen_semanal_web: Boolean(config.resumen_semanal_web),
    resumen_semanal_whatsapp: Boolean(config.resumen_semanal_whatsapp),
    inactividad_activo: Boolean(config.inactividad_activo),
    inactividad_dias: config.inactividad_dias ?? 7,
    inactividad_web: Boolean(config.inactividad_web),
    inactividad_whatsapp: Boolean(config.inactividad_whatsapp),
    resumen_ciclo_activo: Boolean(config.resumen_ciclo_activo ?? true),
    resumen_ciclo_whatsapp: Boolean(config.resumen_ciclo_whatsapp ?? true),
    whatsapp_hora_envio: config.whatsapp_hora_envio ?? 9,
    whatsapp_minuto_envio: config.whatsapp_minuto_envio ?? 0,
  }
}

interface StepperProps {
  value: number
  onChange: (val: number) => void
  min: number
  max: number
  step?: number
  formatLabel: (val: number) => string
  ariaLabel: string
}

const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  formatLabel,
  ariaLabel,
}) => {
  return (
    <div className={localStyles.stepper} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={localStyles.stepperBtn}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={`Disminuir ${ariaLabel}`}
      >
        <Minus size={14} />
      </button>
      <span className={localStyles.stepperValue}>{formatLabel(value)}</span>
      <button
        type="button"
        className={localStyles.stepperBtn}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={`Aumentar ${ariaLabel}`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: () => void
  ariaLabel: string
  disabled?: boolean
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, ariaLabel, disabled = false }) => {
  return (
    <label className={localStyles.switch}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <span className={localStyles.slider} />
    </label>
  )
}

interface NotificacionesFormProps {
  initialConfig: ConfiguracionNotificacion | null
  onSave: (config: NotificationFormState) => Promise<void>
}

const NotificacionesForm: React.FC<NotificacionesFormProps> = ({ initialConfig, onSave }) => {
  const [form, setForm] = useState<NotificationFormState>(() => buildInitialState(initialConfig))
  const [isSaving, setIsSaving] = useState(false)
  const { activo: sonidoActivo, cambiarActivo: cambiarSonidoActivo } = useSonidoAvisos()

  const isDirty = useMemo(() => {
    const initial = buildInitialState(initialConfig)
    return (Object.keys(form) as (keyof NotificationFormState)[]).some(
      (key) => form[key] !== initial[key]
    )
  }, [form, initialConfig])

  const handleToggle = (field: keyof NotificationFormState) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleNumber = (field: keyof NotificationFormState, val: number, min: number, max: number) => {
    const safe = Math.max(min, Math.min(max, isNaN(val) ? min : val))
    setForm((prev) => ({ ...prev, [field]: safe }))
  }

  const handleTimeChange = (timeStr: string) => {
    if (!timeStr) return
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
    if (!isNaN(h) && !isNaN(m)) {
      setForm((prev) => ({
        ...prev,
        whatsapp_hora_envio: Math.max(0, Math.min(23, h)),
        whatsapp_minuto_envio: Math.max(0, Math.min(59, m)),
      }))
    }
  }

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty || isSaving) return

    setIsSaving(true)
    try {
      await onSave(form)
      sileo.success({ title: 'Tus preferencias de notificaciones fueron guardadas.' })
    } catch (err: unknown) {
      console.error(err)
      sileo.error({ title: 'No pudimos guardar los cambios. Probá de nuevo.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={localStyles.tabContainer}>
      <div className={localStyles.tabForm}>
        {/* ── Banner Informativo: Canales Web y WhatsApp ──────────────────── */}
        <div className={localStyles.noticeCard}>
          <div className={localStyles.noticeIconBox}>
            <Bell size={18} />
          </div>
          <div className={localStyles.noticeContent}>
            <h4 className={localStyles.noticeTitle}>
              Alertas en la app y WhatsApp
            </h4>
            <p className={localStyles.noticeDescription}>
              Avisos y alertas en la app web. Resumen mensual al corte de ciclo por WhatsApp.
            </p>
          </div>
        </div>

        {/* ── Sonido en este dispositivo (Ancho Completo) ─────────────────── */}
        <section className={perfilStyles.sectionCard}>
          <div className={perfilStyles.sectionHeader}>
            <div className={perfilStyles.sectionIconWrap} style={{ color: '#2563eb' }}>
              <Bell size={18} />
            </div>
            <div className={perfilStyles.sectionHeaderText}>
              <h3>Sonido</h3>
            </div>
          </div>

          <div className={localStyles.cardStack}>
            <div className={localStyles.settingRow}>
              <div className={localStyles.settingRowHeader}>
                <div className={localStyles.settingInfo}>
                  <div className={localStyles.settingLabelGroup}>
                    <span className={localStyles.settingLabel}>Sonido de los avisos</span>
                  </div>
                  <span className={localStyles.settingSubtitle}>
                    <span className={localStyles.subtitleDesktop}>
                      Suena una campanita cuando llega un aviso o cuando entrás con avisos sin leer.
                    </span>
                    <span className={localStyles.subtitleMobile}>
                      Suena con avisos nuevos o sin leer.
                    </span>
                  </span>
                </div>
                <div className={localStyles.settingActions}>
                  <Switch
                    checked={sonidoActivo}
                    onChange={() => cambiarSonidoActivo(!sonidoActivo)}
                    ariaLabel="Sonido de los avisos"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Grid Principal Superior (2 Columnas Desktop, 1 Mobile) ───────── */}
        <div className={localStyles.mainGrid}>
          {/* Columna 1: Pagos y Presupuestos */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#2563eb' }}>
                <CreditCard size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Pagos y compromisos</h3>
              </div>
            </div>

            <div className={localStyles.cardStack}>
              {/* Row 1: Vencimiento de Tarjetas y Cuotas */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Vencimiento de tarjetas y cuotas</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Aviso previo al cierre y vencimiento para evitar intereses.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.cuota_vence_web}
                      onChange={() => handleToggle('cuota_vence_web')}
                      ariaLabel="Activar recordatorio de vencimiento de tarjetas y cuotas"
                    />
                  </div>
                </div>

                {form.cuota_vence_web && (
                  <div className={localStyles.subPanel}>
                    <span className={localStyles.subLabel}>Anticipación</span>
                    <Stepper
                      value={form.cuota_vence_anticipacion_dias}
                      onChange={(val) => handleNumber('cuota_vence_anticipacion_dias', val, 1, 30)}
                      min={1}
                      max={30}
                      formatLabel={(val) => `${val} ${val === 1 ? 'día antes' : 'días antes'}`}
                      ariaLabel="Anticipación de vencimiento de tarjetas"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Límites de Presupuesto */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Límites de presupuesto</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Aviso preventivo al acercarte al tope de una categoría.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.presupuesto_umbral_1_activo}
                      onChange={() => handleToggle('presupuesto_umbral_1_activo')}
                      ariaLabel="Activar alerta preventiva de presupuesto"
                    />
                  </div>
                </div>

                {form.presupuesto_umbral_1_activo && (
                  <div className={localStyles.subPanel}>
                    <span className={localStyles.subLabel}>Umbral</span>
                    <Stepper
                      value={form.presupuesto_umbral_1}
                      onChange={(val) => handleNumber('presupuesto_umbral_1', val, 50, 95)}
                      min={50}
                      max={95}
                      step={5}
                      formatLabel={(val) => `${val}% consumido`}
                      ariaLabel="Porcentaje de umbral de presupuesto"
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Suscripciones y Recurrentes */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Suscripciones y servicios</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Aviso previo a la renovación de suscripciones y débitos.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.suscripcion_recordatorio_activo}
                      onChange={() => handleToggle('suscripcion_recordatorio_activo')}
                      ariaLabel="Activar aviso anticipado de suscripciones"
                    />
                  </div>
                </div>

                {form.suscripcion_recordatorio_activo && (
                  <div className={localStyles.subPanel}>
                    <span className={localStyles.subLabel}>Anticipación</span>
                    <Stepper
                      value={form.suscripcion_recordatorio_dias}
                      onChange={(val) => handleNumber('suscripcion_recordatorio_dias', val, 1, 14)}
                      min={1}
                      max={14}
                      formatLabel={(val) => `${val} ${val === 1 ? 'día antes' : 'días antes'}`}
                      ariaLabel="Anticipación de recordatorio de suscripción"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Columna 2: Hábitos y Monitoreo */}
          <section className={perfilStyles.sectionCard}>
            <div className={perfilStyles.sectionHeader}>
              <div className={perfilStyles.sectionIconWrap} style={{ color: '#10b981' }}>
                <Activity size={18} />
              </div>
              <div className={perfilStyles.sectionHeaderText}>
                <h3>Monitoreo y hábitos</h3>
              </div>
            </div>

            <div className={localStyles.cardStack}>
              {/* Row 1: Metas de Ahorro Alcanzadas */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Metas de ahorro cumplidas</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Aviso al completar el 100% de una meta fijada.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.meta_alcanzada_activo}
                      onChange={() => handleToggle('meta_alcanzada_activo')}
                      ariaLabel="Activar festejo de meta cumplida"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Recordatorio por Inactividad */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Recordatorio por inactividad</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Aviso si pasás varios días sin registrar gastos.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.inactividad_activo}
                      onChange={() => handleToggle('inactividad_activo')}
                      ariaLabel="Activar recordatorio de inactividad"
                    />
                  </div>
                </div>

                {form.inactividad_activo && (
                  <div className={localStyles.subPanel}>
                    <span className={localStyles.subLabel}>Inactividad</span>
                    <Stepper
                      value={form.inactividad_dias}
                      onChange={(val) => handleNumber('inactividad_dias', val, 3, 30)}
                      min={3}
                      max={30}
                      formatLabel={(val) => `Tras ${val} días`}
                      ariaLabel="Días de inactividad antes del recordatorio"
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Gastos Inusuales y Desvíos */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Gastos inusuales y desvíos</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Alerta ante consumos fuera de tu patrón habitual.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.gasto_inusual_activo}
                      onChange={() => handleToggle('gasto_inusual_activo')}
                      ariaLabel="Activar detección de gastos inusuales"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Resumen Financiero Semanal */}
              <div className={localStyles.settingRow}>
                <div className={localStyles.settingRowHeader}>
                  <div className={localStyles.settingInfo}>
                    <div className={localStyles.settingLabelGroup}>
                      <span className={localStyles.settingLabel}>Resumen semanal</span>
                    </div>
                    <span className={localStyles.settingSubtitle}>
                      Balance semanal de consumos y ahorros en la app.
                    </span>
                  </div>
                  <div className={localStyles.settingActions}>
                    <Switch
                      checked={form.resumen_semanal_activo}
                      onChange={() => handleToggle('resumen_semanal_activo')}
                      ariaLabel="Activar resumen semanal en la app web"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Card 3: Reporte Mensual y Alertas de WhatsApp (Ancho Completo) ── */}
        <section className={`${perfilStyles.sectionCard} ${localStyles.bottomSection}`}>
          <div className={perfilStyles.sectionHeader}>
            <div className={perfilStyles.sectionIconWrap} style={{ color: '#16a34a' }}>
              <MessageSquare size={18} />
            </div>
            <div className={perfilStyles.sectionHeaderText}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Reporte mensual por WhatsApp</h3>
                <span className={localStyles.badgeHighlight}>Canal exclusivo</span>
              </div>
            </div>
          </div>

          <div className={localStyles.cardStack}>
            {/* Row 1: Resumen mensual al cierre de ciclo */}
            <div className={localStyles.settingRow}>
              <div className={localStyles.settingRowHeader}>
                <div className={localStyles.settingInfo}>
                  <div className={localStyles.settingLabelGroup}>
                    <span className={localStyles.settingLabel}>Resumen de cierre de ciclo</span>
                  </div>
                  <span className={localStyles.settingSubtitle}>
                    Balance mensual enviado a WhatsApp el día de corte.
                  </span>
                </div>
                <div className={localStyles.settingActions}>
                  <Switch
                    checked={form.resumen_ciclo_activo}
                    onChange={() => handleToggle('resumen_ciclo_activo')}
                    ariaLabel="Activar resumen de cierre de ciclo por WhatsApp"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Horario de entrega de WhatsApp */}
            <div className={localStyles.settingRow}>
              <div className={localStyles.timeScheduleBody}>
                <div className={localStyles.settingInfo}>
                  <div className={localStyles.settingLabelGroup}>
                    <span className={localStyles.settingLabel}>Horario de entrega</span>
                  </div>
                  <span className={localStyles.settingSubtitle}>
                    Hora en que se enviará el resumen a tu chat.
                  </span>
                </div>
                <div className={localStyles.timeInputWrapper}>
                  <TimeInput
                    value={formatTime(form.whatsapp_hora_envio, form.whatsapp_minuto_envio)}
                    onChange={handleTimeChange}
                    ariaLabel="Horario de entrega por WhatsApp"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BARRA UNIFICADA DE GUARDADO ─────────────────────────────────── */}
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
      </div>
    </form>
  )
}

export const TabNotificaciones: React.FC = () => {
  const { config, updateConfig, isLoading } = useNotificaciones()

  const handleSave = async (formValues: NotificationFormState) => {
    await updateConfig(formValues)
  }

  if (isLoading && !config) {
    return <PerfilNotificacionesSkeleton />
  }

  return (
    <NotificacionesForm
      key={config ? 'loaded' : 'loading'}
      initialConfig={config}
      onSave={handleSave}
    />
  )
}
