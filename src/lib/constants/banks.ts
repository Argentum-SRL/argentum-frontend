// ─── Catálogo de bancos / billeteras de Argentina ────────────────────────────

export interface BankDefinition {
  id: string
  nombre: string
  tipo: 'billetera_virtual' | 'banco_digital' | 'banco_tradicional' | 'plataforma_inversion' | 'efectivo'
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
    colorPrimario: '#FFFFFF',
    colorTexto: '#111',
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
    colorPrimario: '#A200FF',
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
  {
    id: 'cocos',
    nombre: 'Cocos',
    tipo: 'billetera_virtual',
    colorPrimario: '#14D883',
    colorTexto: '#111',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #14D883 0%, #0CB068 100%)',
  },
  {
    id: 'claropay',
    nombre: 'Claro Pay',
    tipo: 'billetera_virtual',
    colorPrimario: '#DA291C',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #DA291C 0%, #A61A0F 100%)',
  },
  {
    id: 'ieb',
    nombre: 'IEB+',
    tipo: 'billetera_virtual',
    colorPrimario: '#002F6C',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #002F6C 0%, #001B40 100%)',
  },
  {
    id: 'n1u',
    nombre: 'N1U',
    tipo: 'billetera_virtual',
    colorPrimario: '#6C5CE7',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)',
  },
  {
    id: 'astropay',
    nombre: 'Astropay',
    tipo: 'billetera_virtual',
    colorPrimario: '#FF2D55',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #FF2D55 0%, #C41638 100%)',
  },
  {
    id: 'letsbit',
    nombre: 'LetsBit',
    tipo: 'billetera_virtual',
    colorPrimario: '#7B2CBF',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%)',
  },
  {
    id: 'fiwind',
    nombre: 'Fiwind',
    tipo: 'billetera_virtual',
    colorPrimario: '#00D1B2',
    colorTexto: '#111',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #00D1B2 0%, #009E86 100%)',
  },

  // ── Bancos digitales ───────────────────────────────────────────────────────
  {
    id: 'brubank',
    nombre: 'Brubank',
    tipo: 'banco_digital',
    colorPrimario: '#6A0DAD',
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
    colorPrimario: '#00C9B1',
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
    colorPrimario: '#0066CC',
    colorTexto: 'white',
    logoPath: 'macro.svg',
    gradiente: 'linear-gradient(135deg, #0066CC 0%, #004C99 100%)',
  },
  {
    id: 'nacion',
    nombre: 'Banco Nación',
    tipo: 'banco_tradicional',
    colorPrimario: '#4682B4',
    colorTexto: 'white',
    logoPath: 'nacion.svg',
    gradiente: 'linear-gradient(135deg, #4682B4 0%, #315F86 100%)',
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
    colorPrimario: '#6B8E23',
    colorTexto: 'white',
    logoPath: 'bancosantafe.svg',
  },
  {
    id: 'credicoop',
    nombre: 'Banco Credicoop',
    tipo: 'banco_tradicional',
    colorPrimario: '#005696',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #005696 0%, #003660 100%)',
  },

  // ── Plataformas de inversión ───────────────────────────────────────────────
  {
    id: 'balanz',
    nombre: 'Balanz',
    tipo: 'plataforma_inversion',
    colorPrimario: '#004A8F',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #004A8F 0%, #002D5C 100%)',
  },
  {
    id: 'iol',
    nombre: 'IOL (InvertirOnline)',
    tipo: 'plataforma_inversion',
    colorPrimario: '#00A3E0',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #00A3E0 0%, #0077A8 100%)',
  },
  {
    id: 'ppi',
    nombre: 'Portfolio Personal Inversiones',
    tipo: 'plataforma_inversion',
    colorPrimario: '#1E293B',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
  },
  {
    id: 'cohen',
    nombre: 'Cohen',
    tipo: 'plataforma_inversion',
    colorPrimario: '#1B365D',
    colorTexto: 'white',
    logoPath: '',
    gradiente: 'linear-gradient(135deg, #1B365D 0%, #0B1C33 100%)',
  },
]

export const BANK_SECTIONS: { titulo: string; tipo: BankDefinition['tipo'] }[] = [
  { titulo: 'Billeteras virtuales', tipo: 'billetera_virtual' },
  { titulo: 'Bancos digitales',     tipo: 'banco_digital' },
  { titulo: 'Bancos tradicionales', tipo: 'banco_tradicional' },
  { titulo: 'Plataformas de inversión', tipo: 'plataforma_inversion' },
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
