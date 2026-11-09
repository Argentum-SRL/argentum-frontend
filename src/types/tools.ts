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
  tna_billetera_inversion_usada?: number | null;
  saldo_final_inversion?: number | null;
  remanente_vpn?: number | null;
}

export interface ConvenienciaRequest {
  precio_contado: number;
  precio_total_cuotas?: number;
  cantidad_cuotas: number;
  inflacion_mensual: number;
  tiene_interes?: boolean;
  tna?: number;
  tna_billetera_inversion?: number | null;
}

export interface CurrencyFinancialData {
  total_billeteras: number;
  cuotas_comprometidas: number;
  suscripciones_mensuales: number;
  saldo_disponible: number;
}

export interface FinancialContext {
  saldo_disponible: number;
  carga_mensual_comprometida: number;
  ars: CurrencyFinancialData;
  usd: CurrencyFinancialData;
  ingreso_promedio_mensual: number | null;
  ingreso_es_estimacion_parcial: boolean;
  gasto_promedio_variable: number;
  ciclos_con_historia: number;
  margen_libre_mensual: number | null;
}

export interface AhorrosDetalle {
  inversiones: number;
  dolares_usd: number;
  dolares_en_pesos: number;
  metas: number;
  total: number;
}

export interface InflacionEsperadaData {
  valor_mensual: number;
  meses: number[];
  fuente_texto: string;
  es_respaldo: boolean;
}

export interface CanAffordRequest {
  precio_total: number;
  modo: 'contado' | 'cuotas' | 'mensual';
  cantidad_cuotas?: number;
  tiene_interes?: boolean;
  tna?: number;
  ingreso_manual?: number | null;
}

export interface CanAffordResult {
  modo: 'contado' | 'cuotas' | 'mensual';
  resultado: 'bien' | 'justo' | 'ahorros' | 'no_alcanza';
  motivo?: 'datos_viejos' | 'sin_ingreso' | 'aprendiendo' | 'pocos_datos' | null;
  titulo: string;
  linea_principal: string;
  lineas_plan?: string[];
  linea_ahorros?: string | null;
  ahorros?: AhorrosDetalle | null;
  linea_liberacion?: string | null;
  linea_compensar?: string | null;
  linea_frescura?: string | null;
  linea_espera?: string | null;
  libre: number;
  precio_total: number;
  fuente_inflacion?: string | null;
}

