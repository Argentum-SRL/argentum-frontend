import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, ArrowRight, Pencil, RotateCcw, CheckCircle, Lightbulb, HelpCircle } from '@/components/ui/icons';
import { MontoInput } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import type { IPCData, ConvenienciaResult as IConvenienciaResult } from '@/types/tools';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import DetalleCuotasChart from './DetalleCuotasChart';
import ExplicacionCalculo from './ExplicacionCalculo';
import styles from './ToolsComponents.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

export interface ConvenienciaWizardProps {
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
  resultado: IConvenienciaResult | null;
  calculando: boolean;
  calcular: () => Promise<boolean>;
  resetCalculadora: () => void;
  cuotaCalculada: number | null;
  ipcData: IPCData | null;
  ipcLoading: boolean;
  ipcError: boolean;
}

export const ConvenienciaWizard: React.FC<ConvenienciaWizardProps> = ({
  formData,
  setFormData,
  resultado,
  calculando,
  calcular,
  resetCalculadora,
  cuotaCalculada,
  ipcData,
  ipcLoading,
  ipcError,
}) => {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(() => {
    if (resultado) return 3;
    if (formData.precio_contado && formData.precio_contado > 0) return 2;
    return 1;
  });

  const [isRotating, setIsRotating] = useState(false);
  const [isCustomCuotas, setIsCustomCuotas] = useState<boolean>(
    Boolean(formData.cantidad_cuotas && !QUICK_CUOTAS.includes(formData.cantidad_cuotas))
  );
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<'fwd' | 'bwd'>('fwd');

  useEffect(() => {
    if (resultado && activeStage !== 3) {
      setAnimDir('fwd');
      setAnimKey(k => k + 1);
      setActiveStage(3);
    }
  }, [resultado]);

  const goTo = (s: 1 | 2 | 3) => {
    if (s === activeStage) return;
    setAnimDir(s > activeStage ? 'fwd' : 'bwd');
    setAnimKey(k => k + 1);
    setActiveStage(s);
  };

  const handleChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tiene_interes') {
        if (value === true) next.precio_total_cuotas = null;
        else next.tna = '';
      }
      return next;
    });
  };

  const syncIpc = () => {
    if (ipcData?.valor_mensual != null) {
      setIsRotating(true);
      handleChange('inflacion_mensual', ipcData.valor_mensual.toString());
      setTimeout(() => setIsRotating(false), 600);
    }
  };

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

  // ── Validation ──────────────────────────────────────────────────────────
  const isStep1Invalid =
    formData.precio_contado === null ||
    formData.precio_contado <= 0 ||
    formData.precio_contado > MAX_MONTO_INTEGRIDAD;

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

  const isStep2Invalid = isStep1Invalid || !hasCuotas || !hasFinancingCondition || !hasInflation;

  const ipcLabel = ipcLoading
    ? 'Cargando…'
    : ipcError || !ipcData
      ? 'Sin datos oficiales'
      : ipcData.es_estimado
        ? `IPC estimado · ${ipcData.fuente}`
        : `IPC oficial · ${ipcData.fuente}`;

  const handleCalcular = async () => {
    if (isStep2Invalid) return;
    const success = await calcular();
    if (success) goTo(3);
  };

  const cuotaEstimada = (() => {
    if (cuotaCalculada !== null) return cuotaCalculada;
    if (formData.precio_total_cuotas && formData.cantidad_cuotas) {
      return formData.precio_total_cuotas / formData.cantidad_cuotas;
    }
    return null;
  })();

  // ── Result derivations ───────────────────────────────────────────────────
  const isCuotas = resultado?.resultado === 'conviene_cuotas';
  const isContado = resultado?.resultado === 'conviene_contado';

  const verdictConfig = resultado ? (
    isCuotas
      ? { label: 'Conviene pagar en cuotas', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} en términos reales`, hint: 'La inflación licúa las cuotas futuras a tu favor.', icon: CheckCircle, color: 'success' }
      : isContado
      ? { label: 'Conviene pagar de contado', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} frente a financiar`, hint: 'El recargo supera el efecto inflacionario.', icon: Lightbulb, color: 'error' }
      : { label: 'Da prácticamente lo mismo', sub: `Diferencia de apenas ${resultado.porcentaje_ahorro.toFixed(1)}%`, hint: 'Elegí según tu disponibilidad de efectivo hoy.', icon: HelpCircle, color: 'gold' }
  ) : null;

  // ── Step indicator ───────────────────────────────────────────────────────
  const steps: { key: 1 | 2 | 3; label: string }[] = [
    { key: 1, label: 'Compra' },
    { key: 2, label: 'Financiación' },
    { key: 3, label: 'Análisis' },
  ];

  return (
    <div className={styles.fwShell}>

      {/* ══ Step dots (minimal, top center) ══ */}
      <div className={styles.fwDots}>
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div className={`${styles.fwDotLine} ${activeStage > i ? styles.fwDotLineFilled : ''}`} />
            )}
            <button
              type="button"
              className={`${styles.fwDot} ${activeStage === s.key ? styles.fwDotActive : ''} ${activeStage > s.key ? styles.fwDotDone : ''}`}
              onClick={() => {
                if (s.key === 1) goTo(1);
                if (s.key === 2 && !isStep1Invalid) goTo(2);
                if (s.key === 3 && resultado) goTo(3);
              }}
              disabled={(s.key === 2 && isStep1Invalid && activeStage < 2) || (s.key === 3 && !resultado && activeStage < 3)}
              aria-label={`Paso ${s.key}: ${s.label}`}
            >
              {activeStage > s.key ? '✓' : s.key}
            </button>
            {activeStage === s.key && (
              <span className={styles.fwDotLabel}>{s.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ══ Stage body ══ */}
      <div
        key={animKey}
        className={`${styles.fwStage} ${animDir === 'fwd' ? styles.fwStageFwd : styles.fwStageBwd}`}
      >

        {/* ─────────────────────────────────────
            STAGE 1 — COMPRA
           ───────────────────────────────────── */}
        {activeStage === 1 && (
          <div className={styles.fwSingleCol}>
            <div className={styles.fwHeroBlock}>
              <p className={styles.fwEyebrow}>Paso 1 de 3</p>
              <h2 className={styles.fwHeroTitle}>¿Cuánto pagarías hoy?</h2>
              <p className={styles.fwHeroSub}>
                Ingresá el precio de lista o lo que cobran si pagás todo junto ahora mismo.
              </p>
            </div>

            <div className={styles.fwInputArea}>
              <MontoInput
                label="Precio de contado"
                placeholder="0"
                value={formData.precio_contado}
                onChange={(val) => handleChange('precio_contado', val)}
                allowDecimals
                hideCurrency
              />
            </div>

            <button
              type="button"
              className={styles.fwCta}
              disabled={isStep1Invalid}
              onClick={() => goTo(2)}
            >
              <span>Continuar</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────
            STAGE 2 — FINANCIACIÓN (columna única)
           ───────────────────────────────────── */}
        {activeStage === 2 && (
          <div className={styles.fwSingleCol}>

            {/* Header with contado recap */}
            <div className={styles.fwStage2Top}>
              <div className={styles.fwHeroBlock}>
                <p className={styles.fwEyebrow}>Paso 2 de 3</p>
                <h2 className={styles.fwHeroTitle}>¿Cómo te ofrecen pagar?</h2>
              </div>
              <button type="button" className={styles.fwRecapChip} onClick={() => goTo(1)}>
                <span className={styles.fwRecapPrice}>{formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '—'}</span>
                <span className={styles.fwRecapLabel}>al contado</span>
                <Pencil size={11} className={styles.fwRecapIcon} />
              </button>
            </div>

            {/* ── Section 1: Cuotas ── */}
            <div className={styles.fwSection}>
              <label className={styles.fwSectionLabel}>Cantidad de cuotas</label>
              <div className={styles.fwChipsRow}>
                {QUICK_CUOTAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.fwChip} ${formData.cantidad_cuotas === n && !isCustomCuotas ? styles.fwChipActive : ''}`}
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
                  className={`${styles.fwChip} ${isCustomCuotas ? styles.fwChipActive : ''}`}
                  onClick={() => setIsCustomCuotas(true)}
                >
                  Otra
                </button>
              </div>

              {isCustomCuotas && (
                <div className={`${styles.fwInlineInput} ${styles.fwFadeIn}`}>
                  <input
                    id="conv_cuotas_custom"
                    type="number"
                    placeholder="Ej: 9"
                    value={formData.cantidad_cuotas ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      handleChange('cantidad_cuotas', val);
                    }}
                    min="1" max="120" step="1"
                    className={styles.fwNumInput}
                    inputMode="numeric"
                    autoFocus
                  />
                  <span className={styles.fwNumUnit}>cuotas</span>
                </div>
              )}

              {/* Cuota estimada live */}
              {cuotaEstimada !== null && formData.cantidad_cuotas && (
                <div className={styles.fwLiveCuota}>
                  <span className={styles.fwLiveCuotaVal}>{formatMonto(cuotaEstimada, 'ARS')}</span>
                  <span className={styles.fwLiveCuotaSub}> por cuota</span>
                </div>
              )}
            </div>

            {/* ── Section 2: Modalidad ── */}
            <div className={styles.fwSection}>
              <label className={styles.fwSectionLabel}>Modalidad de financiación</label>
              <div className={styles.fwToggleRow}>
                <button
                  type="button"
                  className={`${styles.fwToggleBtn} ${!formData.tiene_interes ? styles.fwToggleBtnActive : ''}`}
                  onClick={() => handleChange('tiene_interes', false)}
                >
                  Precio total fijado
                </button>
                <button
                  type="button"
                  className={`${styles.fwToggleBtn} ${formData.tiene_interes ? styles.fwToggleBtnActive : ''}`}
                  onClick={() => handleChange('tiene_interes', true)}
                >
                  Con tasa (TNA)
                </button>
              </div>

              {!formData.tiene_interes && (
                <div className={styles.fwFadeIn}>
                  <MontoInput
                    label="Precio total en cuotas"
                    placeholder="0"
                    value={formData.precio_total_cuotas}
                    onChange={(val) => handleChange('precio_total_cuotas', val)}
                    allowDecimals
                    hideCurrency
                    compact
                  />
                  <p className={styles.fwFieldHint}>Suma de todas las cuotas a pagar</p>
                </div>
              )}

              {formData.tiene_interes && (
                <div className={styles.fwFadeIn}>
                  <label className={styles.fwFieldLabel} htmlFor="conv_tna">TNA (Tasa Nominal Anual)</label>
                  <div className={styles.fwInlineInput}>
                    <input
                      id="conv_tna"
                      type="number"
                      step="any"
                      min="0.1"
                      max="3000"
                      placeholder="Ej: 120"
                      value={formData.tna}
                      onChange={(e) => handleChange('tna', e.target.value)}
                      className={styles.fwNumInput}
                      inputMode="decimal"
                    />
                    <span className={styles.fwNumUnit}>%</span>
                  </div>
                  {formData.tna !== '' && (isNaN(parseFloat(formData.tna)) || parseFloat(formData.tna) < 0.1 || parseFloat(formData.tna) > 3000) && (
                    <span className={styles.errorText}>TNA debe estar entre 0.1% y 3000%</span>
                  )}
                  <p className={styles.fwFieldHint}>Figura en el resumen bancario o web del comercio</p>
                </div>
              )}
            </div>

            {/* ── Section 3: Inflación ── */}
            <div className={styles.fwSection}>
              <div className={styles.fwSectionLabelRow}>
                <label className={styles.fwSectionLabel} htmlFor="conv_inflacion">Inflación mensual esperada</label>
                <span className={styles.fwSectionMeta}>{ipcLabel}</span>
              </div>

              <div className={styles.fwInlineInput}>
                <input
                  id="conv_inflacion"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  placeholder="Ej: 1.66"
                  value={formData.inflacion_mensual}
                  onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                  className={styles.fwNumInput}
                  inputMode="decimal"
                />
                <span className={styles.fwNumUnit}>% / mes</span>
                {ipcData?.valor_mensual != null && (
                  <button
                    type="button"
                    className={styles.fwSyncBtn}
                    onClick={syncIpc}
                    title="Usar dato oficial"
                  >
                    <RefreshCcw size={11} className={isRotating ? styles.iconRotating : ''} />
                    <span>Usar {ipcData.valor_mensual}%</span>
                  </button>
                )}
              </div>

              {formData.inflacion_mensual && (isNaN(parseFloat(formData.inflacion_mensual)) || parseFloat(formData.inflacion_mensual) < 0 || parseFloat(formData.inflacion_mensual) > 100) && (
                <span className={styles.errorText}>Inflación debe estar entre 0% y 100%</span>
              )}
            </div>

            {/* CTA */}
            <button
              type="button"
              className={`${styles.fwCta} ${isStep2Invalid ? styles.fwCtaDisabled : ''}`}
              disabled={isStep2Invalid || calculando}
              onClick={handleCalcular}
            >
              {calculando ? (
                <>
                  <span className={styles.fwCtaSpinner} />
                  <span>Calculando…</span>
                </>
              ) : (
                <>
                  <span>Ver análisis</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────
            STAGE 3 — ANÁLISIS
           ───────────────────────────────────── */}
        {activeStage === 3 && resultado && verdictConfig && (
          <div className={styles.fwSingleCol}>

            {/* Veredicto hero */}
            <div className={`${styles.fwVerdict} ${isCuotas ? styles.fwVerdictCuotas : isContado ? styles.fwVerdictContado : styles.fwVerdictEmpate}`}>
              <div className={styles.fwVerdictIconWrap}>
                {React.createElement(verdictConfig.icon, { size: 26 })}
              </div>
              <div className={styles.fwVerdictBody}>
                <p className={styles.fwVerdictLabel}>{verdictConfig.label}</p>
                <p className={styles.fwVerdictSaving}>{verdictConfig.sub}</p>
                <p className={styles.fwVerdictHint}>{verdictConfig.hint}</p>
              </div>
            </div>

            {/* Compare row */}
            <div className={styles.fwCompareRow}>
              <div className={styles.fwCompareCol}>
                <span className={styles.fwCompareColLabel}>Contado</span>
                <span className={styles.fwCompareColVal}>{formatMonto(resultado.precio_contado, 'ARS')}</span>
                <span className={styles.fwCompareColSub}>Pago único hoy</span>
              </div>
              <div className={styles.fwCompareVsLabel}>vs</div>
              <div className={styles.fwCompareCol}>
                <span className={styles.fwCompareColLabel}>Cuotas · Costo real</span>
                <span className={styles.fwCompareColVal}>{formatMonto(resultado.costo_real_cuotas, 'ARS')}</span>
                <span className={styles.fwCompareColSub}>Ajustado por inflación</span>
              </div>
              <div className={styles.fwCompareDiff}>
                <span className={styles.fwCompareDiffLabel}>
                  {isCuotas ? 'Ahorro real' : isContado ? 'Sobrecosto' : 'Diferencia'}
                </span>
                <span
                  className={styles.fwCompareDiffVal}
                  style={{ color: isCuotas ? 'var(--success)' : isContado ? 'var(--error)' : 'var(--gold)' }}
                >
                  {formatMonto(resultado.ahorro_real, 'ARS')}
                </span>
                <span className={styles.fwCompareDiffPct}>
                  {resultado.porcentaje_ahorro.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Extra metrics si hay interés */}
            {resultado.tiene_interes && (
              <div className={styles.fwMetricsRow}>
                <div className={styles.fwMetric}>
                  <span className={styles.fwMetricLabel}>Interés total</span>
                  <span className={styles.fwMetricVal}>{formatMonto(resultado.interes_total ?? 0, 'ARS')}</span>
                  {resultado.tna_usada && <span className={styles.fwMetricSub}>TNA {resultado.tna_usada}%</span>}
                </div>
                <div className={styles.fwMetric}>
                  <span className={styles.fwMetricLabel}>Total nominal</span>
                  <span className={styles.fwMetricVal}>{formatMonto(resultado.precio_total_cuotas_con_interes ?? 0, 'ARS')}</span>
                  <span className={styles.fwMetricSub}>{resultado.cantidad_cuotas}x de {formatMonto(resultado.monto_cuota, 'ARS')}</span>
                </div>
              </div>
            )}

            {/* Gráfico */}
            {resultado.cantidad_cuotas <= 24 && (
              <DetalleCuotasChart detallePorMes={resultado.detalle_por_mes} resultado={resultado.resultado} />
            )}

            {/* Explicación */}
            <ExplicacionCalculo />

            {/* Actions */}
            <div className={styles.fwActions}>
              <button type="button" className={styles.fwActionSecondary} onClick={() => goTo(2)}>
                <Pencil size={13} />
                <span>Modificar financiación</span>
              </button>
              <button type="button" className={styles.fwActionGhost} onClick={() => { resetCalculadora(); goTo(1); }}>
                <RotateCcw size={13} />
                <span>Nueva simulación</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvenienciaWizard;
