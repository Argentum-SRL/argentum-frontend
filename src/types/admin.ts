export interface UsuarioAdminResumen {
  id: string
  nombre: string | null
  apellido: string | null
  email: string | null
  telefono: string | null
  auth_provider?: string | null
  is_active: boolean
  is_admin: boolean
  onboarding_completado: boolean
  whatsapp_vinculado: boolean
  created_at: string
  ultima_actividad: string | null
  foto_url: string | null
}

export interface UsuarioAdmin extends UsuarioAdminResumen {
  paso_onboarding_actual: string | null
}

export interface PaginatedUsuarios {
  total: number
  page: number
  limit: number
  pages: number
  usuarios: UsuarioAdminResumen[]
}

export interface FiltrosAdmin {
  page?: number
  limit?: number
  search?: string
  estado?: 'activo' | 'inactivo' | 'bloqueado' | ''
  onboarding?: 'completo' | 'incompleto' | ''
  wpp?: 'vinculado' | 'no_vinculado' | ''
}

export interface AdminStats {
  total: number
  activos: number
  onboarding_completo: number
  whatsapp_vinculados: number
  nuevos_hoy: number
  nuevos_7_dias: number
  activos_7_dias: number
  admins_total: number
  por_proveedor: Record<string, number>
}

export interface CalidadResumen {
  total: number
  entendidos_primera: number
  porcentaje_entendidos_primera: number
  no_entendidos: number
  deshechos_o_corregidos: number
  correcciones: number
  errores_ia: number
  topes: number
}

export interface CostoPorDia {
  fecha: string
  total_usd: number | string
}

export interface CostoPorUsuario {
  usuario_id: string
  email: string | null
  total_usd: number | string
}

export interface CostoResumen {
  total_usd: number | string
  por_funcion: Record<string, number | string>
  por_dia: CostoPorDia[]
  por_usuario: CostoPorUsuario[]
  sin_usuario_usd: number | string
}

export interface TopesHoyResumen {
  gasto_hoy_usd: number | string
  presupuesto_usd: number | string
  nivel: 'normal' | 'aviso' | 'sin_archivos' | 'sin_ia'
  usuarios_tope_mensajes: number
  usuarios_tope_archivos: number
}

export interface SaludResumen {
  tiempo_respuesta_mediana_ms: number | null
  tiempo_respuesta_p90_ms: number | null
  mensajes_con_tiempo: number
  avisos_whatsapp_enviados: number
  avisos_whatsapp_sin_enviar: number
}

export interface MonitorWppResumen {
  calidad: CalidadResumen
  costo: CostoResumen
  topes_hoy: TopesHoyResumen
  salud: SaludResumen
}

export interface ConversacionMonitorItem {
  fecha: string
  usuario_id: string
  email: string | null
  tipo_mensaje: string
  intent: string | null
  categoria: string
  confianza: number | null
  tiempo_respuesta_ms: number | null
  error_ia: boolean
  texto_visible: boolean
  mensaje_usuario: string | null
  transcripcion: string | null
  mensaje_bot: string | null
}

export interface PaginatedConversacionesMonitor {
  total: number
  pagina: number
  items: ConversacionMonitorItem[]
}
