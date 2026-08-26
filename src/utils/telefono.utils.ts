/**
 * Utilidades para normalización y formateo de números de teléfono / WhatsApp.
 */

export interface CountryOption {
  codigo: string
  bandera: string
  nombre?: string
}

export const PAISES_DEFAULT: CountryOption[] = [
  { bandera: '🇦🇷', nombre: 'Argentina', codigo: '+54' },
  { bandera: '🇺🇾', nombre: 'Uruguay',   codigo: '+598' },
  { bandera: '🇧🇷', nombre: 'Brasil',    codigo: '+55' },
  { bandera: '🇨🇱', nombre: 'Chile',     codigo: '+56' },
  { bandera: '🇲🇽', nombre: 'México',    codigo: '+52' },
  { bandera: '🇪🇸', nombre: 'España',    codigo: '+34' },
  { bandera: '🇺🇸', nombre: 'EE.UU.',   codigo: '+1' },
]

/**
 * Construye el número en formato internacional E.164 estándar para WhatsApp.
 * Si es Argentina (+54), remueve 0/15 inicial y asegura el prefijo '9' para móviles.
 */
export function buildPhone(codigoPais: string, numeroRaw: string): string {
  if (!numeroRaw) return codigoPais
  let n = numeroRaw.replace(/\D/g, '') // solo dígitos

  if (codigoPais === '+54') {
    if (n.startsWith('54')) n = n.slice(2)
    if (n.startsWith('0')) n = n.slice(1)
    if (n.startsWith('15')) n = n.slice(2)
    if (!n.startsWith('9')) n = '9' + n
  }

  return `${codigoPais}${n}`
}

/**
 * Devuelve el número canónico de solo dígitos sin prefijos nacionales (ej: '1112345678').
 */
export function normalizarTelefono(telefono: string | null | undefined): string {
  if (!telefono) return ''
  let digitos = telefono.replace(/\D/g, '')
  if (digitos.startsWith('54')) digitos = digitos.slice(2)
  if (digitos.startsWith('9')) digitos = digitos.slice(1)
  if (digitos.startsWith('0')) digitos = digitos.slice(1)
  return digitos
}

/**
 * Desglosa un teléfono guardado en su código de país y número local para los inputs.
 */
export function desglosarTelefono(
  telefono: string | null | undefined,
  paises: CountryOption[] = PAISES_DEFAULT
): { codigoPais: string; numeroLocal: string } {
  if (!telefono) return { codigoPais: '+54', numeroLocal: '' }
  const clean = telefono.trim()

  for (const p of paises) {
    if (clean.startsWith(p.codigo)) {
      let num = clean.slice(p.codigo.length)
      if (p.codigo === '+54' && num.startsWith('9')) {
        num = num.slice(1) // Quitamos el 9 de visualización en el input para que el usuario escriba su cod de área
      }
      return { codigoPais: p.codigo, numeroLocal: num }
    }
  }

  return { codigoPais: '+54', numeroLocal: clean.replace(/^\+/, '') }
}

/**
 * Formatea un número guardado para visualización elegante en el perfil (ej: "+54 9 11 1234-5678").
 */
export function formatearTelefonoVisual(telefono: string | null | undefined): string {
  if (!telefono) return ''
  const clean = telefono.trim()

  // Si es número argentino con +549
  if (clean.startsWith('+549') || clean.startsWith('+54')) {
    const raw = clean.replace(/\D/g, '')
    if (raw.startsWith('549')) {
      const rest = raw.slice(3) // después del 549
      if (rest.length === 10) {
        // Ej: 11 2345 6789 o 341 234 5678
        const area = rest.length === 10 && rest.startsWith('11') ? rest.slice(0, 2) : rest.slice(0, 3)
        const middle = rest.length === 10 && rest.startsWith('11') ? rest.slice(2, 6) : rest.slice(3, 6)
        const end = rest.length === 10 && rest.startsWith('11') ? rest.slice(6) : rest.slice(6)
        return `+54 9 ${area} ${middle}-${end}`
      }
      return `+54 9 ${rest}`
    }
  }

  return clean
}
