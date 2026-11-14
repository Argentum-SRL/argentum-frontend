import categoriaService from '@/services/categoria.service'

/**
 * Cache dinámico de colores provistos por la API por ID de categoría (Decisión 15.g).
 */
const API_CATEGORY_COLORS: Record<string, string> = {}

categoriaService
  .getCategorias()
  .then((cats) => {
    for (const c of cats) {
      if (c.id && c.color) {
        API_CATEGORY_COLORS[c.id] = c.color
      }
    }
  })
  .catch(() => {})

/**
 * Paleta canónica oficial de categorías de Argentum (sincronizada con Backend ARBOL_CATEGORIAS).
 * Claves normalizadas (sin tildes, minúsculas).
 */
export const COLORES_CATEGORIA: Record<string, string> = {
  // Egresos principales
  alimentacion: '#F97316', // Naranja vibrante
  gastronomia: '#F59E0B', // Ámbar cálido
  transporte: '#0284C7', // Azul cielo
  vivienda: '#EAB308', // Amarillo dorado
  hogar: '#8B5CF6', // Violeta / Púrpura
  salud: '#10B981', // Verde esmeralda
  'cuidado personal': '#C026D3', // Fucsia
  ocio: '#EC4899', // Rosa
  educacion: '#DC2626', // Rojo
  indumentaria: '#7C3AED', // Violeta intenso
  tecnologia: '#6366F1', // Índigo
  impuestos: '#78716C', // Piedra / Gris cálido
  banco: '#64748B', // Pizarra / Azul grisáceo
  otros: '#6B7280', // Gris neutro
  ahorro: '#2563EB', // Azul real

  // Ingresos
  trabajo: '#16A34A', // Verde hoja
  'jubilacion y auh': '#65A30D', // Verde lima
  inversiones: '#2563EB', // Azul inversión
  'otros ingresos': '#10B981',

  // Alias y variantes semánticas
  servicios: '#EAB308',
  restaurante: '#F59E0B',
  restaurantes: '#F59E0B',
  'restaurantes y delivery': '#F59E0B',
  recreativo: '#EC4899',
  entretenimiento: '#EC4899',
  'entretenimiento y salidas': '#EC4899',
  'equipamiento del hogar': '#8B5CF6',
  comunicacion: '#6366F1',
  ropa: '#7C3AED',
  'ropa e indumentaria': '#7C3AED',
  supermercado: '#F97316',
}

/**
 * Colores predefinidos y diferenciados para subcategorías comunes de Argentum.
 */
export const COLORES_SUBCATEGORIA: Record<string, string> = {
  // Alimentación
  supermercado: '#EA580C',
  verduleria: '#16A34A',
  carniceria: '#DC2626',
  polleria: '#F59E0B',
  pescaderia: '#0284C7',
  panaderia: '#D97706',
  kiosco: '#EC4899',
  dietetica: '#84CC16',

  // Gastronomía
  restaurantes: '#F59E0B',
  restaurante: '#F59E0B',
  delivery: '#EA580C',
  cafeteria: '#B45309',
  bar: '#8B5CF6',
  heladeria: '#06B6D4',

  // Transporte
  'transporte publico': '#0284C7',
  'taxi y apps': '#F59E0B',
  'taxi / apps': '#F59E0B',
  taxi: '#F59E0B',
  combustible: '#EF4444',
  estacionamiento: '#6366F1',
  peajes: '#8B5CF6',
  peaje: '#8B5CF6',
  auto: '#64748B',
  bicicleta: '#10B981',
  'bicicleta / patineta': '#10B981',

  // Vivienda
  alquiler: '#EAB308',
  expensas: '#84CC16',
  luz: '#FBBF24',
  electricidad: '#FBBF24',
  gas: '#FB923C',
  agua: '#38BDF8',

  // Hogar
  limpieza: '#06B6D4',
  'muebles y electro': '#8B5CF6',
  'muebles y decoracion': '#8B5CF6',
  reparaciones: '#F59E0B',
  mantenimiento: '#F59E0B',
  'servicio domestico': '#10B981',

  // Salud
  'prepaga y obra social': '#0D9488',
  medico: '#0284C7',
  farmacia: '#10B981',
  dentista: '#8B5CF6',
  terapias: '#EC4899',

  // Cuidado personal
  'peluqueria y belleza': '#C026D3',
  perfumeria: '#F472B6',

  // Ocio
  salidas: '#F43F5E',
  streaming: '#6366F1',
  'hobbies y juegos': '#8B5CF6',
  'deportes y gimnasio': '#10B981',
  viajes: '#0284C7',

  // Educación
  'colegio y facultad': '#DC2626',
  cursos: '#F59E0B',
  'libros y utiles': '#2563EB',

  // Indumentaria
  ropa: '#7C3AED',
  calzado: '#0284C7',
  accesorios: '#EC4899',

  // Tecnología
  celular: '#6366F1',
  internet: '#06B6D4',
  'apps y programas': '#8B5CF6',
  equipos: '#64748B',

  // Impuestos
  'abl e inmobiliario': '#78716C',
  patente: '#64748B',
  monotributo: '#A8A29E',

  // Banco
  comisiones: '#64748B',
  prestamos: '#EF4444',
  intereses: '#F59E0B',
  seguros: '#0284C7',
  'tarjeta de credito': '#8B5CF6',

  // Otros
  regalos: '#EC4899',
  mascotas: '#F59E0B',
  'ayuda familiar': '#10B981',
  'pagos a personas': '#6366F1',
  'paso por mi cuenta': '#6B7280',
}

/**
 * Paleta de respaldo de alto contraste para categorías o subcategorías personalizadas.
 */
export const PALETA_CATEGORIAS_FALLBACK = [
  '#F97316', // Naranja
  '#0284C7', // Azul cielo
  '#10B981', // Verde esmeralda
  '#EAB308', // Amarillo dorado
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#F59E0B', // Ámbar
  '#06B6D4', // Cian
  '#DC2626', // Rojo
  '#6366F1', // Índigo
  '#84CC16', // Lima
  '#64748B', // Slate
]

/**
 * Paleta de respaldo diferenciada para subcategorías dentro de una misma categoría.
 */
export const PALETA_SUBCATEGORIAS_FALLBACK = [
  '#0284C7', // Azul cielo
  '#10B981', // Verde esmeralda
  '#F59E0B', // Ámbar
  '#EC4899', // Rosa
  '#8B5CF6', // Violeta
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#14B8A6', // Teal
  '#6366F1', // Índigo
  '#84CC16', // Lima
  '#EAB308', // Amarillo
  '#7C3AED', // Violeta oscuro
]

function normalizar(texto?: string | null): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Obtiene el color canónico predefinido para una categoría.
 * Prioridad:
 * 1. Color retornado por la API para ese ID de categoría
 * 2. Mapeo oficial de nombre canónico
 * 3. Color de respaldo de la paleta de alto contraste según índice
 */
export function getCategoriaColor(
  categoriaOrNombre?: string | { categoria_id?: string | null; categoria_nombre?: string } | null,
  index = 0
): string {
  if (!categoriaOrNombre) {
    return PALETA_CATEGORIAS_FALLBACK[index % PALETA_CATEGORIAS_FALLBACK.length]
  }

  let id: string | null | undefined
  let nombre: string | undefined

  if (typeof categoriaOrNombre === 'string') {
    nombre = categoriaOrNombre
  } else {
    id = categoriaOrNombre.categoria_id
    nombre = categoriaOrNombre.categoria_nombre
  }

  if (id && API_CATEGORY_COLORS[id]) {
    return API_CATEGORY_COLORS[id]
  }

  const key = normalizar(nombre)
  if (key && COLORES_CATEGORIA[key]) {
    return COLORES_CATEGORIA[key]
  }

  return PALETA_CATEGORIAS_FALLBACK[index % PALETA_CATEGORIAS_FALLBACK.length]
}

/**
 * Obtiene el color canónico predefinido o diferenciado para una subcategoría.
 * Prioridad:
 * 1. Mapeo específico compuesto `categoriaPadre|subcategoria`
 * 2. Mapeo específico por nombre de subcategoría
 * 3. Si no existe, color diferenciado de la paleta armónica según el índice
 */
export function getSubcategoriaColor(
  subcategoriaOrNombre?:
    | string
    | { subcategoria_id?: string; subcategoria_nombre?: string }
    | null,
  parentCategoriaNombre?: string | null,
  index = 0
): string {
  if (!subcategoriaOrNombre) {
    return PALETA_SUBCATEGORIAS_FALLBACK[index % PALETA_SUBCATEGORIAS_FALLBACK.length]
  }

  const subNombre =
    typeof subcategoriaOrNombre === 'string'
      ? subcategoriaOrNombre
      : subcategoriaOrNombre.subcategoria_nombre

  const subKey = normalizar(subNombre)
  if (parentCategoriaNombre) {
    const parentKey = normalizar(parentCategoriaNombre)
    const compoundKey = `${parentKey}|${subKey}`
    if (COLORES_SUBCATEGORIA[compoundKey]) {
      return COLORES_SUBCATEGORIA[compoundKey]
    }
  }

  if (subKey && COLORES_SUBCATEGORIA[subKey]) {
    return COLORES_SUBCATEGORIA[subKey]
  }

  return PALETA_SUBCATEGORIAS_FALLBACK[index % PALETA_SUBCATEGORIAS_FALLBACK.length]
}
