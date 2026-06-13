import React from 'react';
import { Percent } from 'lucide-react';
import { Input, Button, MontoInput } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import type { IPCData } from '@/types/tools';
import styles from './ToolsComponents.module.css';

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
  
  const handleChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tiene_interes') {
        if (value === true) {
          next.precio_total_cuotas = null;
        } else {
          next.tna = '';
        }
      }
      return next;
    });
  };

  const isFormInvalid = 
    formData.precio_contado === null || 
    formData.precio_contado <= 0 ||
    (!formData.tiene_interes && (formData.precio_total_cuotas === null || formData.precio_total_cuotas <= 0)) ||
    (formData.tiene_interes && (!formData.tna || isNaN(parseFloat(formData.tna)) || parseFloat(formData.tna) <= 0 || parseFloat(formData.tna) > 3000)) ||
    formData.cantidad_cuotas === null ||
    isNaN(formData.cantidad_cuotas) ||
    formData.cantidad_cuotas < 1 ||
    formData.cantidad_cuotas > 120 ||
    !formData.inflacion_mensual ||
    isNaN(parseFloat(formData.inflacion_mensual)) ||
    parseFloat(formData.inflacion_mensual) < 0 ||
    parseFloat(formData.inflacion_mensual) > 100;

  const getInflationDescription = () => {
    if (ipcLoading) return 'Cargando IPC del INDEC...';
    if (ipcError || !ipcData) return 'No pudimos obtener el IPC actual. Ingresá el valor manualmente.';
    if (ipcData.es_estimado) return '⚠️ Dato estimado, no hay IPC reciente disponible';
    return `📊 IPC de ${ipcData.fecha_dato} según INDEC (${ipcData.fuente})`;
  };

  return (
    <div className={styles.card}>
      <div>
        <h2 className={styles.cardTitle}>¿Te conviene pagar en cuotas?</h2>
        <p className={styles.cardSubtitle}>
          Ingresá los datos de la compra y calculamos si la inflación te juega a favor
        </p>
      </div>

      <div className={styles.formGroup}>
        <MontoInput
          label="Precio de contado"
          placeholder="Ej: 1.000.000"
          value={formData.precio_contado}
          onChange={(val) => handleChange('precio_contado', val)}
          allowDecimals
          hideCurrency
        />
        <span className={styles.inputDesc}>Lo que pagarías si pagás todo junto hoy</span>
      </div>

      {/* ¿Las cuotas tienen interés? */}
      <div className="flex flex-col gap-2 animate-fadeIn">
        <label className="text-sm font-medium text-foreground">
          ¿Las cuotas tienen interés?
        </label>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleChange('tiene_interes', false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              !formData.tiene_interes
                ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sin interés
          </button>
          <button
            type="button"
            onClick={() => handleChange('tiene_interes', true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              formData.tiene_interes
                ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Con interés
          </button>
        </div>
      </div>

      {!formData.tiene_interes ? (
        <div className={styles.formGroup}>
          <MontoInput
            label="Precio total en cuotas"
            placeholder="Ej: 1.500.000"
            value={formData.precio_total_cuotas}
            onChange={(val) => handleChange('precio_total_cuotas', val)}
            allowDecimals
            hideCurrency
          />
          <span className={styles.inputDesc}>El total que terminarías pagando con todas las cuotas sumadas</span>
        </div>
      ) : (
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
              value={formData.tna}
              onChange={(e) => handleChange('tna', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              %
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            La TNA para calcular el recargo de cuotas mediante sistema francés.
          </p>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="cantidad_cuotas">Cantidad de cuotas</label>
        <Input
          id="cantidad_cuotas"
          type="number"
          placeholder="Ej: 12"
          value={formData.cantidad_cuotas === null || isNaN(formData.cantidad_cuotas) ? '' : formData.cantidad_cuotas}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            handleChange('cantidad_cuotas', val);
          }}
          min="1"
          max="120"
          step="1"
        />
        {formData.cantidad_cuotas !== null && !isNaN(formData.cantidad_cuotas) && (formData.cantidad_cuotas < 1 || formData.cantidad_cuotas > 120) && (
          <span className="text-xs text-red-500 font-medium mt-1">La cantidad de cuotas debe estar entre 1 y 120</span>
        )}
      </div>

      {cuotaCalculada !== null && cuotaCalculada > 0 && (
        <div className={styles.realtimeInfo}>
          <span>Cada cuota sería de: {formatMonto(cuotaCalculada, 'ARS')}</span>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="inflacion_mensual">Inflación mensual estimada</label>
        <Input
          id="inflacion_mensual"
          type="number"
          placeholder="Ej: 3.0"
          value={formData.inflacion_mensual}
          onChange={(e) => handleChange('inflacion_mensual', e.target.value)}
          icon={<Percent size={16} />}
          min="0"
          max="100"
          step="0.1"
        />
        {formData.inflacion_mensual !== '' && (isNaN(parseFloat(formData.inflacion_mensual)) || parseFloat(formData.inflacion_mensual) < 0 || parseFloat(formData.inflacion_mensual) > 100) && (
          <span className="text-xs text-red-500 font-medium mt-1">La inflación mensual debe estar entre 0% y 100%</span>
        )}
        <span className={styles.inputDesc}>{getInflationDescription()}</span>
      </div>

      <Button
        variant="primary"
        fullWidth
        loading={calculando}
        disabled={isFormInvalid}
        onClick={calcular}
        type="button"
      >
        Calcular conveniencia
      </Button>
    </div>
  );
};

export default ConvenienciaForm;
