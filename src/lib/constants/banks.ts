// ─── Catálogo de bancos / billeteras de Argentina ────────────────────────────

export interface BankDefinition {
  id: string
  nombre: string
  tipo: 'billetera_virtual' | 'banco_digital' | 'banco_tradicional' | 'efectivo'
  colorPrimario: string
  colorTexto: 'white' | '#111'
  /** Nombre del archivo dentro de src/assets/banks/ */
  logoPath: string
  /** Gradiente CSS para la card principal (opcional) */
  gradiente?: string
}

export const BANKS: BankDefinition[] = [
  // ── Billeteras virtuales ───────────────────────────────────────────────────
  {
    id: 'mercadopago',
    nombre: 'Mercado Pago',
    tipo: 'billetera_virtual',
    colorPrimario: '#009EE3',
    colorTexto: 'white',
    logoPath: 'mercadopago.svg',
  },
  {
    id: 'uala',
    nombre: 'Ualá',
    tipo: 'billetera_virtual',
    colorPrimario: '#5C2D91',
    colorTexto: 'white',
    logoPath: 'uala.svg',
  },
  {
    id: 'naranjax',
    nombre: 'Naranja X',
    tipo: 'billetera_virtual',
    colorPrimario: '#FF6200',
    colorTexto: 'white',
    logoPath: 'naranjax.svg',
  },
  {
    id: 'personalpay',
    nombre: 'Personal Pay',
    tipo: 'billetera_virtual',
    colorPrimario: '#6A0DAD',
    colorTexto: 'white',
    logoPath: 'personalpay.svg',
  },
  {
    id: 'prex',
    nombre: 'Prex',
    tipo: 'billetera_virtual',
    colorPrimario: '#FF3366',
    colorTexto: 'white',
    logoPath: 'prex.svg',
  },
  {
    id: 'paypal',
    nombre: 'PayPal',
    tipo: 'billetera_virtual',
    colorPrimario: '#003087',
    colorTexto: 'white',
    logoPath: 'paypal.svg',
  },


  // ── Bancos digitales ───────────────────────────────────────────────────────
  {
    id: 'brubank',
    nombre: 'Brubank',
    tipo: 'banco_digital',
    colorPrimario: '#00C9B1',
    colorTexto: 'white',
    logoPath: 'brubank.svg',
  },
  {
    id: 'lemon',
    nombre: 'Lemon',
    tipo: 'banco_digital',
    colorPrimario: '#C6F135',
    colorTexto: '#111',
    logoPath: 'lemon.svg',
  },
  {
    id: 'cuentadni',
    nombre: 'Cuenta DNI',
    tipo: 'banco_digital',
    colorPrimario: '#004B9D',
    colorTexto: 'white',
    logoPath: 'cuantadni.svg',   // nombre real en assets
  },

  // ── Bancos tradicionales ───────────────────────────────────────────────────
  {
    id: 'galicia',
    nombre: 'Galicia',
    tipo: 'banco_tradicional',
    colorPrimario: '#FF8C00',
    colorTexto: 'white',
    logoPath: 'galicia.svg',
    gradiente: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
  },
  {
    id: 'santander',

    nombre: 'Santander',
    tipo: 'banco_tradicional',
    colorPrimario: '#EC0000',
    colorTexto: 'white',
    logoPath: 'santander.svg',
    gradiente: 'linear-gradient(135deg, #EC0000 0%, #B00000 100%)',
  },
  {
    id: 'bbva',
    nombre: 'BBVA',
    tipo: 'banco_tradicional',
    colorPrimario: '#004481',
    colorTexto: 'white',
    logoPath: 'bbva.svg',
    gradiente: 'linear-gradient(135deg, #004481 0%, #002D5C 100%)',
  },
  {
    id: 'macro',
    nombre: 'Macro',
    tipo: 'banco_tradicional',
    colorPrimario: '#F7A800',
    colorTexto: '#111',
    logoPath: 'macro.svg',
    gradiente: 'linear-gradient(135deg, #F7A800 0%, #D48C00 100%)',
  },
  {
    id: 'nacion',
    nombre: 'Banco Nación',
    tipo: 'banco_tradicional',
    colorPrimario: '#009B3A',
    colorTexto: 'white',
    logoPath: 'nacion.svg',
    gradiente: 'linear-gradient(135deg, #009B3A 0%, #006B28 100%)',
  },
  {
    id: 'provincia',
    nombre: 'Banco Provincia',
    tipo: 'banco_tradicional',
    colorPrimario: '#004B9D',
    colorTexto: 'white',
    logoPath: 'bancoprovincia.svg',  // nombre real en assets
  },
  {
    id: 'hipotecario',
    nombre: 'Banco Hipotecario',
    tipo: 'banco_tradicional',
    colorPrimario: '#003DA5',
    colorTexto: 'white',
    logoPath: 'hipotecario.svg',
  },
  {
    id: 'icbc',
    nombre: 'ICBC',
    tipo: 'banco_tradicional',
    colorPrimario: '#C8102E',
    colorTexto: 'white',
    logoPath: 'icbc.svg',
  },
  {
    id: 'hsbc',
    nombre: 'HSBC',
    tipo: 'banco_tradicional',
    colorPrimario: '#DB0011',
    colorTexto: 'white',
    logoPath: 'hcbc.svg',   // nombre real en assets
  },
  {
    id: 'supervielle',
    nombre: 'Supervielle',
    tipo: 'banco_tradicional',
    colorPrimario: '#E4002B',
    colorTexto: 'white',
    logoPath: 'supraville.svg',  // nombre real en assets
  },
  {
    id: 'bancosantafe',
    nombre: 'Banco Santa Fe',
    tipo: 'banco_tradicional',
    colorPrimario: '#005BA1',
    colorTexto: 'white',
    logoPath: 'bancosantafe.svg',
  },
]

export const BANK_SECTIONS: { titulo: string; tipo: BankDefinition['tipo'] }[] = [
  { titulo: 'Billeteras virtuales', tipo: 'billetera_virtual' },
  { titulo: 'Bancos digitales',     tipo: 'banco_digital' },
  { titulo: 'Bancos tradicionales', tipo: 'banco_tradicional' },
]

/** Colores predefinidos para billeteras personalizadas ("Otra") */
export const CUSTOM_COLORS = [
  '#0D2045',   // primary
  '#1A3D28',   // secondary
  '#8A95A8',   // silver
  '#A8905A',   // gold
  '#00C9B1',   // teal
  '#5C2D91',   // purple
  '#EC0000',   // red
  '#009EE3',   // blue
]
