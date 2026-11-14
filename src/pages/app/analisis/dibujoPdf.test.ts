import { describe, it, expect, vi, beforeEach } from 'vitest'
import jsPDF from 'jspdf'
import analisisService, {
  type AnalisisResumenResponse,
  type ComparativaCiclosResponse,
  type ProyeccionCompromisosResponse,
} from '@/services/analisis.service'
import { dibujarInformePdf, exportarInformePdf } from './exportarInformePdf'
import { opcionesTablaPdf } from './opcionesTablaPdf'
import { RGB_COLORES } from './estilosArchivo'
import type { SeccionPdf, TablaPdf } from './contenidoPdf'
import type { PedidoDescarga } from './descargaAnalisis'

const mockSave = vi.fn()

vi.mock('jspdf', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jspdf')>()
  return {
    ...mod,
    default: class MockJsPdf extends mod.default {
      save = mockSave
    },
  }
})

describe('TF10: Dibujo y orquestación del informe PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('opciones de autoTable y opcionesTablaPdf configuran bordes, colores, plain y didParseCell según DECISIONES', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const tabla: TablaPdf = {
      encabezados: ['Categoría', 'Subcategoría', 'Monto'],
      alineaciones: ['left', 'center', 'right'],
      filasNegrita: [0],
      filas: [
        ['Comida', '', { valor: 500, moneda: 'pesos', tipo: 'monto' }],
        ['', 'Almuerzo', { valor: 300, moneda: 'pesos', tipo: 'monto' }],
      ],
      total: ['Total', '', { valor: 800, moneda: 'pesos', tipo: 'monto' }],
    }

    const options = opcionesTablaPdf(doc, tabla, 30)

    // theme plain
    expect(options.theme).toBe('plain')
    expect(options.alternateRowStyles).toBeUndefined()

    // bodyStyles.lineColor = RGB de D9E1F2 y lineWidth = { top: 0, right: 0, bottom: 0.2, left: 0 }
    expect(options.bodyStyles?.lineColor).toEqual(RGB_COLORES.LINEA_TABLA)
    expect(options.bodyStyles?.lineWidth).toEqual({ top: 0, right: 0, bottom: 0.2, left: 0 })

    // didParseCell
    const didParseCell = options.didParseCell!

    // 1. Fila normal (índice 1, Almuerzo): no le pone fillColor
    const cellNormal = {
      section: 'body',
      row: { index: 1 },
      column: { index: 1 },
      cell: { styles: {} as Record<string, unknown> },
    }
    didParseCell(cellNormal as never)
    expect(cellNormal.cell.styles.fillColor).toBeUndefined()
    expect(cellNormal.cell.styles.halign).toBe('center')

    // 2. Fila en filasNegrita (índice 0, Comida): negrita sin fillColor
    const cellNegrita = {
      section: 'body',
      row: { index: 0 },
      column: { index: 0 },
      cell: { styles: {} as Record<string, unknown> },
    }
    didParseCell(cellNegrita as never)
    expect(cellNegrita.cell.styles.fontStyle).toBe('bold')
    expect(cellNegrita.cell.styles.fillColor).toBeUndefined()
    expect(cellNegrita.cell.styles.halign).toBe('left')

    // 3. Fila de total (índice 2): EEF3FA y negrita
    const cellTotal = {
      section: 'body',
      row: { index: 2 },
      column: { index: 2 },
      cell: { styles: {} as Record<string, unknown> },
    }
    didParseCell(cellTotal as never)
    expect(cellTotal.cell.styles.fontStyle).toBe('bold')
    expect(cellTotal.cell.styles.fillColor).toEqual(RGB_COLORES.FONDO_TOTAL)
    expect(cellTotal.cell.styles.halign).toBe('right')

    // Alineación de cada celda es la de alineaciones
    const cellCol0 = { section: 'body', row: { index: 1 }, column: { index: 0 }, cell: { styles: {} as Record<string, unknown> } }
    const cellCol1 = { section: 'body', row: { index: 1 }, column: { index: 1 }, cell: { styles: {} as Record<string, unknown> } }
    const cellCol2 = { section: 'body', row: { index: 1 }, column: { index: 2 }, cell: { styles: {} as Record<string, unknown> } }
    didParseCell(cellCol0 as never)
    didParseCell(cellCol1 as never)
    didParseCell(cellCol2 as never)
    expect(cellCol0.cell.styles.halign).toBe('left')
    expect(cellCol1.cell.styles.halign).toBe('center')
    expect(cellCol2.cell.styles.halign).toBe('right')
  })

  it('el subtítulo dibujado y textos canónicos no empiezan con el título, contienen "Generado el" y nombres de billetera', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const textSpy = vi.spyOn(doc, 'text')

    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Gastos del día a día',
      bloques: ['kpis'],
      params: {
        moneda_modo: 'solo_ars',
        ciclos: 3,
        billetera_id: 'b-galicia',
      },
    }

    const secciones: SeccionPdf[] = [
      {
        titulo: 'Números principales',
        tablas: [
          {
            encabezados: ['Concepto', 'Monto'],
            alineaciones: ['left', 'right'],
            filas: [['Ingresos', '$ 1.000']],
          },
        ],
      },
    ]

    dibujarInformePdf(doc, pedido, secciones, '14/11/2026', { billeteraNombre: 'Galicia' })

    const llamadas = textSpy.mock.calls.map((c) => String(c[0]))
    const subtitulo = llamadas.find((t) => t.includes('Generado el'))
    expect(subtitulo).toBeDefined()
    expect(subtitulo?.startsWith('Gastos del día a día')).toBe(false)
    expect(subtitulo).toContain('Generado el')
    expect(subtitulo).toContain('Galicia')
    expect(subtitulo).not.toContain('Billetera seleccionada')

    // Pie de página
    const textoCompleto = llamadas.join(' || ')
    expect(textoCompleto).toContain('Argentum · página 1 de')
    expect(textoCompleto).not.toContain('Análisis · Página')
  })

  it('exportarInformePdf pide cada servicio una sola vez aunque varios bloques lo requieran', async () => {
    mockSave.mockClear()
    const getResumenSpy = vi.spyOn(analisisService, 'getResumen').mockResolvedValue({
      moneda_modo: 'solo_ars',
      moneda_visual: 'ARS',
      cotizacion_referencia: { texto: '' },
      periodo_seleccionado: { cantidad_ciclos: 6, fecha_inicio: '2026-06-01', fecha_fin: '2026-11-30', etiqueta: '' },
      kpis: {
        ingresos_totales: 0,
        gastos_totales: 0,
        balance_neto: 0,
        tasa_ahorro_pct: null,
        tasa_ahorro_texto: null,
        promedio_gasto_ciclo: null,
        promedio_ingreso_ciclo: null,
        variacion_gasto_vs_anterior_pct: null,
        variacion_ingreso_vs_anterior_pct: null,
        variacion_texto: null,
        cantidad_operaciones: 0,
        alcance: 'terminados',
        frase_resumen: null,
      },
      insights: [],
      serie_ciclos: [],
      desglose_categorias: [],
      filtros_disponibles: { billeteras: [], tarjetas: [] },
    } as unknown as AnalisisResumenResponse)

    const getCompSpy = vi.spyOn(analisisService, 'getComparativaCiclos').mockResolvedValue({
      moneda_visual: 'ARS',
      ciclos_disponibles: [],
      ciclo_a: { clave: '', etiqueta: '', rango_texto: '' },
      ciclo_b: { clave: '', etiqueta: '', rango_texto: '' },
      resumen: {} as unknown as AnalisisResumenResponse['kpis'],
      categorias: [],
    } as unknown as ComparativaCiclosResponse)

    const getProySpy = vi.spyOn(analisisService, 'getProyeccionCompromisos').mockResolvedValue({
      moneda_visual: 'ARS',
      horizonte_meses: 6,
      cotizacion_referencia: { texto: '' },
      kpis: {} as unknown as ProyeccionCompromisosResponse['kpis'],
      serie_mensual: [],
      planes_activos: [],
    } as unknown as ProyeccionCompromisosResponse)

    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Combinado',
      bloques: ['kpis', 'evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos', 'proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars' },
    }

    await exportarInformePdf(pedido, { billeteraNombre: 'Galicia' })

    expect(getResumenSpy).toHaveBeenCalledTimes(1)
    expect(getCompSpy).toHaveBeenCalledTimes(1)
    expect(getProySpy).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledTimes(1)
  })
})

describe('TF11: Manejo de corte de tablas y saltos de página con jsPDF y autotable reales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('sección A con 12 filas y sección B con 10 filas con total: Sección B y su tabla pasan a página 2', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const llamadasText: { texto: string; pagina: number }[] = []
    const originalText = doc.text.bind(doc)
    vi.spyOn(doc, 'text').mockImplementation((...args: Parameters<typeof doc.text>) => {
      const texto = String(args[0])
      const pagina = doc.getCurrentPageInfo().pageNumber
      llamadasText.push({ texto, pagina })
      return originalText(...args)
    })

    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Dos Secciones',
      bloques: ['kpis', 'desglose_categorias'],
      params: { moneda_modo: 'solo_ars' },
    }

    // Sección A: 12 filas
    const filasA: string[][] = Array.from({ length: 12 }, (_, i) => [
      `Concepto ${i + 1}`,
      `$ ${1000 * (i + 1)}`,
    ])
    // Sección B: 10 filas con total
    const filasB: string[][] = Array.from({ length: 10 }, (_, i) => [
      `Cat ${i + 1}`,
      `Sub ${i + 1}`,
      `$ ${500 * (i + 1)}`,
      '10%',
      '1',
    ])
    const totalB = ['Total', '', '$ 5.000', '100%', '10']

    const secciones: SeccionPdf[] = [
      {
        titulo: 'Sección A',
        tablas: [
          {
            encabezados: ['Concepto', 'Monto'],
            alineaciones: ['left', 'right'],
            filas: filasA,
          },
        ],
      },
      {
        titulo: 'Sección B',
        tablas: [
          {
            encabezados: ['Categoría', 'Subcategoría', 'Monto', '% del total', 'Movimientos'],
            alineaciones: ['left', 'left', 'right', 'right', 'right'],
            filas: filasB,
            total: totalB,
          },
        ],
      },
    ]

    dibujarInformePdf(doc, pedido, secciones, '14/11/2026')

    // El texto "Sección B" se dibuja en la página 2
    const llamadaSecB = llamadasText.find((ll) => ll.texto === 'Sección B')
    expect(llamadaSecB).toBeDefined()
    expect(llamadaSecB?.pagina).toBe(2)

    // El texto "Sección A" se dibuja en la página 1
    const llamadaSecA = llamadasText.find((ll) => ll.texto === 'Sección A')
    expect(llamadaSecA).toBeDefined()
    expect(llamadaSecA?.pagina).toBe(1)
  })

  it('con una sola sección de 3 filas todo queda en 1 página', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Corto',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const secciones: SeccionPdf[] = [
      {
        titulo: 'Sección Corta',
        tablas: [
          {
            encabezados: ['Concepto', 'Monto'],
            alineaciones: ['left', 'right'],
            filas: [
              ['A', '$ 100'],
              ['B', '$ 200'],
              ['C', '$ 300'],
            ],
          },
        ],
      },
    ]

    dibujarInformePdf(doc, pedido, secciones, '14/11/2026')
    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('con una sección de 60 filas la tabla empieza en la página 1 y ocupa más de una página', () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const llamadasText: { texto: string; pagina: number }[] = []
    const originalText = doc.text.bind(doc)
    vi.spyOn(doc, 'text').mockImplementation((...args: Parameters<typeof doc.text>) => {
      const texto = String(args[0])
      const pagina = doc.getCurrentPageInfo().pageNumber
      llamadasText.push({ texto, pagina })
      return originalText(...args)
    })

    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Largo',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const filas60 = Array.from({ length: 60 }, (_, i) => [
      `Fila ${i + 1}`,
      `$ ${i + 1}`,
    ])
    const secciones: SeccionPdf[] = [
      {
        titulo: 'Sección Larga',
        tablas: [
          {
            encabezados: ['Concepto', 'Monto'],
            alineaciones: ['left', 'right'],
            filas: filas60,
          },
        ],
      },
    ]

    dibujarInformePdf(doc, pedido, secciones, '14/11/2026')
    const llamadaTitulo = llamadasText.find((ll) => ll.texto === 'Sección Larga')
    expect(llamadaTitulo?.pagina).toBe(1)
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  })
})
