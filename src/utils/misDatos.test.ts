import { describe, it, expect } from 'vitest'
import { nombreArchivoMisDatos } from './misDatos'

describe('nombreArchivoMisDatos', () => {
  it('genera el nombre de archivo con formato argentum_mis_datos_AAAAMMDD.zip', () => {
    expect(nombreArchivoMisDatos(new Date(2026, 10, 2))).toBe('argentum_mis_datos_20261102.zip')
    expect(nombreArchivoMisDatos(new Date(2026, 0, 5))).toBe('argentum_mis_datos_20260105.zip')
  })
})

