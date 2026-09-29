import catalogoRaw from '../constants/catalogo_suscripciones.json'

export interface ReglaCategoria {
  id: number
  grupos: string[][]
  categoria: string
  subcategoria: string | null
}

export interface ServicioCatalogoRaw {
  id: string
  nombre: string
  categoria?: string
  subcategoria?: string | null
  generico?: boolean
  variantes?: string[]
}

export interface CatalogoData {
  servicios: ServicioCatalogoRaw[]
  reglas_categoria: ReglaCategoria[]
}

const catalogo = catalogoRaw as unknown as CatalogoData

export function normalizarTexto(texto: string): string {
  if (!texto) return ''
  const sinAcentos = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const soloAlfanum = sinAcentos.replace(/[^a-z0-9]/g, ' ')
  return soloAlfanum.trim().replace(/\s+/g, ' ')
}

export function sugerirCategoriaNombre(nombre: string): {
  categoria: string
  subcategoria: string | null
  coincidio: boolean
} {
  const normNombre = normalizarTexto(nombre)
  if (!normNombre) {
    return { categoria: 'Otros', subcategoria: null, coincidio: false }
  }

  const paddedNombre = ` ${normNombre} `

  // Regla 0: Servicios no genéricos del catálogo
  for (const s of catalogo.servicios) {
    if (s.generico) continue
    for (const c of [s.nombre, s.id, ...(s.variantes || [])]) {
      const cNorm = normalizarTexto(c)
      if (cNorm && paddedNombre.includes(` ${cNorm} `)) {
        return {
          categoria: s.categoria || 'Otros',
          subcategoria: s.subcategoria || null,
          coincidio: true,
        }
      }
    }
  }

  // Reglas 1 a 11
  for (const regla of catalogo.reglas_categoria) {
    let coincideRegla = true
    for (const grupo of regla.grupos) {
      const coincideGrupo = grupo.some(palabra => {
        const normPalabra = normalizarTexto(palabra)
        return normPalabra && paddedNombre.includes(` ${normPalabra} `)
      })
      if (!coincideGrupo) {
        coincideRegla = false
        break
      }
    }
    if (coincideRegla) {
      return {
        categoria: regla.categoria,
        subcategoria: regla.subcategoria,
        coincidio: true,
      }
    }
  }

  return { categoria: 'Otros', subcategoria: null, coincidio: false }
}

export const nombreInicial = (s?: { nombre?: string } | null): string =>
  s?.nombre ? s.nombre.replace(/\s*\([^)]*\)/g, '').trim() : ''

export interface ServicioPreseleccionLike {
  id?: string
  nombre?: string
  categoria?: string
  subcategoria?: string | null
  generico?: boolean
}

export function preseleccionCategoria(
  servicio: ServicioPreseleccionLike | 'other' | null | undefined,
  nombre = ''
): { categoria: string; subcategoria: string | null } {
  if (servicio === 'other' || !servicio) {
    const sug = sugerirCategoriaNombre(nombre)
    return { categoria: sug.coincidio ? sug.categoria : 'Otros', subcategoria: sug.coincidio ? sug.subcategoria : null }
  }
  if (!servicio.generico || normalizarTexto(nombre) === normalizarTexto(nombreInicial(servicio))) {
    return { categoria: servicio.categoria || 'Otros', subcategoria: servicio.subcategoria || null }
  }
  const sug = sugerirCategoriaNombre(nombre)
  return sug.coincidio
    ? { categoria: sug.categoria, subcategoria: sug.subcategoria }
    : { categoria: servicio.categoria || 'Otros', subcategoria: servicio.subcategoria || null }
}

export interface CategoriaLike {
  id: string
  nombre: string
  tipo: string
  subcategorias?: Array<{ id: string; nombre: string }>
}

export function sugerirCategoriaSuscripcion(
  nombre: string,
  categorias: CategoriaLike[]
): {
  categoriaNombre: string
  subcategoriaNombre: string | null
  categoriaId: string | null
  subcategoriaId: string | null
  coincidio: boolean
} {
  const sug = sugerirCategoriaNombre(nombre)
  const egresoCats = categorias.filter(c => c.tipo === 'egreso')

  const normTarget = normalizarTexto(sug.categoria)
  let matchedCat = egresoCats.find(c => normalizarTexto(c.nombre) === normTarget)

  let matchedSubId: string | null = null

  if (!matchedCat) {
    matchedCat = egresoCats.find(c => normalizarTexto(c.nombre) === 'otros')
  } else if (sug.subcategoria && matchedCat.subcategorias) {
    const normSubTarget = normalizarTexto(sug.subcategoria)
    const matchedSub = matchedCat.subcategorias.find(s => normalizarTexto(s.nombre) === normSubTarget)
    if (matchedSub) {
      matchedSubId = matchedSub.id
    }
  }

  return {
    categoriaNombre: sug.categoria,
    subcategoriaNombre: sug.subcategoria,
    categoriaId: matchedCat ? matchedCat.id : null,
    subcategoriaId: matchedSubId,
    coincidio: sug.coincidio,
  }
}
