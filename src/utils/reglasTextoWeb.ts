// Reglas de estilo y formato para los textos de la web (cartelitos y campanita).
// Mismos códigos, mismo orden y mismas expresiones que app/core/reglas_texto_web.py del backend.

export const LARGO_MAXIMO_TITULO_WEB = 90
export const MAXIMO_RENGLONES_WEB = 7

// Bordes de palabra con letras unicode (igual que (?<![^\W]) en Python).
const A = '(?<![\\p{L}\\p{N}_])'
const Z = '(?![\\p{L}\\p{N}_])'

// [expresión, nombre, distingue mayúsculas]
const PALABRAS_WEB: Array<[string, string, boolean]> = [
  ['con [eé]xito', 'con éxito', false],
  ['exitosamente', 'exitosamente', false],
  ['correctamente', 'correctamente', false],
  ['por favor', 'por favor', false],
  ['realiz[\\p{L}\\p{N}_]*', 'realizar', false],
  ['gestion[\\p{L}\\p{N}_]*', 'gestionar', false],
  ['proces[\\p{L}\\p{N}_]*', 'procesar', false],
  ['operaci[oó]n[\\p{L}\\p{N}_]*', 'operación', false],
  ['inv[aá]lid[\\p{L}\\p{N}_]*', 'inválido', false],
  ['v[aá]lid[oa]s?', 'válido', false],
  ['error al', 'error al', false],
  ['(?:debe|debes|debés|deben)', 'deber', false],
  ['requerid[\\p{L}\\p{N}_]*', 'requerido', false],
  ['exced[\\p{L}\\p{N}_]*', 'exceder', false],
  ['ha sido|han sido', 'pasiva', false],
  ['intent[aá]', 'intentá', false],
  [
    '(?:tienes|puedes|quieres|dime|escribe|env[ií]a|' +
      'elige|ingresa|intenta|verifica)',
    'tuteo',
    false,
  ],
  [
    '(?:pudimos|enviamos|mandamos|cambiamos|anotamos|encontramos|contactanos|registramos' +
      '|vamos a|anoté|saqué|guardé|borré|eliminé|voy a)',
    'primera persona',
    false,
  ],
  ['la web', 'la web', false],
  ['REM', 'REM', true],
  ['TNA', 'TNA', true],
  ['CFT', 'CFT', true],
  ['ARS', 'ARS', true],
  ['USD', 'USD', true],
]

const MESES =
  'enero|febrero|marzo|abril|mayo|junio|' +
  'julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre'

const esItem = (linea: string): boolean => linea.startsWith('- ')

export function problemasTextoWeb(texto: string): string[] {
  const res: string[] = []
  const lineas = texto
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lineas.length > 0 && lineas[0].length > LARGO_MAXIMO_TITULO_WEB) {
    res.push(`W1_TITULO_LARGO:${lineas[0].length}`)
  }
  if (lineas.length > 0 && new RegExp('^listo' + Z, 'iu').test(lineas[0])) {
    res.push('W2_PALABRA:listo')
  }
  for (const [expr, nombre, exacta] of PALABRAS_WEB) {
    if (new RegExp(A + expr + Z, exacta ? 'u' : 'iu').test(texto)) {
      res.push(`W2_PALABRA:${nombre}`)
    }
  }
  if (/[«»“”"]/u.test(texto) || /(?<!\p{L})'|'(?!\p{L})/u.test(texto)) {
    res.push('W3_COMILLAS')
  }
  if (texto.includes('*') || texto.includes('_')) res.push('W4_MARCAS')
  if (texto.includes('(s)') || texto.includes('(es)')) {
    res.push('W5_PLURAL_PARENTESIS')
  }
  if (texto.includes('—') || texto.includes('–')) res.push('W6_RAYA')
  lineas.forEach((l, i) => {
    if (!esItem(l) && !/[.?!:]$/u.test(l)) res.push(`W7_SIN_PUNTO:${i + 1}`)
  })
  if (
    new RegExp(A + '(?:None|nan|NaN|null|undefined)' + Z, 'u').test(texto) ||
    /[{}]/u.test(texto)
  ) {
    res.push('W8_SIN_RELLENAR')
  }
  if (
    /(?<!\d)\d{1,2}\/\d{1,2}\/\d{2,4}(?!\d)/u.test(texto) ||
    /(?<!\d)0\d\/\d{1,2}(?!\d)/u.test(texto) ||
    new RegExp('(?<!\\d)\\d{1,2} de (?:' + MESES + ')', 'iu').test(texto) ||
    new RegExp(A + 'anteayer' + Z, 'iu').test(texto)
  ) {
    res.push('W9_FECHA')
  }
  if (/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F})/u.test(texto)) {
    res.push('W10_EMOJI')
  }
  if (new RegExp('https?://|www\\.|\\.com' + Z, 'iu').test(texto)) {
    res.push('W11_LINK')
  }
  if (lineas.length > MAXIMO_RENGLONES_WEB) res.push('W12_RENGLONES')
  if (lineas.some((l) => /^(?:• |\* |\d{1,2}\) )/u.test(l))) {
    res.push('W13_LISTA')
  }
  return res
}
