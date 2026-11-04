import React from 'react';
import { Button, MontoInput } from '@/components/ui';
import { MAX_MONTO_INTEGRIDAD } from '@/lib/constants/limits';
import styles from './ToolsComponents.module.css';

interface GastoFijoFormProps {
  monto: number | null;
  setMonto: (val: number | null) => void;
  calculando: boolean;
  calcular: () => void;
}

/**
 * Formulario para evaluar la incorporación de un gasto fijo recurrente mensual.
 * Cumple D1 a D3: misma tarjeta, cabecera, campo y botón que CanAffordForm.
 */
export const GastoFijoForm: React.FC<GastoFijoFormProps> = ({
  monto,
  setMonto,
  calculando,
  calcular,
}) => {
  const isFormInvalid =
    monto === null ||
    isNaN(monto) ||
    monto <= 0 ||
    monto > MAX_MONTO_INTEGRIDAD;

  return (
    <div className={`${styles.card} ${styles.animateFadeIn}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>¿Te entra un gasto fijo?</h2>
        <p className={styles.cardSubtitle}>
          Por ejemplo: gimnasio, prepaga, colegio o una suscripción.
        </p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="gf_monto">
          ¿Cuánto por mes?
        </label>
        <MontoInput
          id="gf_monto"
          variant="outlined"
          size="lg"
          placeholder="0"
          value={monto}
          onChange={(val) => setMonto(val)}
          allowDecimals
        />
        <span className={styles.inputDesc}>
          El importe en pesos que pagarías cada mes
        </span>
      </div>

      <Button
        variant="primary"
        fullWidth
        loading={calculando}
        disabled={isFormInvalid}
        onClick={calcular}
        type="button"
      >
        Ver si me entra
      </Button>
    </div>
  );
};

export default GastoFijoForm;
