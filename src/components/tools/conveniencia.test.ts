import { describe, expect, it } from 'vitest'
import {
  resolverValorCuotaFormulario,
  resolverTotalCuotasFormulario,
  TEXTO_AYUDA_INFLACION_ESPERADA,
} from './conveniencia'
import { problemasTextoWeb } from '@/utils/reglasTextoWeb'

describe('resolverValorCuotaFormulario', () => {
  it('calcula el valor de cuota automáticamente con "Sin interés"', () => {
    expect(
      resolverValorCuotaFormulario({
        precioContado: 300000,
        cantidadCuotas: 6,
        sinInteres: true,
        seLaTasa: false,
        cuotaManual: null,
        cuotaSimuladaBackend: null,
      })
    ).toBe(50000)

    expect(
      resolverValorCuotaFormulario({
        precioContado: 500000,
        cantidadCuotas: 12,
        sinInteres: true,
        seLaTasa: false,
        cuotaManual: null,
        cuotaSimuladaBackend: null,
      })
    ).toBe(41666.67)
  })

  it('usa la cuota simulada del servidor cuando "Sé la tasa" está activo', () => {
    expect(
      resolverValorCuotaFormulario({
        precioContado: 600000,
        cantidadCuotas: 6,
        sinInteres: false,
        seLaTasa: true,
        cuotaManual: 50000,
        cuotaSimuladaBackend: 118210.48,
      })
    ).toBe(118210.48)

    expect(
      resolverValorCuotaFormulario({
        precioContado: 600000,
        cantidadCuotas: 6,
        sinInteres: false,
        seLaTasa: true,
        cuotaManual: 50000,
        cuotaSimuladaBackend: null,
      })
    ).toBeNull()
  })

  it('usa el valor manual ingresado cuando no hay "Sin interés" ni tasa', () => {
    expect(
      resolverValorCuotaFormulario({
        precioContado: 500000,
        cantidadCuotas: 12,
        sinInteres: false,
        seLaTasa: false,
        cuotaManual: 50000,
        cuotaSimuladaBackend: null,
      })
    ).toBe(50000)

    expect(resolverTotalCuotasFormulario(50000, 12)).toBe(600000)
  })

  it('devuelve null con datos faltantes o inválidos', () => {
    expect(
      resolverValorCuotaFormulario({
        precioContado: 500000,
        cantidadCuotas: 0,
        sinInteres: true,
        seLaTasa: false,
        cuotaManual: null,
        cuotaSimuladaBackend: null,
      })
    ).toBeNull()

    expect(resolverTotalCuotasFormulario(null, 12)).toBeNull()
  })
})

describe('Textos nuevos web de T2 cumplen reglasTextoWeb', () => {
  const TEXTOS_WEB_T2 = [
    // D-T2.3: tres títulos
    'Te conviene en cuotas.',
    'Te conviene de contado.',
    'Da casi lo mismo.',
    // D-T2.3: líneas 2 y 3 con datos de TC1 a TC5 y las fuentes
    '12 cuotas de $50.000 son $600.000: $100.000 más que de contado (20%).',
    '12 cuotas de $50.000 son $600.000, lo mismo que de contado.',
    '6 cuotas de $50.000 son $300.000: $20.000 más que de contado (7%).',
    '6 cuotas de $50.000 son $300.000: $22.000 más que de contado (8%).',
    '6 cuotas de $50.000 son $300.000: $20.000 menos que de contado.',
    'Con la inflación que se espera, en plata de hoy son unos $529.000.',
    'Con la última inflación del INDEC, en plata de hoy son unos $277.000.',
    'Con la inflación que pusiste, en plata de hoy son unos $529.000.',
    // D-T2.5: tres textos del detalle de precio de contado
    'Pagás $160.000 más que de contado (20%).',
    'Pagás lo mismo que de contado.',
    'Pagás $20.000 menos que de contado.',
    // D-T2.6: ayuda de "?" y validaciones nuevas
    TEXTO_AYUDA_INFLACION_ESPERADA,
    'Ingresá el valor de cada cuota mayor a 0.',
    'Ingresá una tasa de entre 0,1% y 3.000% por año.',
    'Ingresá un precio de contado mayor a 0.',
  ]

  it('ningún texto nuevo de T2 tiene problemas en problemasTextoWeb', () => {
    for (const texto of TEXTOS_WEB_T2) {
      expect(problemasTextoWeb(texto), `Texto inválido: ${texto}`).toEqual([])
    }
  })
})
