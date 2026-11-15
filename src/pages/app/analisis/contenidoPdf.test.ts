import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  armarContenidoPdf,
  colorCeldaPdf,
  textoCeldaPdf,
  type CeldaMontoPdf,
  type CeldaPorcentajePdf,
  type DatosInformePdf,
} from './contenidoPdf'
import { HEX_COLORES, hexToRgb, RGB_COLORES } from './estilosArchivo'
import type { PedidoDescarga } from './descargaAnalisis'
import type { AnalisisResumenResponse } from '@/services/analisis.service'

describe('TF7: Estructura y fidelidad de armarContenidoPdf', () => {
  const datosEjemplo: DatosInformePdf = {
    resumen: {
      moneda_modo: 'solo_ars',
      moneda_visual: 'ARS',
      cotizacion_referencia: { texto: '' },
      aviso_cotizacion: null,
      periodo_seleccionado: {
        cantidad_ciclos: 6,
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-11-30',
        etiqueta: 'Últimos 6 ciclos',
      },
      kpis: {
        ingresos_totales: 1500000,
        gastos_totales: 1300000,
        balance_neto: 200000,
        tasa_ahorro_pct: 13.3,
        tasa_ahorro_texto: null,
        promedio_gasto_ciclo: 216666.67,
        promedio_ingreso_ciclo: 250000,
        variacion_gasto_vs_anterior_pct: 0,
        variacion_ingreso_vs_anterior_pct: 0,
        variacion_texto: null,
        cantidad_operaciones: 42,
        alcance: 'terminados',
        frase_resumen: 'Tus gastos se mantuvieron estables en los últimos 6 ciclos.',
      },
      insights: [],
      serie_ciclos: [
        {
          clave: '2026-06',
          etiqueta: 'Junio 2026',
          nombre_corto: 'Jun 2026',
          rango_texto: '01/06 al 30/06',
          fecha_inicio: '2026-06-01',
          fecha_fin: '2026-06-30',
          ingresos: null,
          gastos: 0,
          balance: null,
          tasa_ahorro_pct: null,
          promedio_historico_gastos: null,
          dias_transcurridos: 30,
          dias_totales: 30,
          es_actual: false,
          sin_datos: true,
        },
        {
          clave: '2026-11',
          etiqueta: 'Noviembre 2026',
          nombre_corto: 'Nov 2026',
          rango_texto: '01/11 al 30/11',
          fecha_inicio: '2026-11-01',
          fecha_fin: '2026-11-30',
          ingresos: 500000,
          gastos: 320000,
          balance: 180000,
          tasa_ahorro_pct: 36.0,
          promedio_historico_gastos: null,
          dias_transcurridos: 14,
          dias_totales: 30,
          es_actual: true,
          sin_datos: false,
        },
      ],
      totales_terminados: {
        ingresos: 999999,
        gastos: 888888,
        balance: 111111,
        tasa_ahorro_pct: 11.1,
      },
      desglose_categorias: [
        {
          categoria_id: 'cat-1',
          categoria_nombre: 'Supermercado',
          monto: 150000,
          porcentaje_del_total: 50,
          ancho_barra_pct: 50,
          cantidad_movimientos: 10,
          subcategorias: [
            {
              subcategoria_id: 'sub-1',
              subcategoria_nombre: 'Alimentos',
              monto: 100000,
              porcentaje_categoria: 66.7,
              porcentaje_total: 33.3,
              ancho_barra_pct: 66.7,
              cantidad_movimientos: 7,
            },
          ],
        },
      ],
      total_desglose: {
        monto: 777777,
        cantidad_movimientos: 99,
      },
      filtros_disponibles: { billeteras: [], tarjetas: [] },
    },
    comparativa: {
      moneda_visual: 'ARS',
      ciclos_disponibles: [],
      ciclo_a: {
        clave: '2026-10',
        etiqueta: 'Octubre 2026',
        nombre_corto: 'Oct 2026',
        rango_texto: '01/10 al 31/10',
      },
      ciclo_b: {
        clave: '2026-09',
        etiqueta: 'Septiembre 2026',
        nombre_corto: 'Sep 2026',
        rango_texto: '01/09 al 30/09',
      },
      resumen: {
        gasto_a: 120000,
        gasto_b: 100000,
        diferencia_gasto_monto: 20000,
        diferencia_gasto_pct: 20,
        ingreso_a: 0,
        ingreso_b: 0,
        diferencia_ingreso_monto: 0,
        diferencia_ingreso_pct: null,
        balance_a: 0,
        balance_b: 0,
        mayor_aumento: null,
        mayor_ahorro: null,
      },
      categorias: [
        {
          categoria_id: 'cat-1',
          categoria_nombre: 'Supermercado',
          monto_a: 120000,
          monto_b: 100000,
          diferencia_monto: 20000,
          diferencia_pct: 20.0,
          tendencia: 'subio',
          ancho_a_pct: 100,
          ancho_b_pct: 83.3,
        },
      ],
      totales: {
        monto_a: 555555,
        monto_b: 444444,
        diferencia_monto: 111111,
        diferencia_pct: 25.0,
      },
    },
    proyeccion: {
      moneda_visual: 'ARS',
      horizonte_meses: 6,
      kpis: {
        compromiso_mes_actual: 30000,
        total_cuotas_ventana: 75000,
        carga_mensual_suscripciones: 5000,
        cantidad_planes_activos: 1,
        mes_mayor_alivio: null,
      },
      serie_mensual: [
        {
          clave: '2026-12',
          etiqueta: 'Dic 26',
          nombre_corto: 'Dic 2026',
          rango_texto: '01/12 al 31/12',
          monto_cuotas: 25000,
          monto_suscripciones: 5000,
          monto_total: 30000,
          cantidad_cuotas: 1,
          planes_que_finalizan: 1,
          monto_que_se_libera: 15000,
        },
      ],
      planes_activos: [
        {
          id: 'plan-1',
          descripcion: 'Notebook',
          tarjeta_nombre: 'Visa Santander',
          cuotas_restantes: 3,
          cantidad_cuotas: 6,
          monto_cuota: 25000,
          saldo_pendiente: 75000,
          ultimo_vencimiento: '2027-02-10',
          ultimo_mes_etiqueta: 'Feb 27',
          ultimo_mes_nombre_corto: 'Feb 2027',
          progreso_pct: 50,
        },
      ],
      totales_serie: {
        monto_cuotas: 333333,
        monto_suscripciones: 22222,
        monto_total: 355555,
        planes_que_finalizan: 9,
        monto_que_se_libera: 11111,
      },
    },
  }

  it('secciones en orden de bloques con sus títulos propios y tabla_movimientos omitida', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Informe Test',
      bloques: [
        { tipo: 'kpis', titulo: 'Mis Números' },
        'tabla_movimientos',
        { tipo: 'desglose_categorias', titulo: 'Mis Gastos' },
        'evolucion_ciclos',
      ],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    expect(sec).toHaveLength(3)
    expect(sec[0].titulo).toBe('Mis Números')
    expect(sec[1].titulo).toBe('Mis Gastos')
    expect(sec[2].titulo).toBe('Evolución')
  })

  it('frase_resumen en nota de la sección de kpis (sin campo lineas)', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'KPIs',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    expect(sec[0].nota).toBe('Tus gastos se mantuvieron estables en los últimos 6 ciclos.')
    expect((sec[0] as unknown as { lineas?: unknown }).lineas).toBeUndefined()
  })

  it('encabezados exactos del Excel y orden en Números principales', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'KPIs',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    const t = sec[0].tablas[0]
    expect(t.encabezados).toEqual(['Concepto', 'Monto'])
    const conceptos = t.filas.map((r) => r[0])
    expect(conceptos).toEqual([
      'Ingresos',
      'Egresos',
      'Te quedó',
      '% de lo que entró',
      'Promedio de gastos por ciclo',
    ])
    // Tipos de celdas
    const celdaTeQuedo = t.filas[2][1] as CeldaMontoPdf
    expect(celdaTeQuedo.tipo).toBe('resultado')
    expect(celdaTeQuedo.valor).toBe(200000)

    const celdaPct = t.filas[3][1] as CeldaPorcentajePdf
    expect(celdaPct.tipo).toBe('porcentaje')
    expect(celdaPct.valor).toBe(13.3)
  })

  it('Categorías con fila de categoría y subcategorías con columnas alternadas, sin (Total)', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Categorías',
      bloques: ['desglose_categorias'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    const t = sec[0].tablas[0]
    expect(t.encabezados).toEqual(['Categoría', 'Subcategoría', 'Monto', '% del total', 'Movimientos'])
    // Fila categoría: Supermercado, subcategoría vacía ""
    expect(t.filas[0][0]).toBe('Supermercado')
    expect(t.filas[0][1]).toBe('')
    // Fila subcategoría: categoría vacía "", Alimentos
    expect(t.filas[1][0]).toBe('')
    expect(t.filas[1][1]).toBe('Alimentos')

    // Ninguna celda contiene "(Total)"
    for (const fila of t.filas) {
      expect(fila[1]).not.toBe('(Total)')
    }
  })

  it('filas "Sin datos" y "En curso" en Evolución', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Evolución',
      bloques: ['evolucion_ciclos'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    const t = sec[0].tablas[0]
    expect(t.encabezados).toEqual([
      'Ciclo',
      'Desde',
      'Hasta',
      'Ingresos',
      'Gastos',
      'Te quedó',
      '% de lo que entró',
      'Estado',
    ])
    expect(t.filas[0][7]).toBe('Sin datos')
    expect(t.filas[1][7]).toBe('En curso')
  })

  it('totales tomados directamente del backend y no sumados en el front', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Completo',
      bloques: ['evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos', 'proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)

    // Evolución: total tomado de totales_terminados (999999 / 888888 / 111111 / 11.1)
    const totEvo = sec[0].tablas[0].total!
    expect(totEvo[0]).toBe('Total ciclos terminados')
    expect((totEvo[3] as CeldaMontoPdf).valor).toBe(999999)
    expect((totEvo[4] as CeldaMontoPdf).valor).toBe(888888)

    // Categorías: total tomado de total_desglose (777777 / 99)
    const totCat = sec[1].tablas[0].total!
    expect(totCat[0]).toBe('Total')
    expect((totCat[2] as CeldaMontoPdf).valor).toBe(777777)
    expect(totCat[4]).toBe('99')

    // Comparativa: total tomado de totales (555555 / 444444 / 111111)
    const totComp = sec[2].tablas[0].total!
    expect(totComp[0]).toBe('Total')
    expect((totComp[1] as CeldaMontoPdf).valor).toBe(555555)
    expect((totComp[2] as CeldaMontoPdf).valor).toBe(444444)
    const diffMonto = totComp[3] as CeldaMontoPdf
    expect(diffMonto.tipo).toBe('diferencia')
    expect(diffMonto.valor).toBe(111111)
    const diffPct = totComp[4] as CeldaPorcentajePdf
    expect(diffPct.tipo).toBe('porcentaje_diferencia')
    expect(diffPct.valor).toBe(25.0)

    // Proyección: total tomado de totales_serie (355555 / 9 / 11111)
    const totProy = sec[3].tablas[0].total!
    expect(totProy[0]).toBe('Total')
    expect((totProy[3] as CeldaMontoPdf).valor).toBe(355555)
    expect(totProy[4]).toBe('9')
    expect((totProy[5] as CeldaMontoPdf).valor).toBe(11111)
  })

  it('ciclos y meses usan nombre_corto ("Nov 2026", "Feb 2027")', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Nombres',
      bloques: ['evolucion_ciclos', 'comparativa_ciclos', 'proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    expect(sec[0].tablas[0].filas[1][0]).toBe('Nov 2026')
    expect(sec[1].tablas[0].encabezados[1]).toBe('Oct 2026')
    expect(sec[1].tablas[0].encabezados[2]).toBe('Sep 2026')
    expect(sec[2].tablas[0].filas[0][0]).toBe('Dic 2026')
    expect(sec[2].tablas[1].filas[0][6]).toBe('Feb 2027')
  })

  it('segunda tabla de Proyección tiene título "Compras en cuotas"', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Proyección',
      bloques: ['proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    expect(sec[0].tablas).toHaveLength(2)
    expect(sec[0].tablas[1].titulo).toBe('Compras en cuotas')
    expect(sec[0].tablas[1].encabezados).toEqual([
      'Compra',
      'Tarjeta',
      'Cuotas que faltan',
      'De',
      'Cuota',
      'Falta pagar',
      'Última cuota',
    ])
  })

  it('modo solo_usd produce celdas con moneda "dolares"', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'KPIs USD',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_usd' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    const celda = sec[0].tablas[0].filas[0][1] as CeldaMontoPdf
    expect(celda.moneda).toBe('dolares')
  })

  it('estilosArchivo tiene constantes hexadecimales y el RGB de 1F3864 es [31, 56, 100]', () => {
    const raw = fs.readFileSync(path.resolve(__dirname, 'estilosArchivo.ts'), 'utf-8')
    expect(raw).toContain('1F3864')
    expect(raw).toContain('595959')
    expect(raw).toContain('7F7F7F')
    expect(raw).toContain('D9E1F2')
    expect(raw).toContain('EEF3FA')

    expect(HEX_COLORES.AZUL_MARINO).toBe('1F3864')
    expect(hexToRgb('1F3864')).toEqual([31, 56, 100])
    expect(RGB_COLORES.AZUL_MARINO).toEqual([31, 56, 100])
  })

  it('cada tabla de cada sección trae alineaciones con la lista exacta de DECISIONES y del mismo largo que encabezados', () => {
    const pedido: PedidoDescarga = {
      tipo: 'informe',
      titulo: 'Reporte Completo',
      bloques: ['kpis', 'evolucion_ciclos', 'desglose_categorias', 'comparativa_ciclos', 'proyeccion_cuotas'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)

    // Números principales: [left, right]
    const tKpis = sec[0].tablas[0]
    expect(tKpis.alineaciones).toEqual(['left', 'right'])
    expect(tKpis.alineaciones).toHaveLength(tKpis.encabezados.length)

    // Evolución: [left, center, center, right, right, right, right, center]
    const tEvo = sec[1].tablas[0]
    expect(tEvo.alineaciones).toEqual(['left', 'center', 'center', 'right', 'right', 'right', 'right', 'center'])
    expect(tEvo.alineaciones).toHaveLength(tEvo.encabezados.length)

    // Categorías: [left, left, right, right, right]
    const tCat = sec[2].tablas[0]
    expect(tCat.alineaciones).toEqual(['left', 'left', 'right', 'right', 'right'])
    expect(tCat.alineaciones).toHaveLength(tCat.encabezados.length)

    // Comparación: [left, right, right, right, right]
    const tComp = sec[3].tablas[0]
    expect(tComp.alineaciones).toEqual(['left', 'right', 'right', 'right', 'right'])
    expect(tComp.alineaciones).toHaveLength(tComp.encabezados.length)

    // Proyección primera tabla: [left, right, right, right, right, right]
    const tProy1 = sec[4].tablas[0]
    expect(tProy1.alineaciones).toEqual(['left', 'right', 'right', 'right', 'right', 'right'])
    expect(tProy1.alineaciones).toHaveLength(tProy1.encabezados.length)

    // Compras en cuotas: [left, left, right, right, right, right, center]
    const tProy2 = sec[4].tablas[1]
    expect(tProy2.alineaciones).toEqual(['left', 'left', 'right', 'right', 'right', 'right', 'center'])
    expect(tProy2.alineaciones).toHaveLength(tProy2.encabezados.length)
  })

  it('Categorías trae filasNegrita con los índices de las filas de categoría y ninguno de subcategoría', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Categorías',
      bloques: ['desglose_categorias'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, datosEjemplo)
    const t = sec[0].tablas[0]
    expect(t.filasNegrita).toBeDefined()
    expect(t.filasNegrita).toEqual([0])
    expect(t.filasNegrita).not.toContain(1)
  })
})

describe('TF9: Formato numérico y colores de celdas PDF', () => {
  it('formatea montos, resultados y diferencias según DECISIONES', () => {
    // Pesos
    expect(textoCeldaPdf({ valor: 1234567.8, moneda: 'pesos', tipo: 'monto' })).toBe('$ 1.234.568')
    expect(textoCeldaPdf({ valor: 0, moneda: 'pesos', tipo: 'monto' })).toBe('-')

    // Dólares
    expect(textoCeldaPdf({ valor: 1234.5, moneda: 'dolares', tipo: 'monto' })).toBe('US$ 1.234,50')

    // Resultado
    expect(textoCeldaPdf({ valor: -1500, moneda: 'pesos', tipo: 'resultado' })).toBe('-$ 1.500')
    expect(colorCeldaPdf({ valor: -1500, moneda: 'pesos', tipo: 'resultado' })).toBe('rojo')
    expect(textoCeldaPdf({ valor: 1500, moneda: 'pesos', tipo: 'resultado' })).toBe('$ 1.500')
    expect(colorCeldaPdf({ valor: 1500, moneda: 'pesos', tipo: 'resultado' })).toBe('texto')

    // Diferencia
    expect(textoCeldaPdf({ valor: 100, moneda: 'pesos', tipo: 'diferencia' })).toBe('+$ 100')
    expect(colorCeldaPdf({ valor: 100, moneda: 'pesos', tipo: 'diferencia' })).toBe('rojo')
    expect(textoCeldaPdf({ valor: -100, moneda: 'pesos', tipo: 'diferencia' })).toBe('-$ 100')
    expect(colorCeldaPdf({ valor: -100, moneda: 'pesos', tipo: 'diferencia' })).toBe('verde')

    // Porcentaje
    expect(textoCeldaPdf({ valor: 92.2, tipo: 'porcentaje' })).toBe('92%')

    // Diferencia porcentaje
    expect(textoCeldaPdf({ valor: 12.5, tipo: 'porcentaje_diferencia' })).toBe('+13%')
    expect(colorCeldaPdf({ valor: 12.5, tipo: 'porcentaje_diferencia' })).toBe('rojo')
    expect(textoCeldaPdf({ valor: -40, tipo: 'porcentaje_diferencia' })).toBe('-40%')
    expect(colorCeldaPdf({ valor: -40, tipo: 'porcentaje_diferencia' })).toBe('verde')
  })

  it('ningún resultado contiene "ARS", "USD" ni ",00" en pesos', () => {
    const casos: Parameters<typeof textoCeldaPdf>[0][] = [
      { valor: 1234567.8, moneda: 'pesos', tipo: 'monto' },
      { valor: 0, moneda: 'pesos', tipo: 'monto' },
      { valor: 1234.5, moneda: 'dolares', tipo: 'monto' },
      { valor: -1500, moneda: 'pesos', tipo: 'resultado' },
      { valor: 1500, moneda: 'pesos', tipo: 'resultado' },
      { valor: 100, moneda: 'pesos', tipo: 'diferencia' },
      { valor: -100, moneda: 'pesos', tipo: 'diferencia' },
      { valor: 92.2, tipo: 'porcentaje' },
      { valor: 12.5, tipo: 'porcentaje_diferencia' },
      { valor: -40, tipo: 'porcentaje_diferencia' },
    ]

    for (const c of casos) {
      const txt = textoCeldaPdf(c)
      expect(txt).not.toContain('ARS')
      expect(txt).not.toContain('USD')
      if (typeof c === 'object' && c !== null && 'moneda' in c && c.moneda === 'pesos') {
        expect(txt).not.toContain(',00')
      }
    }
  })
})

describe('TF8: Controles estáticos de exportarInformePdf, contenidoPdf y opcionesTablaPdf', () => {
  const dir = path.resolve(__dirname)
  const files = ['exportarInformePdf.ts', 'contenidoPdf.ts', 'opcionesTablaPdf.ts']

  for (const f of files) {
    it(`${f} no contiene hex suelto, rgb(, arreglos numéricos, export {, theme striped ni Página`, () => {
      const code = fs.readFileSync(path.join(dir, f), 'utf-8')
      // No '#' seguido de 3 o 6 dígitos hexadecimales
      expect(code).not.toMatch(/#[0-9A-Fa-f]{6}/)
      expect(code).not.toMatch(/#[0-9A-Fa-f]{3}\b/)
      // No rgb(
      expect(code).not.toContain('rgb(')
      // No arreglo literal de 3 números [num, num, num]
      expect(code).not.toMatch(/\[\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\]/)
      // No export {
      expect(code).not.toMatch(/export\s*\{/)
      // No theme: 'striped'
      expect(code).not.toContain("theme: 'striped'")
      expect(code).not.toContain('theme: "striped"')
      // No alternateRowStyles
      expect(code).not.toContain('alternateRowStyles')
      // No "Página" con mayúscula
      expect(code).not.toContain('Página')
    })
  }

  it('exportarInformePdf.ts y opcionesTablaPdf.ts no contienen "/^\\d+$/" ni "RGB_COLORES.BLANCO" fuera de headStyles', () => {
    for (const f of ['exportarInformePdf.ts', 'opcionesTablaPdf.ts']) {
      const code = fs.readFileSync(path.join(dir, f), 'utf-8')
      expect(code).not.toContain('/^\\d+$/')
      expect(code).not.toMatch(/\/[\^]\\d\+\$\//)
      const sinHeadStyles = code.replace(/headStyles:\s*\{[\s\S]*?\}/g, '')
      expect(sinHeadStyles).not.toContain('RGB_COLORES.BLANCO')
    }
  })
})

describe('TF15: Modo solo_gastos en PDF', () => {
  const baseResumen: AnalisisResumenResponse = {
    moneda_modo: 'solo_ars',
    moneda_visual: 'ARS',
    kpis: {
      solo_gastos: true,
      gastos_totales: 80000,
      gasto_total_referencia: 650000,
      peso_sobre_gasto_total_pct: 12.3,
      promedio_gasto_ciclo: 70000,
      ingresos_totales: null,
      balance_neto: null,
      tasa_ahorro_pct: null,
    },
    serie_ciclos: [
      {
        nombre_corto: 'Oct 2026',
        etiqueta: 'Octubre 2026',
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        gastos: 80000,
        es_actual: false,
        sin_datos: false,
      },
    ],
    totales_terminados: {
      gastos: 80000,
    },
  } as unknown as AnalisisResumenResponse

  it('con solo_gastos true y referencia 650000, kpis trae exactamente 4 filas', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Test',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, { resumen: baseResumen })
    expect(sec).toHaveLength(1)
    const filas = sec[0].tablas[0].filas
    const conceptos = filas.map((r) => r[0])
    expect(conceptos).toEqual([
      'Egresos',
      'Todo lo que gastaste',
      '% de todo lo que gastaste',
      'Promedio de gastos por ciclo',
    ])
  })

  it('con referencia null, kpis trae solo Egresos y Promedio de gastos por ciclo', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Test',
      bloques: ['kpis'],
      params: { moneda_modo: 'solo_ars' },
    }
    const resumenSinRef = {
      ...baseResumen,
      kpis: {
        ...baseResumen.kpis,
        gasto_total_referencia: null,
        peso_sobre_gasto_total_pct: null,
      },
    }
    const sec = armarContenidoPdf(pedido, { resumen: resumenSinRef })
    expect(sec).toHaveLength(1)
    const filas = sec[0].tablas[0].filas
    const conceptos = filas.map((r) => r[0])
    expect(conceptos).toEqual(['Egresos', 'Promedio de gastos por ciclo'])
  })

  it('el bloque evolucion_ciclos trae encabezados y alineaciones de solo gastos', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Test',
      bloques: ['evolucion_ciclos'],
      params: { moneda_modo: 'solo_ars' },
    }
    const sec = armarContenidoPdf(pedido, { resumen: baseResumen })
    expect(sec).toHaveLength(1)
    const tabla = sec[0].tablas[0]
    expect(tabla.encabezados).toEqual(['Ciclo', 'Desde', 'Hasta', 'Gastos', 'Estado'])
    expect(tabla.alineaciones).toEqual(['left', 'center', 'center', 'right', 'center'])
    expect(tabla.alineaciones).toHaveLength(tabla.encabezados.length)
  })

  it('con solo_gastos false todo es igual que hoy', () => {
    const pedido: PedidoDescarga = {
      tipo: 'tab',
      titulo: 'Test',
      bloques: ['kpis', 'evolucion_ciclos'],
      params: { moneda_modo: 'solo_ars' },
    }
    const resumenNormal = {
      ...baseResumen,
      kpis: {
        ...baseResumen.kpis,
        solo_gastos: false,
        ingresos_totales: 1000000,
        balance_neto: 920000,
        tasa_ahorro_pct: 92.0,
      },
    }
    const sec = armarContenidoPdf(pedido, { resumen: resumenNormal })
    expect(sec).toHaveLength(2)
    const conceptosKpi = sec[0].tablas[0].filas.map((r) => r[0])
    expect(conceptosKpi).toEqual([
      'Ingresos',
      'Egresos',
      'Te quedó',
      '% de lo que entró',
      'Promedio de gastos por ciclo',
    ])
    expect(sec[1].tablas[0].encabezados).toEqual([
      'Ciclo',
      'Desde',
      'Hasta',
      'Ingresos',
      'Gastos',
      'Te quedó',
      '% de lo que entró',
      'Estado',
    ])
  })
})
