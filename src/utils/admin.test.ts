import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  tiempoRelativo,
  tiempoHasta,
  ordenarTareas,
  estadoCuentaVisual,
  etiquetaCanal,
  rangoPagina,
  formatearCantidad,
  textoIntent,
  inicialesDe,
  estadoVisual,
  explicacionEstado,
} from './admin'

const AHORA = new Date('2026-11-09T15:00:00Z')

describe('Helpers de administración', () => {
  it('T1 tiempoRelativo formatea fechas relativas en Argentina', () => {
    expect(tiempoRelativo(null, AHORA)).toBe('Nunca')
    expect(tiempoRelativo('2026-11-09T14:59:30Z', AHORA)).toBe('Recién')
    expect(tiempoRelativo('2026-11-09T15:10:00Z', AHORA)).toBe('Recién')
    expect(tiempoRelativo('2026-11-09T14:55:00Z', AHORA)).toBe('Hace 5 min')
    expect(tiempoRelativo('2026-11-09T13:00:00Z', AHORA)).toBe('Hace 2 h')
    expect(tiempoRelativo('2026-11-09T03:30:00Z', AHORA)).toBe('Hace 11 h')
    expect(tiempoRelativo('2026-11-09T02:59:00Z', AHORA)).toBe('Ayer, 23:59')
    expect(tiempoRelativo('2026-11-03T15:00:00Z', AHORA)).toBe('03/11')
    expect(tiempoRelativo('2025-12-31T15:00:00Z', AHORA)).toBe('31/12/2025')
  })

  it('T2 tiempoHasta formatea próximas corridas en Argentina', () => {
    expect(tiempoHasta(null, AHORA)).toBe('—')
    expect(tiempoHasta('2026-11-09T14:00:00Z', AHORA)).toBe('Ahora')
    expect(tiempoHasta('2026-11-09T15:00:30Z', AHORA)).toBe('En menos de 1 min')
    expect(tiempoHasta('2026-11-09T15:12:00Z', AHORA)).toBe('En 12 min')
    expect(tiempoHasta('2026-11-09T17:00:00Z', AHORA)).toBe('En 2 h')
    expect(tiempoHasta('2026-11-09T16:12:00Z', AHORA)).toBe('En 1 h 12 min')
    expect(tiempoHasta('2026-11-10T16:00:00Z', AHORA)).toBe('10/11 13:00')
  })

  it('T3 ordenarTareas prioriza problemas y ordena alfabéticamente sin mutar', () => {
    const entrada = [
      { estado: 'Al día', nombre: 'B' },
      { estado: 'Falló', nombre: 'Z' },
      { estado: 'Sin datos', nombre: 'C' },
      { estado: 'Atrasado', nombre: 'A' },
      { estado: 'Al día', nombre: 'Á' },
    ]
    const copiaOriginal = entrada.map((item) => ({ ...item }))
    const ordenadas = ordenarTareas(entrada)
    expect(ordenadas.map((item) => item.nombre)).toEqual(['Z', 'A', 'C', 'Á', 'B'])
    expect(entrada).toEqual(copiaOriginal)
  })

  it('T4 estadoCuentaVisual devuelve texto y tono exactos', () => {
    expect(estadoCuentaVisual('activa')).toEqual({ texto: 'Activa', tono: 'bien' })
    expect(estadoCuentaVisual('suspendida')).toEqual({ texto: 'Suspendida', tono: 'mal' })
    expect(estadoCuentaVisual('sin_verificar')).toEqual({
      texto: 'Sin verificar el mail',
      tono: 'aviso',
    })
  })

  it('T5 etiquetaCanal devuelve nombre legible del canal', () => {
    expect(etiquetaCanal('web')).toBe('Web')
    expect(etiquetaCanal('whatsapp')).toBe('WhatsApp')
    expect(etiquetaCanal(null)).toBe('')
  })

  it('T6 rangoPagina formatea rangos paginados y cero', () => {
    expect(rangoPagina(1, 20, 37)).toBe('1–20 de 37')
    expect(rangoPagina(2, 20, 37)).toBe('21–37 de 37')
    expect(rangoPagina(1, 20, 0)).toBe('0 de 0')
  })

  it('T7 formatearCantidad y textoIntent formatean cantidades y claves', () => {
    expect(formatearCantidad(1000)).toBe('1.000')
    expect(formatearCantidad(340)).toBe('340')
    expect(formatearCantidad(0)).toBe('0')
    expect(textoIntent('registrar_transaccion')).toBe('Registrar transaccion')
    expect(textoIntent('no_mezclar_transferencias')).toBe('No mezclar transferencias')
    expect(textoIntent(null)).toBe('—')
    expect(textoIntent('')).toBe('—')
  })

  it('T8 inicialesDe extrae iniciales con respaldo', () => {
    expect(inicialesDe('Ángela', 'Periolo', 'x@y.com')).toBe('ÁP')
    expect(inicialesDe('mauro', 'romagnoli', null)).toBe('MR')
    expect(inicialesDe('Lucía', null, null)).toBe('L')
    expect(inicialesDe(null, null, 'demo@argentum.com')).toBe('D')
    expect(inicialesDe(null, null, null)).toBe('?')
  })

  it('T9 estadoVisual y explicacionEstado cubren los 7 estados', () => {
    expect(estadoVisual('activo')).toEqual({ texto: 'Activo', tono: 'bien' })
    expect(estadoVisual('nuevo')).toEqual({ texto: 'Nuevo', tono: 'info' })
    expect(estadoVisual('poco_uso')).toEqual({ texto: 'Poco uso', tono: 'aviso' })
    expect(estadoVisual('en_desuso')).toEqual({ texto: 'En desuso', tono: 'apagado' })
    expect(estadoVisual('sin_empezar')).toEqual({ texto: 'Sin empezar', tono: 'aviso' })
    expect(estadoVisual('suspendida')).toEqual({ texto: 'Suspendida', tono: 'mal' })
    expect(estadoVisual('sin_verificar')).toEqual({ texto: 'Mail sin verificar', tono: 'aviso' })

    expect(explicacionEstado('activo')).toBe('Usó la app en los últimos 7 días.')
    expect(explicacionEstado('nuevo')).toBe('Se registró hace 7 días o menos.')
    expect(explicacionEstado('poco_uso')).toBe('Entre 8 y 30 días sin usar la app.')
    expect(explicacionEstado('en_desuso')).toBe('Más de 30 días sin usar la app.')
    expect(explicacionEstado('sin_empezar')).toBe('No terminó el inicio de la app.')
    expect(explicacionEstado('suspendida')).toBe('No puede entrar a la app.')
    expect(explicacionEstado('sin_verificar')).toBe('No confirmó su mail.')
  })

  it('T10 solo AvatarUsuario renderiza <img> en admin con no-referrer y onError', () => {
    const adminDir = path.resolve(__dirname, '../pages/admin')
    const archivosConImg: string[] = []
    const recorrer = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        const st = statSync(full)
        if (st.isDirectory()) {
          recorrer(full)
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry)) {
          const txt = readFileSync(full, 'utf-8')
          if (txt.includes('<img')) {
            archivosConImg.push(path.relative(adminDir, full).replace(/\\/g, '/'))
          }
        }
      }
    }
    recorrer(adminDir)

    expect(archivosConImg).toEqual(['usuarios/AvatarUsuario.tsx'])
    const avatarTxt = readFileSync(path.join(adminDir, 'usuarios/AvatarUsuario.tsx'), 'utf-8')
    expect(avatarTxt).toContain('referrerPolicy="no-referrer"')
    expect(avatarTxt).toContain('onError')
  })
})
