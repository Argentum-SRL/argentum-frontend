import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, PieChart, CreditCard, Target, Settings, ChevronLeft } from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import pageStyles from './NotificacionesConfigPage.module.css'
import cardStyles from '@/components/notificaciones/NotificacionesConfigModal.module.css'

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

const NotificacionesConfigPage: React.FC = () => {
  const navigate = useNavigate()
  const { config, updateConfig } = useNotificaciones()
  const [prevConfig, setPrevConfig] = useState<typeof config>(null)
  const [form, setForm] = useState(defaultFormState)
  const [isSaving, setIsSaving] = useState(false)

  if (config !== prevConfig) {
    setPrevConfig(config)
    if (config) {
      setForm({
        cuota_vence_anticipacion_dias: config.cuota_vence_anticipacion_dias,
        cuota_vence_web: config.cuota_vence_web,
        cuota_vence_whatsapp: config.cuota_vence_whatsapp,
        presupuesto_umbral_1: config.presupuesto_umbral_1,
        presupuesto_umbral_1_activo: config.presupuesto_umbral_1_activo,
        presupuesto_umbral_1_web: config.presupuesto_umbral_1_web,
        presupuesto_umbral_1_whatsapp: config.presupuesto_umbral_1_whatsapp,
        presupuesto_umbral_2_web: config.presupuesto_umbral_2_web,
        presupuesto_umbral_2_whatsapp: config.presupuesto_umbral_2_whatsapp,
        suscripcion_hoy_web: config.suscripcion_hoy_web,
        suscripcion_hoy_whatsapp: config.suscripcion_hoy_whatsapp,
        suscripcion_recordatorio_activo: config.suscripcion_recordatorio_activo,
        suscripcion_recordatorio_dias: config.suscripcion_recordatorio_dias,
        suscripcion_recordatorio_web: config.suscripcion_recordatorio_web,
        suscripcion_recordatorio_whatsapp: config.suscripcion_recordatorio_whatsapp,
        meta_alcanzada_activo: config.meta_alcanzada_activo,
        meta_alcanzada_web: config.meta_alcanzada_web,
        meta_alcanzada_whatsapp: config.meta_alcanzada_whatsapp,
        saldo_cero_web: config.saldo_cero_web,
        saldo_cero_whatsapp: config.saldo_cero_whatsapp,
        gasto_inusual_activo: config.gasto_inusual_activo,
        gasto_inusual_web: config.gasto_inusual_web,
        gasto_inusual_whatsapp: config.gasto_inusual_whatsapp,
        resumen_semanal_activo: config.resumen_semanal_activo,
        resumen_semanal_web: config.resumen_semanal_web,
        resumen_semanal_whatsapp: config.resumen_semanal_whatsapp,
        inactividad_activo: config.inactividad_activo,
        inactividad_dias: config.inactividad_dias,
        inactividad_web: config.inactividad_web,
        inactividad_whatsapp: config.inactividad_whatsapp,
        whatsapp_hora_envio: config.whatsapp_hora_envio,
        whatsapp_minuto_envio: config.whatsapp_minuto_envio,
      })
    }
  }

  const handleCheckboxChange = (field: keyof typeof defaultFormState) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleNumberChange = (field: keyof typeof defaultFormState, value: number, min: number, max: number) => {
    const safeValue = Math.max(min, Math.min(max, value || min))
    setForm((prev) => ({ ...prev, [field]: safeValue }))
  }

  const formatTimeValue = (hora: number, minuto: number) => {
    const h = String(hora).padStart(2, '0')
    const m = String(minuto).padStart(2, '0')
    return `${h}:${m}`
  }

  const handleTimeChange = (timeString: string) => {
    if (!timeString) return
    const [hStr, mStr] = timeString.split(':')
    const hora = parseInt(hStr, 10)
    const minuto = parseInt(mStr, 10)
    
    if (!isNaN(hora) && !isNaN(minuto)) {
      setForm((prev) => ({
        ...prev,
        whatsapp_hora_envio: Math.max(0, Math.min(23, hora)),
        whatsapp_minuto_envio: Math.max(0, Math.min(59, minuto)),
      }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateConfig(form)
      navigate(-1)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={pageStyles.root}>
      <header className={pageStyles.header}>
        <button
          onClick={() => navigate(-1)}
          className={pageStyles.backBtn}
          title="Volver"
          aria-label="Volver a la página anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className={pageStyles.titleArea}>
          <h1 className={pageStyles.title}>Configuración de Notificaciones</h1>
          <p className={pageStyles.desc}>Personalizá cómo y cuándo querés que te notifiquemos.</p>
        </div>
      </header>

      <div className={pageStyles.container}>
        <form onSubmit={handleSave} className={cardStyles.form}>
        <div className={cardStyles.topGrid}>
          {/* --- GENERAL DE CANALES --- */}
          <section className={cardStyles.section}>
            <h3 className={cardStyles.sectionTitle}>
              <Settings size={16} /> Resumen por WhatsApp
            </h3>
            <div className={cardStyles.card}>
              <div className={cardStyles.cardHeader}>
                <div className={cardStyles.cardMeta}>
                  <p className={cardStyles.cardTitle}>Horario de envío</p>
                  <p className={cardStyles.cardDesc}>
                    Tus avisos del día se enviarán juntos en un solo mensaje de WhatsApp a la hora que elijas.
                  </p>
                </div>
                <div>
                  <input
                    type="time"
                    value={formatTimeValue(form.whatsapp_hora_envio, form.whatsapp_minuto_envio)}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={cardStyles.timeInput}
                    aria-label="Horario de envío diario"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* --- CUOTAS --- */}
          <section className={cardStyles.section}>
            <h3 className={cardStyles.sectionTitle}>
              <Calendar size={16} /> Alertas de Cuotas
            </h3>
            <div className={cardStyles.card}>
              <div className={cardStyles.cardHeader}>
                <div className={cardStyles.cardMeta}>
                  <p className={cardStyles.cardTitle}>Cuotas próximas a vencer</p>
                  <p className={cardStyles.cardDesc}>Avisar cuando tengas cuotas pendientes de pago.</p>
                </div>
              </div>
              <div className={cardStyles.cardControls}>
                <div className={cardStyles.inputGroup}>
                  <label htmlFor="cuota_vence_anticipacion_dias">Anticipación:</label>
                  <input
                    type="number"
                    id="cuota_vence_anticipacion_dias"
                    value={form.cuota_vence_anticipacion_dias}
                    onChange={(e) =>
                      handleNumberChange('cuota_vence_anticipacion_dias', parseInt(e.target.value), 1, 30)
                    }
                    className={cardStyles.numberInput}
                    min={1}
                    max={30}
                  />
                  <span>días</span>
                </div>
                <div className={cardStyles.channels}>
                  <label className={cardStyles.channelLabel}>
                    <input
                      type="checkbox"
                      checked={form.cuota_vence_web}
                      onChange={() => handleCheckboxChange('cuota_vence_web')}
                      className={cardStyles.channelCheckbox}
                    />
                    En la web
                  </label>
                  <label className={cardStyles.channelLabel}>
                    <input
                      type="checkbox"
                      checked={form.cuota_vence_whatsapp}
                      onChange={() => handleCheckboxChange('cuota_vence_whatsapp')}
                      className={cardStyles.channelCheckbox}
                    />
                    Por WhatsApp
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

          {/* --- PRESUPUESTOS --- */}
          <section className={cardStyles.section}>
            <h3 className={cardStyles.sectionTitle}>
              <PieChart size={16} /> Alertas de Presupuestos
            </h3>
            <div className={cardStyles.grid}>
              {/* Umbral 1 */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Alerta de límite</p>
                    <p className={cardStyles.cardDesc}>Avisar cuando estés cerca de agotar un presupuesto.</p>
                  </div>
                  <label className={cardStyles.switch}>
                    <input
                      type="checkbox"
                      checked={form.presupuesto_umbral_1_activo}
                      onChange={() => handleCheckboxChange('presupuesto_umbral_1_activo')}
                      aria-label="Activar aviso de límite de presupuesto"
                    />
                    <span className={cardStyles.slider} />
                  </label>
                </div>
                {form.presupuesto_umbral_1_activo && (
                  <div className={cardStyles.cardControls}>
                    <div className={cardStyles.inputGroup}>
                      <label htmlFor="presupuesto_umbral_1">Porcentaje límite:</label>
                      <input
                        type="number"
                        id="presupuesto_umbral_1"
                        value={form.presupuesto_umbral_1}
                        onChange={(e) =>
                          handleNumberChange('presupuesto_umbral_1', parseInt(e.target.value), 50, 95)
                        }
                        className={cardStyles.numberInput}
                        min={50}
                        max={95}
                      />
                      <span>%</span>
                    </div>
                    <div className={cardStyles.channels}>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.presupuesto_umbral_1_web}
                          onChange={() => handleCheckboxChange('presupuesto_umbral_1_web')}
                          className={cardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.presupuesto_umbral_1_whatsapp}
                          onChange={() => handleCheckboxChange('presupuesto_umbral_1_whatsapp')}
                          className={cardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Umbral 2 (100% - Agotado) */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Presupuesto agotado</p>
                    <p className={cardStyles.cardDesc}>Avisar cuando un presupuesto se consuma por completo.</p>
                  </div>
                </div>
                <div className={cardStyles.cardControls}>
                  <div className={cardStyles.channels}>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.presupuesto_umbral_2_web}
                        onChange={() => handleCheckboxChange('presupuesto_umbral_2_web')}
                        className={cardStyles.channelCheckbox}
                      />
                      En la web
                    </label>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.presupuesto_umbral_2_whatsapp}
                        onChange={() => handleCheckboxChange('presupuesto_umbral_2_whatsapp')}
                        className={cardStyles.channelCheckbox}
                      />
                      Por WhatsApp
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- SUSCRIPCIONES --- */}
          <section className={cardStyles.section}>
            <h3 className={cardStyles.sectionTitle}>
              <CreditCard size={16} /> Alertas de Suscripciones
            </h3>
            <div className={cardStyles.grid}>
              {/* Cobro del día */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Día de cobro</p>
                    <p className={cardStyles.cardDesc}>Avisar el mismo día que se cobra una suscripción.</p>
                  </div>
                </div>
                <div className={cardStyles.cardControls}>
                  <div className={cardStyles.channels}>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.suscripcion_hoy_web}
                        onChange={() => handleCheckboxChange('suscripcion_hoy_web')}
                        className={cardStyles.channelCheckbox}
                      />
                      En la web
                    </label>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.suscripcion_hoy_whatsapp}
                        onChange={() => handleCheckboxChange('suscripcion_hoy_whatsapp')}
                        className={cardStyles.channelCheckbox}
                      />
                      Por WhatsApp
                    </label>
                  </div>
                </div>
              </div>

              {/* Recordatorio anticipado */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Aviso anticipado</p>
                    <p className={cardStyles.cardDesc}>Avisar unos días antes del cobro para preparar el pago.</p>
                  </div>
                  <label className={cardStyles.switch}>
                    <input
                      type="checkbox"
                      checked={form.suscripcion_recordatorio_activo}
                      onChange={() => handleCheckboxChange('suscripcion_recordatorio_activo')}
                      aria-label="Activar aviso anticipado de suscripción"
                    />
                    <span className={cardStyles.slider} />
                  </label>
                </div>
                {form.suscripcion_recordatorio_activo && (
                  <div className={cardStyles.cardControls}>
                    <div className={cardStyles.inputGroup}>
                      <label htmlFor="suscripcion_recordatorio_dias">Anticipación:</label>
                      <input
                        type="number"
                        id="suscripcion_recordatorio_dias"
                        value={form.suscripcion_recordatorio_dias}
                        onChange={(e) =>
                          handleNumberChange('suscripcion_recordatorio_dias', parseInt(e.target.value), 1, 14)
                        }
                        className={cardStyles.numberInput}
                        min={1}
                        max={14}
                      />
                      <span>días</span>
                    </div>
                    <div className={cardStyles.channels}>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.suscripcion_recordatorio_web}
                          onChange={() => handleCheckboxChange('suscripcion_recordatorio_web')}
                          className={cardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.suscripcion_recordatorio_whatsapp}
                          onChange={() => handleCheckboxChange('suscripcion_recordatorio_whatsapp')}
                          className={cardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* --- METAS Y FINANZAS --- */}
          <section className={cardStyles.section}>
            <h3 className={cardStyles.sectionTitle}>
              <Target size={16} /> Finanzas y Metas
            </h3>
            <div className={cardStyles.grid}>
              {/* Metas alcanzadas */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Meta cumplida</p>
                    <p className={cardStyles.cardDesc}>Avisar cuando completes una meta de ahorro.</p>
                  </div>
                  <label className={cardStyles.switch}>
                    <input
                      type="checkbox"
                      checked={form.meta_alcanzada_activo}
                      onChange={() => handleCheckboxChange('meta_alcanzada_activo')}
                      aria-label="Activar aviso de meta cumplida"
                    />
                    <span className={cardStyles.slider} />
                  </label>
                </div>
                {form.meta_alcanzada_activo && (
                  <div className={cardStyles.cardControls}>
                    <div className={cardStyles.channels}>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.meta_alcanzada_web}
                          onChange={() => handleCheckboxChange('meta_alcanzada_web')}
                          className={cardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.meta_alcanzada_whatsapp}
                          onChange={() => handleCheckboxChange('meta_alcanzada_whatsapp')}
                          className={cardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Saldo en Cero */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Billetera sin fondos</p>
                    <p className={cardStyles.cardDesc}>Avisar cuando una billetera se quede sin dinero.</p>
                  </div>
                </div>
                <div className={cardStyles.cardControls}>
                  <div className={cardStyles.channels}>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.saldo_cero_web}
                        onChange={() => handleCheckboxChange('saldo_cero_web')}
                        className={cardStyles.channelCheckbox}
                      />
                      En la web
                    </label>
                    <label className={cardStyles.channelLabel}>
                      <input
                        type="checkbox"
                        checked={form.saldo_cero_whatsapp}
                        onChange={() => handleCheckboxChange('saldo_cero_whatsapp')}
                        className={cardStyles.channelCheckbox}
                      />
                      Por WhatsApp
                    </label>
                  </div>
                </div>
              </div>

              {/* Gasto inusual */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Gasto inusual</p>
                    <p className={cardStyles.cardDesc}>Avisar cuando se registre un gasto llamativamente alto.</p>
                  </div>
                  <label className={cardStyles.switch}>
                    <input
                      type="checkbox"
                      checked={form.gasto_inusual_activo}
                      onChange={() => handleCheckboxChange('gasto_inusual_activo')}
                      aria-label="Activar aviso de gasto inusual"
                    />
                    <span className={cardStyles.slider} />
                  </label>
                </div>
                {form.gasto_inusual_activo && (
                  <div className={cardStyles.cardControls}>
                    <div className={cardStyles.channels}>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.gasto_inusual_web}
                          onChange={() => handleCheckboxChange('gasto_inusual_web')}
                          className={cardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.gasto_inusual_whatsapp}
                          onChange={() => handleCheckboxChange('gasto_inusual_whatsapp')}
                          className={cardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Inactividad */}
              <div className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div className={cardStyles.cardMeta}>
                    <p className={cardStyles.cardTitle}>Alerta de inactividad</p>
                    <p className={cardStyles.cardDesc}>Avisar si pasaron varios días sin registrar movimientos.</p>
                  </div>
                  <label className={cardStyles.switch}>
                    <input
                      type="checkbox"
                      checked={form.inactividad_activo}
                      onChange={() => handleCheckboxChange('inactividad_activo')}
                      aria-label="Activar aviso de inactividad"
                    />
                    <span className={cardStyles.slider} />
                  </label>
                </div>
                {form.inactividad_activo && (
                  <div className={cardStyles.cardControls}>
                    <div className={cardStyles.inputGroup}>
                      <label htmlFor="inactividad_dias">Días sin registrar:</label>
                      <input
                        type="number"
                        id="inactividad_dias"
                        value={form.inactividad_dias}
                        onChange={(e) =>
                          handleNumberChange('inactividad_dias', parseInt(e.target.value), 3, 30)
                        }
                        className={cardStyles.numberInput}
                        min={3}
                        max={30}
                      />
                      <span>días</span>
                    </div>
                    <div className={cardStyles.channels}>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.inactividad_web}
                          onChange={() => handleCheckboxChange('inactividad_web')}
                          className={cardStyles.channelCheckbox}
                        />
                        En la web
                      </label>
                      <label className={cardStyles.channelLabel}>
                        <input
                          type="checkbox"
                          checked={form.inactividad_whatsapp}
                          onChange={() => handleCheckboxChange('inactividad_whatsapp')}
                          className={cardStyles.channelCheckbox}
                        />
                        Por WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* --- ACTIONS FOOTER --- */}
          <div className={cardStyles.footer}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={cardStyles.btnCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button type="submit" className={cardStyles.btnSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NotificacionesConfigPage
