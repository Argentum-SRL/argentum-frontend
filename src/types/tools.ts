export interface IPCData {
  valor_mensual: number;
  fecha_dato: string;
  es_estimado: boolean;
  fuente: string;
  ultima_actualizacion: string;
}

export interface DetalleCuota {
  mes: number;
  cuota_nominal: number;
  cuota_valor_presente: number;
}

export interface ConvenienciaResult {
  resultado: 'conviene_cuotas' | 'conviene_contado' | 'indiferente';
  precio_contado: number;
  precio_total_cuotas_nominal: number;
  costo_real_cuotas: number;
  ahorro_real: number;
  porcentaje_ahorro: number;
  monto_cuota: number;
  cantidad_cuotas: number;
  inflacion_mensual_usada: number;
  detalle_por_mes: DetalleCuota[];
}

export interface ConvenienciaRequest {
  precio_contado: number;
  precio_total_cuotas: number;
  cantidad_cuotas: number;
  inflacion_mensual: number;
}
