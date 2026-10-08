import React, { useState, useEffect } from 'react';
import {
  RefreshCcw, ArrowRight, Pencil, RotateCcw,
  CheckCircle, Lightbulb, HelpCircle,
} from '@/components/ui/icons';
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
      ? { label: 'Conviene pagar en cuotas', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} en términos reales`, hint: 'La inflación licúa las cuotas futuras a tu favor.', icon: CheckCircle }
      : isContado
      ? { label: 'Conviene pagar de contado', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} frente a financiar`, hint: 'El recargo supera el efecto inflacionario.', icon: Lightbulb }
      : { label: 'Da prácticamente lo mismo', sub: `Diferencia de apenas ${resultado.porcentaje_ahorro.toFixed(1)}%`, hint: 'Elegí según tu disponibilidad de efectivo hoy.', icon: HelpCircle }
  ) : null;

  return (
    <div className={styles.fwShell}>

      {/* ══ Progress track ══ */}
      <div className={styles.fwProgress}>
        <button
          type="button"
          className={`${styles.fwProgressStep} ${activeStage === 1 ? styles.fwProgressStepActive : ''} ${activeStage > 1 ? styles.fwProgressStepDone : ''}`}
          onClick={() => goTo(1)}
          aria-label="Paso 1: Compra"
        >
          <span className={styles.fwProgressDot}>{activeStage > 1 ? '✓' : '1'}</span>
          <span className={styles.fwProgressLabel}>
            {activeStage > 1 && formData.precio_contado
              ? `Compra · ${formatMonto(formData.precio_contado, 'ARS')}`
              : 'Compra'}
          </span>
        </button>

        <div className={`${styles.fwProgressLine} ${activeStage > 1 ? styles.fwProgressLineFilled : ''}`} />

        <button
          type="button"
          className={`${styles.fwProgressStep} ${activeStage === 2 ? styles.fwProgressStepActive : ''} ${activeStage > 2 ? styles.fwProgressStepDone : ''} ${isStep1Invalid && activeStage < 2 ? styles.fwProgressStepLocked : ''}`}
          onClick={() => !isStep1Invalid && goTo(2)}
          disabled={isStep1Invalid && activeStage < 2}
          aria-label="Paso 2: Financiación"
        >
          <span className={styles.fwProgressDot}>{activeStage > 2 ? '✓' : '2'}</span>
          <span className={styles.fwProgressLabel}>Financiación</span>
        </button>

        <div className={`${styles.fwProgressLine} ${activeStage > 2 ? styles.fwProgressLineFilled : ''}`} />

        <button
          type="button"
          className={`${styles.fwProgressStep} ${activeStage === 3 ? styles.fwProgressStepActive : ''} ${!resultado && activeStage < 3 ? styles.fwProgressStepLocked : ''}`}
          onClick={() => resultado && goTo(3)}
          disabled={!resultado && activeStage < 3}
          aria-label="Paso 3: Análisis"
        >
          <span className={styles.fwProgressDot}>3</span>
          <span className={styles.fwProgressLabel}>Análisis</span>
        </button>
      </div>

      {/* ══ Stage body ══ */}
      <div
        key={animKey}
        className={`${styles.fwStage} ${animDir === 'fwd' ? styles.fwStageFwd : styles.fwStageBwd}`}
      >

        {/* ═══════════════════════════════════════════
            STAGE 1 — COMPRA (sin cambios)
           ═══════════════════════════════════════════ */}
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

        {/* ═══════════════════════════════════════════
            STAGE 2 — FINANCIACIÓN
            Composición: 65% config | 35% live summary
           ═══════════════════════════════════════════ */}
        {activeStage === 2 && (
          <div className={styles.s2Shell}>

            {/* ── LEFT: Config zone (65%) ── */}
            <div className={styles.s2Config}>

              <div className={styles.s2Header}>
                <h2 className={styles.s2Title}>¿Cómo te ofrecen pagar?</h2>
                <p className={styles.s2Subtitle}>
                  Elegí las cuotas y condiciones para compararlas contra el pago al contado.
                </p>
              </div>

              {/* 1. Cantidad de cuotas */}
              <div className={styles.s2Field}>
                <label className={styles.s2Label}>Cantidad de cuotas</label>
                <div className={styles.s2Chips}>
                  {QUICK_CUOTAS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.s2Chip} ${formData.cantidad_cuotas === n && !isCustomCuotas ? styles.s2ChipActive : ''}`}
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
                    className={`${styles.s2Chip} ${isCustomCuotas ? styles.s2ChipActive : ''}`}
                    onClick={() => setIsCustomCuotas(true)}
                  >
                    Otra
                  </button>
                </div>

                {/* "Otra cantidad" — input compacto integrado */}
                {isCustomCuotas && (
                  <div className={`${styles.s2CustomWrap} ${styles.s2FadeSlide}`}>
                    <input
                      id="conv_cuotas_custom"
                      type="number"
                      placeholder="0"
                      value={formData.cantidad_cuotas ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        handleChange('cantidad_cuotas', val);
                      }}
                      min="1"
                      max="120"
                      step="1"
                      className={styles.s2CustomField}
                      inputMode="numeric"
                      autoFocus
                    />
                    <span className={styles.s2CustomSuffix}>cuotas</span>
                  </div>
                )}
                {isCustomCuotas && formData.cantidad_cuotas !== null && !isNaN(formData.cantidad_cuotas) &&
                  (formData.cantidad_cuotas < 1 || formData.cantidad_cuotas > 120) && (
                    <span className={styles.errorText}>Entre 1 y 120 cuotas</span>
                  )}
              </div>

              {/* 2. Modalidad — segmented control */}
              <div className={styles.s2Field}>
                <label className={styles.s2Label}>Modalidad</label>
                <div className={styles.s2Segment} role="group">
                  <button
                    type="button"
                    className={`${styles.s2SegBtn} ${!formData.tiene_interes ? styles.s2SegBtnActive : ''}`}
                    onClick={() => handleChange('tiene_interes', false)}
                  >
                    Precio total fijado
                  </button>
                  <button
                    type="button"
                    className={`${styles.s2SegBtn} ${formData.tiene_interes ? styles.s2SegBtnActive : ''}`}
                    onClick={() => handleChange('tiene_interes', true)}
                  >
                    Con tasa (TNA)
                  </button>
                </div>

                {/* Precio total fijado */}
                {!formData.tiene_interes && (
                  <div className={`${styles.s2CondArea} ${styles.s2FadeSlide}`}>
                    <label className={styles.s2CondLabel}>Precio total de las cuotas</label>
                    <MontoInput
                      label=""
                      placeholder="0"
                      value={formData.precio_total_cuotas}
                      onChange={(val) => handleChange('precio_total_cuotas', val)}
                      allowDecimals
                      hideCurrency
                      compact
                    />
                    <p className={styles.s2Hint}>Suma de todas las cuotas a pagar</p>
                  </div>
                )}

                {/* Con tasa TNA */}
                {formData.tiene_interes && (
                  <div className={`${styles.s2CondArea} ${styles.s2FadeSlide}`}>
                    <label className={styles.s2CondLabel} htmlFor="conv_tna">TNA (Tasa Nominal Anual)</label>
                    <div className={styles.s2NumWrap}>
                      <input
                        id="conv_tna"
                        type="number"
                        step="any"
                        min="0.1"
                        max="3000"
                        placeholder="Ej: 120"
                        value={formData.tna}
                        onChange={(e) => handleChange('tna', e.target.value)}
                        className={styles.s2NumField}
                        inputMode="decimal"
                      />
                      <span className={styles.s2NumSuffix}>%</span>
                    </div>
                    {formData.tna !== '' && (isNaN(parseFloat(formData.tna)) || parseFloat(formData.tna) < 0.1 || parseFloat(formData.tna) > 3000) && (
                      <span className={styles.errorText}>TNA entre 0.1% y 3000%</span>
                    )}
                    <p className={styles.s2Hint}>Figura en el resumen bancario o web del comercio</p>
                  </div>
                )}
              </div>

              {/* 3. Inflación — bloque compacto horizontal */}
              <div className={styles.s2InflationRow}>
                <div className={styles.s2InflationMeta}>
                  <label className={styles.s2InflationLabel} htmlFor="conv_inflacion">
                    Inflación mensual esperada
                  </label>
                  <span className={styles.s2InflationSource}>{ipcLabel}</span>
                </div>
                <div className={styles.s2InflationInputs}>
                  <div className={styles.s2NumWrap}>
                    <input
                      id="conv_inflacion"
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      placeholder="1.66"
                      value={formData.inflacion_mensual}
                      onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                      className={styles.s2NumField}
                      inputMode="decimal"
                    />
                    <span className={styles.s2NumSuffix}>% / mes</span>
                    {ipcData?.valor_mensual != null && (
                      <button
                        type="button"
                        className={styles.s2IpcBtn}
                        onClick={syncIpc}
                        title="Usar dato oficial del INDEC"
                      >
                        <RefreshCcw size={11} className={isRotating ? styles.iconRotating : ''} />
                        <span>Usar {ipcData.valor_mensual}%</span>
                      </button>
                    )}
                  </div>
                  {formData.inflacion_mensual && (isNaN(parseFloat(formData.inflacion_mensual)) || parseFloat(formData.inflacion_mensual) < 0 || parseFloat(formData.inflacion_mensual) > 100) && (
                    <span className={styles.errorText}>Entre 0% y 100%</span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                className={`${styles.s2Cta} ${isStep2Invalid ? styles.s2CtaDisabled : ''}`}
                disabled={isStep2Invalid || calculando}
                onClick={handleCalcular}
              >
                {calculando ? (
                  <>
                    <span className={styles.s2CtaSpinner} />
                    <span>Calculando…</span>
                  </>
                ) : (
                  <>
                    <span>Ver análisis</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>

            {/* ── RIGHT: Live summary (35%) ── */}
            <aside className={styles.s2Live} aria-label="Resumen en vivo">
              <div className={styles.s2LiveHeader}>
                <span className={styles.s2LiveTitle}>TU OFERTA</span>
                <span className={styles.s2LiveBadge}>
                  <span className={styles.s2LivePulse} aria-hidden="true" />
                  EN VIVO
                </span>
              </div>

              {/* Precio de contado */}
              <div className={styles.s2LiveBlock}>
                <div className={styles.s2LiveBigNum}>
                  {formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '—'}
                </div>
                <div className={styles.s2LiveRowBetween}>
                  <span className={styles.s2LiveSmallLabel}>Contado</span>
                  <button type="button" className={styles.s2LiveEditBtn} onClick={() => goTo(1)}>
                    <Pencil size={10} />
                    <span>Editar</span>
                  </button>
                </div>
              </div>

              <div className={styles.s2LiveSep} />

              {/* Cuotas */}
              <div className={styles.s2LiveBlock}>
                <div className={styles.s2LiveRow}>
                  <span className={styles.s2LiveSmallLabel}>Cuotas</span>
                  <span className={styles.s2LiveVal}>
                    {formData.cantidad_cuotas ? `${formData.cantidad_cuotas}×` : '—'}
                  </span>
                </div>
                {cuotaEstimada !== null && (
                  <div className={styles.s2LiveRow}>
                    <span className={styles.s2LiveSmallLabel}>Por cuota</span>
                    <span className={styles.s2LiveVal}>{formatMonto(cuotaEstimada, 'ARS')}</span>
                  </div>
                )}
              </div>

              <div className={styles.s2LiveSep} />

              {/* Inflación */}
              <div className={styles.s2LiveBlock}>
                <div className={styles.s2LiveRow}>
                  <span className={styles.s2LiveSmallLabel}>Inflación est.</span>
                  <span className={styles.s2LiveVal}>
                    {formData.inflacion_mensual ? `${formData.inflacion_mensual}% / mes` : '—'}
                  </span>
                </div>
              </div>

              <div className={styles.s2LiveSep} />

              {/* Precio total o TNA */}
              <div className={styles.s2LiveBlock}>
                {!formData.tiene_interes && formData.precio_total_cuotas != null ? (
                  <div className={styles.s2LiveRow}>
                    <span className={styles.s2LiveSmallLabel}>Precio total</span>
                    <span className={styles.s2LiveVal}>{formatMonto(formData.precio_total_cuotas, 'ARS')}</span>
                  </div>
                ) : formData.tiene_interes && formData.tna ? (
                  <div className={styles.s2LiveRow}>
                    <span className={styles.s2LiveSmallLabel}>TNA</span>
                    <span className={styles.s2LiveVal}>{formData.tna}%</span>
                  </div>
                ) : (
                  <span className={styles.s2LivePlaceholder}>
                    {!formData.tiene_interes ? 'Ingresá el precio total' : 'Ingresá la TNA'}
                  </span>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            STAGE 3 — ANÁLISIS (sin cambios)
           ═══════════════════════════════════════════ */}
        {activeStage === 3 && resultado && verdictConfig && (
          <div className={styles.fwSingleCol}>

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

            {resultado.cantidad_cuotas <= 24 && (
              <DetalleCuotasChart detallePorMes={resultado.detalle_por_mes} resultado={resultado.resultado} />
            )}

            <ExplicacionCalculo />

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
