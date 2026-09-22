import React, { useState, useEffect } from 'react';
import { RefreshCcw, ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { Button, MontoInput } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import type { IPCData } from '@/types/tools';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import styles from './ToolsComponents.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

interface ConvenienciaFormProps {
  formData: {
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_contado: number | null;
    precio_total_cuotas: number | null;
    cantidad_cuotas: number | null;
    inflacion_mensual: string;
    tiene_interes: boolean;
    tna: string;
  }>>;
  calculando: boolean;
  calcular: () => void;
  cuotaCalculada: number | null;
  ipcData: IPCData | null;
  ipcLoading: boolean;
  ipcError: boolean;
}

export const ConvenienciaForm: React.FC<ConvenienciaFormProps> = ({
  formData,
  setFormData,
  calculando,
  calcular,
  cuotaCalculada,
  ipcData,
  ipcLoading,
  ipcError
}) => {
  const [step, setStep] = useState<1 | 2>(formData.precio_contado && formData.precio_contado > 0 ? 2 : 1);
  const [isCustomCuotas, setIsCustomCuotas] = useState<boolean>(
    Boolean(formData.cantidad_cuotas && !QUICK_CUOTAS.includes(formData.cantidad_cuotas))
  );

  const handleChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tiene_interes') {
        if (value === true)  next.precio_total_cuotas = null;
        else                 next.tna = '';
      }
      return next;
    });
  };

  const syncIpc = () => {
    if (ipcData?.valor_mensual != null) {
      handleChange('inflacion_mensual', ipcData.valor_mensual.toString());
    }
  };

  // Pre-fill inflation if empty when IPC data is available
  useEffect(() => {
    if (ipcData?.valor_mensual != null) {
      setFormData(prev => {
        if (!prev.inflacion_mensual) {
          return { ...prev, inflacion_mensual: ipcData.valor_mensual.toString() };
        }
        return prev;
      });
    }
  }, [ipcData?.valor_mensual, setFormData]);

  const isStep1Invalid =
    formData.precio_contado === null ||
    formData.precio_contado <= 0 ||
    formData.precio_contado > MAX_MONTO_INTEGRIDAD;

  // Progressive unlocking conditions for Step 2
  const hasCuotas =
    formData.cantidad_cuotas !== null &&
    !isNaN(formData.cantidad_cuotas) &&
    formData.cantidad_cuotas >= 1 &&
    formData.cantidad_cuotas <= 120;

  const hasFinancingCondition =
    (!formData.tiene_interes && (
      formData.precio_total_cuotas !== null &&
      formData.precio_total_cuotas > 0 &&
      formData.precio_total_cuotas <= MAX_MONTO_INTEGRIDAD
    )) ||
    (formData.tiene_interes && (
      Boolean(formData.tna) &&
      !isNaN(parseFloat(formData.tna)) &&
      parseFloat(formData.tna) >= 0.1 &&
      parseFloat(formData.tna) <= 3000
    ));

  const hasInflation =
    Boolean(formData.inflacion_mensual) &&
    !isNaN(parseFloat(formData.inflacion_mensual)) &&
    parseFloat(formData.inflacion_mensual) >= 0 &&
    parseFloat(formData.inflacion_mensual) <= 100;

  const isFormInvalid =
    isStep1Invalid ||
    !hasCuotas ||
    !hasFinancingCondition ||
    !hasInflation;

  const ipcFuenteLabel = ipcLoading
    ? 'Cargando IPC…'
    : ipcError || !ipcData
      ? 'IPC manual'
      : ipcData.es_estimado
        ? `IPC estimado · ${ipcData.fuente}`
        : `IPC oficial · ${ipcData.fuente}`;

  return (
    <div className={styles.card}>
      {/* ── Stepper Header ── */}
      <div className={styles.stepperHeader}>
        <div className={styles.stepperTrack}>
          <div
            className={`${styles.stepBadge} ${step === 1 ? styles.stepBadgeActive : styles.stepBadgeDone}`}
            onClick={() => step === 2 && setStep(1)}
            role={step === 2 ? 'button' : undefined}
          >
            {step > 1 ? <Check size={12} strokeWidth={3} /> : null}
            <span>01 Compra</span>
          </div>

          <span className={styles.stepSeparator}>→</span>

          <div className={`${styles.stepBadge} ${step === 2 ? styles.stepBadgeActive : styles.stepBadgePending}`}>
            <span>02 Financiación</span>
          </div>

          <span className={styles.stepSeparator}>→</span>

          <div className={`${styles.stepBadge} ${styles.stepBadgePending}`}>
            <span>03 Análisis</span>
          </div>
        </div>

        {step === 2 && formData.precio_contado && (
          <button
            type="button"
            className={styles.stepBackBtn}
            onClick={() => setStep(1)}
            title="Modificar precio de contado"
          >
            <ChevronLeft size={14} />
            <span>Contado: <strong>{formatMonto(formData.precio_contado, 'ARS')}</strong></span>
          </button>
        )}
      </div>

      {/* ── PASO 1: Precio de contado ── */}
      {step === 1 && (
        <div className={styles.step1Box}>
          <div className={styles.step1Header}>
            <h2 className={styles.step1Title}>¿Cuánto cuesta de contado?</h2>
            <p className={styles.step1Subtitle}>
              Lo que pagarías si pagás todo junto hoy
            </p>
          </div>

          <div className={styles.formGroup}>
            <MontoInput
              label="Precio de contado"
              placeholder="0"
              value={formData.precio_contado}
              onChange={(val) => handleChange('precio_contado', val)}
              allowDecimals
              hideCurrency
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={isStep1Invalid}
            onClick={() => !isStep1Invalid && setStep(2)}
            type="button"
          >
            <span>Continuar</span>
            <ArrowRight size={16} style={{ marginLeft: 6, display: 'inline' }} />
          </Button>
        </div>
      )}

      {/* ── PASO 2: Financiación (Composición de 2 Zonas: Configuración + Resumen en Vivo) ── */}
      {step === 2 && (
        <div className={styles.step2Layout}>
          {/* ── ZONA IZQUIERDA: Configuración ── */}
          <div className={styles.step2ConfigZone}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>¿Cómo te ofrecen pagar?</h2>
              <p className={styles.cardSubtitle}>
                Elegí las cuotas y condiciones para comparar contra el pago al contado
              </p>
            </div>

            {/* ── 1. Cantidad de cuotas ── */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <label className={styles.label}>Cantidad de cuotas</label>
                {hasCuotas && (
                  <span className={styles.stepConfirmBadge}>
                    <Check size={11} strokeWidth={3} />
                    <span>{formData.cantidad_cuotas} cuotas seleccionadas</span>
                  </span>
                )}
              </div>

              <div className={styles.chipsRow}>
                {QUICK_CUOTAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.chip} ${formData.cantidad_cuotas === n && !isCustomCuotas ? styles.chipActive : ''}`}
                    onClick={() => {
                      setIsCustomCuotas(false);
                      handleChange('cantidad_cuotas', n);
                    }}
                  >
                    {n}x
                  </button>
                ))}

                <button
                  type="button"
                  className={`${styles.chip} ${isCustomCuotas ? styles.chipActive : ''}`}
                  onClick={() => setIsCustomCuotas(true)}
                >
                  Otra cantidad
                </button>
              </div>

              {isCustomCuotas && (
                <div className={`${styles.formGroup} ${styles.animateFadeIn}`} style={{ marginTop: 4 }}>
                  <div className={styles.tnaWrapper}>
                    <input
                      id="conv_cuotas_custom"
                      type="number"
                      placeholder="Cantidad de cuotas (ej: 9)"
                      value={formData.cantidad_cuotas ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        handleChange('cantidad_cuotas', val);
                      }}
                      min="1"
                      max="120"
                      step="1"
                      className={styles.tnaInput}
                      inputMode="numeric"
                      autoFocus
                    />
                    <span className={styles.tnaUnit}>cuotas</span>
                  </div>
                  {formData.cantidad_cuotas !== null && !isNaN(formData.cantidad_cuotas) &&
                    (formData.cantidad_cuotas < 1 || formData.cantidad_cuotas > 120) && (
                      <span className={styles.errorText}>Entre 1 y 120 cuotas</span>
                    )}
                </div>
              )}
            </div>

            {/* ── 2. Condición de financiación (revelado al tener cuotas) ── */}
            {hasCuotas && (
              <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
                <hr className={styles.flowDivider} />

                <label className={styles.label}>¿Cómo se determina el precio final?</label>
                
                <div className={styles.pillToggle}>
                  <button
                    type="button"
                    className={`${styles.pillOption} ${!formData.tiene_interes ? styles.pillOptionActive : ''}`}
                    onClick={() => handleChange('tiene_interes', false)}
                  >
                    Precio total fijado
                  </button>
                  <button
                    type="button"
                    className={`${styles.pillOption} ${formData.tiene_interes ? styles.pillOptionActive : ''}`}
                    onClick={() => handleChange('tiene_interes', true)}
                  >
                    Con tasa (TNA)
                  </button>
                </div>

                {/* Si selecciona Precio total fijado */}
                {!formData.tiene_interes && (
                  <div className={`${styles.formGroup} ${styles.animateFadeIn}`} style={{ marginTop: 6 }}>
                    <MontoInput
                      label="Precio total en cuotas"
                      placeholder="0"
                      value={formData.precio_total_cuotas}
                      onChange={(val) => handleChange('precio_total_cuotas', val)}
                      allowDecimals
                      hideCurrency
                    />
                    <span className={styles.inputDesc}>Suma de todas las cuotas a pagar</span>
                  </div>
                )}

                {/* Si selecciona Con tasa (TNA) */}
                {formData.tiene_interes && (
                  <div className={`${styles.formGroup} ${styles.animateFadeIn}`} style={{ marginTop: 6 }}>
                    <label className={styles.label} htmlFor="conv_tna">TNA (Tasa Nominal Anual)</label>
                    <div className={styles.tnaWrapper}>
                      <input
                        id="conv_tna"
                        type="number"
                        step="any"
                        min="0.1"
                        max="3000"
                        placeholder="Ej: 120"
                        value={formData.tna}
                        onChange={(e) => handleChange('tna', e.target.value)}
                        className={styles.tnaInput}
                        inputMode="decimal"
                      />
                      <span className={styles.tnaUnit}>%</span>
                    </div>
                    {formData.tna !== '' && (isNaN(parseFloat(formData.tna)) || parseFloat(formData.tna) < 0.1 || parseFloat(formData.tna) > 3000) && (
                      <span className={styles.errorText}>TNA debe estar entre 0.1% y 3000%</span>
                    )}
                    <span className={styles.inputDesc}>Figura en la web del comercio o resumen bancario</span>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. Inflación mensual esperada (revelado de forma compacta y secundaria) ── */}
            {hasCuotas && hasFinancingCondition && (
              <div className={`${styles.compactInflationBox} ${styles.animateFadeIn}`}>
                <div className={styles.compactInflationHeader}>
                  <label className={styles.label} htmlFor="conv_inflacion" style={{ margin: 0 }}>
                    Inflación mensual esperada
                  </label>
                  
                  <div className={styles.compactInflationMeta}>
                    <span>{ipcFuenteLabel}</span>
                    {ipcData?.valor_mensual != null && (
                      <button
                        type="button"
                        className={styles.ipcSyncBtn}
                        onClick={syncIpc}
                        title="Usar valor oficial del INDEC"
                      >
                        <RefreshCcw size={10} style={{ display: 'inline', marginRight: 3 }} />
                        Usar {ipcData.valor_mensual}%
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.compactInflationRow}>
                  <div className={styles.tnaWrapper}>
                    <input
                      id="conv_inflacion"
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      placeholder="Ej: 1.66"
                      value={formData.inflacion_mensual}
                      onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                      className={styles.tnaInput}
                      inputMode="decimal"
                    />
                    <span className={styles.tnaUnit}>%</span>
                  </div>
                </div>
                
                {formData.inflacion_mensual && (isNaN(parseFloat(formData.inflacion_mensual)) || parseFloat(formData.inflacion_mensual) < 0 || parseFloat(formData.inflacion_mensual) > 100) && (
                  <span className={styles.errorText}>Inflación debe estar entre 0% y 100%</span>
                )}
              </div>
            )}

            {/* ── 4 & 5. Feedback y CTA: Calcular conveniencia ── */}
            {hasCuotas && hasFinancingCondition && hasInflation && (
              <div className={styles.ctaSection}>
                <div className={styles.dataReadyBadge}>
                  <Check size={12} strokeWidth={3} />
                  <span>Datos listos para analizar</span>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  loading={calculando}
                  disabled={isFormInvalid}
                  onClick={calcular}
                  type="button"
                >
                  <span>Calcular conveniencia</span>
                  <ArrowRight size={16} style={{ marginLeft: 6, display: 'inline' }} />
                </Button>
              </div>
            )}
          </div>

          {/* ── ZONA DERECHA: Resumen en Vivo ── */}
          <div className={styles.liveSummaryPanel}>
            <div className={styles.liveSummaryHeader}>
              <span className={styles.liveSummaryTitle}>Tu Financiación</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>En vivo</span>
            </div>

            <div className={styles.liveSummaryList}>
              <div className={styles.liveSummaryItem}>
                <span className={styles.liveSummaryLabel}>Contado</span>
                <span className={styles.liveSummaryValue}>
                  {formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '$0'}
                </span>
              </div>

              <div className={styles.liveSummaryItem}>
                <span className={styles.liveSummaryLabel}>Financiación</span>
                <span className={styles.liveSummaryValue}>
                  {formData.cantidad_cuotas ? `${formData.cantidad_cuotas} cuotas` : '—'}
                </span>
                {cuotaCalculada !== null ? (
                  <span className={styles.liveSummarySubValue}>
                    {formatMonto(cuotaCalculada, 'ARS')} / mes
                  </span>
                ) : formData.precio_total_cuotas && formData.cantidad_cuotas ? (
                  <span className={styles.liveSummarySubValue}>
                    {formatMonto(formData.precio_total_cuotas / formData.cantidad_cuotas, 'ARS')} / mes
                  </span>
                ) : null}
              </div>

              <div className={styles.liveSummaryItem}>
                <span className={styles.liveSummaryLabel}>Inflación esperada</span>
                <span className={styles.liveSummaryValue}>
                  {formData.inflacion_mensual ? `${formData.inflacion_mensual} % / mes` : '—'}
                </span>
              </div>
            </div>

            <div className={styles.liveStatusPills}>
              <div className={`${styles.liveStatusPill} ${styles.liveStatusPillDone}`}>
                <Check size={12} strokeWidth={3} />
                <span>Compra cargada</span>
              </div>

              <div className={`${styles.liveStatusPill} ${hasFinancingCondition && hasCuotas ? styles.liveStatusPillDone : ''}`}>
                {hasFinancingCondition && hasCuotas ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--text-3)', display: 'inline-block' }} />
                )}
                <span>Financiación configurada</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvenienciaForm;


