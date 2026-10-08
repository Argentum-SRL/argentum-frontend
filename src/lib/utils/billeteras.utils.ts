// ─── Helpers del módulo Billeteras ────────────────────────────────────────────

import { BANKS } from '@/lib/constants/banks'
import type { BankDefinition } from '@/lib/constants/banks'
import type { Billetera } from '@/types'

// Carga todos los logos de banks/ (SVG, PNG, etc.) como URLs estáticas via Vite glob import.
// La key resultante es la ruta relativa al módulo; se indexa por filename.
const _logoModules = import.meta.glob('@/assets/banks/*.{svg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const _logoMap: Record<string, string> = {}
for (const [path, url] of Object.entries(_logoModules)) {
  const filename = path.split('/').pop() ?? ''
  _logoMap[filename] = url
}

/** Devuelve la URL del SVG para un logoPath dado. Vacío si no existe. */
export function getBankLogoUrl(logoPath: string): string {
  return _logoMap[logoPath] ?? ''
}

/** Busca un BankDefinition por id. */
export function getBankById(bankId: string): BankDefinition | undefined {
  return BANKS.find((b) => b.id === bankId)
}

/**
 * Fallback: busca un banco por nombre cuando bank_id no está disponible.
 * Útil cuando el backend devuelve billeteras sin bank_id.
 * Usa coincidencia parcial case-insensitive.
 */
export function findBankByNombre(nombre: string): BankDefinition | undefined {
  const lower = nombre.toLowerCase().trim()
  return BANKS.find(
    (b) =>
      lower.includes(b.nombre.toLowerCase()) ||
      b.nombre.toLowerCase().includes(lower) ||
      // Aliases comunes
      (b.id === 'mercadopago' && lower.includes('mercado')) ||
      (b.id === 'nacion' && (lower.includes('naci') || lower.includes('bna'))) ||
      (b.id === 'provincia' && lower.includes('provi')) ||
      (b.id === 'cuentadni' && (lower.includes('dni') || lower.includes('cuenta'))) ||
      (b.id === 'arq' && (lower.includes('arq') || lower.includes('dolarapp')))
  )
}


/**
 * Formatea el input de saldo mientras el usuario escribe.
 * Normaliza comas como decimal, agrega puntos de miles.
 * Devuelve el número parseado.
 */
export function parseSaldoInput(raw: string): number {
  // Normalizar: reemplazar puntos de miles, coma decimal → punto
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(normalized)
  return isNaN(n) ? 0 : n
}

/** Formatea un número para mostrar en el input (puntos de miles) */
export function formatSaldoInput(monto: number): string {
  if (monto === 0) return ''
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(monto)
}

/** Calcula totales consolidados de las billeteras activas */
export function calcularTotales(
  billeteras: Billetera[],
  cotizacionUSD: number,
): {
  totalARS: number
  totalUSD: number
  equivalenteTotal: number
} {
  const activas = billeteras.filter((b) => b.estado === 'activa')
  const totalARS = activas
    .filter((b) => b.moneda === 'ARS')
    .reduce((acc, b) => acc + Number(b.saldo_actual), 0)
  const totalUSD = activas
    .filter((b) => b.moneda === 'USD')
    .reduce((acc, b) => acc + Number(b.saldo_actual), 0)
  const equivalenteTotal = totalARS + totalUSD * cotizacionUSD

  return { totalARS, totalUSD, equivalenteTotal }
}

/**
 * Devuelve las dos primeras letras del nombre para usar como fallback de logo.
 * "Banco Nación" → "BN"
 */
export function getInitials(nombre: string): string {
  if (nombre.trim().toUpperCase() === 'ARQ') {
    return 'ARQ'
  }
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Ordena una lista de billeteras según las reglas del sistema:
 * 1. La billetera principal siempre a la izquierda / primera de todo.
 * 2. Agrupadas por moneda (la moneda de la principal primero, luego otras).
 * 3. Dentro de cada grupo de moneda, de mayor a menor saldo.
 * 4. Desempate alfabético consistente por nombre.
 */
export function sortBilleteras(
  billeteras: Billetera[],
  monedaUsuarioFallback: string = 'ARS'
): Billetera[] {
  if (!billeteras || billeteras.length <= 1) return billeteras ? [...billeteras] : []

  const principal = billeteras.find((b) => b.es_principal)
  const monedaBase = principal?.moneda ?? monedaUsuarioFallback

  return [...billeteras].sort((a, b) => {
    // 1. La billetera principal siempre a la izquierda de todo
    if (a.es_principal && !b.es_principal) return -1
    if (!a.es_principal && b.es_principal) return 1

    // 2. Agrupar por moneda: primero la moneda de la principal (o fallback)
    const aPrioridad = a.moneda === monedaBase ? 0 : 1
    const bPrioridad = b.moneda === monedaBase ? 0 : 1
    if (aPrioridad !== bPrioridad) {
      return aPrioridad - bPrioridad
    }
    if (a.moneda !== b.moneda) {
      return a.moneda.localeCompare(b.moneda)
    }

    // 3. Dentro de cada grupo de moneda, ordenar de mayor a menor saldo
    const saldoA = Number(a.saldo_actual) || 0
    const saldoB = Number(b.saldo_actual) || 0
    const diffSaldo = saldoB - saldoA
    if (diffSaldo !== 0) {
      return diffSaldo
    }

    // 4. Fallback alfabético por nombre
    return a.nombre.localeCompare(b.nombre)
  })
}
