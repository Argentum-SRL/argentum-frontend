import type { ConfiguracionInforme, TipoBloqueInforme } from '@/services/analisis.service'

export type BloqueItemDescarga =
  | TipoBloqueInforme
  | { id?: string; tipo: TipoBloqueInforme; titulo?: string }

export interface PedidoDescargaParams {
  moneda_modo?: string
  ciclos?: number
  naturaleza?: string
  billetera_id?: string
  tarjeta_id?: string
  categoria_id?: string
  ciclo_a?: string
  ciclo_b?: string
  meses?: number
}

export interface PedidoDescarga {
  tipo?: 'tab' | 'informe'
  titulo: string
  bloques: BloqueItemDescarga[]
  params: PedidoDescargaParams
  filtros?: PedidoDescargaParams
}

export interface ContextoDescarga {
  tab?: 'evolucion' | 'categorias' | 'comparativa' | 'comparar' | 'proyeccion' | 'informes' | 'mis_informes'
  tabActiva?: 'evolucion' | 'categorias' | 'comparativa' | 'comparar' | 'proyeccion' | 'informes' | 'mis_informes'
  filtros?: PedidoDescargaParams
  cicloA?: string | null
  cicloB?: string | null
  mesesProyeccion?: number
  meses?: number
  informeAbierto?: {
    nombre: string
    configuracion: ConfiguracionInforme
    cicloA?: string | null
    cicloB?: string | null
    meses?: number
  } | null
  modoInformes?: 'galeria' | 'constructor' | 'visor'
  tituloInforme?: string
  bloquesInforme?: BloqueItemDescarga[]
  datosResumen?: unknown
  datosVisor?: unknown
}

export function obtenerTipoBloque(b: BloqueItemDescarga): TipoBloqueInforme {
  return typeof b === 'string' ? b : b.tipo
}

export function obtenerTituloBloque(b: BloqueItemDescarga): string | undefined {
  return typeof b === 'string' ? undefined : b.titulo
}

export function normalizarSlug(texto: string): string {
  if (!texto || typeof texto !== 'string' || !texto.trim()) return 'analisis'
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'analisis'
  )
}

export function nombreArchivoDescarga(
  tituloOPedido: string | { titulo: string },
  extension: 'xlsx' | 'pdf' | string,
  hoy?: Date
): string {
  const titulo = typeof tituloOPedido === 'string' ? tituloOPedido : tituloOPedido?.titulo || 'analisis'
  const refHoy = hoy || new Date()
  const yyyy = refHoy.getFullYear()
  const mm = String(refHoy.getMonth() + 1).padStart(2, '0')
  const dd = String(refHoy.getDate()).padStart(2, '0')
  const extRaw = extension.replace(/^\./, '').toLowerCase()
  return `argentum_${normalizarSlug(titulo)}_${yyyy}${mm}${dd}.${extRaw === 'excel' ? 'xlsx' : extRaw}`
}

export function resumenPedido(
  pedido: PedidoDescarga,
  nombres?: {
    billeteras?: Record<string, string>
    tarjetas?: Record<string, string>
    billeteraNombre?: string
    tarjetaNombre?: string
  },
  opciones?: {
    incluirTitulo?: boolean
  }
): string {
  const partes: string[] = []
  if (opciones?.incluirTitulo !== false) {
    partes.push(pedido.titulo)
  }

  const p = pedido.params || pedido.filtros || {}
  const bloquesRelevantes = (pedido.bloques || [])
    .map(obtenerTipoBloque)
    .filter((t) => t !== 'tabla_movimientos')
  const esSoloProyeccion =
    bloquesRelevantes.length > 0 &&
    bloquesRelevantes.every((t) => t === 'proyeccion_cuotas')

  if (esSoloProyeccion) {
    const n = p.meses ?? 6
    partes.push(`Próximos ${n} meses`)
  } else if (p.ciclos) {
    partes.push(`Últimos ${p.ciclos} ciclos`)
  } else if (p.meses) {
    partes.push(`Próximos ${p.meses} meses`)
  }

  const modo = (p.moneda_modo || 'solo_ars').toLowerCase()
  partes.push(modo.includes('usd') ? 'Dólares' : 'Pesos')

  if (p.billetera_id && p.billetera_id !== 'todos') {
    partes.push(nombres?.billeteras?.[p.billetera_id] || nombres?.billeteraNombre || 'Billetera seleccionada')
  } else {
    partes.push('Todas las billeteras')
  }

  if (p.tarjeta_id && p.tarjeta_id !== 'todos') {
    partes.push(nombres?.tarjetas?.[p.tarjeta_id] || nombres?.tarjetaNombre || 'Tarjeta seleccionada')
  }

  const nat = (p.naturaleza || 'todos').toLowerCase().trim()
  if (nat === 'cuotas') partes.push('Cuotas')
  else if (nat === 'fijos') partes.push('Gastos fijos')
  else if (nat === 'variables') partes.push('Gastos variables')

  return partes.join(' · ')
}

function baseParams(f?: PedidoDescargaParams): PedidoDescargaParams {
  return {
    moneda_modo: f?.moneda_modo ?? 'solo_ars',
    ciclos: f?.ciclos ?? 6,
    naturaleza: f?.naturaleza ?? 'todos',
    billetera_id: f?.billetera_id,
    tarjeta_id: f?.tarjeta_id,
    categoria_id: f?.categoria_id,
  }
}

export function armarPedidoDescarga(contexto: ContextoDescarga): PedidoDescarga | null {
  const tab = contexto.tabActiva || contexto.tab
  const f = contexto.filtros || {}
  const cicloA = contexto.cicloA ?? f.ciclo_a
  const cicloB = contexto.cicloB ?? f.ciclo_b
  const meses = contexto.mesesProyeccion ?? contexto.meses ?? f.meses ?? 6

  if (tab === 'evolucion') {
    const p = baseParams(f)
    return { tipo: 'tab', titulo: 'Análisis - Evolución', bloques: ['kpis', 'evolucion_ciclos'], params: p, filtros: p }
  }
  if (tab === 'categorias') {
    const p = baseParams(f)
    return { tipo: 'tab', titulo: 'Análisis - Categorías', bloques: ['kpis', 'desglose_categorias'], params: p, filtros: p }
  }
  if (tab === 'comparar' || tab === 'comparativa') {
    const p = { ...baseParams(f), ...(cicloA ? { ciclo_a: cicloA } : {}), ...(cicloB ? { ciclo_b: cicloB } : {}) }
    return { tipo: 'tab', titulo: 'Análisis - Comparar', bloques: ['comparativa_ciclos'], params: p, filtros: p }
  }
  if (tab === 'proyeccion') {
    const p = { ...baseParams(f), meses: meses === 12 ? 12 : 6 }
    return { tipo: 'tab', titulo: 'Análisis - Proyección', bloques: ['proyeccion_cuotas'], params: p, filtros: p }
  }

  if (tab === 'informes' || tab === 'mis_informes') {
    if (contexto.modoInformes === 'galeria' || contexto.modoInformes === 'constructor') return null
    if (contexto.informeAbierto) {
      const cfg = contexto.informeAbierto.configuracion
      const p: PedidoDescargaParams = {
        ...baseParams(cfg),
        ...(contexto.informeAbierto.cicloA ? { ciclo_a: contexto.informeAbierto.cicloA } : {}),
        ...(contexto.informeAbierto.cicloB ? { ciclo_b: contexto.informeAbierto.cicloB } : {}),
        ...(contexto.informeAbierto.meses ? { meses: contexto.informeAbierto.meses } : {}),
      }
      return { tipo: 'informe', titulo: contexto.informeAbierto.nombre, bloques: cfg.bloques, params: p, filtros: p }
    }
    if (contexto.tituloInforme && contexto.bloquesInforme && contexto.bloquesInforme.length > 0) {
      const p = { ...baseParams(f), ...(cicloA ? { ciclo_a: cicloA } : {}), ...(cicloB ? { ciclo_b: cicloB } : {}), ...(meses ? { meses } : {}) }
      return { tipo: 'informe', titulo: contexto.tituloInforme, bloques: contexto.bloquesInforme, params: p, filtros: p }
    }
    return null
  }

  return null
}
