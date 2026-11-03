/**
 * Mapeo y filtrado de códigos de íconos para movimientos.
 */

export interface IconoInfo {
  codigo: string
  nombre: string
}

export const MAPA_ICONOS: Record<string, string> = {
  credito: 'Con tarjeta de crédito',
  suscripcion: 'Débito automático',
  reintegro: 'Reintegro',
  devolucion: 'Te devolvieron parte del gasto',
  paso_por_mi_cuenta: 'Pasó por tu cuenta: no es gasto ni ingreso',
  inversion: 'Billetera de inversión: no cuenta',
}

/**
 * Devuelve los objetos { codigo, nombre } para cada código conocido,
 * filtrando cualquier código desconocido.
 */
export function iconosConNombre(codigos: string[]): IconoInfo[] {
  if (!codigos || !Array.isArray(codigos)) return []
  const resultado: IconoInfo[] = []
  for (const c of codigos) {
    const nombre = MAPA_ICONOS[c]
    if (nombre) {
      resultado.push({ codigo: c, nombre })
    }
  }
  return resultado
}

