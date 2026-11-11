import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CLAVE_IDS_SONADOS,
  CLAVE_PREFERENCIA,
  CLAVE_ULTIMA_ENTRADA,
  CLAVE_ULTIMO_SONIDO,
  agregarIds,
  debeSonarAlEntrar,
  esRegresoLargo,
  guardarPreferenciaSonido,
  leerIds,
  leerNumero,
  leerPreferenciaSonido,
  separacionCumplida,
  sonarAlEntrar,
  sonarPendiente,
  sonarPorAvisosNuevos,
  type AlmacenSimple,
  type DependenciasSonido,
} from './sonidoAvisos'

const AHORA = 1_800_000_000_000
const MINUTO_MS = 60 * 1000

function crearAlmacenFalso(inicial: Record<string, string> = {}): AlmacenSimple & {
  datos: Map<string, string>
} {
  const datos = new Map<string, string>(Object.entries(inicial))
  return {
    datos,
    getItem(clave: string): string | null {
      return datos.has(clave) ? (datos.get(clave) ?? null) : null
    },
    setItem(clave: string, valor: string): void {
      datos.set(clave, valor)
    },
  }
}

function crearReproductorFalso(resultado = true): {
  reproducir: () => Promise<boolean>
  llamadas: () => number
} {
  let llamadas = 0
  return {
    reproducir: async () => {
      llamadas += 1
      return resultado
    },
    llamadas: () => llamadas,
  }
}

function recolectarTs(dir: string): string[] {
  const archivos: string[] = []
  const entradas = fs.readdirSync(dir, { withFileTypes: true })
  for (const entrada of entradas) {
    const ruta = path.join(dir, entrada.name)
    if (entrada.isDirectory()) {
      archivos.push(...recolectarTs(ruta))
    } else if (entrada.isFile() && (entrada.name.endsWith('.ts') || entrada.name.endsWith('.tsx'))) {
      archivos.push(ruta)
    }
  }
  return archivos
}

describe('sonidoAvisos', () => {
  it('preferencia: por defecto prendida, apagada solo con "no", y error = prendida', () => {
    expect(leerPreferenciaSonido(null)).toBe(true)
    expect(leerPreferenciaSonido(crearAlmacenFalso())).toBe(true)
    expect(leerPreferenciaSonido(crearAlmacenFalso({ [CLAVE_PREFERENCIA]: 'no' }))).toBe(false)
    expect(leerPreferenciaSonido(crearAlmacenFalso({ [CLAVE_PREFERENCIA]: 'si' }))).toBe(true)
    expect(leerPreferenciaSonido(crearAlmacenFalso({ [CLAVE_PREFERENCIA]: 'cualquier' }))).toBe(true)

    const almacenConError: AlmacenSimple = {
      getItem() {
        throw new Error('storage bloqueado')
      },
      setItem() {},
    }
    expect(leerPreferenciaSonido(almacenConError)).toBe(true)
  })

  it('guardar preferencia escribe si/no y nunca tira error', () => {
    const almacen = crearAlmacenFalso()
    guardarPreferenciaSonido(almacen, false)
    expect(almacen.getItem(CLAVE_PREFERENCIA)).toBe('no')

    guardarPreferenciaSonido(almacen, true)
    expect(almacen.getItem(CLAVE_PREFERENCIA)).toBe('si')

    const almacenConError: AlmacenSimple = {
      getItem() {
        return null
      },
      setItem() {
        throw new Error('cuota llena')
      },
    }
    expect(() => guardarPreferenciaSonido(almacenConError, false)).not.toThrow()
    expect(() => guardarPreferenciaSonido(null, true)).not.toThrow()
  })

  it('entrada: solo con no leídas y cada 30 minutos', () => {
    expect(debeSonarAlEntrar(0, AHORA, null)).toBe(false)
    expect(debeSonarAlEntrar(2, AHORA, null)).toBe(true)
    expect(debeSonarAlEntrar(2, AHORA, AHORA - 29 * MINUTO_MS)).toBe(false)
    expect(debeSonarAlEntrar(2, AHORA, AHORA - 30 * MINUTO_MS)).toBe(true)
    expect(debeSonarAlEntrar(2, AHORA, AHORA + 5000)).toBe(true)
  })

  it('separación mínima de 3 segundos', () => {
    expect(separacionCumplida(AHORA, null)).toBe(true)
    expect(separacionCumplida(AHORA, AHORA - 2999)).toBe(false)
    expect(separacionCumplida(AHORA, AHORA - 3000)).toBe(true)
    expect(separacionCumplida(AHORA, AHORA + 1000)).toBe(true)
  })

  it('ids: sin repetir y como mucho 200', () => {
    expect(agregarIds(['a'], ['a', 'b', 'b'])).toEqual(['a', 'b'])

    const iniciales = Array.from({ length: 199 }, (_, i) => `x${i}`)
    const resultado = agregarIds(iniciales, ['y1', 'y2'])
    expect(resultado).toHaveLength(200)
    expect(resultado[0]).toBe('x1')
    expect(resultado[resultado.length - 1]).toBe('y2')
  })

  it('leer ids y números aguanta basura', () => {
    expect(leerIds(crearAlmacenFalso({ [CLAVE_IDS_SONADOS]: 'no-json' }))).toEqual([])
    expect(leerIds(crearAlmacenFalso({ [CLAVE_IDS_SONADOS]: '{"a":1}' }))).toEqual([])
    expect(leerIds(crearAlmacenFalso({ [CLAVE_IDS_SONADOS]: '["a",2,"b",null]' }))).toEqual([
      'a',
      'b',
    ])

    expect(leerNumero(crearAlmacenFalso({ clave: 'abc' }), 'clave')).toBeNull()
    expect(leerNumero(crearAlmacenFalso({ clave: '123' }), 'clave')).toBe(123)
    expect(leerNumero(crearAlmacenFalso(), 'clave')).toBeNull()
  })

  it('aviso nuevo: suena una sola vez por tanda y registra todo', async () => {
    const almacen = crearAlmacenFalso()
    const rep = crearReproductorFalso(true)
    let reloj = AHORA
    const dep: DependenciasSonido = {
      almacen,
      ahora: () => reloj,
      reproducir: rep.reproducir,
    }

    const r1 = await sonarPorAvisosNuevos(dep, ['n1', 'n2', 'n3'])
    expect(r1).toBe('sono')
    expect(rep.llamadas()).toBe(1)
    expect(leerIds(almacen)).toEqual(['n1', 'n2', 'n3'])
    expect(almacen.getItem(CLAVE_ULTIMO_SONIDO)).toBe(String(AHORA))

    reloj = AHORA + 10_000
    const r2 = await sonarPorAvisosNuevos(dep, ['n2'])
    expect(r2).toBe('no')
    expect(rep.llamadas()).toBe(1)
  })

  it('aviso nuevo: apagado no suena pero registra; bloqueado no marca último sonido', async () => {
    const almacenApagado = crearAlmacenFalso({ [CLAVE_PREFERENCIA]: 'no' })
    const repApagado = crearReproductorFalso(true)
    const rApagado = await sonarPorAvisosNuevos(
      { almacen: almacenApagado, ahora: () => AHORA, reproducir: repApagado.reproducir },
      ['p1']
    )
    expect(rApagado).toBe('no')
    expect(repApagado.llamadas()).toBe(0)
    expect(leerIds(almacenApagado)).toContain('p1')

    const almacenBloq = crearAlmacenFalso()
    const repBloq = crearReproductorFalso(false)
    const rBloq = await sonarPorAvisosNuevos(
      { almacen: almacenBloq, ahora: () => AHORA, reproducir: repBloq.reproducir },
      ['q1']
    )
    expect(rBloq).toBe('bloqueado')
    expect(leerIds(almacenBloq)).toContain('q1')
    expect(almacenBloq.getItem(CLAVE_ULTIMO_SONIDO)).toBeNull()
  })

  it('entrada: suena, no repite antes de 30 minutos, bloqueado no marca', async () => {
    const almacen = crearAlmacenFalso()
    const rep = crearReproductorFalso(true)
    let reloj = AHORA
    const dep: DependenciasSonido = {
      almacen,
      ahora: () => reloj,
      reproducir: rep.reproducir,
    }

    expect(await sonarAlEntrar(dep, 0)).toBe('no')
    expect(await sonarAlEntrar(dep, 3)).toBe('sono')
    expect(almacen.getItem(CLAVE_ULTIMA_ENTRADA)).toBe(String(AHORA))

    reloj = AHORA + 10 * MINUTO_MS
    expect(await sonarAlEntrar(dep, 3)).toBe('no')

    reloj = AHORA + 31 * MINUTO_MS
    expect(await sonarAlEntrar(dep, 3)).toBe('sono')

    const almacenSeparacion = crearAlmacenFalso({
      [CLAVE_ULTIMO_SONIDO]: String(AHORA - 1000),
    })
    expect(
      await sonarAlEntrar(
        {
          almacen: almacenSeparacion,
          ahora: () => AHORA,
          reproducir: crearReproductorFalso(true).reproducir,
        },
        3
      )
    ).toBe('no')

    const almacenBloq = crearAlmacenFalso()
    const rBloq = await sonarAlEntrar(
      {
        almacen: almacenBloq,
        ahora: () => AHORA,
        reproducir: crearReproductorFalso(false).reproducir,
      },
      3
    )
    expect(rBloq).toBe('bloqueado')
    expect(almacenBloq.getItem(CLAVE_ULTIMA_ENTRADA)).toBeNull()
  })

  it('pendiente: vale 2 minutos y solo con no leídas', async () => {
    const depVigente = () => ({
      almacen: crearAlmacenFalso(),
      ahora: () => AHORA,
      reproducir: crearReproductorFalso(true).reproducir,
    })

    expect(
      await sonarPendiente(depVigente(), { pedidoEn: AHORA - 60 * 1000, tipo: 'entrada' }, 2)
    ).toBe('sono')

    const repVencido = crearReproductorFalso(true)
    expect(
      await sonarPendiente(
        { almacen: crearAlmacenFalso(), ahora: () => AHORA, reproducir: repVencido.reproducir },
        { pedidoEn: AHORA - 3 * 60 * 1000, tipo: 'entrada' },
        2
      )
    ).toBe('no')
    expect(repVencido.llamadas()).toBe(0)

    expect(
      await sonarPendiente(depVigente(), { pedidoEn: AHORA - 60 * 1000, tipo: 'nuevo' }, 0)
    ).toBe('no')

    expect(
      await sonarPendiente(depVigente(), { pedidoEn: AHORA - 60 * 1000, tipo: 'nuevo' }, 1)
    ).toBe('sono')

    expect(await sonarPendiente(depVigente(), null, 2)).toBe('no')

    expect(
      await sonarPendiente(
        {
          almacen: crearAlmacenFalso({ [CLAVE_PREFERENCIA]: 'no' }),
          ahora: () => AHORA,
          reproducir: crearReproductorFalso(true).reproducir,
        },
        { pedidoEn: AHORA - 60 * 1000, tipo: 'entrada' },
        2
      )
    ).toBe('no')
  })

  it('regreso largo: desde 30 minutos', () => {
    expect(esRegresoLargo(null, AHORA)).toBe(false)
    expect(esRegresoLargo(AHORA - 29 * MINUTO_MS, AHORA)).toBe(false)
    expect(esRegresoLargo(AHORA - 30 * MINUTO_MS, AHORA)).toBe(true)
  })

  it('estático: solo reproductorAvisos toca el audio y el contexto usa la lógica', () => {
    const esteArchivo = fileURLToPath(import.meta.url)
    const dirActual = path.dirname(esteArchivo)
    const dirSrc = path.resolve(dirActual, '..')
    const raizRepo = path.resolve(dirActual, '../..')

    const archivosSrc = recolectarTs(dirSrc)
    const infraccionesAudio: string[] = []

    for (const absPath of archivosSrc) {
      if (path.resolve(absPath) === path.resolve(esteArchivo)) continue
      const relPath = path.relative(raizRepo, absPath).replace(/\\/g, '/')
      if (relPath === 'src/services/reproductorAvisos.ts') continue

      const contenido = fs.readFileSync(absPath, 'utf-8')
      if (contenido.includes('AudioContext') || contenido.includes('new Audio(')) {
        infraccionesAudio.push(relPath)
      }
    }

    expect(infraccionesAudio).toEqual([])

    const rutaContexto = path.join(dirSrc, 'context', 'NotificacionContext.tsx')
    const codigoContexto = fs.readFileSync(rutaContexto, 'utf-8')
    expect(codigoContexto).toContain('sonarPorAvisosNuevos(')
    expect(codigoContexto).toContain('sonarAlEntrar(')
    expect(codigoContexto).toContain('instalarDesbloqueo(')

    const rutaMp3 = path.join(raizRepo, 'public', 'sonidos', 'aviso.mp3')
    expect(fs.existsSync(rutaMp3)).toBe(true)
    expect(fs.statSync(rutaMp3).size).toBe(12897)
  })

  it('escenas de uso S1 a S9', async () => {
    const almacen = crearAlmacenFalso()
    const rep = crearReproductorFalso(true)
    let reloj = AHORA
    const dep: DependenciasSonido = {
      almacen,
      ahora: () => reloj,
      reproducir: rep.reproducir,
    }

    // S1: entrar con 0 no leídas
    expect(await sonarAlEntrar(dep, 0)).toBe('no')
    // S2: entrar con 3 no leídas
    expect(await sonarAlEntrar(dep, 3)).toBe('sono')
    // S3: volver a entrar a los 10 minutos
    reloj = AHORA + 10 * MINUTO_MS
    expect(await sonarAlEntrar(dep, 3)).toBe('no')
    // S4: volver a entrar a los 31 minutos
    reloj = AHORA + 31 * MINUTO_MS
    expect(await sonarAlEntrar(dep, 3)).toBe('sono')
    // S5: llegan juntos ['a','b','c'] a los 36 minutos
    reloj = AHORA + 36 * MINUTO_MS
    expect(await sonarPorAvisosNuevos(dep, ['a', 'b', 'c'])).toBe('sono')
    expect(rep.llamadas()).toBe(3)
    // S6: 'b' llega a la otra pestaña 4 segundos después
    reloj = AHORA + 36 * MINUTO_MS + 4000
    expect(await sonarPorAvisosNuevos(dep, ['b'])).toBe('no')
    expect(rep.llamadas()).toBe(3)
    // S7: preferencia apagada y llega 'd' a los 40 minutos
    reloj = AHORA + 40 * MINUTO_MS
    guardarPreferenciaSonido(almacen, false)
    expect(await sonarPorAvisosNuevos(dep, ['d'])).toBe('no')
    expect(rep.llamadas()).toBe(3)
    expect(leerIds(almacen)).toContain('d')

    // S8: arranque bloqueado y desbloqueo dentro de 1 minuto
    const almacenS8 = crearAlmacenFalso()
    let relojS8 = AHORA
    expect(
      await sonarAlEntrar(
        {
          almacen: almacenS8,
          ahora: () => relojS8,
          reproducir: crearReproductorFalso(false).reproducir,
        },
        2
      )
    ).toBe('bloqueado')
    relojS8 = AHORA + 1 * MINUTO_MS
    expect(
      await sonarPendiente(
        {
          almacen: almacenS8,
          ahora: () => relojS8,
          reproducir: crearReproductorFalso(true).reproducir,
        },
        { pedidoEn: AHORA, tipo: 'entrada' },
        2
      )
    ).toBe('sono')

    // S9: arranque bloqueado y desbloqueo vencido a los 3 minutos
    const almacenS9 = crearAlmacenFalso()
    let relojS9 = AHORA
    expect(
      await sonarAlEntrar(
        {
          almacen: almacenS9,
          ahora: () => relojS9,
          reproducir: crearReproductorFalso(false).reproducir,
        },
        2
      )
    ).toBe('bloqueado')
    relojS9 = AHORA + 3 * MINUTO_MS
    expect(
      await sonarPendiente(
        {
          almacen: almacenS9,
          ahora: () => relojS9,
          reproducir: crearReproductorFalso(true).reproducir,
        },
        { pedidoEn: AHORA, tipo: 'entrada' },
        2
      )
    ).toBe('no')
  })
})
