import React from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { formatMonto } from '@/utils/format';
import type { IPCData } from '@/types/tools';
import styles from './ToolsComponents.module.css';

interface ConvenienciaFormProps {
  formData: {
    precio_contado: string;
    precio_total_cuotas: string;
    cantidad_cuotas: number;
    inflacion_mensual: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    precio_contado: string;
    precio_total_cuotas: string;
    cantidad_cuotas: number;
    inflacion_mensual: string;
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
  
  const cuotasOptions = [1, 2, 3, 4, 6, 9, 10, 12, 15, 18, 24, 30, 36, 48, 60].map(c => ({
    label: `${c} cuota${c > 1 ? 's' : ''}`,
    value: c
  }));

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormInvalid = 
    !formData.precio_contado || 
    parseFloat(formData.precio_contado) <= 0 ||
    !formData.precio_total_cuotas ||
    parseFloat(formData.precio_total_cuotas) <= 0 ||
    !formData.inflacion_mensual ||
    parseFloat(formData.inflacion_mensual) < 0;

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
        <label className={styles.label} htmlFor="precio_contado">Precio de contado</label>
        <Input
          id="precio_contado"
          type="number"
          placeholder="Ej: 1.000.000"
          value={formData.precio_contado}
          onChange={(e) => handleChange('precio_contado', e.target.value)}
          icon={<DollarSign size={16} />}
          min="1"
          step="any"
        />
        <span className={styles.inputDesc}>Lo que pagarías si pagás todo junto hoy</span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="precio_total_cuotas">Precio total en cuotas</label>
        <Input
          id="precio_total_cuotas"
          type="number"
          placeholder="Ej: 1.500.000"
          value={formData.precio_total_cuotas}
          onChange={(e) => handleChange('precio_total_cuotas', e.target.value)}
          icon={<DollarSign size={16} />}
          min="1"
          step="any"
        />
        <span className={styles.inputDesc}>El total que terminarías pagando con todas las cuotas sumadas</span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="cantidad_cuotas">Cantidad de cuotas</label>
        <Select
          id="cantidad_cuotas"
          options={cuotasOptions}
          value={formData.cantidad_cuotas}
          onChange={(e) => handleChange('cantidad_cuotas', parseInt(e.target.value))}
        />
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
