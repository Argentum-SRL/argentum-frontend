import { describe, expect, it } from 'vitest'
import {
  resolverValorCuotaFormulario,
  resolverTotalCuotasFormulario,
  armarPedidoConveniencia,
  TEXTO_AYUDA_INFLACION_ESPERADA,
  TEXTO_AYUDA_CUOTAS_CONTADO,
} from './conveniencia'
import { TEXTO_AYUDA_PERMITIRSE } from './permitirseAyuda'
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

describe('Textos de pantalla T3 sin tecnicismos ni primera persona', () => {
  const PROHIBIDAS_PANTALLA = [
    'anoté',
    'guardé',
    'voy',
    'pudimos',
    'enviamos',
    'mandamos',
    'vamos',
    'nuestro',
    'nuestra',
    'nuestros',
    'nuestras',
    'nosotros',
    'comparo',
    'digo',
    'REM',
    'TNA',
    'CFT',
    'ARS',
    'USD',
    'líquido',
  ]

  it('TEXTO_AYUDA_PERMITIRSE y TEXTO_AYUDA_CUOTAS_CONTADO coinciden exactamente con D-T3.4', () => {
    expect(TEXTO_AYUDA_PERMITIRSE).toBe(
      'Te dice si una compra te entra, mirando la plata que tenés hoy, lo que cobrás y gastás cada mes y lo que ya tenés comprometido. Si te entra usando plata de tus cuentas o tus ahorros, también te lo aclara. No es un consejo de inversión.'
    )
    expect(TEXTO_AYUDA_CUOTAS_CONTADO).toBe(
      'Compara lo que pagás en cuotas con el precio de contado, teniendo en cuenta la inflación que se espera para los próximos meses. Si las cuotas pierden valor más rápido de lo que te cobran de más, te conviene en cuotas.'
    )
  })

  it('ni ayudas ni rótulos de pantalla contienen palabras prohibidas como palabra entera', () => {
    const textosPantalla = [
      TEXTO_AYUDA_PERMITIRSE,
      TEXTO_AYUDA_CUOTAS_CONTADO,
      TEXTO_AYUDA_INFLACION_ESPERADA,
      'Plata disponible',
      'Precio',
      'Herramientas',
    ]

    for (const texto of textosPantalla) {
      for (const palabra of PROHIBIDAS_PANTALLA) {
        const escaped = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const rx = new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}($|[^\\p{L}\\p{N}_])`, 'iu')
        expect(rx.test(texto), `Palabra prohibida "${palabra}" en "${texto}"`).toBe(false)
      }
    }
  })
})

describe('armarPedidoConveniencia (D-V1.7)', () => {
  const baseForm = {
    precio_contado: 1000,
    precio_total_cuotas: null,
    valor_cuota: 130000,
    sin_interes: false,
    cantidad_cuotas: 12,
    inflacion_mensual: '3',
    usar_inflacion_propia: true,
    tiene_interes: false,
    tna: '',
    hasCapitalToInvest: true,
    investmentTna: '40',
    moneda_contado: 'USD' as const,
    moneda_cuotas: 'ARS' as const,
  }

  it('envía moneda_contado USD y moneda_cuotas ARS con contado en dólares y cuotas en pesos', () => {
    const req = armarPedidoConveniencia(baseForm)
    expect(req.moneda_contado).toBe('USD')
    expect(req.moneda_cuotas).toBe('ARS')
    expect(req.inflacion_mensual).toBe(3)
    expect(req.tna_billetera_inversion).toBe(40)
  })

  it('con "Sin interés" fuerza moneda_cuotas igual a moneda_contado', () => {
    const req = armarPedidoConveniencia({
      ...baseForm,
      valor_cuota: null,
      sin_interes: true,
      moneda_contado: 'USD',
      moneda_cuotas: 'ARS',
    })
    expect(req.moneda_contado).toBe('USD')
    expect(req.moneda_cuotas).toBe('USD')
    expect(req.inflacion_mensual).toBeUndefined()
    expect(req.tna_billetera_inversion).toBeUndefined()
  })

  it('con cuotas en dólares omite inflacion_mensual y tna_billetera_inversion', () => {
    const req = armarPedidoConveniencia({
      ...baseForm,
      moneda_contado: 'ARS',
      moneda_cuotas: 'USD',
      valor_cuota: 100,
    })
    expect(req.moneda_contado).toBe('ARS')
    expect(req.moneda_cuotas).toBe('USD')
    expect(req.inflacion_mensual).toBeUndefined()
    expect(req.tna_billetera_inversion).toBeUndefined()
  })
})
