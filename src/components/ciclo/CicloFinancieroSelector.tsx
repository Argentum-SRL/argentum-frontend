import React, { useState, useEffect } from 'react'
import { Calendar, Building2, Check, AlertCircle, RefreshCw } from '@/components/ui/icons'
import { getPreviewFechaCobro } from '@/services/onboarding.service'
import styles from './CicloFinancieroSelector.module.css'

export interface CicloValue {
  tipo: 'dia_fijo' | 'regla'
  valor: string
  direccion: 'anterior' | 'posterior' | null
}

interface Props {
  value: CicloValue
  onChange: (val: CicloValue) => void
  disabled?: boolean
}

const PRESET_DAYS = ['1', '5', '10', '15', '20', '25', '28']

const BUSINESS_DAY_OPTIONS = [
  {
    id: 'dia_habil_4',
    title: '4° día hábil del mes',
    subtitle: 'Estándar Ley de Contrato de Trabajo (Comercio, Estatales)',
    badge: 'Más común',
  },
  {
    id: 'ultimo_dia_habil',
    title: 'Último día hábil del mes',
    subtitle: 'Liquidación a fin de mes (Bancos, Empresas privadas)',
    badge: 'Popular',
  },
  {
    id: 'primer_dia_habil',
    title: '1° día hábil del mes',
    subtitle: 'Cobro el primer día laborable bancario',
  },
]

const OTHER_BUSINESS_DAYS = [
  { id: 'dia_habil_2', label: '2° día hábil' },
  { id: 'dia_habil_3', label: '3° día hábil' },
  { id: 'dia_habil_5', label: '5° día hábil' },
  { id: 'dia_habil_6', label: '6° día hábil' },
  { id: 'dia_habil_7', label: '7° día hábil' },
  { id: 'dia_habil_8', label: '8° día hábil' },
  { id: 'dia_habil_9', label: '9° día hábil' },
  { id: 'dia_habil_10', label: '10° día hábil' },
]

export const CicloFinancieroSelector: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { tipo, valor, direccion } = value

  // Preview state
  const [preview, setPreview] = useState<{
    proxima_fecha_cobro: string
    fue_ajustada: boolean
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Sub-selector for custom business day
  const isCustomBusinessDay =
    tipo === 'regla' &&
    !BUSINESS_DAY_OPTIONS.some((opt) => opt.id === valor) &&
    OTHER_BUSINESS_DAYS.some((opt) => opt.id === valor)

  const [userExpandedOther, setUserExpandedOther] = useState(false)
  const showOtherBusinessDays = isCustomBusinessDay || userExpandedOther

  const num = tipo === 'dia_fijo' ? parseInt(valor, 10) : 0
  const isValid = tipo === 'dia_fijo' ? !isNaN(num) && num >= 1 && num <= 31 : Boolean(valor)

  // Live preview effect with debouncing
  useEffect(() => {
    if (!isValid) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const data = await getPreviewFechaCobro(
          {
            tipo,
            valor,
            direccion: tipo === 'regla' ? null : direccion,
          },
          controller.signal
        )
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
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isValid, tipo, valor, direccion])

  // Handlers
  const handleModeChange = (newTipo: 'dia_fijo' | 'regla') => {
    if (disabled || newTipo === tipo) return

    if (newTipo === 'dia_fijo') {
      onChange({
        tipo: 'dia_fijo',
        valor: '1',
        direccion: direccion || 'anterior',
      })
    } else {
      onChange({
        tipo: 'regla',
        valor: 'dia_habil_4',
        direccion: null,
      })
      setUserExpandedOther(false)
    }
  }

  const handleDaySelect = (dayStr: string) => {
    if (disabled) return
    onChange({
      ...value,
      valor: dayStr,
    })
  }

  const handleContingencyChange = (newDir: 'anterior' | 'posterior' | null) => {
    if (disabled) return
    onChange({
      ...value,
      direccion: newDir,
    })
  }

  const handleBusinessDaySelect = (ruleId: string) => {
    if (disabled) return
    setUserExpandedOther(false)
    onChange({
      tipo: 'regla',
      valor: ruleId,
      direccion: null,
    })
  }

  const handleOtherBusinessDaySelect = (ruleId: string) => {
    if (disabled) return
    onChange({
      tipo: 'regla',
      valor: ruleId,
      direccion: null,
    })
  }

  // Format preview date nicely
  const getFormattedDate = (isoDate: string) => {
    try {
      const dt = new Date(isoDate + 'T12:00:00')
      return dt.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return isoDate
    }
  }

  return (
    <div className={styles.container}>
      {/* ── PASO 1: Selector de Modo ── */}
      <div className={styles.modeGrid}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeChange('dia_fijo')}
          className={`${styles.modeCard} ${tipo === 'dia_fijo' ? styles.modeCardActive : ''}`}
        >
          <div className={styles.modeIconWrap}>
            <Calendar size={20} />
          </div>
          <div className={styles.modeText}>
            <div className={styles.modeTitle}>
              <span>Por fecha fija</span>
              {tipo === 'dia_fijo' && <Check size={16} className={styles.checkBadge} />}
            </div>
            <span className={styles.modeSubtitle}>
              Cobro un día específico del mes (ej: 28, 5, 10 o 1)
            </span>
          </div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeChange('regla')}
          className={`${styles.modeCard} ${tipo === 'regla' ? styles.modeCardActive : ''}`}
        >
          <div className={styles.modeIconWrap}>
            <Building2 size={20} />
          </div>
          <div className={styles.modeText}>
            <div className={styles.modeTitle}>
              <span>Por día hábil</span>
              {tipo === 'regla' && <Check size={16} className={styles.checkBadge} />}
            </div>
            <span className={styles.modeSubtitle}>
              Cobro según días hábiles bancarios (ej: 4to día hábil o fin de mes)
            </span>
          </div>
        </button>
      </div>

      {/* ── PASO 2: Contenido Dinámico ── */}
      {tipo === 'dia_fijo' ? (
        <div className={styles.sectionBlock}>
          {/* Selector de Día 1..31 */}
          <div className={styles.blockHeader}>
            <span className={styles.blockTitle}>¿Qué día del mes te depositan?</span>
            <span className={styles.highlightPill}>
              Día {valor || '1'} de cada mes
            </span>
          </div>

          <div className={styles.dayPickerContainer}>
            {/* Presets rápidos */}
            <div className={styles.quickDaysRow}>
              <span className={styles.blockHint}>Frecuentes:</span>
              {PRESET_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDaySelect(d)}
                  className={`${styles.quickDayBtn} ${valor === d ? styles.quickDayBtnActive : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Grilla completa 1 a 31 */}
            <div className={styles.dayGrid} role="radiogroup" aria-label="Seleccionar día del mes">
              {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => {
                const isSelected = valor === d
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDaySelect(d)}
                    className={`${styles.dayBtn} ${isSelected ? styles.dayBtnActive : ''}`}
                    aria-checked={isSelected}
                    role="radio"
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pregunta de Contingencia */}
          <div className={styles.contingencyWrapper}>
            <span className={styles.blockTitle}>
              Si cae feriado o fin de semana, ¿te depositan...?
            </span>

            <div className={styles.contingencyCards}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleContingencyChange('anterior')}
                className={`${styles.contingencyCard} ${
                  direccion === 'anterior' ? styles.contingencyCardActive : ''
                }`}
              >
                <div className={styles.contingencyTitle}>
                  <span>Antes</span>
                  {direccion === 'anterior' && <Check size={14} className={styles.checkBadge} />}
                </div>
                <span className={styles.contingencyDesc}>
                  El día hábil previo (ej. viernes anterior)
                </span>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => handleContingencyChange('posterior')}
                className={`${styles.contingencyCard} ${
                  direccion === 'posterior' ? styles.contingencyCardActive : ''
                }`}
              >
                <div className={styles.contingencyTitle}>
                  <span>Después</span>
                  {direccion === 'posterior' && <Check size={14} className={styles.checkBadge} />}
                </div>
                <span className={styles.contingencyDesc}>
                  El siguiente día hábil (ej. lunes posterior)
                </span>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => handleContingencyChange(null)}
                className={`${styles.contingencyCard} ${
                  direccion === null ? styles.contingencyCardActive : ''
                }`}
              >
                <div className={styles.contingencyTitle}>
                  <span>El mismo día</span>
                  {direccion === null && <Check size={14} className={styles.checkBadge} />}
                </div>
                <span className={styles.contingencyDesc}>
                  Transferencia directa sin postergación
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          <div className={styles.blockHeader}>
            <span className={styles.blockTitle}>Seleccioná tu esquema de día hábil</span>
            <span className={styles.blockHint}>
              Descuenta automáticamente sábados, domingos y feriados
            </span>
          </div>

          <div className={styles.businessDayCards}>
            {BUSINESS_DAY_OPTIONS.map((opt) => {
              const isSelected = valor === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleBusinessDaySelect(opt.id)}
                  className={`${styles.businessCard} ${isSelected ? styles.businessCardActive : ''}`}
                >
                  <div className={styles.businessCardContent}>
                    <div className={styles.businessCardTitle}>
                      <span>{opt.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {opt.badge && <span className={styles.badgePopular}>{opt.badge}</span>}
                        {isSelected && <Check size={16} className={styles.checkBadge} />}
                      </div>
                    </div>
                    <span className={styles.businessCardSubtitle}>{opt.subtitle}</span>
                  </div>
                </button>
              )
            })}

            {/* Opción para otro día hábil */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setUserExpandedOther(true)
                if (!OTHER_BUSINESS_DAYS.some((o) => o.id === valor)) {
                  handleOtherBusinessDaySelect('dia_habil_5')
                }
              }}
              className={`${styles.businessCard} ${
                showOtherBusinessDays ? styles.businessCardActive : ''
              }`}
            >
              <div className={styles.businessCardContent}>
                <div className={styles.businessCardTitle}>
                  <span>Otro día hábil...</span>
                  {showOtherBusinessDays && <Check size={16} className={styles.checkBadge} />}
                </div>
                <span className={styles.businessCardSubtitle}>
                  Elegí entre el 2° y el 10° día hábil del mes
                </span>
              </div>
            </button>
          </div>

          {/* Sub-picker del 2° al 10° día hábil */}
          {showOtherBusinessDays && (
            <div className={styles.customDaySelector}>
              <span className={styles.customDayLabel}>Día hábil específico:</span>
              <div className={styles.customDayPills}>
                {OTHER_BUSINESS_DAYS.map((o) => {
                  const isSelected = valor === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleOtherBusinessDaySelect(o.id)}
                      className={`${styles.customDayPill} ${
                        isSelected ? styles.customDayPillActive : ''
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 3: Preview Reactivo en Vivo ── */}
      <div className={styles.previewCard}>
        <div className={styles.previewIconBox}>
          {loadingPreview ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Calendar size={18} />
          )}
        </div>

        <div className={styles.previewContent}>
          <span className={styles.previewEyebrow}>Inicio del próximo ciclo</span>
          {loadingPreview ? (
            <div className={styles.previewLoading}>
              <span>Calculando según calendario de feriados...</span>
            </div>
          ) : preview ? (
            <div className={styles.previewDate}>
              {getFormattedDate(preview.proxima_fecha_cobro)}
            </div>
          ) : (
            <div className={styles.previewDate}>--</div>
          )}
        </div>

        {!loadingPreview && preview?.fue_ajustada && (
          <div className={styles.previewBadge}>
            <AlertCircle size={13} />
            <span>Ajustado por feriado / fin de semana</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default CicloFinancieroSelector
