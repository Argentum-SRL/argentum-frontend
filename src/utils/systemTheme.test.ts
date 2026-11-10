import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  SYSTEM_BAR_COLORS,
  getActiveSystemBarSurface,
  registerSystemBarSurface,
  resetSystemBarStateForTests,
  syncSystemBarsForTheme,
  updateSystemBars,
} from './systemTheme'

interface MockMeta {
  id: string
  attrs: Record<string, string>
  parentNode: { removeChild: (node: MockMeta) => void } | null
  setAttribute: (name: string, value: string) => void
  getAttribute: (name: string) => string | null
  hasAttribute: (name: string) => boolean
  removeAttribute: (name: string) => void
}

function createMockDocument(initialDark = false) {
  const metas: MockMeta[] = []
  const head = {
    appendChild(node: MockMeta) {
      node.parentNode = head
      metas.push(node)
    },
    removeChild(node: MockMeta) {
      const idx = metas.indexOf(node)
      if (idx !== -1) metas.splice(idx, 1)
      node.parentNode = null
    },
  }

  function makeMeta(initialAttrs: Record<string, string>): MockMeta {
    const attrs: Record<string, string> = { ...initialAttrs }
    const meta: MockMeta = {
      id: attrs.id ?? '',
      attrs,
      parentNode: head,
      setAttribute(name, value) {
        attrs[name] = value
        if (name === 'id') meta.id = value
      },
      getAttribute(name) {
        return name in attrs ? attrs[name] : null
      },
      hasAttribute(name) {
        return name in attrs
      },
      removeAttribute(name) {
        delete attrs[name]
      },
    }
    return meta
  }

  metas.push(
    makeMeta({ id: 'meta-color-scheme', name: 'color-scheme', content: 'light dark' }),
    makeMeta({ id: 'meta-apple-status-bar', name: 'apple-mobile-web-app-status-bar-style', content: 'default' }),
    makeMeta({ id: 'meta-theme-color-light', name: 'theme-color', content: '#FAF7F2', media: '(prefers-color-scheme: light)' }),
    makeMeta({ id: 'meta-theme-color-dark', name: 'theme-color', content: '#060B14', media: '(prefers-color-scheme: dark)' }),
  )

  const rootProps: Record<string, string> = {}
  const rootClasses = new Set<string>(initialDark ? ['dark'] : [])
  const rootAttrs: Record<string, string> = initialDark ? { 'data-theme': 'dark' } : {}

  const documentElement = {
    style: {
      backgroundColor: '',
      colorScheme: '',
      setProperty(name: string, val: string) {
        rootProps[name] = val
      },
      getPropertyValue(name: string) {
        return rootProps[name] ?? ''
      },
    },
    classList: {
      add: (cls: string) => rootClasses.add(cls),
      remove: (cls: string) => rootClasses.delete(cls),
      contains: (cls: string) => rootClasses.has(cls),
    },
    setAttribute: (name: string, value: string) => {
      rootAttrs[name] = value
    },
    getAttribute: (name: string) => rootAttrs[name] ?? null,
    removeAttribute: (name: string) => {
      delete rootAttrs[name]
    },
  }

  const body = {
    style: {
      backgroundColor: '',
    },
  }

  const mockDoc = {
    documentElement,
    body,
    head,
    getElementById: (id: string) => metas.find((m) => m.id === id) ?? null,
    querySelector: (selector: string) => {
      const match = selector.match(/^meta\[name="([^"]+)"\]$/)
      if (!match) return null
      return metas.find((m) => m.attrs.name === match[1]) ?? null
    },
    querySelectorAll: (selector: string) => {
      const match = selector.match(/^meta\[name="([^"]+)"\]$/)
      if (!match) return []
      return metas.filter((m) => m.attrs.name === match[1])
    },
    createElement: (tag: string) => {
      if (tag !== 'meta') throw new Error(`Unexpected tag ${tag}`)
      return makeMeta({})
    },
  }

  return { mockDoc, metas }
}

describe('systemTheme — sincronización de barras del sistema en móviles y PWAs', () => {
  beforeEach(() => {
    resetSystemBarStateForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetSystemBarStateForTests()
  })

  it('alinea los colores base de app exactamente con --page en index.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css')
    const css = fs.readFileSync(cssPath, 'utf-8')

    expect(css).toContain(`--page: ${SYSTEM_BAR_COLORS.app.light};`)
    expect(css).toContain(`--page: ${SYSTEM_BAR_COLORS.app.dark};`)
    expect(css).toContain(`--lunar-bg: ${SYSTEM_BAR_COLORS.loading.light};`)
    expect(css).toContain(`--lunar-bg: ${SYSTEM_BAR_COLORS.loading.dark};`)
  })

  it('consolida etiquetas meta theme-color, elimina media queries obsoletas y preserva status bar default', () => {
    const { mockDoc, metas } = createMockDocument(true)
    vi.stubGlobal('document', mockDoc)

    updateSystemBars('#060B14', true)

    const themeMetas = metas.filter((m) => m.attrs.name === 'theme-color')
    expect(themeMetas).toHaveLength(1)
    expect(themeMetas[0].attrs.content).toBe('#060B14')
    expect(themeMetas[0].hasAttribute('media')).toBe(false)

    expect(mockDoc.documentElement.style.getPropertyValue('--system-bar-bg')).toBe('#060B14')
    expect(mockDoc.documentElement.style.backgroundColor).toBe('#060B14')
    expect(mockDoc.body.style.backgroundColor).toBe('#060B14')
    expect(mockDoc.documentElement.style.colorScheme).toBe('dark')
    expect(mockDoc.getElementById('meta-color-scheme')?.getAttribute('content')).toBe('dark')
    expect(mockDoc.getElementById('meta-apple-status-bar')?.getAttribute('content')).toBe('default')
  })

  it('resuelve colisiones padre/hijo mediante pila LIFO y respeta la superficie activa al alternar tema', () => {
    const { mockDoc, metas } = createMockDocument(true)
    vi.stubGlobal('document', mockDoc)

    expect(getActiveSystemBarSurface()).toBe('app')

    // Child LunarLoading monta primero en dark mode (antes que el layout del padre)
    const unregisterLoading = registerSystemBarSurface('loading')
    expect(getActiveSystemBarSurface()).toBe('loading')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#060B14')

    // ThemeProvider padre sincroniza sin sobreescribir el loader activo
    syncSystemBarsForTheme(true)
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#060B14')

    // Fondo atmosférico encima del stack -> usa #020408
    const unregisterAtmos = registerSystemBarSurface('atmospheric')
    expect(getActiveSystemBarSurface()).toBe('atmospheric')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#020408')

    // El usuario alterna a modo claro mientras el fondo atmosférico está activo -> #FAF4EC
    syncSystemBarsForTheme(false)
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#FAF4EC')
    expect(mockDoc.getElementById('meta-apple-status-bar')?.getAttribute('content')).toBe('default')

    // Al desmontar fondo atmosférico vuelve al loader en modo claro -> #FAF7F2
    unregisterAtmos()
    expect(getActiveSystemBarSurface()).toBe('loading')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#FAF7F2')

    // Al desmontar loader vuelve a la app principal en modo claro -> --page (#F5F4F0)
    unregisterLoading()
    expect(getActiveSystemBarSurface()).toBe('app')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#F5F4F0')

    // Alternar nuevamente a modo oscuro en app -> --page (#0E1117)
    syncSystemBarsForTheme(true)
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#0E1117')
  })

  it('index.html no bloquea colores con !important ni alterna a black-translucent', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html')
    const html = fs.readFileSync(htmlPath, 'utf-8')

    expect(html).not.toContain('#060B14 !important')
    expect(html).not.toContain('black-translucent')
    expect(html).toContain('--system-bar-bg')
    expect(html).toContain('media="(prefers-color-scheme: light)"')
    expect(html).toContain('media="(prefers-color-scheme: dark)"')
  })

  it('LunarLoading, AtmosphericBackground y ConstellationCanvas sellan el borde superior en móvil', () => {
    const lunarCss = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/AtmosphericBackground/LunarLoading.module.css'),
      'utf-8',
    )
    const atmosCss = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css'),
      'utf-8',
    )
    const constellationCss = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/AtmosphericBackground/ConstellationCanvas.module.css'),
      'utf-8',
    )

    expect(lunarCss).toContain('.topSafeBlend')
    expect(lunarCss).toContain('.bottomSafeBlend')
    expect(lunarCss).toContain('#060B14 0%')
    expect(lunarCss).toContain('#FAF7F2 0%')

    expect(atmosCss).toContain('#FAF4EC 0%')
    expect(atmosCss).toContain('#020408 0%')

    expect(constellationCss).toContain('@media (max-width: 639px)')
  })

  it('reemplaza el nodo meta theme-color en head al cambiar el color para forzar repintado WebKit/iOS sin duplicar llamadas idénticas', () => {
    const { mockDoc, metas } = createMockDocument(true)
    vi.stubGlobal('document', mockDoc)

    updateSystemBars('#060B14', true)
    const firstMeta = metas.find((m) => m.attrs.name === 'theme-color')
    expect(firstMeta).toBeDefined()
    expect(firstMeta?.id).toBe('meta-theme-color')

    // Llamada idéntica: mantiene la misma instancia sin churn en DOM
    updateSystemBars('#060B14', true)
    const sameMeta = metas.find((m) => m.attrs.name === 'theme-color')
    expect(sameMeta).toBe(firstMeta)

    // Cambio de color: reemplaza el nodo por una instancia nueva en <head>
    updateSystemBars('#0E1117', true)
    const replacedMetas = metas.filter((m) => m.attrs.name === 'theme-color')
    expect(replacedMetas).toHaveLength(1)
    expect(replacedMetas[0]).not.toBe(firstMeta)
    expect(replacedMetas[0].attrs.content).toBe('#0E1117')
    expect(replacedMetas[0].id).toBe('meta-theme-color')
  })

  it('soporta desmontajes LIFO fuera de orden, invocaciones repetidas de cleanup y cambio de tema sobre surface', () => {
    const { mockDoc, metas } = createMockDocument(false)
    vi.stubGlobal('document', mockDoc)

    // Superficie base de página con header sticky (ej. TermsPage -> --surface)
    const unregisterSurface = registerSystemBarSurface('surface')
    expect(getActiveSystemBarSurface()).toBe('surface')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#FFFFFF')

    // Cambio a modo oscuro con 'surface' arriba del stack
    syncSystemBarsForTheme(true)
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#161B24')

    // Se monta encima un fondo atmosférico (p. ej. error boundary / overlay fullscreen)
    const unregisterAtmos = registerSystemBarSurface('atmospheric')
    expect(getActiveSystemBarSurface()).toBe('atmospheric')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#020408')

    // Si 'surface' se desmonta primero (fuera de orden LIFO), 'atmospheric' conserva el control
    unregisterSurface()
    unregisterSurface() // idempotente: repetir cleanup no corrompe el stack
    expect(getActiveSystemBarSurface()).toBe('atmospheric')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#020408')

    // Al desmontar 'atmospheric', regresa al fallback base 'app' (--page oscuro)
    unregisterAtmos()
    expect(getActiveSystemBarSurface()).toBe('app')
    expect(metas.find((m) => m.attrs.name === 'theme-color')?.attrs.content).toBe('#0E1117')
  })

  it('sincroniza tokens de index.css, public/manifest.json y reglas sin transición de fondo en raíz', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf-8')
    const manifestRaw = fs.readFileSync(path.resolve(process.cwd(), 'public/manifest.json'), 'utf-8')
    const manifest = JSON.parse(manifestRaw) as {
      display: string
      background_color: string
      theme_color: string
    }

    // Tokens light & dark alineados exactamente con SYSTEM_BAR_COLORS
    expect(css).toContain(`--surface: ${SYSTEM_BAR_COLORS.surface.light};`)
    expect(css).toContain(`--surface: ${SYSTEM_BAR_COLORS.surface.dark};`)
    expect(css).toContain(`--lunar-bg-deep: ${SYSTEM_BAR_COLORS.atmospheric.dark};`)

    // HTML y body leen --system-bar-bg sin animar background-color
    expect(css).toMatch(/html\s*\{[^}]*transition:\s*color\s+/s)
    expect(css).toMatch(/body\s*\{[^}]*background-color:\s*var\(--system-bar-bg/s)
    expect(css).not.toMatch(/html\s*\{[^}]*transition:[^;]*(?:background|background-color)/s)
    expect(css).not.toMatch(/body\s*\{[^}]*transition:[^;]*(?:background|background-color)/s)

    // Manifest PWA arranca en modo loading claro (#FAF7F2) sin flash de color distinto
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe(SYSTEM_BAR_COLORS.loading.light)
    expect(manifest.theme_color).toBe(SYSTEM_BAR_COLORS.loading.light)
  })

  it('prohíbe transiciones de background/background-color en superficies edge/fullscreen que invalidarían el snap de tema', () => {
    const extractMatchingBlocks = (css: string, selector: string): string[] => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?:^|[\\n,}])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g')
      const matches: string[] = []
      let m: RegExpExecArray | null
      while ((m = regex.exec(css)) !== null) {
        matches.push(m[1])
      }
      return matches
    }

    const assertNoBackgroundTransition = (
      relPath: string,
      selector: string,
      options: { requireExplicitTransition?: boolean } = {},
    ) => {
      const css = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf-8')
      const bodies = extractMatchingBlocks(css, selector)
      expect(bodies.length, `${relPath} -> ${selector} debe existir`).toBeGreaterThan(0)

      const combinedTransitions = bodies
        .map((b) => {
          const match = b.match(/transition\s*:\s*([^;]+);/i)
          return match ? match[1] : null
        })
        .filter((val): val is string => val !== null)

      if (options.requireExplicitTransition) {
        // Debe anular el wildcard global `*, *::before, *::after { transition: background-color 0.2s ease }`
        expect(
          combinedTransitions.length,
          `${relPath} -> ${selector} debe declarar transition explícito sin background-color`,
        ).toBeGreaterThan(0)
      }

      for (const transitionVal of combinedTransitions) {
        if (transitionVal.trim() === 'none' || transitionVal.trim() === 'none !important') continue
        expect(
          transitionVal,
          `${relPath} -> ${selector} no debe transicionar background ni background-color`,
        ).not.toMatch(/\bbackground(?:-color)?\b/i)
      }
    }

    assertNoBackgroundTransition('src/components/layout/AppLayout/AppLayout.module.css', '.main', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/auth/AuthLayout/AuthLayout.module.css', '.root', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/auth/AuthLayout/AuthLayout.module.css', '.rightPanel', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/auth/AuthLayout/AuthLayout.module.css', '.mobile', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/pages/TermsPage.module.css', '.container', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/pages/TermsPage.module.css', '.header', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/pages/TermsPage.module.css', '.footer', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/pages/admin/AnimacionPreviewPage.module.css', '.pageRoot', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/LunarLoading.module.css', '.container', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/LunarLoading.module.css', '.topSafeBlend')
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/LunarLoading.module.css', '.bottomSafeBlend')
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css', '.container', {
      requireExplicitTransition: true,
    })
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css', '.topVignette')
    assertNoBackgroundTransition('src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css', '.bottomVignette')
    assertNoBackgroundTransition('src/pages/app/suscripciones/SuscripcionesPage.module.css', '.emptyState', {
      requireExplicitTransition: true,
    })

    // Verificar que los fondos atmosféricos extiendan color sólido a env(safe-area-inset-*) y no reseteen background-color
    const atmosCss = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css'),
      'utf-8',
    )
    expect(atmosCss).toContain('background-image: radial-gradient')
    expect(atmosCss).toContain('#FAF4EC env(safe-area-inset-top, 0px)')
    expect(atmosCss).toContain('#020408 env(safe-area-inset-top, 0px)')
    expect(atmosCss).toContain('#FAF4EC env(safe-area-inset-bottom, 0px)')
    expect(atmosCss).toContain('#020408 env(safe-area-inset-bottom, 0px)')

    const lunarCss = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/AtmosphericBackground/LunarLoading.module.css'),
      'utf-8',
    )
    expect(lunarCss).toContain('#FAF7F2 env(safe-area-inset-top, 0px)')
    expect(lunarCss).toContain('#060B14 env(safe-area-inset-top, 0px)')
  })

  it('verifica que todos los módulos raíz y fullscreen estén conectados a systemTheme o wrappers atmosféricos', () => {
    const read = (relPath: string) => fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf-8')

    expect(read('src/context/ThemeProvider.tsx')).toContain('syncSystemBarsForTheme')
    expect(read('src/components/ui/AtmosphericBackground/LunarLoading.tsx')).toContain("registerSystemBarSurface('loading')")
    expect(read('src/components/ui/AtmosphericBackground/AtmosphericBackground.tsx')).toContain(
      "registerSystemBarSurface('atmospheric')",
    )
    expect(read('src/pages/TermsPage.tsx')).toContain("registerSystemBarSurface('surface')")
    expect(read('src/pages/admin/AnimacionPreviewPage.tsx')).toContain("registerSystemBarSurface('loading')")

    // Todas las pantallas full-bleed restantes delegan en <AtmosphericBackground>
    expect(read('src/components/ui/ErrorBoundary/RootErrorBoundary.tsx')).toContain('<AtmosphericBackground')
    expect(read('src/components/ui/ErrorBoundary/PageErrorBoundary.tsx')).toContain('<AtmosphericBackground')
    expect(read('src/components/auth/CrearPasswordBloqueo/CrearPasswordBloqueo.tsx')).toContain('<AtmosphericBackground')
    expect(read('src/pages/NotFoundPage.tsx')).toContain('<AtmosphericBackground')
    expect(read('src/pages/onboarding/OnboardingPage.tsx')).toContain('<AtmosphericBackground')
    expect(read('src/components/auth/AuthLayout/AuthLayout.tsx')).toContain('<AtmosphericBackground')
  })

  it('garantiza --mobile-top-clearance (48px) en todos los shells, pantallas y overlays para despejar el blur superior de iOS 26', () => {
    const read = (relPath: string) => fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf-8')

    // 1. Token canónico único en tokens.css
    const tokensCss = read('src/styles/tokens.css')
    expect(tokensCss).toContain('--mobile-top-clearance: 48px;')

    // 2. Shell /app/* y sangrado full-bleed acoplado de SuscripcionesPage
    const appLayoutCss = read('src/components/layout/AppLayout/AppLayout.module.css')
    expect(appLayoutCss).toContain('calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))')

    const subsCss = read('src/pages/app/suscripciones/SuscripcionesPage.module.css')
    expect(subsCss).toContain('margin-top: calc(-1 * (var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px)))')
    expect(subsCss).toContain('padding: calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))')

    // 3. Cero doble safe-area ni padding superior redundante dentro de AppLayout en móvil
    const perfilCss = read('src/pages/app/perfil/PerfilPage.parte1.css')
    expect(perfilCss).not.toContain('env(safe-area-inset-top')

    const dashCss = read('src/pages/app/dashboard/DashboardPage.parte1.css')
    expect(dashCss).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{[^}]*\.header\s*\{[^}]*padding-top:\s*0;/s)

    const repiteCss = read('src/pages/app/lo-que-se-repite/LoQueSeRepitePage.module.css')
    expect(repiteCss).toMatch(/\.root\s*\{[^}]*padding:\s*0\s+0\s+40px;/s)

    const analisisCss = read('src/pages/app/analisis/AnalisisPage.module.css')
    expect(analisisCss).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{\s*\.page\s*\{\s*padding-top:\s*0;\s*\}/s)

    const disenoCss = read('src/pages/admin/diseno/DisenoPage.module.css')
    expect(disenoCss).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{\s*\.pageContainer\s*\{\s*padding:\s*0\s+0\s+40px;\s*\}/s)

    // 4. TermsPage sin backdrop-filter en .header opaco sticky top: 0 y con clearance móvil
    const termsCss = read('src/pages/TermsPage.module.css')
    const termsHeaderMatch = termsCss.match(/\.header\s*\{([^}]*)\}/s)
    expect(termsHeaderMatch?.[1]).toBeDefined()
    expect(termsHeaderMatch?.[1]).not.toMatch(/backdrop-filter/i)
    expect(termsCss).toContain('var(--mobile-top-clearance, 48px)')

    // 5. Pantallas fullscreen/auth/onboarding/admin/overlays y toasts alineados al token móvil
    const modulesWithClearance = [
      'src/components/ui/ThemeToggle/ThemeToggle.module.css',
      'src/components/auth/AuthLayout/AuthLayout.module.css',
      'src/pages/onboarding/OnboardingPage.module.css',
      'src/components/auth/CrearPasswordBloqueo/CrearPasswordBloqueo.module.css',
      'src/pages/admin/AnimacionPreviewPage.module.css',
      'src/pages/admin/components/IconPlayground.tsx',
      'src/components/ui/AtmosphericBackground/AtmosphericBackground.module.css',
      'src/components/ui/AtmosphericBackground/LunarLoading.module.css',
      'src/components/ui/Modal/Modal.module.css',
      'src/styles/sileo.css',
      'src/components/ui/SileoToaster/SileoToaster.tsx',
    ]

    for (const modPath of modulesWithClearance) {
      const content = read(modPath)
      expect(content, `${modPath} debe usar --mobile-top-clearance`).toContain('--mobile-top-clearance')
      expect(content, `${modPath} debe combinar con env(safe-area-inset-top`).toContain('env(safe-area-inset-top')
    }
  })
})

