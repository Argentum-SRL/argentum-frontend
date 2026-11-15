import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { armarKpisVista } from './kpisVista'
import { formatMonto } from '@/utils/format'
import type { AnalisisKpis } from '@/services/analisis.service'

describe('TF13: armarKpisVista', () => {
  it(
    'con solo_gastos true, gastos, peso, referencia y promedio genera soloGastos true y textoPeso',
    () => {
    const kpis: AnalisisKpis = {
      ingresos_totales: null,
      gastos_totales: 80000,
      balance_neto: null,
      tasa_ahorro_pct: null,
      tasa_ahorro_texto: null,
      promedio_gasto_ciclo: 70000,
      promedio_ingreso_ciclo: null,
      variacion_gasto_vs_anterior_pct: null,
      variacion_ingreso_vs_anterior_pct: null,
      variacion_texto: null,
      cantidad_operaciones: 5,
      alcance: 'terminados',
      frase_resumen: null,
      solo_gastos: true,
      gasto_total_referencia: 650000,
      peso_sobre_gasto_total_pct: 12.3,
    }

    const res = armarKpisVista(kpis, 'solo_ars')
    expect(res.soloGastos).toBe(true)
    const refFormateada = formatMonto(650000, 'ARS')
    expect(res.textoPeso).toBe(`Es el 12,3% de todo lo que gastaste (${refFormateada})`)
  })

  it('con peso null devuelve textoPeso null', () => {
    const kpis: AnalisisKpis = {
      ingresos_totales: null,
      gastos_totales: 80000,
      balance_neto: null,
      tasa_ahorro_pct: null,
      tasa_ahorro_texto: null,
      promedio_gasto_ciclo: null,
      promedio_ingreso_ciclo: null,
      variacion_gasto_vs_anterior_pct: null,
      variacion_ingreso_vs_anterior_pct: null,
      variacion_texto: null,
      cantidad_operaciones: 2,
      alcance: 'en_curso',
      frase_resumen: null,
      solo_gastos: true,
      gasto_total_referencia: null,
      peso_sobre_gasto_total_pct: null,
    }

    const res = armarKpisVista(kpis, 'solo_ars')
    expect(res.soloGastos).toBe(true)
    expect(res.textoPeso).toBeNull()
  })

  it('con solo_gastos false e ingresos devuelve soloGastos false y textoPeso null', () => {
    const kpis: AnalisisKpis = {
      ingresos_totales: 1000000,
      gastos_totales: 650000,
      balance_neto: 350000,
      tasa_ahorro_pct: 35.0,
      tasa_ahorro_texto: null,
      promedio_gasto_ciclo: 650000,
      promedio_ingreso_ciclo: 1000000,
      variacion_gasto_vs_anterior_pct: null,
      variacion_ingreso_vs_anterior_pct: null,
      variacion_texto: null,
      cantidad_operaciones: 10,
      alcance: 'terminados',
      frase_resumen: null,
      solo_gastos: false,
      gasto_total_referencia: null,
      peso_sobre_gasto_total_pct: null,
    }

    const res = armarKpisVista(kpis, 'solo_ars')
    expect(res.soloGastos).toBe(false)
    expect(res.textoPeso).toBeNull()
  })

  it(
    'con ingresos_totales null y sin solo_gastos (respuesta vieja) devuelve soloGastos true',
    () => {
    const kpisViejo: AnalisisKpis = {
      ingresos_totales: null,
      gastos_totales: 80000,
      balance_neto: null,
      tasa_ahorro_pct: null,
      tasa_ahorro_texto: null,
      promedio_gasto_ciclo: null,
      promedio_ingreso_ciclo: null,
      variacion_gasto_vs_anterior_pct: null,
      variacion_ingreso_vs_anterior_pct: null,
      variacion_texto: null,
      cantidad_operaciones: 2,
      alcance: 'en_curso',
      frase_resumen: null,
    }

    const res = armarKpisVista(kpisViejo, 'solo_ars')
    expect(res.soloGastos).toBe(true)
  })

  it('en dólares el texto usa el formato de dólares de formatMonto', () => {
    const kpis: AnalisisKpis = {
      ingresos_totales: null,
      gastos_totales: 80,
      balance_neto: null,
      tasa_ahorro_pct: null,
      tasa_ahorro_texto: null,
      promedio_gasto_ciclo: null,
      promedio_ingreso_ciclo: null,
      variacion_gasto_vs_anterior_pct: null,
      variacion_ingreso_vs_anterior_pct: null,
      variacion_texto: null,
      cantidad_operaciones: 2,
      alcance: 'en_curso',
      frase_resumen: null,
      solo_gastos: true,
      gasto_total_referencia: 650,
      peso_sobre_gasto_total_pct: 12.3,
    }

    const res = armarKpisVista(kpis, 'solo_usd')
    expect(res.soloGastos).toBe(true)
    const refDolar = formatMonto(650, 'USD')
    expect(res.textoPeso).toBe(`Es el 12,3% de todo lo que gastaste (${refDolar})`)
  })
})

describe('TF14: Estático componentes y kpisVista', () => {
  const dir = __dirname
  const codeNP = readFileSync(resolve(dir, 'NumerosPrincipales.tsx'), 'utf-8')
  const codeVK = readFileSync(resolve(dir, 'ViewerKpisBlock.tsx'), 'utf-8')
  const codeAP = readFileSync(resolve(dir, 'AnalisisPage.tsx'), 'utf-8')
  const codeKV = readFileSync(resolve(dir, 'kpisVista.ts'), 'utf-8')

  it('NumerosPrincipales.tsx y ViewerKpisBlock.tsx importan armarKpisVista', () => {
    expect(codeNP).toContain('armarKpisVista')
    expect(codeVK).toContain('armarKpisVista')
  })

  it('ninguno contiene hayFiltroCategoriaOTarjeta', () => {
    expect(codeNP).not.toContain('hayFiltroCategoriaOTarjeta')
    expect(codeVK).not.toContain('hayFiltroCategoriaOTarjeta')
    expect(codeAP).not.toContain('hayFiltroCategoriaOTarjeta')
  })

  it('no contienen !important ni style={{', () => {
    for (const [name, code] of [
      ['kpisVista.ts', codeKV],
      ['NumerosPrincipales.tsx', codeNP],
      ['ViewerKpisBlock.tsx', codeVK],
    ]) {
      expect(code.includes('!important'), `${name} tiene !important`).toBe(false)
      expect(code.includes('style={{'), `${name} tiene style={{`).toBe(false)
    }
  })

  it('no contienen hex sueltos nuevos comparado con antes', () => {
    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g
    const antesDir = resolve(
      'D:/Argentum/auditorias/scripts/fase_n4c_arreglos_analisis/antes'
    )
    for (const file of ['NumerosPrincipales.tsx', 'ViewerKpisBlock.tsx']) {
      const actualCode = readFileSync(resolve(dir, file), 'utf-8')
      const actualHex = new Set(actualCode.match(hexRegex) || [])
      const antesPath = resolve(antesDir, file)
      if (existsSync(antesPath)) {
        const antesCode = readFileSync(antesPath, 'utf-8')
        const antesHex = new Set(antesCode.match(hexRegex) || [])
        for (const h of actualHex) {
          expect(antesHex.has(h), `Hex nuevo '${h}' en ${file}`).toBe(true)
        }
      }
    }
    const kvHex = codeKV.match(hexRegex) || []
    expect(kvHex).toEqual([])
  })
})

describe('TF16: Estático formato vertical y líneas largas contra HEAD', () => {
  const dir = __dirname

  const LINEAS_LARGAS_PERMITIDAS_HEAD: Record<string, string[]> = {
    'NumerosPrincipales.tsx': [
      [
        '    sinPrefijo.replace(/que en los mismos días del ciclo anterior/i, ',
        "'que el ciclo anterior').trim() ||",
      ].join(''),
    ],
    'ViewerKpisBlock.tsx': [],
    'contenidoPdf.ts': [
      [
        '    const valorTxt = isPesos ? formatearEnteroConPuntos(absVal) : ',
        'formatearDecimalConPuntosYComa(absVal)',
      ].join(''),
      [
        '  const modo = (pedido.params?.moneda_modo || pedido.filtros?.moneda_modo || ',
        "'solo_ars').toLowerCase()",
      ].join(''),
      [
        '        nota: k?.frase_resumen || ',
        '(datos.resumen as { frase_resumen?: string } | undefined)?.frase_resumen || undefined,',
      ].join(''),
      [
        "          encabezados: ['Ciclo', 'Cuotas', 'Suscripciones', 'Total', ",
        "'Compras que terminan', 'Se libera'],",
      ].join(''),
      [
        "          encabezados: ['Compra', 'Tarjeta', 'Cuotas que faltan', 'De', ",
        "'Cuota', 'Falta pagar', 'Última cuota'],",
      ].join(''),
    ],
    'kpisVista.ts': [],
    'kpisVista.test.ts': [],
  }

  const ARCHIVOS_REVISAR = [
    'NumerosPrincipales.tsx',
    'ViewerKpisBlock.tsx',
    'contenidoPdf.ts',
    'kpisVista.ts',
    'kpisVista.test.ts',
  ]

  it('no hay ninguna línea de más de 100 caracteres que no exista igual en HEAD', () => {
    for (const filename of ARCHIVOS_REVISAR) {
      const code = readFileSync(resolve(dir, filename), 'utf-8')
      const lines = code.split(/\r?\n/)
      const permitidas = new Set(LINEAS_LARGAS_PERMITIDAS_HEAD[filename] || [])

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx]
        if (line.length > 100) {
          const permitida = permitidas.has(line)
          expect(
            permitida,
            `Línea ${idx + 1} de ${filename} supera 100 caracteres y no está en HEAD`
          ).toBe(true)
        }
      }
    }
  })

  it('NumerosPrincipales.tsx y ViewerKpisBlock.tsx no tienen "if (" y "return" juntos', () => {
    for (const filename of ['NumerosPrincipales.tsx', 'ViewerKpisBlock.tsx']) {
      const code = readFileSync(resolve(dir, filename), 'utf-8')
      const lines = code.split(/\r?\n/)
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx]
        const tieneIfYReturn = line.includes('if (') && line.includes('return')
        expect(
          tieneIfYReturn,
          `Línea ${idx + 1} de ${filename} contiene "if (" y "return" en la misma línea`
        ).toBe(false)
      }
    }
  })

  it('ViewerKpisBlock.tsx no tiene ninguna línea con "label:" y "value:" juntos', () => {
    const code = readFileSync(resolve(dir, 'ViewerKpisBlock.tsx'), 'utf-8')
    const lines = code.split(/\r?\n/)
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]
      const tieneLabelYValue = line.includes('label:') && line.includes('value:')
      expect(
        tieneLabelYValue,
        `Línea ${idx + 1} de ViewerKpisBlock.tsx contiene "label:" y "value:" juntos`
      ).toBe(false)
    }
  })
})
