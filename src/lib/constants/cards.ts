// ─── Catálogo de marcas de tarjetas de crédito / débito ──────────────────────
//
// Agrega aquí cada marca de tarjeta junto con el nombre del archivo en
// src/assets/cards/. El glob en tarjetas.utils.ts lo levanta automáticamente.
// Se soportan SVG y PNG.

export interface CardBrandDefinition {
  /** Identificador único (debe coincidir con el campo "marca" del backend) */
  id: string
  /** Nombre visible al usuario */
  nombre: string
  /** Nombre del archivo dentro de src/assets/cards/ */
  logoPath: string
  /** Color de fondo principal de la tarjeta */
  colorPrimario: string
  /** Color del texto sobre la tarjeta */
  colorTexto: 'white' | '#111'
  /** Gradiente CSS opcional para la card visual */
  gradiente?: string
}

export const CARD_BRANDS: CardBrandDefinition[] = [
  {
    id: 'visa',
    nombre: 'Visa',
    logoPath: 'visa.svg',
    colorPrimario: '#1A1F71',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #1A1F71 0%, #0D1245 100%)',
  },
  {
    id: 'mastercard',
    nombre: 'Mastercard',
    logoPath: 'mastercard.svg',
    colorPrimario: '#252525',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #2C2C2C 0%, #111111 100%)',
  },
  {
    id: 'amex',
    nombre: 'American Express',
    logoPath: 'amex.svg',
    colorPrimario: '#007BC1',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #007BC1 0%, #004F80 100%)',
  },
  {
    id: 'naranja',
    nombre: 'Naranja',
    logoPath: 'naranja.svg',
    colorPrimario: '#FF6200',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #FF6200 0%, #CC4E00 100%)',
  },
  {
    id: 'cabal',
    nombre: 'Cabal',
    logoPath: 'cabal.svg',
    colorPrimario: '#002F6C',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #002F6C 0%, #001A3E 100%)',
  },
  {
    id: 'galicia',
    nombre: 'Galicia',
    logoPath: 'logo_tarjeta_galicia_blanco.svg',
    colorPrimario: '#FF8C00',
    colorTexto: 'white',
    gradiente: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
  },
]

/** Busca una CardBrandDefinition por id. */
export function getCardBrandById(id: string): CardBrandDefinition | undefined {
  return CARD_BRANDS.find((c) => c.id === id)
}

/** Busca una CardBrandDefinition por nombre (parcial, case-insensitive). */
export function findCardBrandByNombre(nombre: string): CardBrandDefinition | undefined {
  const lower = nombre.toLowerCase().trim()
  return CARD_BRANDS.find(
    (c) =>
      lower.includes(c.nombre.toLowerCase()) ||
      c.nombre.toLowerCase().includes(lower) ||
      // Aliases comunes
      (c.id === 'amex' && (lower.includes('amex') || lower.includes('american'))) ||
      (c.id === 'naranja' && lower.includes('naranja'))
  )
}
