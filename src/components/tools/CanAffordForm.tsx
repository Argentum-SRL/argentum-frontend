

import React from 'react';
import { Calendar, Coins } from 'lucide-react';
import { Select, Button, MontoInput } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import styles from './ToolsComponents.module.css';

interface CanAffordFormProps {
  formData: {
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number;
    ingreso_manual: number | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_total: number | null;
    modo: 'contado' | 'cuotas';
    cantidad_cuotas: number;
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
  const cuotasOptions = [2, 3, 4, 6, 9, 10, 12, 15, 18, 24, 30, 36, 48, 60].map(c => ({
    label: `${c} cuotas`,
    value: c
  }));

  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showManualIncome = ingresoPromedioContext === null;

  const isFormInvalid = 
    formData.precio_total === null || 
    formData.precio_total <= 0 ||
    (formData.modo === 'cuotas' && (formData.cantidad_cuotas < 2 || formData.cantidad_cuotas > 60)) ||
    (formData.modo === 'cuotas' && tieneInteres && (!tna || isNaN(parseFloat(tna)) || parseFloat(tna) <= 0 || parseFloat(tna) > 3000)) ||
    (showManualIncome && formData.ingreso_manual !== null && formData.ingreso_manual < 0);

  // Real-time calculations for preview
  const getPreviewText = () => {
    if (!formData.precio_total || formData.precio_total <= 0) return null;

    if (formData.modo === 'contado') {
      const pct = saldoDisponibleContext > 0 
        ? (formData.precio_total / saldoDisponibleContext) * 100 
        : 999;
      if (pct === 999) {
        return 'Representa más del 100% de tu saldo disponible';
      }
      return `Representa el ${pct.toFixed(1)}% de tu saldo disponible actual`;
    } else {
      let cuota = formData.precio_total / formData.cantidad_cuotas;
      if (tieneInteres && tna && !isNaN(parseFloat(tna)) && parseFloat(tna) > 0) {
        cuota = calcularCuotaConInteres(formData.precio_total, formData.cantidad_cuotas, parseFloat(tna));
      }
      return `La cuota mensual sería de ${formatMonto(cuota, 'ARS')}`;
    }
  };

  return (
    <div className={styles.card}>
      <div>
        <h2 className={styles.cardTitle}>¿Qué estás pensando comprar?</h2>
        <p className={styles.cardSubtitle}>
          Analizá si tu situación financiera actual aguanta este nuevo gasto
        </p>
      </div>

      {/* Precio de la compra */}
      <div className={styles.formGroup}>
        <MontoInput
          label="Precio de la compra"
          placeholder="Ej: 500.000"
          value={formData.precio_total}
          onChange={(val) => handleChange('precio_total', val)}
          allowDecimals
          hideCurrency
        />
        <span className={styles.inputDesc}>El costo total del producto o servicio</span>
      </div>

      {/* ¿Cómo lo vas a pagar? */}
      <div className={styles.formGroup}>
        <label className={styles.label}>¿Cómo lo vas a pagar?</label>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleChange('modo', 'contado')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              formData.modo === 'contado'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Coins size={14} />
            <span>De contado</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('modo', 'cuotas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              formData.modo === 'cuotas'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar size={14} />
            <span>En cuotas</span>
          </button>
        </div>
      </div>

      {/* Cantidad de cuotas */}
      {formData.modo === 'cuotas' && (
        <div className={`${styles.formGroup} animate-fadeIn`}>
          <label className={styles.label} htmlFor="can_afford_cuotas">¿En cuántas cuotas?</label>
          <Select
            id="can_afford_cuotas"
            options={cuotasOptions}
            value={formData.cantidad_cuotas}
            onChange={(e) => handleChange('cantidad_cuotas', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* ¿Las cuotas tienen interés? */}
      {formData.modo === 'cuotas' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          <label className="text-sm font-medium text-foreground">
            ¿Las cuotas tienen interés?
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTieneInteres(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                !tieneInteres
                  ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sin interés
            </button>
            <button
              type="button"
              onClick={() => setTieneInteres(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tieneInteres
                  ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Con interés
            </button>
          </div>
        </div>
      )}

      {/* Input de TNA y preview de cuotas con interés */}
      {formData.modo === 'cuotas' && tieneInteres && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-sm font-medium text-foreground">
            TNA (Tasa Nominal Anual)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="3000"
              placeholder="Ej: 120"
              value={tna}
              onChange={(e) => setTna(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              %
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            La TNA figura en el contrato o en la web del comercio/banco. Ej: 120% anual.
          </p>

          {tna && parseFloat(tna) > 0 && formData.precio_total && formData.precio_total > 0 && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-4 py-3 mt-1 border border-border">
              <span className="text-xs text-muted-foreground">Cuota estimada: </span>
              <span className="text-sm font-semibold text-foreground">
                {formatMonto(calcularCuotaConInteres(formData.precio_total, formData.cantidad_cuotas, parseFloat(tna)), 'ARS')}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/ mes</span>
            </div>
          )}
        </div>
      )}

      {/* Ingreso manual si no hay promedio */}
      {showManualIncome && (
        <div className={`${styles.formGroup} animate-fadeIn`}>
          <MontoInput
            label="Tu ingreso mensual estimado"
            placeholder="Ej: 800.000"
            value={formData.ingreso_manual}
            onChange={(val) => handleChange('ingreso_manual', val)}
            allowDecimals
            hideCurrency
          />
          <span className={styles.inputDesc}>
            No tenemos ingresos registrados tuyos. Completalo para ver la capacidad de pago.
          </span>
        </div>
      )}

      {/* Preview en tiempo real */}
      {getPreviewText() && (
        <div className={`${styles.realtimeInfo} animate-fadeIn`}>
          <span>{getPreviewText()}</span>
        </div>
      )}

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
