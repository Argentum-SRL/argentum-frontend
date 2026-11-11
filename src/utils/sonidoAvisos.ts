// Lógica pura para decidir cuándo suena la campanita de avisos.
// Sin dependencias de window, document ni React para poder testearla en Node.

export const CLAVE_PREFERENCIA = 'argentum_sonido_avisos'
export const CLAVE_ULTIMA_ENTRADA = 'argentum_sonido_ultima_entrada'
export const CLAVE_ULTIMO_SONIDO = 'argentum_sonido_ultimo'
export const CLAVE_IDS_SONADOS = 'argentum_sonido_ids'

export const ESPERA_ENTRADA_MS = 30 * 60 * 1000
export const SEPARACION_MINIMA_MS = 3000
export const VENTANA_PENDIENTE_MS = 2 * 60 * 1000
export const MAX_IDS_GUARDADOS = 200

export interface AlmacenSimple {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
}

export type ResultadoSonido = 'sono' | 'bloqueado' | 'no'

export interface DependenciasSonido {
  almacen: AlmacenSimple | null
  ahora: () => number
  reproducir: () => Promise<boolean>
}

export interface SonidoPendiente {
  pedidoEn: number
  tipo: 'entrada' | 'nuevo'
}

// Escribe en el almacén protegiendo ante modo privado, cuota llena o almacén nulo.
function escribirEnAlmacen(almacen: AlmacenSimple | null, clave: string, valor: string): void {
  if (!almacen) return
  try {
    almacen.setItem(clave, valor)
  } catch {
    // Nunca propaga errores de almacenamiento
  }
}

// El sonido viene encendido por defecto; solo se apaga si se guardó exactamente 'no'.
export function leerPreferenciaSonido(almacen: AlmacenSimple | null): boolean {
  if (!almacen) return true
  try {
    return almacen.getItem(CLAVE_PREFERENCIA) !== 'no'
  } catch {
    return true
  }
}

// Guarda la preferencia del dispositivo ('si' o 'no') sin lanzar errores.
export function guardarPreferenciaSonido(almacen: AlmacenSimple | null, activo: boolean): void {
  escribirEnAlmacen(almacen, CLAVE_PREFERENCIA, activo ? 'si' : 'no')
}

// Lee un número entero guardado en el almacén; devuelve null si falta, es inválido o falla.
export function leerNumero(almacen: AlmacenSimple | null, clave: string): number | null {
  if (!almacen) return null
  try {
    const bruto = almacen.getItem(clave)
    if (!bruto) return null
    const limpio = bruto.trim()
    if (!/^-?\d+$/.test(limpio)) return null
    const numero = Number(limpio)
    return Number.isSafeInteger(numero) ? numero : null
  } catch {
    return null
  }
}

// Lee la lista de ids ya considerados; ignora JSON roto o elementos que no son texto.
export function leerIds(almacen: AlmacenSimple | null): string[] {
  if (!almacen) return []
  try {
    const bruto = almacen.getItem(CLAVE_IDS_SONADOS)
    if (!bruto) return []
    const parsed: unknown = JSON.parse(bruto)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

// Agrega al final los ids que no estaban (sin duplicar ni dentro de nuevos) y conserva como máximo MAX_IDS_GUARDADOS.
export function agregarIds(ids: string[], nuevos: string[]): string[] {
  const vistos = new Set<string>(ids)
  const acumulados = [...ids]

  for (const id of nuevos) {
    if (!vistos.has(id)) {
      vistos.add(id)
      acumulados.push(id)
    }
  }

  if (acumulados.length > MAX_IDS_GUARDADOS) {
    return acumulados.slice(-MAX_IDS_GUARDADOS)
  }

  return acumulados
}

// Al entrar solo suena si hay avisos sin leer y pasaron al menos 30 minutos desde la última entrada sonora (o si el reloj retrocedió).
export function debeSonarAlEntrar(
  noLeidas: number,
  ahora: number,
  ultimaEntrada: number | null
): boolean {
  return (
    noLeidas > 0 &&
    (ultimaEntrada === null ||
      ahora - ultimaEntrada >= ESPERA_ENTRADA_MS ||
      ahora < ultimaEntrada)
  )
}

// Evita ráfagas de sonidos dejando pasar al menos SEPARACION_MINIMA_MS entre reproducciones.
export function separacionCumplida(ahora: number, ultimoSonido: number | null): boolean {
  return (
    ultimoSonido === null ||
    ahora - ultimoSonido >= SEPARACION_MINIMA_MS ||
    ahora < ultimoSonido
  )
}

// Indica si la pestaña o app estuvo oculta el tiempo suficiente como para tratar el regreso como una nueva entrada.
export function esRegresoLargo(ocultoDesde: number | null, ahora: number): boolean {
  return ocultoDesde !== null && ahora - ocultoDesde >= ESPERA_ENTRADA_MS
}

// Un sonido pendiente por bloqueo de autoplay caduca a los 2 minutos y solo aplica si siguen quedando avisos sin leer.
export function pendienteVigente(
  pendiente: SonidoPendiente | null,
  ahora: number,
  noLeidas: number
): boolean {
  return (
    pendiente !== null &&
    noLeidas > 0 &&
    ahora >= pendiente.pedidoEn &&
    ahora - pendiente.pedidoEn <= VENTANA_PENDIENTE_MS
  )
}

// Reproduce la campanita como máximo una vez por tanda de avisos nuevos, registrando siempre los ids entre pestañas.
export async function sonarPorAvisosNuevos(
  dep: DependenciasSonido,
  ids: string[]
): Promise<ResultadoSonido> {
  const conocidos = leerIds(dep.almacen)
  const setConocidos = new Set<string>(conocidos)
  const setNuevos = new Set<string>()
  const nuevos: string[] = []

  for (const id of ids) {
    if (!setConocidos.has(id) && !setNuevos.has(id)) {
      setNuevos.add(id)
      nuevos.push(id)
    }
  }

  // Se guarda siempre para que otra pestaña abierta o una recarga no vuelva a sonar por los mismos avisos.
  const actualizados = agregarIds(conocidos, ids)
  escribirEnAlmacen(dep.almacen, CLAVE_IDS_SONADOS, JSON.stringify(actualizados))

  const ahoraMs = dep.ahora()
  const ultimoSonido = leerNumero(dep.almacen, CLAVE_ULTIMO_SONIDO)

  if (
    nuevos.length === 0 ||
    !leerPreferenciaSonido(dep.almacen) ||
    !separacionCumplida(ahoraMs, ultimoSonido)
  ) {
    return 'no'
  }

  const sono = await dep.reproducir()
  if (sono) {
    escribirEnAlmacen(dep.almacen, CLAVE_ULTIMO_SONIDO, String(ahoraMs))
    return 'sono'
  }

  return 'bloqueado'
}

// Registra ids en el almacén sin reproducir sonido (por ejemplo, la lista ya existente al iniciar sesión).
export function registrarIdsConocidos(dep: DependenciasSonido, ids: string[]): void {
  const conocidos = leerIds(dep.almacen)
  const actualizados = agregarIds(conocidos, ids)
  escribirEnAlmacen(dep.almacen, CLAVE_IDS_SONADOS, JSON.stringify(actualizados))
}

// Evalúa y reproduce el aviso sonoro de entrada cuando corresponde, marcando timestamps solo si sonó.
export async function sonarAlEntrar(
  dep: DependenciasSonido,
  noLeidas: number
): Promise<ResultadoSonido> {
  const ahoraMs = dep.ahora()
  const ultimaEntrada = leerNumero(dep.almacen, CLAVE_ULTIMA_ENTRADA)
  const ultimoSonido = leerNumero(dep.almacen, CLAVE_ULTIMO_SONIDO)

  if (
    !leerPreferenciaSonido(dep.almacen) ||
    !debeSonarAlEntrar(noLeidas, ahoraMs, ultimaEntrada) ||
    !separacionCumplida(ahoraMs, ultimoSonido)
  ) {
    return 'no'
  }

  const sono = await dep.reproducir()
  if (sono) {
    escribirEnAlmacen(dep.almacen, CLAVE_ULTIMA_ENTRADA, String(ahoraMs))
    escribirEnAlmacen(dep.almacen, CLAVE_ULTIMO_SONIDO, String(ahoraMs))
    return 'sono'
  }

  return 'bloqueado'
}

// Reintenta reproducir un sonido que quedó bloqueado por política de autoplay al primer gesto del usuario.
export async function sonarPendiente(
  dep: DependenciasSonido,
  pendiente: SonidoPendiente | null,
  noLeidas: number
): Promise<ResultadoSonido> {
  const ahoraMs = dep.ahora()

  if (
    !leerPreferenciaSonido(dep.almacen) ||
    !pendiente ||
    !pendienteVigente(pendiente, ahoraMs, noLeidas)
  ) {
    return 'no'
  }

  if (pendiente.tipo === 'entrada') {
    return sonarAlEntrar(dep, noLeidas)
  }

  const ultimoSonido = leerNumero(dep.almacen, CLAVE_ULTIMO_SONIDO)
  if (!separacionCumplida(ahoraMs, ultimoSonido)) {
    return 'no'
  }

  const sono = await dep.reproducir()
  if (sono) {
    escribirEnAlmacen(dep.almacen, CLAVE_ULTIMO_SONIDO, String(ahoraMs))
    return 'sono'
  }

  return 'bloqueado'
}

