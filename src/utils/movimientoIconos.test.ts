import { describe, it, expect } from 'vitest'
import { iconosConNombre, MAPA_ICONOS } from './movimientoIconos'

describe('iconosConNombre', () => {
  it('retorna array vacío si la lista de códigos está vacía o es inválida', () => {
    expect(iconosConNombre([])).toEqual([])
    // @ts-expect-error probando valor inválido
    expect(iconosConNombre(null)).toEqual([])
    // @ts-expect-error probando valor inválido
    expect(iconosConNombre(undefined)).toEqual([])
  })

  it('retorna objetos con código y nombre para códigos válidos', () => {
    const codigos = ['credito', 'suscripcion']
    const resultado = iconosConNombre(codigos)
    expect(resultado).toEqual([
      { codigo: 'credito', nombre: 'Con tarjeta de crédito' },
      { codigo: 'suscripcion', nombre: 'Débito automático' },
    ])
  })

  it('filtra códigos desconocidos', () => {
    const codigos = ['codigo_raro', 'inversion', 'fake_icon', 'paso_por_mi_cuenta']
    const resultado = iconosConNombre(codigos)
    expect(resultado).toEqual([
      { codigo: 'inversion', nombre: 'Billetera de inversión: no cuenta' },
      { codigo: 'paso_por_mi_cuenta', nombre: 'Pasó por tu cuenta: no es gasto ni ingreso' },
    ])
  })

  it('mapea correctamente todos los códigos conocidos', () => {
    const todos = Object.keys(MAPA_ICONOS)
    const resultado = iconosConNombre(todos)
    expect(resultado.length).toBe(6)
    expect(resultado).toEqual([
      { codigo: 'credito', nombre: 'Con tarjeta de crédito' },
      { codigo: 'suscripcion', nombre: 'Débito automático' },
      { codigo: 'reintegro', nombre: 'Reintegro' },
      { codigo: 'devolucion', nombre: 'Te devolvieron parte del gasto' },
      { codigo: 'paso_por_mi_cuenta', nombre: 'Pasó por tu cuenta: no es gasto ni ingreso' },
      { codigo: 'inversion', nombre: 'Billetera de inversión: no cuenta' },
    ])
  })
})

