import { describe, it, expect, vi, afterEach } from 'vitest'
import { esPunteroFino } from './foco'

describe('Detección de puntero fino (esPunteroFino)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve true cuando matchMedia reporta matches true (escritorio)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: true,
    })))

    expect(esPunteroFino()).toBe(true)
  })

  it('devuelve false cuando matchMedia reporta matches false (pantalla táctil)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: false,
    })))

    expect(esPunteroFino()).toBe(false)
  })

  it('devuelve false cuando matchMedia no está presente', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(esPunteroFino()).toBe(false)
  })
})
