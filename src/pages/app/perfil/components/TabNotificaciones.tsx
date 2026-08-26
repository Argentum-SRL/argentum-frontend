import React, { useState } from 'react'
import {
  Clock,
  CreditCard,
  PieChart,
  Repeat,
  Target,
  AlertTriangle,
  Activity,
  Globe,
  MessageSquare,
  Save,
} from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import type { ConfiguracionNotificacion } from '@/types'
import { useToast } from '@/hooks/useToast'
import { TimeInput } from '@/components/ui'
import styles from '../PerfilPage.module.css'

const defaultFormState = {
  cuota_vence_anticipacion_dias: 3,
  cuota_vence_web: true,
  cuota_vence_whatsapp: true,
  presupuesto_umbral_1: 80,
  presupuesto_umbral_1_activo: true,
  presupuesto_umbral_1_web: true,
  presupuesto_umbral_1_whatsapp: false,
  presupuesto_umbral_2_web: true,
  presupuesto_umbral_2_whatsapp: true,
  suscripcion_hoy_web: true,
  suscripcion_hoy_whatsapp: true,
  suscripcion_recordatorio_activo: true,
  suscripcion_recordatorio_dias: 3,
  suscripcion_recordatorio_web: true,
  suscripcion_recordatorio_whatsapp: false,
  meta_alcanzada_activo: true,
  meta_alcanzada_web: true,
  meta_alcanzada_whatsapp: true,
  saldo_cero_web: true,
  saldo_cero_whatsapp: true,
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
  whatsapp_hora_envio: 9,
  whatsapp_minuto_envio: 0,
}

const buildInitialState = (config: ConfiguracionNotificacion | null) => {
  if (!config) return defaultFormState
  return {
    cuota_vence_anticipacion_dias: config.cuota_vence_anticipacion_dias ?? 3,
    cuota_vence_web: !!config.cuota_vence_web,
    cuota_vence_whatsapp: !!config.cuota_vence_whatsapp,
    presupuesto_umbral_1: config.presupuesto_umbral_1 ?? 80,
    presupuesto_umbral_1_activo: !!config.presupuesto_umbral_1_activo,
    presupuesto_umbral_1_web: !!config.presupuesto_umbral_1_web,
    presupuesto_umbral_1_whatsapp: !!config.presupuesto_umbral_1_whatsapp,
    presupuesto_umbral_2_web: !!config.presupuesto_umbral_2_web,
    presupuesto_umbral_2_whatsapp: !!config.presupuesto_umbral_2_whatsapp,
    suscripcion_hoy_web: !!config.suscripcion_hoy_web,
    suscripcion_hoy_whatsapp: !!config.suscripcion_hoy_whatsapp,
    suscripcion_recordatorio_activo: !!config.suscripcion_recordatorio_activo,
    suscripcion_recordatorio_dias: config.suscripcion_recordatorio_dias ?? 3,
    suscripcion_recordatorio_web: !!config.suscripcion_recordatorio_web,
    suscripcion_recordatorio_whatsapp: !!config.suscripcion_recordatorio_whatsapp,
    meta_alcanzada_activo: !!config.meta_alcanzada_activo,
    meta_alcanzada_web: !!config.meta_alcanzada_web,
    meta_alcanzada_whatsapp: !!config.meta_alcanzada_whatsapp,
    saldo_cero_web: !!config.saldo_cero_web,
    saldo_cero_whatsapp: !!config.saldo_cero_whatsapp,
    gasto_inusual_activo: !!config.gasto_inusual_activo,
    gasto_inusual_web: !!config.gasto_inusual_web,
    gasto_inusual_whatsapp: !!config.gasto_inusual_whatsapp,
    resumen_semanal_activo: !!config.resumen_semanal_activo,
    resumen_semanal_web: !!config.resumen_semanal_web,
    resumen_semanal_whatsapp: !!config.resumen_semanal_whatsapp,
    inactividad_activo: !!config.inactividad_activo,
    inactividad_dias: config.inactividad_dias ?? 7,
    inactividad_web: !!config.inactividad_web,
    inactividad_whatsapp: !!config.inactividad_whatsapp,
    whatsapp_hora_envio: config.whatsapp_hora_envio ?? 9,
    whatsapp_minuto_envio: config.whatsapp_minuto_envio ?? 0,
  }
}

const NotificacionesForm: React.FC<{
  initialConfig: ConfiguracionNotificacion | null
  onSave: (config: typeof defaultFormState) => Promise<void>
}> = ({ initialConfig, onSave }) => {
  const [form, setForm] = useState(() => buildInitialState(initialConfig))
  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (field: keyof typeof defaultFormState) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleNumber = (field: keyof typeof defaultFormState, val: number, min: number, max: number) => {
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
    setIsSaving(true)
    try {
      await onSave(form)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.notifContainer}>
      {/* 1. Horario de Envío de WhatsApp & Guardar */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Clock size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Horario de Notificaciones WhatsApp</h3>
            <p>Tus alertas del día se agruparán y enviarán de forma ordenada en este horario</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className={styles.timeInputBox}>
              <TimeInput
                value={formatTime(form.whatsapp_hora_envio, form.whatsapp_minuto_envio)}
                onChange={(val) => handleTimeChange(val)}
                ariaLabel="Horario diario de envío por WhatsApp"
              />
            </div>
            <button
              type="submit"
              className={styles.saveBtnPrimary}
              disabled={isSaving}
            >
              <Save size={15} />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Grid de Categorías de Notificaciones */}
      <div className={styles.notifCardsGrid}>
        {/* Tarjeta A: Tarjetas y Cuotas */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <CreditCard size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Vencimiento de Tarjetas</h4>
              <p>Recordatorio preventivo previo al cierre o pago de resúmenes</p>
            </div>
          </div>

          <div className={styles.notifCardBody}>
            <div className={styles.inlineNumberControl}>
              <label htmlFor="dias-tarjeta-input">Anticipación:</label>
              <input
                id="dias-tarjeta-input"
                type="number"
                min={1}
                max={30}
                value={form.cuota_vence_anticipacion_dias}
                onChange={(e) =>
                  handleNumber('cuota_vence_anticipacion_dias', parseInt(e.target.value), 1, 30)
                }
                className={styles.smallNumberInput}
              />
              <span>días antes</span>
            </div>

            <div className={styles.channelsGroup}>
              <button
                type="button"
                className={`${styles.channelPill} ${form.cuota_vence_web ? styles.channelActive : ''}`}
                onClick={() => handleToggle('cuota_vence_web')}
              >
                <Globe size={13} />
                <span>Web</span>
              </button>
              <button
                type="button"
                className={`${styles.channelPill} ${form.cuota_vence_whatsapp ? styles.channelActive : ''}`}
                onClick={() => handleToggle('cuota_vence_whatsapp')}
              >
                <MessageSquare size={13} />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta B: Presupuestos */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <PieChart size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Límites de Presupuesto</h4>
              <p>Aviso al acercarte al tope de tus categorías presupuestadas</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.presupuesto_umbral_1_activo}
                onChange={() => handleToggle('presupuesto_umbral_1_activo')}
                aria-label="Activar alerta de límite de presupuesto"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {form.presupuesto_umbral_1_activo && (
            <div className={styles.notifCardBody}>
              <div className={styles.inlineNumberControl}>
                <label htmlFor="umbral-pres-input">Avisar al superar:</label>
                <input
                  id="umbral-pres-input"
                  type="number"
                  min={50}
                  max={95}
                  value={form.presupuesto_umbral_1}
                  onChange={(e) =>
                    handleNumber('presupuesto_umbral_1', parseInt(e.target.value), 50, 95)
                  }
                  className={styles.smallNumberInput}
                />
                <span>% consumido</span>
              </div>

              <div className={styles.channelsGroup}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.presupuesto_umbral_1_web ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('presupuesto_umbral_1_web')}
                >
                  <Globe size={13} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${
                    form.presupuesto_umbral_1_whatsapp ? styles.channelActive : ''
                  }`}
                  onClick={() => handleToggle('presupuesto_umbral_1_whatsapp')}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta C: Suscripciones */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <Repeat size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Suscripciones & Recurrentes</h4>
              <p>Avisos programados previos a cargos automáticos de tus servicios</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.suscripcion_recordatorio_activo}
                onChange={() => handleToggle('suscripcion_recordatorio_activo')}
                aria-label="Activar aviso anticipado de suscripción"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {form.suscripcion_recordatorio_activo && (
            <div className={styles.notifCardBody}>
              <div className={styles.inlineNumberControl}>
                <label htmlFor="dias-susc-input">Anticipación:</label>
                <input
                  id="dias-susc-input"
                  type="number"
                  min={1}
                  max={14}
                  value={form.suscripcion_recordatorio_dias}
                  onChange={(e) =>
                    handleNumber('suscripcion_recordatorio_dias', parseInt(e.target.value), 1, 14)
                  }
                  className={styles.smallNumberInput}
                />
                <span>días antes</span>
              </div>

              <div className={styles.channelsGroup}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.suscripcion_recordatorio_web ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('suscripcion_recordatorio_web')}
                >
                  <Globe size={13} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${
                    form.suscripcion_recordatorio_whatsapp ? styles.channelActive : ''
                  }`}
                  onClick={() => handleToggle('suscripcion_recordatorio_whatsapp')}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta D: Metas de Ahorro */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <Target size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Metas de Ahorro Alcanzadas</h4>
              <p>Celebrar y notificar cuando alcances el 100% de un objetivo</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.meta_alcanzada_activo}
                onChange={() => handleToggle('meta_alcanzada_activo')}
                aria-label="Activar aviso de meta cumplida"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {form.meta_alcanzada_activo && (
            <div className={styles.notifCardBody}>
              <div className={styles.channelsGroup}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.meta_alcanzada_web ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('meta_alcanzada_web')}
                >
                  <Globe size={13} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.meta_alcanzada_whatsapp ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('meta_alcanzada_whatsapp')}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta E: Gasto Inusual */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <AlertTriangle size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Detección de Gasto Inusual</h4>
              <p>Avisar cuando se registre una transacción llamativamente alta</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.gasto_inusual_activo}
                onChange={() => handleToggle('gasto_inusual_activo')}
                aria-label="Activar aviso de gasto inusual"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {form.gasto_inusual_activo && (
            <div className={styles.notifCardBody}>
              <div className={styles.channelsGroup}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.gasto_inusual_web ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('gasto_inusual_web')}
                >
                  <Globe size={13} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.gasto_inusual_whatsapp ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('gasto_inusual_whatsapp')}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta F: Alerta de Inactividad */}
        <div className={styles.notifCard}>
          <div className={styles.notifCardHeader}>
            <div className={styles.notifCardIcon}>
              <Activity size={18} />
            </div>
            <div className={styles.notifCardTitleGroup}>
              <h4>Recordatorio de Registro</h4>
              <p>Avisarte si pasaron varios días sin asentar nuevos movimientos</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={form.inactividad_activo}
                onChange={() => handleToggle('inactividad_activo')}
                aria-label="Activar aviso de inactividad"
              />
              <span className={styles.slider} />
            </label>
          </div>

          {form.inactividad_activo && (
            <div className={styles.notifCardBody}>
              <div className={styles.inlineNumberControl}>
                <label htmlFor="dias-inact-input">Sin registrar durante:</label>
                <input
                  id="dias-inact-input"
                  type="number"
                  min={3}
                  max={30}
                  value={form.inactividad_dias}
                  onChange={(e) =>
                    handleNumber('inactividad_dias', parseInt(e.target.value), 3, 30)
                  }
                  className={styles.smallNumberInput}
                />
                <span>días</span>
              </div>

              <div className={styles.channelsGroup}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.inactividad_web ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('inactividad_web')}
                >
                  <Globe size={13} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${form.inactividad_whatsapp ? styles.channelActive : ''}`}
                  onClick={() => handleToggle('inactividad_whatsapp')}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

export const TabNotificaciones: React.FC = () => {
  const { config, updateConfig } = useNotificaciones()
  const { showToast } = useToast()

  const handleSave = async (formValues: typeof defaultFormState) => {
    try {
      await updateConfig(formValues)
      showToast('Preferencias de notificaciones guardadas exitosamente', 'success')
    } catch (err) {
      console.error(err)
      showToast('Error al guardar las preferencias de notificaciones', 'error')
    }
  }

  return (
    <NotificacionesForm
      key={config ? 'loaded' : 'loading'}
      initialConfig={config}
      onSave={handleSave}
    />
  )
}
