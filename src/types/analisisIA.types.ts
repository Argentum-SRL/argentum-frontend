export type EstadoAnalisis = 'pendiente' | 'completado' | 'error'
export type TipoAnalisis = 'completo' | 'gastos_hormiga' | 'suscripciones' | 'fondo_emergencia'

export interface SeccionesAnalisis {
  resumen_ejecutivo:          string | null
  salud_financiera:           string | null
  gastos_hormiga:             string | null
  suscripciones:              string | null
  fondo_emergencias:          string | null
  oportunidades:              string | null
  capacidad_ahorro_adicional: string | null
  limitaciones_analisis:      string | null
  error_parseo?:              string
  texto_crudo?:               string
}

export interface AnalisisIA {
  id:                  string
  tipo_analisis:       TipoAnalisis
  ciclos_analizados:   number
  periodo_inicio:      string
  periodo_fin:         string
  resultado_secciones: SeccionesAnalisis | null
  estado:              EstadoAnalisis
  error_detalle:       string | null
  modelo_usado:        string
  input_tokens:        number | null
  output_tokens:       number | null
  costo_usd:           string | null
  creado_en:           string
}

export interface GenerarAnalisisParams {
  tipo_analisis: TipoAnalisis
  ciclos:        number
}

export interface ExportacionResponse {
  texto:         string
  instrucciones: string
  advertencias:  string[]
}
