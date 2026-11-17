import { describe, expect, it } from 'vitest'
import { parsearAviso } from './avisoNotificacion'

describe('parsearAviso', () => {
  it('devuelve solo título para aviso de un renglón', () => {
    expect(parsearAviso('Meta creada.')).toEqual({
      titulo: 'Meta creada.',
      bloques: [],
    })
  })

  it('limpia marcas viejas de WhatsApp y separa listas y párrafos', () => {
    const viejo =
      '*Cerraste el ciclo*\n\n' +
      '- Ingresos: *$500.000*\n' +
      '- Egresos: *$420.000*\n' +
      '- Balance: *+$80.000*\n\n' +
      'Más gastaste en *Comida*: $95.000\n\n' +
      'Gastos frecuentes:\n' +
      '- Café: $18.000 en 12 compras'

    expect(parsearAviso(viejo)).toEqual({
      titulo: 'Cerraste el ciclo',
      bloques: [
        {
          tipo: 'lista',
          items: [
            'Ingresos: $500.000',
            'Egresos: $420.000',
            'Balance: +$80.000',
          ],
        },
        { tipo: 'parrafo', texto: 'Más gastaste en Comida: $95.000' },
        { tipo: 'parrafo', texto: 'Gastos frecuentes:' },
        { tipo: 'lista', items: ['Café: $18.000 en 12 compras'] },
      ],
    })
  })

  it('parsea N12 de una moneda en título, párrafos y lista', () => {
    const n12 =
      'Terminó tu mes: te sobraron $80.000.\n' +
      'Entraron $500.000 y gastaste $420.000.\n' +
      'Lo que más pesó: Comida ($95.000).\n' +
      'Gastos chicos que se repiten:\n' +
      '- Café: $18.000 en 12 compras\n' +
      '- Kiosco: $9.000 en 1 compra'

    expect(parsearAviso(n12)).toEqual({
      titulo: 'Terminó tu mes: te sobraron $80.000.',
      bloques: [
        { tipo: 'parrafo', texto: 'Entraron $500.000 y gastaste $420.000.' },
        { tipo: 'parrafo', texto: 'Lo que más pesó: Comida ($95.000).' },
        { tipo: 'parrafo', texto: 'Gastos chicos que se repiten:' },
        {
          tipo: 'lista',
          items: ['Café: $18.000 en 12 compras', 'Kiosco: $9.000 en 1 compra'],
        },
      ],
    })
  })

  it('quita asteriscos de un aviso viejo juntado en una línea', () => {
    const juntado =
      '*Cerraste el ciclo* - Ingresos: *$500.000* - Egresos: *$420.000*'
    expect(parsearAviso(juntado)).toEqual({
      titulo: 'Cerraste el ciclo - Ingresos: $500.000 - Egresos: $420.000',
      bloques: [],
    })
  })

  it('saca el link del título', () => {
    const msg =
      'Si no fuiste vos, cambiala ya: ' +
      'https://miargentum.com/auth/recuperar-password'
    expect(parsearAviso(msg)).toEqual({
      titulo: 'Si no fuiste vos, cambiala ya',
      bloques: [],
    })
  })

  it('maneja vacío y null', () => {
    expect(parsearAviso('')).toEqual({ titulo: '', bloques: [] })
    expect(parsearAviso(null)).toEqual({ titulo: '', bloques: [] })
  })

  it('convierte viñeta vieja en bloque de lista', () => {
    expect(parsearAviso('Visa Galicia •••• 1506 cierra el 22/11.\n• Uno')).toEqual({
      titulo: 'Visa Galicia •••• 1506 cierra el 22/11.',
      bloques: [{ tipo: 'lista', items: ['Uno'] }],
    })
  })
})
