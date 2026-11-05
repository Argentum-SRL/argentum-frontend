import { describe, it, expect } from 'vitest'
import { RESPUESTAS_CONSEJO } from './consejos'

describe('RESPUESTAS_CONSEJO', () => {
  it('tiene exactamente 3 opciones en orden y con los nombres esperados', () => {
    expect(RESPUESTAS_CONSEJO).toHaveLength(3)
    expect(RESPUESTAS_CONSEJO[0]).toEqual({ codigo: 'sirvio', nombre: 'Me sirvió' })
    expect(RESPUESTAS_CONSEJO[1]).toEqual({ codigo: 'no_sirve', nombre: 'No me sirve' })
    expect(RESPUESTAS_CONSEJO[2]).toEqual({ codigo: 'no_avisar', nombre: 'No me avises más de esto' })
  })
})

