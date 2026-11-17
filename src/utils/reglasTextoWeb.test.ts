import { describe, expect, it } from 'vitest'
import {
  LARGO_MAXIMO_TITULO_WEB,
  MAXIMO_RENGLONES_WEB,
  problemasTextoWeb,
} from './reglasTextoWeb'

const VECTORES_WEB: Array<[string, string[]]> = [
  [
    "Meta creada.",
    [],
  ],
  [
    "Transacción eliminada correctamente",
    [
      "W2_PALABRA:correctamente",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "Rendimiento registrado exitosamente",
    [
      "W2_PALABRA:exitosamente",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "No pudimos cargar las metas. Intentá de nuevo.",
    [
      "W2_PALABRA:intentá",
      "W2_PALABRA:primera persona",
    ],
  ],
  [
    "Por favor, seleccioná una tarjeta y una billetera.",
    [
      "W2_PALABRA:por favor",
    ],
  ],
  [
    "Debe ingresar una TNA válida entre 0.1% y 3000%",
    [
      "W2_PALABRA:válido",
      "W2_PALABRA:deber",
      "W2_PALABRA:TNA",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "Ingresá un monto mayor a 0.",
    [],
  ],
  [
    "\"Galicia\" archivada.",
    [
      "W3_COMILLAS",
    ],
  ],
  [
    "Billetera Galicia archivada.",
    [],
  ],
  [
    "*Cerraste el ciclo*",
    [
      "W4_MARCAS",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "Listo: 3 movimiento(s) actualizado(s).",
    [
      "W2_PALABRA:listo",
      "W5_PLURAL_PARENTESIS",
    ],
  ],
  [
    "Cálculo listo.",
    [],
  ],
  [
    "El resumen de tu Visa Galicia •••• 1506 cierra el 22/11 y vence el 4/12.",
    [],
  ],
  [
    "Vence el 20/11/2026.",
    [
      "W9_FECHA",
    ],
  ],
  [
    "Vence el 04/12.",
    [
      "W9_FECHA",
    ],
  ],
  [
    "Vence el 4/12.",
    [],
  ],
  [
    "Vence el 9 de octubre.",
    [
      "W9_FECHA",
    ],
  ],
  [
    "Pagá en https://miargentum.com",
    [
      "W7_SIN_PUNTO:1",
      "W11_LINK",
    ],
  ],
  [
    "Hola 👍",
    [
      "W7_SIN_PUNTO:1",
      "W10_EMOJI",
    ],
  ],
  [
    "• Café",
    [
      "W7_SIN_PUNTO:1",
      "W13_LISTA",
    ],
  ],
  [
    "1) Galicia.",
    [
      "W13_LISTA",
    ],
  ],
  [
    "Terminó tu mes: te sobraron $80.000.\n"
      + "Entraron $500.000 y gastaste $420.000.\n"
      + "Lo que más pesó: Comida ($95.000).\n"
      + "Gastos chicos que se repiten:\n"
      + "- Café: $18.000 en 12 compras\n"
      + "- Kiosco: $9.000 en 7 compras",
    [],
  ],
  [
    "Tenés {x}.",
    [
      "W8_SIN_RELLENAR",
    ],
  ],
  [
    "Te va a llegar un código a tu email.",
    [],
  ],
  [
    "Contraseña actualizada. Ya podés entrar con la nueva.",
    [],
  ],
  [
    "Se cambió el email de tu cuenta.\nSi no fuiste vos, cambiá tu contraseña ya.",
    [],
  ],
  [
    "No se pudo eliminar la meta. Probá de nuevo.",
    [],
  ],
  [
    "Tu billetera Mercado Pago se quedó sin saldo.",
    [],
  ],
  [
    "Ya usaste el 80% del presupuesto Comida: $80.000 de $100.000.",
    [],
  ],
  [
    "El precio de contado excede el límite permitido",
    [
      "W2_PALABRA:exceder",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "Tu cuenta ha sido eliminada exitosamente.",
    [
      "W2_PALABRA:exitosamente",
      "W2_PALABRA:pasiva",
    ],
  ],
  [
    "Si tienes dudas, escribe.",
    [
      "W2_PALABRA:tuteo",
    ],
  ],
  [
    "Hoy se cobra Netflix: US$10.",
    [],
  ],
  [
    "Gasto de ARS 500.",
    [
      "W2_PALABRA:ARS",
    ],
  ],
  [
    "¿Te llegó el reintegro de $25.000 de Súper?",
    [],
  ],
  [
    "Completá los datos requeridos",
    [
      "W2_PALABRA:requerido",
      "W7_SIN_PUNTO:1",
    ],
  ],
  [
    "No se puede eliminar una tarjeta con transacciones. Archivala.",
    [],
  ],
  [
    "Listo, no lo vamos a mostrar más.",
    [
      "W2_PALABRA:listo",
      "W2_PALABRA:primera persona",
    ],
  ],
  [
    "Es O'Higgins.",
    [],
  ],
  [
    "Saldo: undefined.",
    [
      "W8_SIN_RELLENAR",
    ],
  ],
  [
    "Cierre el 3 de diciembre.",
    [
      "W9_FECHA",
    ],
  ],
  [
    "Anteayer pagaste.",
    [
      "W9_FECHA",
    ],
  ],
  [
    "Esta línea de prueba es bastante larga y tiene que medir justo noventa caracteres en tota.",
    [],
  ],
  [
    "Esta línea de prueba es bastante larga y tien"
      + "e que medir justo noventa caracteres en totas.",
    [
      "W1_TITULO_LARGO:91",
    ],
  ],
  [
    "Uno.\nDos.\nTres.\nCuatro.\nCinco.\nSeis.\nSiete.",
    [],
  ],
  [
    "Uno.\nDos.\nTres.\nCuatro.\nCinco.\nSeis.\nSiete.\nOcho.",
    [
      "W12_RENGLONES",
    ],
  ],
]

describe('reglasTextoWeb', () => {
  it('mantiene constantes canónicas', () => {
    expect(LARGO_MAXIMO_TITULO_WEB).toBe(90)
    expect(MAXIMO_RENGLONES_WEB).toBe(7)
  })

  it.each(VECTORES_WEB)('valida vector %#', (texto, esperado) => {
    expect(problemasTextoWeb(texto)).toEqual(esperado)
  })
})
