import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import type {
  AnalisisResumenResponse,
  ComparativaCiclosResponse,
  ProyeccionCompromisosResponse,
} from '@/services/analisis.service'
import analisisService from '@/services/analisis.service'
import {
  armarPedidoDescarga,
  nombreArchivoDescarga,
  resumenPedido,
  normalizarSlug,
  type PedidoDescarga,
} from './descargaAnalisis'
import {
  exportarInformePdf,
} from './exportarInformePdf'
import {
  armarContenidoPdf,
  type DatosInformePdf,
} from './contenidoPdf'
import { PLANTILLAS_RAPIDAS } from './plantillasInforme'

const mockSave = vi.fn()
const mockAddPage = vi.fn()
const mockSetPage = vi.fn()
const mockText = vi.fn()
const mockRect = vi.fn()
const mockSetFillColor = vi.fn()
const mockSetTextColor = vi.fn()
const mockSetFont = vi.fn()
const mockSetFontSize = vi.fn()
const mockGetNumberOfPages = vi.fn().mockReturnValue(2)
let capturedJsPdfOptions: unknown = null

vi.mock('jspdf', () => {
  return {
    default: class MockJsPdf {
      constructor(options: unknown) {
        if (!capturedJsPdfOptions) {
          capturedJsPdfOptions = options
        }
      }
      save = mockSave
      addPage = mockAddPage
      setPage = mockSetPage
      text = mockText
      rect = mockRect
      setFillColor = mockSetFillColor
      setTextColor = mockSetTextColor
      setFont = mockSetFont
      setFontSize = mockSetFontSize
      getNumberOfPages = mockGetNumberOfPages
    },
  }
})

vi.mock('jspdf-autotable', () => {
  return {
    default: vi.fn().mockImplementation((doc: Record<string, unknown>) => {
      doc.lastAutoTable = { finalY: 60 }
    }),
  }
})

const ANALISIS_DIR = path.resolve(__dirname)

const mockDatos = {
  resumen: {
    periodo_seleccionado: {
      clave: '2026-11',
      etiqueta: 'Últimos 6 ciclos (01/06/2026 - 30/11/2026)',
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-11-30',
      dias_totales: 183,
    },
    moneda_visual: 'ARS',
    kpis: {
      ingresos_totales: 1500000,
      gastos_totales: 1300000,
      balance_neto: 200000,
      tasa_ahorro_pct: 13.3,
      promedio_gasto_ciclo: 216666.67,
      cantidad_operaciones: 42,
    },
    frase_resumen: 'Tus gastos se mantuvieron estables en los últimos 6 ciclos.',
    serie_ciclos: [
      {
        clave: '2026-06',
        etiqueta: 'Jun 2026',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
        ingresos: null,
        gastos: 0,
        balance: null,
        tasa_ahorro_pct: null,
        es_actual: false,
        sin_datos: true,
      },
      {
        clave: '2026-11',
        etiqueta: 'Nov 2026',
        fecha_inicio: '2026-11-01',
        fecha_fin: '2026-11-30',
        ingresos: 500000,
        gastos: 320000,
        balance: 180000,
        tasa_ahorro_pct: 36.0,
        es_actual: true,
        sin_datos: false,
      },
    ],
    desglose_categorias: [
      {
        categoria_id: 'cat-1',
        categoria_nombre: 'Supermercado',
        monto: 150000,
        porcentaje_del_total: 12.5,
        cantidad_movimientos: 10,
        subcategorias: [
          {
            subcategoria_nombre: 'Alimentos',
            monto: 100000,
            porcentaje_total: 8.3,
            cantidad_movimientos: 7,
          },
        ],
      },
    ],
    desglose_tarjetas: [],
    filtros_disponibles: {
      billeteras: [],
      tarjetas: [],
      categorias: [],
      ciclos: [],
    },
  },
  comparativa: {
    ciclo_a: {
      clave: '2026-10',
      etiqueta: 'Octubre 2026',
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-10-31',
    },
    ciclo_b: {
      clave: '2026-09',
      etiqueta: 'Septiembre 2026',
      fecha_inicio: '2026-09-01',
      fecha_fin: '2026-09-30',
    },
    moneda_visual: 'ARS',
    categorias: [
      {
        categoria_id: 'cat-1',
        categoria_nombre: 'Supermercado',
        monto_a: 120000,
        monto_b: 100000,
        diferencia_monto: 20000,
        diferencia_pct: 20.0,
      },
    ],
    totales: {
      monto_a: 120000,
      monto_b: 100000,
      diferencia_monto: 20000,
      diferencia_pct: 20.0,
    },
  },
  proyeccion: {
    moneda_visual: 'ARS',
    meses_horizonte: 6,
    resumen: {
      total_comprometido: 60000,
      total_cuotas: 50000,
      total_suscripciones: 10000,
      promedio_mensual: 10000,
    },
    serie_mensual: [
      {
        clave: '2026-12',
        etiqueta: 'Dic 2026',
        monto_cuotas: 25000,
        monto_suscripciones: 5000,
        monto_total: 30000,
        planes_que_finalizan: 1,
        monto_que_se_libera: 15000,
      },
    ],
    planes_activos: [
      {
        transaccion_id: 'tx-1',
        descripcion: 'Notebook',
        tarjeta_nombre: 'Visa Santander',
        cuotas_restantes: 3,
        cantidad_cuotas: 6,
        monto_cuota: 25000,
        saldo_pendiente: 75000,
        ultimo_mes_etiqueta: 'Feb 2027',
      },
    ],
    suscripciones_activas: [],
  },
} as unknown as DatosInformePdf

describe('TF6: Tests unitarios de armarPedidoDescarga', () => {
  it('para cada pestaña devuelve titulo, bloques y params de A-1 (Comparar con ciclo A/B y Proyección con meses 12)', () => {
    // Evolución
    const pEvo = armarPedidoDescarga({
      tab: 'evolucion',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    })
    expect(pEvo).not.toBeNull()
    expect(pEvo?.titulo).toBe('Análisis - Evolución')
    expect(pEvo?.bloques).toEqual(['kpis', 'evolucion_ciclos'])
    expect(pEvo?.params.ciclos).toBe(6)

    // Categorías
    const pCat = armarPedidoDescarga({
      tab: 'categorias',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    })
    expect(pCat).not.toBeNull()
    expect(pCat?.titulo).toBe('Análisis - Categorías')
    expect(pCat?.bloques).toEqual(['kpis', 'desglose_categorias'])

    // Comparar con ciclo A y B
    const pComp = armarPedidoDescarga({
      tab: 'comparar',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
      cicloA: '2026-10',
      cicloB: '2026-09',
    })
    expect(pComp).not.toBeNull()
    expect(pComp?.titulo).toBe('Análisis - Comparar')
    expect(pComp?.bloques).toEqual(['comparativa_ciclos'])
    expect(pComp?.params.ciclo_a).toBe('2026-10')
    expect(pComp?.params.ciclo_b).toBe('2026-09')

    // Proyección con meses 12
    const pProy = armarPedidoDescarga({
      tab: 'proyeccion',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
      mesesProyeccion: 12,
    })
    expect(pProy).not.toBeNull()
    expect(pProy?.titulo).toBe('Análisis - Proyección')
    expect(pProy?.bloques).toEqual(['proyeccion_cuotas'])
    expect(pProy?.params.meses).toBe(12)
  })

  it('informes en galería y en constructor devuelve null', () => {
    const pGal = armarPedidoDescarga({
      tab: 'informes',
      modoInformes: 'galeria',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    })
    expect(pGal).toBeNull()

    const pCons = armarPedidoDescarga({
      tab: 'informes',
      modoInformes: 'constructor',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    })
    expect(pCons).toBeNull()

    const pSinVisor = armarPedidoDescarga({
      tab: 'informes',
      filtros: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    })
    expect(pSinVisor).toBeNull()
  })

  it('visor de la plantilla "Gastos del día a día" devuelve bloques [kpis, desglose_categorias, comparativa_ciclos], ciclos 3, naturaleza variables', () => {
    const plantilla = PLANTILLAS_RAPIDAS.find((p) => p.nombre === 'Gastos del día a día')
    expect(plantilla).toBeDefined()

    const pPlantilla = armarPedidoDescarga({
      tab: 'informes',
      modoInformes: 'visor',
      informeAbierto: {
        nombre: plantilla!.nombre,
        configuracion: plantilla!.configuracion,
      },
    })

    expect(pPlantilla).not.toBeNull()
    expect(pPlantilla?.titulo).toBe('Gastos del día a día')
    expect(pPlantilla?.bloques.map((b) => (typeof b === 'string' ? b : b.tipo))).toEqual([
      'kpis',
      'desglose_categorias',
      'comparativa_ciclos',
    ])
    expect(pPlantilla?.params.ciclos).toBe(3)
    expect(pPlantilla?.params.naturaleza).toBe('variables')
  })

  it('un informe personalizado devuelve su configuracion tal cual', () => {
    const cfgCustom = {
      moneda_modo: 'solo_usd' as const,
      ciclos: 12,
      naturaleza: 'fijos' as const,
      billetera_id: 'b-99',
      tarjeta_id: 't-12',
      bloques: [
        { id: 'b3', tipo: 'proyeccion_cuotas' as const, titulo: 'Compromisos de Fin de Año' },
        { id: 'b1', tipo: 'kpis' as const, titulo: 'KPIs Anuales' },
      ],
    }

    const pCustom = armarPedidoDescarga({
      tab: 'informes',
      modoInformes: 'visor',
      informeAbierto: {
        nombre: 'Mi Informe Anual',
        configuracion: cfgCustom,
      },
    })

    expect(pCustom).not.toBeNull()
    expect(pCustom?.titulo).toBe('Mi Informe Anual')
    expect(pCustom?.bloques).toEqual(cfgCustom.bloques)
    expect(pCustom?.params.moneda_modo).toBe('solo_usd')
    expect(pCustom?.params.ciclos).toBe(12)
    expect(pCustom?.params.naturaleza).toBe('fijos')
    expect(pCustom?.params.billetera_id).toBe('b-99')
    expect(pCustom?.params.tarjeta_id).toBe('t-12')
  })

  it('nombreArchivoDescarga con los dos ejemplos de A-1 y remoción de acentos', () => {
    const fechaRef = new Date(2026, 10, 14) // 14 de noviembre de 2026
    const pdfResumen = nombreArchivoDescarga('Resumen del ciclo', 'pdf', fechaRef)
    expect(pdfResumen).toBe('argentum_resumen_del_ciclo_20261114.pdf')

    const xlsxEvolucion = nombreArchivoDescarga('Análisis - Evolución', 'xlsx', fechaRef)
    expect(xlsxEvolucion).toBe('argentum_analisis_evolucion_20261114.xlsx')

    // Sin acentos
    expect(normalizarSlug('Análisis')).toBe('analisis')
    expect(normalizarSlug('Evolución')).toBe('evolucion')
  })

  it('resumenPedido genera los textos descriptivos sin ARS ni USD (usa Pesos / Dólares)', () => {
    const pedidoArs: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Evolución',
      bloques: ['evolucion_ciclos'],
      params: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    }
    const resArs = resumenPedido(pedidoArs)
    expect(resArs).toContain('Pesos')
    expect(resArs).not.toContain('ARS')

    const pedidoUsd: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Categorías',
      bloques: ['desglose_categorias'],
      params: { moneda_modo: 'solo_usd', ciclos: 6, naturaleza: 'todos' },
    }
    const resUsd = resumenPedido(pedidoUsd)
    expect(resUsd).toContain('Dólares')
    expect(resUsd).not.toContain('USD')
  })
})

describe('TF12: resumenPedido con proyección y opciones', () => {
  it('pedido con solo proyeccion_cuotas y meses 12 dice "Próximos 12 meses" y no "ciclos"', () => {
    const pedidoProy: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Análisis - Proyección',
      bloques: ['proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars', ciclos: 6, meses: 12 },
    }
    const res = resumenPedido(pedidoProy)
    expect(res).toContain('Próximos 12 meses')
    expect(res).not.toContain('ciclos')
    expect(res).not.toContain('Últimos')
  })

  it('con { incluirTitulo: false } no empieza con el título', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Mi Título',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars', ciclos: 3 },
    }
    const res = resumenPedido(pedido, undefined, { incluirTitulo: false })
    expect(res.startsWith('Mi Título')).toBe(false)
    expect(res).not.toContain('Mi Título')
    expect(res).toContain('Últimos 3 ciclos')
  })

  it('sin tercer parámetro empieza con el título (como hoy)', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Mi Título',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars', ciclos: 3 },
    }
    const res = resumenPedido(pedido)
    expect(res.startsWith('Mi Título')).toBe(true)
  })
})

describe('TF7: Tests unitarios de armarContenidoPdf', () => {
  it('secciones en el orden de los bloques con sus títulos propios', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Reordenado',
      bloques: [
        { tipo: 'proyeccion_cuotas', titulo: 'Mi Proyección' },
        { tipo: 'kpis', titulo: 'Mis Números' },
        { tipo: 'evolucion_ciclos', titulo: 'Mi Evolución' },
      ],
      params: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    }

    const secciones = armarContenidoPdf(pedido, mockDatos)
    expect(secciones).toHaveLength(3)
    expect(secciones[0].titulo).toBe('Mi Proyección')
    expect(secciones[1].titulo).toBe('Mis Números')
    expect(secciones[2].titulo).toBe('Mi Evolución')
  })

  it('tabla_movimientos no genera sección', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte con movimientos',
      bloques: [
        { tipo: 'kpis', titulo: 'Mis KPIs' },
        { tipo: 'tabla_movimientos', titulo: 'Movimientos' },
      ],
      params: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    }

    const secciones = armarContenidoPdf(pedido, mockDatos)
    expect(secciones).toHaveLength(1)
    expect(secciones[0].titulo).toBe('Mis KPIs')
  })

  it('porcentajes con coma, filas "Sin datos" y "En curso", y encabezados exactos de A-5', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Integral',
      bloques: [
        { tipo: 'kpis', titulo: 'Números' },
        { tipo: 'evolucion_ciclos', titulo: 'Evolución' },
        { tipo: 'desglose_categorias', titulo: 'Categorías' },
        { tipo: 'comparativa_ciclos', titulo: 'Comparativa' },
        { tipo: 'proyeccion_cuotas', titulo: 'Proyección' },
      ],
      params: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos' },
    }

    const secciones = armarContenidoPdf(pedido, mockDatos)
    expect(secciones).toHaveLength(5)

    // 1. KPIs
    const secKpis = secciones[0]
    expect(secKpis.nota).toBe('Tus gastos se mantuvieron estables en los últimos 6 ciclos.')
    const filaTeQuedo = secKpis.tablas[0].filas.find((r) => r[0] === 'Te quedó')
    expect(filaTeQuedo).toBeDefined()
    const filaAhorro = secKpis.tablas[0].filas.find((r) => r[0] === '% de lo que entró')
    expect(filaAhorro).toBeDefined()
    expect((filaAhorro?.[1] as { valor: number }).valor).toBe(13.3)

    // 2. Evolución
    const secEvo = secciones[1]
    expect(secEvo.tablas[0].encabezados).toEqual([
      'Ciclo',
      'Desde',
      'Hasta',
      'Ingresos',
      'Gastos',
      'Te quedó',
      '% de lo que entró',
      'Estado',
    ])
    const filaSinDatos = secEvo.tablas[0].filas.find((r) => r[7] === 'Sin datos')
    expect(filaSinDatos).toBeDefined()
    const filaEnCurso = secEvo.tablas[0].filas.find((r) => r[7] === 'En curso')
    expect(filaEnCurso).toBeDefined()

    // 3. Categorías
    const secCat = secciones[2]
    expect(secCat.tablas[0].encabezados).toEqual([
      'Categoría',
      'Subcategoría',
      'Monto',
      '% del total',
      'Movimientos',
    ])
    const filaCat = secCat.tablas[0].filas.find((r) => r[0] === 'Supermercado')
    expect(filaCat).toBeDefined()
    expect((filaCat?.[3] as { valor: number }).valor).toBe(12.5)

    // 4. Comparativa
    const secComp = secciones[3]
    expect(secComp.tablas[0].encabezados).toEqual([
      'Categoría',
      'Octubre 2026',
      'Septiembre 2026',
      'Diferencia',
      'Diferencia %',
    ])

    // 5. Proyección
    const secProy = secciones[4]
    expect(secProy.tablas[0].encabezados).toEqual([
      'Ciclo',
      'Cuotas',
      'Suscripciones',
      'Total',
      'Compras que terminan',
      'Se libera',
    ])
    expect(secProy.tablas[1].encabezados).toEqual([
      'Compra',
      'Tarjeta',
      'Cuotas que faltan',
      'De',
      'Cuota',
      'Falta pagar',
      'Última cuota',
    ])
  })
})

describe('TF8: Static checks', () => {
  it('MisInformesTab.tsx no contiene exportActions, handleDescargarExcel ni exportarAnalisisPdf', () => {
    const content = fs.readFileSync(path.join(ANALISIS_DIR, 'MisInformesTab.tsx'), 'utf-8')
    expect(content).not.toContain('exportActions')
    expect(content).not.toContain('handleDescargarExcel')
    expect(content).not.toContain('exportarAnalisisPdf')
  })

  it('exportarAnalisisPdf.ts no existe en el sistema de archivos', () => {
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'exportarAnalisisPdf.ts'))).toBe(false)
  })

  it('AnalisisPage.tsx importa y utiliza armarPedidoDescarga para calcular la descarga activa', () => {
    const content = fs.readFileSync(path.join(ANALISIS_DIR, 'AnalisisPage.tsx'), 'utf-8')
    expect(content).toContain('armarPedidoDescarga')
    expect(content).toContain('pedidoDescarga')
  })
})

describe('TF6 / TF8: Exportación PDF e integración con jsPDF', () => {
  it('exportarInformePdf consulta los endpoints necesarios, renderiza en landscape y guarda el archivo', async () => {
    capturedJsPdfOptions = null
    mockSave.mockClear()
    mockAddPage.mockClear()
    const spyResumen = vi.spyOn(analisisService, 'getResumen').mockResolvedValue(mockDatos.resumen as unknown as AnalisisResumenResponse)
    const spyComp = vi.spyOn(analisisService, 'getComparativaCiclos').mockResolvedValue(mockDatos.comparativa as unknown as ComparativaCiclosResponse)
    const spyProy = vi.spyOn(analisisService, 'getProyeccionCompromisos').mockResolvedValue(mockDatos.proyeccion as unknown as ProyeccionCompromisosResponse)

    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Completo',
      bloques: ['kpis', 'evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos', 'proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars', ciclos: 6, naturaleza: 'todos', ciclo_a: '2026-10', ciclo_b: '2026-09', meses: 6 },
    }

    await exportarInformePdf(pedido)

    expect(spyResumen).toHaveBeenCalled()
    expect(spyComp).toHaveBeenCalled()
    expect(spyProy).toHaveBeenCalled()
    expect(capturedJsPdfOptions).toEqual({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/^argentum_reporte_completo_\d{8}\.pdf$/))

    spyResumen.mockRestore()
    spyComp.mockRestore()
    spyProy.mockRestore()
  })
})

