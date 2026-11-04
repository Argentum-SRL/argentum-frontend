import React from 'react';
import { Calendar, Coins } from '@/components/ui/icons';
import { Button, MontoInput } from '@/components/ui';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import { OPCIONES_MODO_PAGO, etiquetaMonto } from '@/utils/permitirse';
import styles from './ToolsComponents.module.css';

const QUICK_CUOTAS = [3, 6, 12, 18, 24, 36];

const MODO_CONFIG = {
  contado: { label: 'De contado', icon: <Coins size={15} /> },
  cuotas: { label: 'En cuotas', icon: <Calendar size={15} /> },
} as const;

const MODO_OPTIONS = OPCIONES_MODO_PAGO.map((modo) => ({
  value: modo,
  label: MODO_CONFIG[modo].label,
  icon: MODO_CONFIG[modo].icon,
}));

interface CanAffordFormProps {
  formData: {
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number | null;
  }>>;
  calculando: boolean;
  calcular: () => void;
  tieneInteres: boolean;
  setTieneInteres: (val: boolean) => void;
  tna: string;
  setTna: (val: string) => void;
}

export const CanAffordForm: React.FC<CanAffordFormProps> = ({
  formData,
  setFormData,
  calculando,
  calcular,
  tieneInteres,
  setTieneInteres,
  tna,
  setTna,
}) => {
  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
    ));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>¿Qué estás pensando comprar?</h2>
        <p className={styles.cardSubtitle}>
          Analizá si podés permitirte esta compra
        </p>
      </div>

      <div className={styles.formGrid2}>
        {/* ── Columna Izquierda: Precio & Modo ── */}
        <div className={styles.formCol}>
          {/* Precio con etiqueta dinámica */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="ca_precio_total">
              {etiquetaMonto(formData.modo)}
            </label>
            <MontoInput
              id="ca_precio_total"
              variant="outlined"
              size="lg"
              placeholder="0"
              value={formData.precio_total}
              onChange={(val) => handleChange('precio_total', val)}
              allowDecimals
            />
            <span className={styles.inputDesc}>El importe en pesos a evaluar</span>
          </div>

          {/* Modo pago */}
          <div className={styles.formGroup}>
            <label className={styles.label}>¿Cómo lo vas a pagar?</label>
            <SegmentedControl<'contado' | 'cuotas'>
              className={styles.modoPagoSelector}
              options={MODO_OPTIONS}
              value={formData.modo}
              onChange={(v) => handleChange('modo', v)}
              ariaLabel="¿Cómo lo vas a pagar?"
              fullWidth
            />
          </div>
        </div>

        {/* ── Columna Derecha: Cuotas e Interés ── */}
        <div className={styles.formCol}>
          {formData.modo === 'cuotas' && (
            <>
              {/* Cantidad de cuotas */}
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
                  className={styles.cuotasInput}
                  inputMode="numeric"
                />
                {formData.cantidad_cuotas !== null && !isNaN(formData.cantidad_cuotas) &&
                  (formData.cantidad_cuotas < 2 || formData.cantidad_cuotas > 120) && (
                    <span className={styles.errorText}>Entre 2 y 120 cuotas</span>
                  )}
              </div>

              {/* Interés */}
              <div className={`${styles.formGroup} ${styles.animateFadeIn}`}>
                <label className={styles.label}>¿Las cuotas tienen interés?</label>
                <SegmentedControl<'sin' | 'con'>
                  className={styles.interesSelector}
                  options={[
                    { value: 'sin', label: 'Sin interés' },
                    { value: 'con', label: 'Con interés' },
                  ]}
                  value={tieneInteres ? 'con' : 'sin'}
                  onChange={(v) => setTieneInteres(v === 'con')}
                  ariaLabel="¿Las cuotas tienen interés?"
                  fullWidth
                />
              </div>

              {/* TNA */}
              {tieneInteres && (
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
                </div>
              )}
            </>
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
