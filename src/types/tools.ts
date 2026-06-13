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
  tiene_interes?: boolean;
  tna_usada?: number | null;
  interes_total?: number | null;
  precio_total_cuotas_con_interes?: number | null;
}

export interface ConvenienciaRequest {
  precio_contado: number;
  precio_total_cuotas?: number;
  cantidad_cuotas: number;
  inflacion_mensual: number;
  tiene_interes?: boolean;
  tna?: number;
}

export interface FinancialContext {
  saldo_disponible: number;
  ingreso_promedio_mensual: number | null;
  ingreso_es_estimacion_parcial: boolean;
  carga_mensual_comprometida: number;
  gasto_promedio_variable: number;
  ciclos_con_historia: number;
  margen_libre_mensual: number | null;
}

export interface CanAffordRequest {
  precio_total: number;
  modo: 'contado' | 'cuotas';
  cantidad_cuotas?: number;
  tiene_interes?: boolean;
  tna?: number;
  ingreso_manual?: number | null;
}

export interface CanAffordResult {
  modo: 'contado' | 'cuotas';
  precio_total: number;
  
  // Contado mode fields
  saldo_disponible_actual?: number;
  saldo_restante_post_compra?: number;
  porcentaje_del_saldo?: number;
  porcentaje_del_ingreso_mensual?: number | null;
  
  // Cuotas mode fields
  monto_cuota?: number;
  cantidad_cuotas?: number;
  carga_mensual_previa?: number;
  carga_mensual_nueva_total?: number;
  porcentaje_carga_sobre_ingreso?: number | null;
  margen_libre_post_compra?: number | null;
  gasto_variable_promedio?: number;
  tiene_interes?: boolean;
  tna_usada?: number | null;
  precio_total_real?: number;
  interes_total?: number;

  // Common fields
  semaforo: 'verde' | 'amarillo' | 'rojo' | 'negro' | 'gris';
  mensaje_principal: string;
  ingreso_promedio_usado: number | null;
  ingreso_es_manual: boolean;
}

