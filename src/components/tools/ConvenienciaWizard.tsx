import React, { useState, useEffect } from 'react';
import { RefreshCcw, ArrowRight, Pencil, RotateCcw, CheckCircle, Lightbulb, HelpCircle } from '@/components/ui/icons';
import { MontoInput, LunarLoader } from '@/components/ui';
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
  // ── Dos grandes etapas: 1 = Simulación interactiva (50/50), 2 = Análisis/Veredicto
  const [activeStage, setActiveStage] = useState<1 | 2>(() => {
    if (resultado) return 2;
    return 1;
  });

  // Estado que controla si la mitad derecha (financiación) ya se desplegó
  const [isFinancingUnlocked, setIsFinancingUnlocked] = useState<boolean>(
    () => Boolean(formData.precio_contado && formData.precio_contado > 0)
  );

  // Edición in-situ del precio de contado en la tarjeta izquierda una vez desbloqueado
  const [isEditingContado, setIsEditingContado] = useState(false);

  const [isRotating, setIsRotating] = useState(false);
  const [isCustomCuotas, setIsCustomCuotas] = useState<boolean>(
    Boolean(formData.cantidad_cuotas && !QUICK_CUOTAS.includes(formData.cantidad_cuotas))
  );
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<'fwd' | 'bwd'>('fwd');

  // Si llega resultado, avanzar a etapa 2
  useEffect(() => {
    if (resultado && activeStage !== 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimDir('fwd');
      setAnimKey(k => k + 1);
      setActiveStage(2);
    }
  }, [resultado, activeStage]);

  const goTo = (s: 1 | 2) => {
    if (s === activeStage) return;
    setAnimDir(s > activeStage ? 'fwd' : 'bwd');
    setAnimKey(k => k + 1);
    setActiveStage(s);
  };

  const handleReset = () => {
    resetCalculadora();
    setIsFinancingUnlocked(false);
    setIsEditingContado(false);
    goTo(1);
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

  // ── Validación ──────────────────────────────────────────────────────────
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

  const handleConfirmContado = () => {
    if (!isStep1Invalid) {
      setIsFinancingUnlocked(true);
      setIsEditingContado(false);
    }
  };

  const handleCalcular = async () => {
    if (isStep2Invalid) return;
    const success = await calcular();
    if (success) goTo(2);
  };

  const cuotaEstimada = (() => {
    if (cuotaCalculada !== null) return cuotaCalculada;
    if (formData.precio_total_cuotas && formData.cantidad_cuotas) {
      return formData.precio_total_cuotas / formData.cantidad_cuotas;
    }
    return null;
  })();

  // ── Modo de ingreso para cuotas fijas: 'cuota' | 'total' ────────────────
  const [fixedMode, setFixedMode] = useState<'cuota' | 'total'>('total');
  const [cuotaInputValue, setCuotaInputValue] = useState<number | null>(() => {
    if (formData.precio_total_cuotas && formData.cantidad_cuotas) {
      return Math.round((formData.precio_total_cuotas / formData.cantidad_cuotas) * 100) / 100;
    }
    return null;
  });

  useEffect(() => {
    if (fixedMode === 'total' && formData.precio_total_cuotas && formData.cantidad_cuotas) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCuotaInputValue(Math.round((formData.precio_total_cuotas / formData.cantidad_cuotas) * 100) / 100);
    }
  }, [formData.precio_total_cuotas, formData.cantidad_cuotas, fixedMode]);

  const handleCuotaValChange = (val: number | null) => {
    setCuotaInputValue(val);
    if (val !== null && val > 0 && formData.cantidad_cuotas) {
      handleChange('precio_total_cuotas', Math.round(val * formData.cantidad_cuotas));
    } else {
      handleChange('precio_total_cuotas', null);
    }
  };

  const handleTotalValChange = (val: number | null) => {
    handleChange('precio_total_cuotas', val);
    if (val !== null && val > 0 && formData.cantidad_cuotas) {
      setCuotaInputValue(Math.round((val / formData.cantidad_cuotas) * 100) / 100);
    } else {
      setCuotaInputValue(null);
    }
  };

  const handleCuotasCountChange = (n: number | null) => {
    handleChange('cantidad_cuotas', n);
    if (n && n > 0) {
      if (fixedMode === 'cuota' && cuotaInputValue) {
        handleChange('precio_total_cuotas', Math.round(cuotaInputValue * n));
      } else if (fixedMode === 'total' && formData.precio_total_cuotas) {
        setCuotaInputValue(Math.round((formData.precio_total_cuotas / n) * 100) / 100);
      }
    }
  };

  // Recargo nominal preview
  const recargoNominal = (() => {
    if (!formData.precio_contado || !formData.precio_total_cuotas) return null;
    const diff = formData.precio_total_cuotas - formData.precio_contado;
    const pct = (diff / formData.precio_contado) * 100;
    return { diff, pct };
  })();

  // ── Derivaciones para el Tablero en Vivo (Panel Izquierdo) ───────────────
  const totalFinanciadoDisplay = (() => {
    if (!formData.tiene_interes && formData.precio_total_cuotas != null) {
      return formData.precio_total_cuotas;
    }
    if (formData.tiene_interes && cuotaEstimada !== null && formData.cantidad_cuotas) {
      return Math.round(cuotaEstimada * formData.cantidad_cuotas);
    }
    return null;
  })();

  const { contadoBarPct, cuotasBarPct } = (() => {
    const pContado = formData.precio_contado || 0;
    const pCuotas = totalFinanciadoDisplay || 0;
    const max = Math.max(pContado, pCuotas, 1);
    if (pContado === 0 && pCuotas === 0) return { contadoBarPct: 0, cuotasBarPct: 0 };
    return {
      contadoBarPct: Math.min(100, Math.max(8, Math.round((pContado / max) * 100))),
      cuotasBarPct: pCuotas > 0 ? Math.min(100, Math.max(8, Math.round((pCuotas / max) * 100))) : 0,
    };
  })();

  const insightPill = (() => {
    if (!formData.precio_contado || formData.precio_contado <= 0) return null;
    const n = formData.cantidad_cuotas;
    if (!n || n <= 0) return null;

    const infMensual = parseFloat(formData.inflacion_mensual) || 0;
    const infAcumulada = (Math.pow(1 + infMensual / 100, n) - 1) * 100;

    if (!formData.tiene_interes && formData.precio_total_cuotas != null) {
      const diff = formData.precio_total_cuotas - formData.precio_contado;
      const pct = (diff / formData.precio_contado) * 100;

      if (Math.abs(pct) < 0.01) {
        return {
          type: 'Success',
          icon: '✨',
          title: 'Cuotas fijas sin recargo nominal',
          desc: `La inflación proyectada (~${infAcumulada.toFixed(1)}% en ${n} meses) licuará el valor real de cada cuota.`
        };
      }
      if (pct < 0) {
        return {
          type: 'Success',
          icon: '🎉',
          title: '¡Descuento en cuotas!',
          desc: `El total financiado es menor que pagar al contado (-${Math.abs(pct).toFixed(1)}%).`
        };
      }
      if (pct < infAcumulada * 0.7) {
        return {
          type: 'Success',
          icon: '⚡',
          title: 'Recargo bajo frente a inflación',
          desc: `El recargo (+${pct.toFixed(1)}%) es significativamente menor a la inflación estimada (~${infAcumulada.toFixed(1)}%).`
        };
      }
      if (pct > infAcumulada) {
        return {
          type: 'Warning',
          icon: '⚠️',
          title: 'Recargo superior a inflación',
          desc: `El recargo (+${pct.toFixed(1)}%) supera la inflación acumulada esperada (~${infAcumulada.toFixed(1)}%).`
        };
      }
      return {
        type: 'Neutral',
        icon: '⚖️',
        title: 'Zona de paridad financiera',
        desc: `Recargo (+${pct.toFixed(1)}%) cercano a inflación proyectada (~${infAcumulada.toFixed(1)}%). Calculá para ver el VPN.`
      };
    }

    if (formData.tiene_interes && formData.tna) {
      const tnaNum = parseFloat(formData.tna);
      if (!isNaN(tnaNum)) {
        const tem = tnaNum / 12;
        return {
          type: tem <= infMensual ? 'Success' : 'Warning',
          icon: tem <= infMensual ? '⚡' : '⚠️',
          title: tem <= infMensual ? 'Tasa mensual conveniente' : 'Tasa mensual elevada',
          desc: `Tasa efectiva estimada ~${tem.toFixed(2)}%/mes vs inflación esperada de ${infMensual}%/mes.`
        };
      }
    }

    return {
      type: 'Neutral',
      icon: '📊',
      title: 'Simulación en vivo',
      desc: 'Completá las cuotas a la derecha para ver el análisis de conveniencia.'
    };
  })();

  const isIpcOfficialUsed = Boolean(
    ipcData?.valor_mensual != null &&
    formData.inflacion_mensual === ipcData.valor_mensual.toString()
  );

  // ── Result derivations para etapa 2 ───────────────────────────────────────
  const isCuotas = resultado?.resultado === 'conviene_cuotas';
  const isContado = resultado?.resultado === 'conviene_contado';

  const verdictConfig = resultado ? (
    isCuotas
      ? { label: 'Conviene pagar en cuotas', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} en términos reales`, hint: 'La inflación licúa las cuotas futuras a tu favor.', icon: CheckCircle, color: 'success' }
      : isContado
      ? { label: 'Conviene pagar de contado', sub: `Ahorrás ${formatMonto(resultado.ahorro_real, 'ARS')} frente a financiar`, hint: 'El recargo supera el efecto inflacionario.', icon: Lightbulb, color: 'error' }
      : { label: 'Da prácticamente lo mismo', sub: `Diferencia de apenas ${resultado.porcentaje_ahorro.toFixed(1)}%`, hint: 'Elegí según tu disponibilidad de efectivo hoy.', icon: HelpCircle, color: 'gold' }
  ) : null;

  const steps: { key: 1 | 2; label: string }[] = [
    { key: 1, label: 'Simulación' },
    { key: 2, label: 'Análisis' },
  ];

  return (
    <div style={{ width: '100%' }}>

      {/* ══ Stepper Maestro Centrado ══ */}
      <div className={styles.wbStepperWrap}>
        <div className={styles.wbStepper}>
          {steps.map((s, i) => {
            const isDone = activeStage > s.key;
            const isActive = activeStage === s.key;
            const isLocked = s.key === 2 && !resultado && activeStage < 2;

            return (
              <React.Fragment key={s.key}>
                {i > 0 && (
                  <div
                    className={`${styles.wbStepDivider} ${
                      activeStage >= s.key ? styles.wbStepDividerActive : ''
                    }`}
                  />
                )}
                <button
                  type="button"
                  className={`${styles.wbStepItem} ${
                    isActive ? styles.wbStepItemActive : ''
                  } ${isDone ? styles.wbStepItemDone : ''}`}
                  onClick={() => {
                    if (s.key === 1) goTo(1);
                    if (s.key === 2 && resultado) goTo(2);
                  }}
                  disabled={isLocked}
                  aria-label={`Paso ${s.key}: ${s.label}`}
                >
                  <div className={styles.wbStepDot}>{isDone ? '✓' : s.key}</div>
                  <span>{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══ Stage body ══ */}
      <div
        key={animKey}
        className={`${styles.fwStage} ${animDir === 'fwd' ? styles.fwStageFwd : styles.fwStageBwd}`}
      >

        {/* ─────────────────────────────────────────────────────────────
            ETAPA 1 — FINANCIAL WORKBENCH (Centrado -> Split View)
           ───────────────────────────────────────────────────────────── */}
        {activeStage === 1 && (
          <>
            {!isFinancingUnlocked ? (
              /* Estado Centrado Inicial */
              <div className={styles.wbInitialShell}>
                <span className={styles.wbInitialEyebrow}>Paso 1 · Compra</span>
                <h2 className={styles.wbInitialTitle}>¿Cuánto pagarías hoy?</h2>
                <p className={styles.wbInitialSub}>
                  Ingresá el precio de lista o lo que cobran si pagás todo junto al contado.
                </p>

                <div
                  className={styles.wbInitialInputWrap}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmContado();
                    }
                  }}
                >
                  <MontoInput
                    label="Precio de contado"
                    placeholder="0"
                    value={formData.precio_contado}
                    onChange={(val) => handleChange('precio_contado', val)}
                    allowDecimals
                    hideCurrency
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  className={styles.wbInitialCta}
                  disabled={isStep1Invalid}
                  onClick={handleConfirmContado}
                >
                  <span>Continuar a financiación</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              /* Master Financial Workbench (2 Paneles Equilibrados) */
              <div className={styles.wbShell}>
                <div className={styles.wbGrid}>

                  {/* ══ PANEL IZQUIERDO: CONTADO & TABLERO EN VIVO ══ */}
                  <div className={styles.wbLeftPanel}>
                    <div className={styles.wbContadoBox}>
                      <div className={styles.wbContadoHeader}>
                        <div className={styles.wbSectionBadge}>
                          <span className={styles.wbBadgeDot} />
                          <span>Compra de contado</span>
                        </div>
                        <button
                          type="button"
                          className={styles.wbEditBtn}
                          onClick={() => setIsEditingContado((prev) => !prev)}
                          title={isEditingContado ? 'Listo' : 'Editar precio de contado'}
                        >
                          <Pencil size={11} />
                          <span>{isEditingContado ? 'Listo' : 'Editar'}</span>
                        </button>
                      </div>

                      {isEditingContado ? (
                        <div
                          className={styles.wbInlineEditWrap}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setIsEditingContado(false);
                            }
                          }}
                        >
                          <MontoInput
                            variant="outlined"
                            label="Precio de contado"
                            placeholder="0"
                            value={formData.precio_contado}
                            onChange={(val) => handleChange('precio_contado', val)}
                            allowDecimals
                            hideCurrency
                            autoFocus
                          />
                          <button
                            type="button"
                            className={styles.wbInlineSaveBtn}
                            onClick={() => setIsEditingContado(false)}
                          >
                            Confirmar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className={styles.wbBigAmount}>
                            {formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '—'}
                          </div>
                          <span className={styles.wbSubHint}>Pago único hoy · Base de comparación</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.wbDivider} />

                    {/* Tablero en vivo */}
                    <div className={styles.wbLiveSection}>
                      <div className={styles.wbLiveHeader}>
                        <span className={styles.wbLiveTitle}>Tablero en vivo</span>
                        <span className={styles.wbLiveBadge}>
                          <span className={styles.wbPulseDot} />
                          ACTIVO
                        </span>
                      </div>

                      {/* Grid 2x2 Métricas */}
                      <div className={styles.wbMetricsGrid}>
                        <div className={styles.wbMetricCard}>
                          <span className={styles.wbMetricLabel}>Cada cuota</span>
                          <span className={`${styles.wbMetricVal} ${styles.wbMetricHighlight}`}>
                            {cuotaEstimada !== null ? formatMonto(cuotaEstimada, 'ARS') : '—'}
                          </span>
                          <span className={styles.wbMetricSub}>
                            {formData.cantidad_cuotas ? `${formData.cantidad_cuotas} cuotas` : '—'}
                          </span>
                        </div>

                        <div className={styles.wbMetricCard}>
                          <span className={styles.wbMetricLabel}>Total financiado</span>
                          <span className={styles.wbMetricVal}>
                            {totalFinanciadoDisplay != null ? formatMonto(totalFinanciadoDisplay, 'ARS') : '—'}
                          </span>
                          <span className={styles.wbMetricSub}>
                            {formData.tiene_interes && formData.tna ? `TNA ${formData.tna}%` : 'Monto final'}
                          </span>
                        </div>
                      </div>

                      {/* Card de Recargo Nominal */}
                      {recargoNominal && (
                        <div className={styles.wbRecargoCard}>
                          <div className={styles.wbRecargoRow}>
                            <span className={styles.wbRecargoLabel}>Recargo nominal</span>
                            <span
                              className={styles.wbRecargoBadge}
                              style={{
                                color: recargoNominal.pct === 0 ? 'var(--success)' : recargoNominal.pct > 0 ? 'var(--error)' : 'var(--success)',
                                background: recargoNominal.pct === 0 ? 'rgba(26, 122, 74, 0.1)' : recargoNominal.pct > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(26, 122, 74, 0.1)',
                              }}
                            >
                              {recargoNominal.pct === 0
                                ? '0% · Sin interés'
                                : `${recargoNominal.pct > 0 ? '+' : ''}${recargoNominal.pct.toFixed(1)}%`}
                            </span>
                          </div>
                          {recargoNominal.pct > 0 && (
                            <span className={styles.wbRecargoDiff}>
                              +{formatMonto(recargoNominal.diff, 'ARS')} frente al contado
                            </span>
                          )}
                        </div>
                      )}

                      {/* Mini Barra Comparativa Visual */}
                      <div className={styles.wbCompareBars}>
                        <span className={styles.wbCompareTitle}>Comparativa de montos</span>
                        <div className={styles.wbBarRow}>
                          <div className={styles.wbBarMeta}>
                            <span className={styles.wbBarName}>Contado</span>
                            <span className={styles.wbBarVal}>
                              {formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '—'}
                            </span>
                          </div>
                          <div className={styles.wbBarTrack}>
                            <div
                              className={styles.wbBarFillContado}
                              style={{ width: `${contadoBarPct}%` }}
                            />
                          </div>
                        </div>

                        <div className={styles.wbBarRow}>
                          <div className={styles.wbBarMeta}>
                            <span className={styles.wbBarName}>En cuotas</span>
                            <span className={styles.wbBarVal}>
                              {totalFinanciadoDisplay != null ? formatMonto(totalFinanciadoDisplay, 'ARS') : '—'}
                            </span>
                          </div>
                          <div className={styles.wbBarTrack}>
                            <div
                              className={
                                recargoNominal && recargoNominal.pct > 0
                                  ? styles.wbBarFillCuotasSurcharge
                                  : styles.wbBarFillCuotasSame
                              }
                              style={{ width: `${cuotasBarPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Insight Pill */}
                    {insightPill && (
                      <div className={`${styles.wbInsightCard} ${styles[`wbInsight${insightPill.type}`]}`}>
                        <span className={styles.wbInsightIcon}>{insightPill.icon}</span>
                        <div className={styles.wbInsightBody}>
                          <span className={styles.wbInsightTitle}>{insightPill.title}</span>
                          <p className={styles.wbInsightDesc}>{insightPill.desc}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ══ PANEL DERECHO: CONDICIONES DE FINANCIACIÓN ══ */}
                  <div
                    className={styles.wbRightPanel}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isStep2Invalid && !calculando) {
                        e.preventDefault();
                        handleCalcular();
                      }
                    }}
                  >
                    <div className={styles.wbRightHeader}>
                      <span className={styles.wbRightEyebrow}>CONDICIONES DE FINANCIACIÓN</span>
                      <h3 className={styles.wbRightTitle}>¿Cómo te ofrecen pagar?</h3>
                      <p className={styles.wbRightSub}>
                        Configurá el plan de cuotas y modalidad para comparar contra los {formData.precio_contado ? formatMonto(formData.precio_contado, 'ARS') : '$0'} de contado.
                      </p>
                    </div>

                    <div className={styles.wbFormFields}>
                      {/* 1. Cantidad de cuotas */}
                      <div className={styles.wbField}>
                        <label className={styles.wbFieldLabel}>Cantidad de cuotas</label>
                        <div className={styles.wbChipsGrid}>
                          {QUICK_CUOTAS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={`${styles.wbChip} ${formData.cantidad_cuotas === n && !isCustomCuotas ? styles.wbChipActive : ''}`}
                              onClick={() => {
                                setIsCustomCuotas(false);
                                handleCuotasCountChange(n);
                              }}
                            >
                              {n}x
                            </button>
                          ))}
                          <button
                            type="button"
                            className={`${styles.wbChip} ${isCustomCuotas ? styles.wbChipActive : ''}`}
                            onClick={() => setIsCustomCuotas(true)}
                          >
                            Otra
                          </button>
                        </div>

                        {isCustomCuotas && (
                          <div className={styles.wbCustomCuotasWrap}>
                            <input
                              id="conv_cuotas_custom"
                              type="number"
                              placeholder="Ej: 9"
                              value={formData.cantidad_cuotas ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                handleCuotasCountChange(val);
                              }}
                              min="1"
                              max="120"
                              step="1"
                              className={styles.wbCustomInput}
                              inputMode="numeric"
                              autoFocus
                            />
                            <span className={styles.wbCustomSuffix}>cuotas</span>
                          </div>
                        )}
                      </div>

                      {/* 2. Modalidad de financiación */}
                      <div className={styles.wbField}>
                        <label className={styles.wbFieldLabel}>Modalidad de financiación</label>
                        <div className={styles.wbSegmented}>
                          <button
                            type="button"
                            className={`${styles.wbSegmentedBtn} ${!formData.tiene_interes ? styles.wbSegmentedBtnActive : ''}`}
                            onClick={() => handleChange('tiene_interes', false)}
                          >
                            Cuotas fijas / Total
                          </button>
                          <button
                            type="button"
                            className={`${styles.wbSegmentedBtn} ${formData.tiene_interes ? styles.wbSegmentedBtnActive : ''}`}
                            onClick={() => handleChange('tiene_interes', true)}
                          >
                            Con tasa (TNA)
                          </button>
                        </div>

                        {/* Si es cuotas fijas */}
                        {!formData.tiene_interes && (
                          <div className={styles.wbFixedModeArea}>
                            <div className={styles.wbSubModeRow}>
                              <span className={styles.wbSubModePrompt}>Modo de ingreso:</span>
                              <div className={styles.wbSubModePills}>
                                <button
                                  type="button"
                                  className={`${styles.wbSubPill} ${fixedMode === 'total' ? styles.wbSubPillActive : ''}`}
                                  onClick={() => setFixedMode('total')}
                                >
                                  Total en cuotas
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.wbSubPill} ${fixedMode === 'cuota' ? styles.wbSubPillActive : ''}`}
                                  onClick={() => setFixedMode('cuota')}
                                >
                                  Valor por cuota
                                </button>
                              </div>
                            </div>

                            {fixedMode === 'total' ? (
                              <div className={styles.wbInputBlock}>
                                <MontoInput
                                  variant="outlined"
                                  label="Precio total financiado"
                                  placeholder="0"
                                  value={formData.precio_total_cuotas}
                                  onChange={handleTotalValChange}
                                  allowDecimals
                                  hideCurrency
                                />
                                <span className={styles.wbFieldHint}>
                                  {formData.cantidad_cuotas && formData.precio_total_cuotas
                                    ? `Equivale a ${formData.cantidad_cuotas} cuotas de ${formatMonto(formData.precio_total_cuotas / formData.cantidad_cuotas, 'ARS')}`
                                    : 'Suma de todos los pagos'}
                                </span>
                              </div>
                            ) : (
                              <div className={styles.wbInputBlock}>
                                <MontoInput
                                  variant="outlined"
                                  label="Valor de cada cuota"
                                  placeholder="0"
                                  value={cuotaInputValue}
                                  onChange={handleCuotaValChange}
                                  allowDecimals
                                  hideCurrency
                                />
                                <span className={styles.wbFieldHint}>
                                  {formData.cantidad_cuotas && cuotaInputValue
                                    ? `${formData.cantidad_cuotas} cuotas × ${formatMonto(cuotaInputValue, 'ARS')} = Total ${formatMonto(cuotaInputValue * formData.cantidad_cuotas, 'ARS')}`
                                    : 'Monto mensual por cada cuota'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Si es con tasa */}
                        {formData.tiene_interes && (
                          <div className={styles.wbFixedModeArea}>
                            <label className={styles.wbFieldLabel} htmlFor="conv_tna">TNA (Tasa Nominal Anual)</label>
                            <div className={styles.wbStandardInputWrap}>
                              <input
                                id="conv_tna"
                                type="number"
                                step="any"
                                min="0.1"
                                max="3000"
                                placeholder="Ej: 120"
                                value={formData.tna}
                                onChange={(e) => handleChange('tna', e.target.value)}
                                className={styles.wbStandardInput}
                                inputMode="decimal"
                              />
                              <span className={styles.wbInputSuffix}>% anual</span>
                            </div>
                            {formData.tna !== '' && (isNaN(parseFloat(formData.tna)) || parseFloat(formData.tna) < 0.1 || parseFloat(formData.tna) > 3000) && (
                              <span className={styles.errorText}>TNA debe estar entre 0.1% y 3000%</span>
                            )}
                            <span className={styles.wbFieldHint}>Figura en el resumen bancario o web del comercio</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Inflación mensual esperada */}
                      <div className={styles.wbField}>
                        <div className={styles.wbInflationHeaderRow}>
                          <label className={styles.wbFieldLabel}>Inflación mensual esperada</label>
                          <span className={styles.wbIpcSourceTag}>{ipcLabel}</span>
                        </div>

                        <div className={styles.wbInflationInputRow}>
                          <div className={styles.wbStandardInputWrap}>
                            <input
                              id="conv_inflacion"
                              type="number"
                              step="any"
                              min="0"
                              max="100"
                              placeholder="Ej: 1.66"
                              value={formData.inflacion_mensual}
                              onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
                              className={styles.wbStandardInput}
                              inputMode="decimal"
                            />
                            <span className={styles.wbInputSuffix}>% / mes</span>
                          </div>
                          {ipcData?.valor_mensual != null && (
                            <button
                              type="button"
                              className={`${styles.wbIpcSyncBtn} ${isIpcOfficialUsed ? styles.wbIpcSyncBtnActive : ''}`}
                              onClick={syncIpc}
                              title={isIpcOfficialUsed ? 'Usando valor oficial' : 'Restaurar valor oficial del INDEC'}
                            >
                              <RefreshCcw size={12} className={isRotating ? styles.iconRotating : ''} />
                              <span>{isIpcOfficialUsed ? 'Oficial INDEC ✓' : `Usar ${ipcData.valor_mensual}%`}</span>
                            </button>
                          )}
                        </div>
                        {formData.inflacion_mensual && (isNaN(parseFloat(formData.inflacion_mensual)) || parseFloat(formData.inflacion_mensual) < 0 || parseFloat(formData.inflacion_mensual) > 100) && (
                          <span className={styles.errorText}>Inflación debe estar entre 0% y 100%</span>
                        )}
                      </div>
                    </div>

                    {/* CTA principal */}
                    <div className={styles.wbCtaWrapper}>
                      <button
                        type="button"
                        className={styles.wbCtaButton}
                        disabled={isStep2Invalid || calculando}
                        onClick={handleCalcular}
                      >
                        {calculando ? (
                          <>
                            <LunarLoader size={18} />
                            <span>Calculando conveniencia…</span>
                          </>
                        ) : (
                          <>
                            <span>Ver análisis completo</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────
            ETAPA 2 — ANÁLISIS Y VEREDICTO
           ───────────────────────────────────────────────────────────── */}
        {activeStage === 2 && resultado && verdictConfig && (
          <div className={styles.fwShell}>
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
                <button type="button" className={styles.fwActionSecondary} onClick={() => goTo(1)}>
                  <Pencil size={13} />
                  <span>Modificar simulación</span>
                </button>
                <button type="button" className={styles.fwActionGhost} onClick={handleReset}>
                  <RotateCcw size={13} />
                  <span>Nueva simulación</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvenienciaWizard;
