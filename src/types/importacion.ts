export type EstadoImportacion = 'procesando' | 'pendiente_revision' | 'importado' | 'error' | 'cancelado';

export interface TransaccionParseada {
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: 'ARS' | 'USD';
  cuota_actual: number | null;
  cuota_total: number | null;
  es_cargo_bancario: boolean;
  titular_seccion: string | null;
  posible_duplicado: boolean;
}

export interface ProcesarResumenResponse {
  importacion_id: string;
  banco_detectado: string;
  estado: EstadoImportacion;
  titulares_detectados: string[] | null;
  total_detectadas: number;
  confianza: number;
  escalado: boolean;
}

export interface PreviewImportacionResponse {
  id: string;
  usuario_id: string;
  banco_detectado: string;
  estado: EstadoImportacion;
  total_detectadas: number;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  titulares_detectados: string[] | null;
  titulares_seleccionados: string[] | null;
  transacciones: TransaccionParseada[];
}

export interface TransaccionConfirmarItem {
  categoria_id: string | null;
  incluir: boolean;
}

export interface ConfirmarImportacionRequest {
  tarjeta_id: string;
  billetera_id: string;
  billetera_usd_id: string | null;
  titulares_seleccionados: string[] | null;
  transacciones_finales: TransaccionConfirmarItem[];
}

export interface ConfirmarImportacionResponse {
  importadas: number;
  duplicadas: number;
  sin_billetera_usd: number;
  total_procesadas: number;
}

export interface DecisionesImportacion {
  titulares_seleccionados: string[] | null;
  billetera_usd_id: string | null;
  decision_cargos_bancarios: 'importar' | 'ignorar' | null;
}

