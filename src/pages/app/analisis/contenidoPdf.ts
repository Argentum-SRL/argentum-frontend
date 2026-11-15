import type {
  AnalisisResumenResponse,
  ComparativaCiclosResponse,
  ProyeccionCompromisosResponse,
} from '@/services/analisis.service'
import { formatFecha } from '@/utils/format'
import { armarKpisVista } from './kpisVista'
import {
  obtenerTipoBloque,
  obtenerTituloBloque,
  type PedidoDescarga,
} from './descargaAnalisis'

export type CeldaMontoPdf = {
  valor: number | null | undefined
  moneda: 'pesos' | 'dolares'
  tipo: 'monto' | 'resultado' | 'diferencia'
}

export type CeldaPorcentajePdf = {
  valor: number | null | undefined
  tipo: 'porcentaje' | 'porcentaje_diferencia'
}

export type CeldaPdf = string | CeldaMontoPdf | CeldaPorcentajePdf

export interface TablaPdf {
  titulo?: string
  encabezados: string[]
  alineaciones: Array<'left' | 'center' | 'right'>
  filas: CeldaPdf[][]
  total?: CeldaPdf[]
  filasNegrita?: number[]
}

export interface SeccionPdf {
  titulo: string
  nota?: string
  tablas: TablaPdf[]
}

export interface DatosInformePdf {
  resumen?: AnalisisResumenResponse | null
  comparativa?: ComparativaCiclosResponse | null
  proyeccion?: ProyeccionCompromisosResponse | null
}

function formatearEnteroConPuntos(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatearDecimalConPuntosYComa(n: number): string {
  const [entero, dec] = n.toFixed(2).split('.')
  return `${entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`
}

export function textoCeldaPdf(celda?: CeldaPdf): string {
  if (!celda) return ''
  if (typeof celda === 'string') return celda
  if (!celda || celda.valor === null || celda.valor === undefined || celda.valor === 0) return '-'
  const v = celda.valor

  if ('moneda' in celda) {
    const isPesos = celda.moneda === 'pesos'
    const absVal = Math.abs(v)
    const valorTxt = isPesos ? formatearEnteroConPuntos(absVal) : formatearDecimalConPuntosYComa(absVal)
    const pref = isPesos ? '$' : 'US$'

    if (celda.tipo === 'monto') return `${pref} ${valorTxt}`
    if (celda.tipo === 'resultado') return v < 0 ? `-${pref} ${valorTxt}` : `${pref} ${valorTxt}`
    if (celda.tipo === 'diferencia') return `${v > 0 ? '+' : '-'}${pref} ${valorTxt}`
  }

  if ('tipo' in celda) {
    const absPct = Math.round(Math.abs(v))
    if (celda.tipo === 'porcentaje') return `${Math.round(v)}%`
    if (celda.tipo === 'porcentaje_diferencia') return `${v > 0 ? '+' : '-'}${absPct}%`
  }

  return '-'
}

export function colorCeldaPdf(celda?: CeldaPdf): 'rojo' | 'verde' | 'texto' {
  if (typeof celda === 'string' || !celda || !celda.valor) return 'texto'
  const v = celda.valor

  if ('moneda' in celda) {
    if (celda.tipo === 'resultado') return v < 0 ? 'rojo' : 'texto'
    if (celda.tipo === 'diferencia') return v > 0 ? 'rojo' : 'verde'
    return 'texto'
  }
  if ('tipo' in celda && celda.tipo === 'porcentaje_diferencia') {
    return v > 0 ? 'rojo' : 'verde'
  }
  return 'texto'
}

function resolverMonedaPedido(pedido: PedidoDescarga): 'pesos' | 'dolares' {
  const modo = (pedido.params?.moneda_modo || pedido.filtros?.moneda_modo || 'solo_ars').toLowerCase()
  return modo === 'solo_usd' || modo === 'consolidado_usd' ? 'dolares' : 'pesos'
}

export function armarContenidoPdf(
  pedido: PedidoDescarga,
  datos: DatosInformePdf = {}
): SeccionPdf[] {
  const secciones: SeccionPdf[] = []
  const moneda = resolverMonedaPedido(pedido)
  const { soloGastos } = armarKpisVista(datos.resumen?.kpis, datos.resumen?.moneda_modo)

  for (const b of pedido.bloques) {
    const tipo = obtenerTipoBloque(b)
    const titCustom = obtenerTituloBloque(b)

    if (tipo === 'tabla_movimientos') continue

    if (tipo === 'kpis') {
      const k = datos.resumen?.kpis
      let filas: CeldaPdf[][]

      if (soloGastos) {
        if (k?.gasto_total_referencia !== null && k?.gasto_total_referencia !== undefined) {
          filas = [
            ['Egresos', { valor: k?.gastos_totales, moneda, tipo: 'monto' }],
            ['Todo lo que gastaste', { valor: k?.gasto_total_referencia, moneda, tipo: 'monto' }],
            [
              '% de todo lo que gastaste',
              { valor: k?.peso_sobre_gasto_total_pct, tipo: 'porcentaje' },
            ],
            [
              'Promedio de gastos por ciclo',
              { valor: k?.promedio_gasto_ciclo, moneda, tipo: 'monto' },
            ],
          ]
        } else {
          filas = [
            ['Egresos', { valor: k?.gastos_totales, moneda, tipo: 'monto' }],
            [
              'Promedio de gastos por ciclo',
              { valor: k?.promedio_gasto_ciclo, moneda, tipo: 'monto' },
            ],
          ]
        }
      } else {
        filas = [
          ['Ingresos', { valor: k?.ingresos_totales, moneda, tipo: 'monto' }],
          ['Egresos', { valor: k?.gastos_totales, moneda, tipo: 'monto' }],
          ['Te quedó', { valor: k?.balance_neto, moneda, tipo: 'resultado' }],
          ['% de lo que entró', { valor: k?.tasa_ahorro_pct, tipo: 'porcentaje' }],
          [
            'Promedio de gastos por ciclo',
            { valor: k?.promedio_gasto_ciclo, moneda, tipo: 'monto' },
          ],
        ]
      }

      secciones.push({
        titulo: titCustom || 'Números principales',
        nota: k?.frase_resumen || (datos.resumen as { frase_resumen?: string } | undefined)?.frase_resumen || undefined,
        tablas: [{
          encabezados: ['Concepto', 'Monto'],
          alineaciones: ['left', 'right'],
          filas,
        }],
      })
    } else if (tipo === 'evolucion_ciclos') {
      const serie = datos.resumen?.serie_ciclos || []
      const totTerm = datos.resumen?.totales_terminados

      if (soloGastos) {
        const filas: CeldaPdf[][] = serie.map((c) => [
          c.nombre_corto || c.etiqueta,
          formatFecha(c.fecha_inicio),
          formatFecha(c.fecha_fin),
          { valor: c.gastos, moneda, tipo: 'monto' },
          c.sin_datos ? 'Sin datos' : c.es_actual ? 'En curso' : 'Terminado',
        ])
        const total: CeldaPdf[] | undefined = totTerm
          ? [
              'Total ciclos terminados', '', '',
              { valor: totTerm.gastos, moneda, tipo: 'monto' },
              '',
            ]
          : undefined

        secciones.push({
          titulo: titCustom || 'Evolución',
          tablas: [{
            encabezados: ['Ciclo', 'Desde', 'Hasta', 'Gastos', 'Estado'],
            alineaciones: ['left', 'center', 'center', 'right', 'center'],
            filas,
            total,
          }],
        })
      } else {
        const filas: CeldaPdf[][] = serie.map((c) => [
          c.nombre_corto || c.etiqueta,
          formatFecha(c.fecha_inicio),
          formatFecha(c.fecha_fin),
          { valor: c.ingresos, moneda, tipo: 'monto' },
          { valor: c.gastos, moneda, tipo: 'monto' },
          { valor: c.balance, moneda, tipo: 'resultado' },
          { valor: c.tasa_ahorro_pct, tipo: 'porcentaje' },
          c.sin_datos ? 'Sin datos' : c.es_actual ? 'En curso' : 'Terminado',
        ])
        const total: CeldaPdf[] | undefined = totTerm
          ? [
              'Total ciclos terminados', '', '',
              { valor: totTerm.ingresos, moneda, tipo: 'monto' },
              { valor: totTerm.gastos, moneda, tipo: 'monto' },
              { valor: totTerm.balance, moneda, tipo: 'resultado' },
              { valor: totTerm.tasa_ahorro_pct, tipo: 'porcentaje' },
              '',
            ]
          : undefined

        secciones.push({
          titulo: titCustom || 'Evolución',
          tablas: [{
            encabezados: [
              'Ciclo',
              'Desde',
              'Hasta',
              'Ingresos',
              'Gastos',
              'Te quedó',
              '% de lo que entró',
              'Estado',
            ],
            alineaciones: [
              'left',
              'center',
              'center',
              'right',
              'right',
              'right',
              'right',
              'center',
            ],
            filas,
            total,
          }],
        })
      }
    } else if (tipo === 'desglose_categorias') {
      const cats = datos.resumen?.desglose_categorias || []
      const filas: CeldaPdf[][] = []
      const filasNegrita: number[] = []
      for (const cat of cats) {
        filasNegrita.push(filas.length)
        filas.push([
          cat.categoria_nombre, '',
          { valor: cat.monto, moneda, tipo: 'monto' },
          { valor: cat.porcentaje_del_total, tipo: 'porcentaje' },
          String(cat.cantidad_movimientos),
        ])
        for (const sub of cat.subcategorias || []) {
          filas.push([
            '', sub.subcategoria_nombre,
            { valor: sub.monto, moneda, tipo: 'monto' },
            { valor: sub.porcentaje_total, tipo: 'porcentaje' },
            String(sub.cantidad_movimientos),
          ])
        }
      }

      const totDesg = datos.resumen?.total_desglose
      const total: CeldaPdf[] | undefined = totDesg
        ? [
            'Total', '',
            { valor: totDesg.monto, moneda, tipo: 'monto' },
            { valor: 100, tipo: 'porcentaje' },
            String(totDesg.cantidad_movimientos),
          ]
        : undefined

      secciones.push({
        titulo: titCustom || 'Categorías',
        tablas: [{
          encabezados: ['Categoría', 'Subcategoría', 'Monto', '% del total', 'Movimientos'],
          alineaciones: ['left', 'left', 'right', 'right', 'right'],
          filas,
          total,
          filasNegrita,
        }],
      })
    } else if (tipo === 'comparativa_ciclos') {
      const comp = datos.comparativa
      const nomA = comp?.ciclo_a?.nombre_corto || comp?.ciclo_a?.etiqueta || 'Ciclo A'
      const nomB = comp?.ciclo_b?.nombre_corto || comp?.ciclo_b?.etiqueta || 'Ciclo B'
      const filas: CeldaPdf[][] = (comp?.categorias || []).map((it) => [
        it.categoria_nombre,
        { valor: it.monto_a, moneda, tipo: 'monto' },
        { valor: it.monto_b, moneda, tipo: 'monto' },
        { valor: it.diferencia_monto, moneda, tipo: 'diferencia' },
        { valor: it.diferencia_pct, tipo: 'porcentaje_diferencia' },
      ])

      const totComp = comp?.totales
      const total: CeldaPdf[] | undefined = totComp
        ? [
            'Total',
            { valor: totComp.monto_a, moneda, tipo: 'monto' },
            { valor: totComp.monto_b, moneda, tipo: 'monto' },
            { valor: totComp.diferencia_monto, moneda, tipo: 'diferencia' },
            { valor: totComp.diferencia_pct, tipo: 'porcentaje_diferencia' },
          ]
        : undefined

      secciones.push({
        titulo: titCustom || 'Comparación',
        tablas: [{
          encabezados: ['Categoría', nomA, nomB, 'Diferencia', 'Diferencia %'],
          alineaciones: ['left', 'right', 'right', 'right', 'right'],
          filas,
          total,
        }],
      })
    } else if (tipo === 'proyeccion_cuotas') {
      const proy = datos.proyeccion
      const filasT1: CeldaPdf[][] = (proy?.serie_mensual || []).map((m) => [
        m.nombre_corto || m.etiqueta,
        { valor: m.monto_cuotas, moneda, tipo: 'monto' },
        { valor: m.monto_suscripciones, moneda, tipo: 'monto' },
        { valor: m.monto_total, moneda, tipo: 'monto' },
        String(m.planes_que_finalizan),
        { valor: m.monto_que_se_libera, moneda, tipo: 'monto' },
      ])

      const totSerie = proy?.totales_serie
      const totalT1: CeldaPdf[] | undefined = totSerie
        ? [
            'Total',
            { valor: totSerie.monto_cuotas, moneda, tipo: 'monto' },
            { valor: totSerie.monto_suscripciones, moneda, tipo: 'monto' },
            { valor: totSerie.monto_total, moneda, tipo: 'monto' },
            String(totSerie.planes_que_finalizan),
            { valor: totSerie.monto_que_se_libera, moneda, tipo: 'monto' },
          ]
        : undefined

      const filasT2: CeldaPdf[][] = (proy?.planes_activos || []).map((p) => [
        p.descripcion,
        p.tarjeta_nombre,
        String(p.cuotas_restantes),
        String(p.cantidad_cuotas),
        { valor: p.monto_cuota, moneda, tipo: 'monto' },
        { valor: p.saldo_pendiente, moneda, tipo: 'monto' },
        p.ultimo_mes_nombre_corto || p.ultimo_mes_etiqueta,
      ])

      const tablas: TablaPdf[] = [
        {
          encabezados: ['Ciclo', 'Cuotas', 'Suscripciones', 'Total', 'Compras que terminan', 'Se libera'],
          alineaciones: ['left', 'right', 'right', 'right', 'right', 'right'],
          filas: filasT1,
          total: totalT1,
        },
      ]
      if (filasT2.length > 0) {
        tablas.push({
          titulo: 'Compras en cuotas',
          encabezados: ['Compra', 'Tarjeta', 'Cuotas que faltan', 'De', 'Cuota', 'Falta pagar', 'Última cuota'],
          alineaciones: ['left', 'left', 'right', 'right', 'right', 'right', 'center'],
          filas: filasT2,
        })
      }
      secciones.push({
        titulo: titCustom || 'Proyección',
        tablas,
      })
    }
  }

  return secciones
}
