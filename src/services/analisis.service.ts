import api from './api'

export type MonedaModoAnalisis = 'solo_ars' | 'solo_usd' | 'consolidado_ars' | 'consolidado_usd'
export type NaturalezaGastoFiltro = 'todos' | 'variables' | 'fijos' | 'cuotas'

export interface AnalisisCotizacionRef {
  texto?: string
  tipo?: string
  nombre?: string
  valor?: number
  fecha_actualizacion?: string | null
}

export interface AnalisisPeriodoInfo {
  cantidad_ciclos: number
  fecha_inicio: string
  fecha_fin: string
  etiqueta: string
}

export interface AnalisisKpis {
  ingresos_totales: number | null
  gastos_totales: number
  balance_neto: number | null
  tasa_ahorro_pct: number | null
  tasa_ahorro_texto: string | null
  promedio_gasto_ciclo: number | null
  promedio_ingreso_ciclo: number | null
  variacion_gasto_vs_anterior_pct: number | null
  variacion_ingreso_vs_anterior_pct: number | null
  variacion_texto: string | null
  cantidad_operaciones: number
  alcance: 'terminados' | 'en_curso'
  frase_resumen: string | null
}

export interface AnalisisInsight {
  id: string
  tipo: 'positivo' | 'alerta' | 'info'
  titulo: string
  descripcion: string
}

export interface AnalisisCicloPunto {
  clave: string
  etiqueta: string
  rango_texto: string
  fecha_inicio: string
  fecha_fin: string
  es_actual: boolean
  dias_transcurridos: number
  dias_totales: number
  ingresos: number | null
  gastos: number
  balance: number | null
  tasa_ahorro_pct: number | null
  promedio_historico_gastos: number | null
  sin_datos: boolean
  por_categoria?: Record<string, number>
  por_subcategoria?: Record<string, number>
}

export interface SerieEvolucionPersonalizada {
  key: string
  tipo: 'categoria' | 'subcategoria' | 'base'
  id: string
  nombre: string
  categoriaPadreNombre?: string
  color: string
}

export interface AnalisisSubcategoriaItem {
  subcategoria_id: string
  subcategoria_nombre: string
  monto: number
  porcentaje_categoria: number
  porcentaje_total: number
  ancho_barra_pct: number
  cantidad_movimientos: number
}

export interface AnalisisCategoriaItem {
  categoria_id: string | null
  categoria_nombre: string
  monto: number
  porcentaje_del_total: number
  ancho_barra_pct: number
  cantidad_movimientos: number
  subcategorias: AnalisisSubcategoriaItem[]
}

export interface AnalisisFiltrosDisponibles {
  billeteras: Array<{
    id: string
    nombre: string
    moneda: string
  }>
  tarjetas: Array<{
    id: string
    nombre: string
    red: string
    ultimos_4: string
  }>
}

export interface AnalisisResumenResponse {
  moneda_modo: MonedaModoAnalisis
  moneda_visual: 'ARS' | 'USD'
  cotizacion_referencia: AnalisisCotizacionRef
  movimientos_sin_cotizacion?: number
  aviso_cotizacion: string | null
  periodo_seleccionado: AnalisisPeriodoInfo
  kpis: AnalisisKpis
  insights: AnalisisInsight[]
  serie_ciclos: AnalisisCicloPunto[]
  desglose_categorias: AnalisisCategoriaItem[]
  filtros_disponibles: AnalisisFiltrosDisponibles
}

export interface AnalisisMovimientoDrilldown {
  id: string
  descripcion: string
  fecha: string
  monto: number
  moneda: 'ARS' | 'USD' | string
  tipo: string
  categoria_nombre: string
  subcategoria_nombre: string | null
  billetera_nombre: string
  tarjeta_nombre: string | null
  cuota_texto: string | null
  es_suscripcion: boolean
}

export interface AnalisisQueryParams {
  moneda_modo?: MonedaModoAnalisis
  ciclos?: number
  billetera_id?: string
  tarjeta_id?: string
  categoria_id?: string
  naturaleza?: NaturalezaGastoFiltro
}

// ── Fase 3: Comparativa entre Ciclos y Proyección de Compromisos ─────────────
export interface ComparativaCicloMeta {
  clave: string
  etiqueta: string
  rango_texto: string
  es_actual?: boolean
  dias_transcurridos?: number
  dias_totales?: number
}

export interface ComparativaCategoriaItem {
  categoria_id: string | null
  categoria_nombre: string
  monto_a: number
  monto_b: number
  diferencia_monto: number
  diferencia_pct: number | null
  tendencia: 'subio' | 'bajo' | 'igual'
  ancho_a_pct: number
  ancho_b_pct: number
}

export interface ComparativaCiclosResponse {
  moneda_visual: 'ARS' | 'USD'
  ciclos_disponibles: ComparativaCicloMeta[]
  ciclo_a: ComparativaCicloMeta
  ciclo_b: ComparativaCicloMeta
  resumen: {
    gasto_a: number
    gasto_b: number
    diferencia_gasto_monto: number
    diferencia_gasto_pct: number | null
    ingreso_a: number
    ingreso_b: number
    diferencia_ingreso_monto: number
    diferencia_ingreso_pct: number | null
    balance_a: number
    balance_b: number
    mayor_aumento: {
      categoria_nombre: string
      diferencia_monto: number
      diferencia_pct: number | null
    } | null
    mayor_ahorro: {
      categoria_nombre: string
      diferencia_monto: number
      diferencia_pct: number | null
    } | null
  }
  categorias: ComparativaCategoriaItem[]
}

export interface ProyeccionMesPunto {
  clave: string
  etiqueta: string
  rango_texto: string
  mes_nombre?: string
  monto_cuotas: number
  monto_suscripciones: number
  monto_total: number
  cantidad_cuotas: number
  planes_que_finalizan: number
  monto_que_se_libera: number
}

export interface ProyeccionPlanActivo {
  id: string
  descripcion: string
  tarjeta_nombre: string
  cuotas_restantes: number
  cantidad_cuotas: number
  monto_cuota: number
  saldo_pendiente: number
  ultimo_vencimiento: string
  ultimo_mes_etiqueta: string
  progreso_pct: number
}

export interface ProyeccionCompromisosResponse {
  moneda_visual: 'ARS' | 'USD'
  horizonte_meses: number
  kpis: {
    compromiso_mes_actual: number
    total_cuotas_ventana: number
    carga_mensual_suscripciones: number
    cantidad_planes_activos: number
    mes_mayor_alivio: {
      etiqueta: string
      rango_texto?: string
      mes_nombre?: string
      monto_liberado: number
      planes_finalizados: number
    } | null
  }
  serie_mensual: ProyeccionMesPunto[]
  planes_activos: ProyeccionPlanActivo[]
}

// ── Fase 4: Mis Informes Personalizados ──────────────────────────────────────
export type TipoBloqueInforme =
  | 'kpis'
  | 'evolucion_ciclos'
  | 'desglose_categorias'
  | 'comparativa_ciclos'
  | 'proyeccion_cuotas'
  | 'tabla_movimientos'

export interface BloqueInformeConfig {
  id: string
  tipo: TipoBloqueInforme
  titulo: string
  vista_modo?: 'barras' | 'dona' | 'ranking'
}

export interface ConfiguracionInforme {
  moneda_modo: MonedaModoAnalisis
  ciclos: number
  naturaleza: NaturalezaGastoFiltro
  billetera_id?: string
  tarjeta_id?: string
  bloques: BloqueInformeConfig[]
}

export interface InformePersonalizadoItem {
  id: string
  nombre: string
  descripcion: string | null
  icono: string
  es_favorito: boolean
  configuracion: ConfiguracionInforme
  fecha_creacion: string | null
  fecha_actualizacion: string | null
}

const analisisService = {
  async getResumen(params: AnalisisQueryParams, signal?: AbortSignal): Promise<AnalisisResumenResponse> {
    const res = await api.get<AnalisisResumenResponse>('/analisis/resumen', {
      params,
      signal,
    })
    return res.data
  },

  async getDrilldownMovimientos(
    params: AnalisisQueryParams & { subcategoria_id?: string; limit?: number },
    signal?: AbortSignal
  ): Promise<AnalisisMovimientoDrilldown[]> {
    const res = await api.get<{ items: AnalisisMovimientoDrilldown[] }>('/analisis/drilldown-movimientos', {
      params,
      signal,
    })
    return res.data.items
  },

  async getComparativaCiclos(
    params: AnalisisQueryParams & { ciclo_a?: string; ciclo_b?: string },
    signal?: AbortSignal
  ): Promise<ComparativaCiclosResponse> {
    const res = await api.get<ComparativaCiclosResponse>('/analisis/comparativa-ciclos', {
      params,
      signal,
    })
    return res.data
  },

  async getProyeccionCompromisos(
    params: {
      moneda_modo?: MonedaModoAnalisis
      meses?: number
      billetera_id?: string
      tarjeta_id?: string
    },
    signal?: AbortSignal
  ): Promise<ProyeccionCompromisosResponse> {
    const res = await api.get<ProyeccionCompromisosResponse>('/analisis/proyeccion-compromisos', {
      params,
      signal,
    })
    return res.data
  },

  async getInformes(signal?: AbortSignal): Promise<InformePersonalizadoItem[]> {
    const res = await api.get<{ items: InformePersonalizadoItem[] }>('/analisis/informes', { signal })
    return res.data.items
  },

  async createInforme(payload: {
    nombre: string
    descripcion?: string | null
    icono?: string
    es_favorito?: boolean
    configuracion: ConfiguracionInforme
  }): Promise<InformePersonalizadoItem> {
    const res = await api.post<InformePersonalizadoItem>('/analisis/informes', payload)
    return res.data
  },

  async updateInforme(
    id: string,
    payload: Partial<{
      nombre: string
      descripcion: string | null
      icono: string
      es_favorito: boolean
      configuracion: ConfiguracionInforme
    }>
  ): Promise<InformePersonalizadoItem> {
    const res = await api.put<InformePersonalizadoItem>(`/analisis/informes/${id}`, payload)
    return res.data
  },

  async deleteInforme(id: string): Promise<void> {
    await api.delete(`/analisis/informes/${id}`)
  },

  async exportarExcel(params: AnalisisQueryParams & { titulo?: string }): Promise<Blob> {
    const res = await api.get<Blob>('/analisis/exportar-excel', {
      params,
      responseType: 'blob',
    })
    return res.data
  },
}

export default analisisService

