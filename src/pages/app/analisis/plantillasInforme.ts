import type { ConfiguracionInforme } from '@/services/analisis.service'

export interface PlantillaRapidaItem {
  id: string
  nombre: string
  descripcion: string
  configuracion: ConfiguracionInforme
}

export const PLANTILLAS_RAPIDAS: Array<{
  id: string
  nombre: string
  descripcion: string
  configuracion: ConfiguracionInforme
}> = [
  {
    id: 'tpl-cierre-ciclo',
    nombre: 'Resumen del ciclo',
    descripcion:
      'Resumen integral del último semestre con evolución, ranking de categorías y comparativa contra el ciclo anterior.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 6,
      naturaleza: 'todos',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'Números principales' },
        { id: 'b-evol', tipo: 'evolucion_ciclos', titulo: 'Evolución por Ciclos' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Desglose por Categorías' },
        { id: 'b-comp', tipo: 'comparativa_ciclos', titulo: 'Comparar dos ciclos' },
      ],
    },
  },
  {
    id: 'tpl-variables-hormiga',
    nombre: 'Gastos del día a día',
    descripcion:
      'Filtra exclusivamente consumos del día a día de los últimos 3 ciclos para detectar cambios cotidianos.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 3,
      naturaleza: 'variables',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'Números del día a día' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Rubros del día a día' },
        { id: 'b-comp', tipo: 'comparativa_ciclos', titulo: 'Diferencias' },
      ],
    },
  },
  {
    id: 'tpl-tarjetas-cuotas',
    nombre: 'Compromisos de Tarjetas y Cuotas',
    descripcion:
      'Enfocado en compras financiadas y proyección futura de liberación de límite y flujo mensual.',
    configuracion: {
      moneda_modo: 'solo_ars',
      ciclos: 6,
      naturaleza: 'cuotas',
      bloques: [
        { id: 'b-kpis', tipo: 'kpis', titulo: 'Números principales' },
        { id: 'b-proy', tipo: 'proyeccion_cuotas', titulo: 'Proyección de Cuotas y Suscripciones' },
        { id: 'b-cats', tipo: 'desglose_categorias', titulo: 'Compras en cuotas por rubro' },
      ],
    },
  },
]
