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
