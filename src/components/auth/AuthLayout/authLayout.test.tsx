import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as viewportModule from '@/hooks/useViewport'
import AuthLayout from './AuthLayout'

describe('AuthLayout — montaje único de children y ThemeToggle (FC1)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('con leftPanel en escritorio deja id="x-unico" una sola vez en el HTML', () => {
    vi.spyOn(viewportModule, 'useViewport').mockReturnValue({
      tipo: 'escritorio',
      esCelular: false,
      esTablet: false,
      esEscritorio: true,
    })
    const html = renderToStaticMarkup(
      <AuthLayout title="Ingresar" leftPanel={<div>Panel izquierdo</div>}>
        <input id="x-unico" />
      </AuthLayout>
    )
    const apariciones = html.match(/id="x-unico"/g) ?? []
    expect(apariciones).toHaveLength(1)
    expect(html).toContain('Panel izquierdo')
    // ThemeToggle también se monta una única vez
    const toggles = html.match(/aria-label="Cambiar a modo (?:oscuro|claro)"/g) ?? []
    expect(toggles).toHaveLength(1)
  })

  it('con leftPanel en celular deja id="x-unico" una sola vez en el HTML', () => {
    vi.spyOn(viewportModule, 'useViewport').mockReturnValue({
      tipo: 'celular',
      esCelular: true,
      esTablet: false,
      esEscritorio: false,
    })
    const html = renderToStaticMarkup(
      <AuthLayout title="Ingresar" leftPanel={<div>Panel izquierdo</div>}>
        <input id="x-unico" />
      </AuthLayout>
    )
    const apariciones = html.match(/id="x-unico"/g) ?? []
    expect(apariciones).toHaveLength(1)
    expect(html).not.toContain('Panel izquierdo')
    // ThemeToggle también se monta una única vez
    const toggles = html.match(/aria-label="Cambiar a modo (?:oscuro|claro)"/g) ?? []
    expect(toggles).toHaveLength(1)
  })

  it('sin leftPanel deja id="x-unico" una sola vez en el HTML', () => {
    vi.spyOn(viewportModule, 'useViewport').mockReturnValue({
      tipo: 'escritorio',
      esCelular: false,
      esTablet: false,
      esEscritorio: true,
    })
    const html = renderToStaticMarkup(
      <AuthLayout title="Verificar">
        <input id="x-unico" />
      </AuthLayout>
    )
    const apariciones = html.match(/id="x-unico"/g) ?? []
    expect(apariciones).toHaveLength(1)
    const toggles = html.match(/aria-label="Cambiar a modo (?:oscuro|claro)"/g) ?? []
    expect(toggles).toHaveLength(1)
  })
})
