import { describe, it, expect } from 'vitest'
import { lineasFinDeMes } from './finDeMes'
import type { FinDeMesTextos } from '@/types'

describe('lineasFinDeMes', () => {
  it('filtra las líneas no nulas en orden', () => {
    const textos: FinDeMesTextos = {
      titulo: 'Libre',
      monto: '$100.000',
      subtitulo: 'Hasta el 24/11',
      linea_rango: 'A',
      linea_riesgo: null,
      linea_estado: null,
      linea_cobertura: 'C',
      linea_saldo: 'S',
    }
    expect(lineasFinDeMes(textos)).toEqual(['A', 'C', 'S'])
  })

  it('devuelve array vacío cuando todas son null', () => {
    const textos: FinDeMesTextos = {
      titulo: 'Libre',
      monto: '$100.000',
      subtitulo: 'Hasta el 30/11',
      linea_rango: null,
      linea_riesgo: null,
      linea_estado: null,
      linea_cobertura: null,
      linea_saldo: null,
    }
    expect(lineasFinDeMes(textos)).toEqual([])
  })
})

