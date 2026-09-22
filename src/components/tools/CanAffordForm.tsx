import React from 'react';
import { Calendar, Coins } from 'lucide-react';
import { Button, MontoInput } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import styles from './ToolsComponents.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

interface CanAffordFormProps {
  formData: {
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
    ingreso_manual: number | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
    ingreso_manual: number | null;
  }>>;
  calculando: boolean;
  calcular: () => void;
  ingresoPromedioContext: number | null;
  saldoDisponibleContext: number;
  tieneInteres: boolean;
  setTieneInteres: (val: boolean) => void;
  tna: string;
  setTna: (val: string) => void;
  calcularCuotaConInteres: (capital: number, n: number, tna: number) => number;
}

export const CanAffordForm: React.FC<CanAffordFormProps> = ({
  formData,
  setFormData,
  calculando,
  calcular,
  ingresoPromedioContext,
  saldoDisponibleContext,
  tieneInteres,
  setTieneInteres,
  tna,
  setTna,
  calcularCuotaConInteres
}) => {
  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showManualIncome = ingresoPromedioContext === null;

  const isFormInvalid =
    formData.precio_total === null ||
    formData.precio_total <= 0 ||
    formData.precio_total > MAX_MONTO_INTEGRIDAD ||
    (formData.modo === 'cuotas' && (
      formData.cantidad_cuotas === null ||
      isNaN(formData.cantidad_cuotas) ||
      formData.cantidad_cuotas < 2 ||
      formData.cantidad_cuotas > 120
    )) ||
    (formData.modo === 'cuotas' && tieneInteres && (
      !tna || isNaN(parseFloat(tna)) || parseFloat(tna) < 0.1 || parseFloat(tna) > 3000
    )) ||
    (showManualIncome &&
      formData.ingreso_manual !== null && (
        formData.ingreso_manual <= 0 || formData.ingreso_manual > MAX_MONTO_INTEGRIDAD
      ));

  // Preview text en tiempo real
  const previewText = (() => {
    if (!formData.precio_total || formData.precio_total <= 0) return null;
    if (formData.modo === 'contado') {
      const pct = saldoDisponibleContext > 0
        ? (formData.precio_total / saldoDisponibleContext) * 100
        : 999;
      if (pct >= 999) return 'Representa más del 100% de tu saldo disponible';
      return `Representa el ${pct.toFixed(1)}% de tu saldo disponible`;
    }
    if (formData.cantidad_cuotas && formData.cantidad_cuotas > 0) {
      let cuota = formData.precio_total / formData.cantidad_cuotas;
      if (tieneInteres && tna && !isNaN(parseFloat(tna)) && parseFloat(tna) > 0) {
        cuota = calcularCuotaConInteres(formData.precio_total, formData.cantidad_cuotas, parseFloat(tna));
      }
      if (cuota > 0) return `La cuota mensual sería de ${formatMonto(cuota, 'ARS')}`;
    }
    return null;
  })();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>¿Qué estás pensando comprar?</h2>
        <p className={styles.cardSubtitle}>
          Analizá si tu situación financiera actual aguanta este nuevo gasto
        </p>
      </div>

      <div className={styles.formGrid2}>
        {/* ── Columna Izquierda: Precio & Modo ── */}
        <div className={styles.formCol}>
          {/* Precio */}
          <div className={styles.formGroup}>
            <MontoInput
              label="Precio de la compra"
              placeholder="0"
              value={formData.precio_total}
              onChange={(val) => handleChange('precio_total', val)}
              allowDecimals
              hideCurrency
              compact
            />
            <span className={styles.inputDesc}>El costo total del producto o servicio</span>
          </div>

          {/* Modo pago */}
          <div className={styles.formGroup}>
            <label className={styles.label}>¿Cómo lo vas a pagar?</label>
            <div className={styles.pillToggle}>
              <button
                type="button"
                className={`${styles.pillOption} ${formData.modo === 'contado' ? styles.pillOptionActive : ''}`}
                onClick={() => handleChange('modo', 'contado')}
              >
                <Coins size={14} />
                De contado
              </button>
              <button
                type="button"
                className={`${styles.pillOption} ${formData.modo === 'cuotas' ? styles.pillOptionActive : ''}`}
                onClick={() => handleChange('modo', 'cuotas')}
              >
                <Calendar size={14} />
                En cuotas
              </button>
            </div>
          </div>

          {/* Cantidad de cuotas */}
          {formData.modo === 'cuotas' && (
            <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
              <label className={styles.label} htmlFor="ca_cuotas">¿En cuántas cuotas?</label>

              <div className={styles.chipsRow}>
                {QUICK_CUOTAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.chip} ${formData.cantidad_cuotas === n ? styles.chipActive : ''}`}
                    onClick={() => handleChange('cantidad_cuotas', n)}
                  >
                    {n}x
                  </button>
                ))}
              </div>

              <input
                id="ca_cuotas"
                type="number"
                placeholder="Ej: 12"
                value={formData.cantidad_cuotas === null || isNaN(formData.cantidad_cuotas) ? '' : formData.cantidad_cuotas}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  handleChange('cantidad_cuotas', val);
                }}
                min="2"
                max="120"
                step="1"
                className={styles.tnaInput}
                inputMode="numeric"
              />
              {formData.cantidad_cuotas !== null && !isNaN(formData.cantidad_cuotas) &&
                (formData.cantidad_cuotas < 2 || formData.cantidad_cuotas > 120) && (
                  <span className={styles.errorText}>Entre 2 y 120 cuotas</span>
                )}
            </div>
          )}
        </div>

        {/* ── Columna Derecha: Interés, Ingreso & Preview ── */}
        <div className={styles.formCol}>
          {/* Interés */}
          {formData.modo === 'cuotas' && (
            <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
              <label className={styles.label}>¿Las cuotas tienen interés?</label>
              <div className={styles.pillToggle}>
                <button
                  type="button"
                  className={`${styles.pillOption} ${!tieneInteres ? styles.pillOptionActive : ''}`}
                  onClick={() => setTieneInteres(false)}
                >
                  Sin interés
                </button>
                <button
                  type="button"
                  className={`${styles.pillOption} ${tieneInteres ? styles.pillOptionActive : ''}`}
                  onClick={() => setTieneInteres(true)}
                >
                  Con interés
                </button>
              </div>
            </div>
          )}

          {/* TNA */}
          {formData.modo === 'cuotas' && tieneInteres && (
            <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
              <label className={styles.label} htmlFor="ca_tna">TNA (Tasa Nominal Anual)</label>
              <div className={styles.tnaWrapper}>
                <input
                  id="ca_tna"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3000"
                  placeholder="Ej: 120"
                  value={tna}
                  onChange={(e) => setTna(e.target.value)}
                  className={styles.tnaInput}
                  inputMode="decimal"
                />
                <span className={styles.tnaUnit}>%</span>
              </div>
              {tna !== '' && (isNaN(parseFloat(tna)) || parseFloat(tna) < 0.1 || parseFloat(tna) > 3000) && (
                <span className={styles.errorText}>TNA debe estar entre 0.1% y 3000%</span>
              )}
              <span className={styles.inputDesc}>Figura en la web del comercio. Ej: 120% anual.</span>

              {/* Cuota preview con TNA */}
              {tna && parseFloat(tna) > 0 && formData.precio_total && formData.precio_total > 0 &&
                formData.cantidad_cuotas && formData.cantidad_cuotas > 0 && (
                  <div className={`${styles.cuotaPreview} ${styles.animateFadeIn}`}>
                    <span>Cuota estimada:</span>
                    <span className={styles.cuotaPreviewValue}>
                      {formatMonto(calcularCuotaConInteres(formData.precio_total, formData.cantidad_cuotas, parseFloat(tna)), 'ARS')}
                    </span>
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/ mes</span>
                  </div>
                )}
            </div>
          )}

          {/* Ingreso manual */}
          {showManualIncome && (
            <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
              <MontoInput
                label="Tu ingreso mensual estimado"
                placeholder="0"
                value={formData.ingreso_manual}
                onChange={(val) => handleChange('ingreso_manual', val)}
                allowDecimals
                hideCurrency
                compact
              />
              {formData.ingreso_manual !== null && formData.ingreso_manual <= 0 && (
                <span className={styles.errorText}>El ingreso debe ser mayor a 0</span>
              )}
              <span className={styles.inputDesc}>
                No tenemos ingresos registrados. Completalo para ver la capacidad.
              </span>
            </div>
          )}

          {/* Preview en tiempo real */}
          {previewText && (
            <div className={`${styles.realtimeInfo} ${styles.animateFadeIn}`}>
              <span>{previewText}</span>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        loading={calculando}
        disabled={isFormInvalid}
        onClick={calcular}
        type="button"
      >
        Analizar compra
      </Button>
    </div>
  );
};

export default CanAffordForm;
