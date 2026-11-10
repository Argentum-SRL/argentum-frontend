/**
 * Superficie visual que controla el color de la barra de estado y de navegación
 * del sistema operativo móvil en la parte superior/inferior del viewport.
 * Ver `DISENO_UNIFICADO.md` §16 para la tabla de rutas y las reglas para módulos nuevos.
 */
export type SystemBarSurface = 'app' | 'loading' | 'atmospheric' | 'surface'

/**
 * Fuente única de verdad (hex exactos por tema) para las barras del sistema:
 * - `app`: coincide 1:1 con `--page` en `src/index.css`.
 * - `loading`: coincide 1:1 con `--lunar-bg` en `src/index.css` y `public/manifest.json`.
 * - `atmospheric`: coincide 1:1 con el tope de las viñetas de `AtmosphericBackground`.
 * - `surface`: coincide 1:1 con `--surface` para pantallas con header sticky flush en `top: 0`.
 */
export const SYSTEM_BAR_COLORS: Record<SystemBarSurface, { light: string; dark: string }> = {
  app: { light: '#F5F4F0', dark: '#0E1117' },
  loading: { light: '#FAF7F2', dark: '#060B14' },
  atmospheric: { light: '#FAF4EC', dark: '#020408' },
  surface: { light: '#FFFFFF', dark: '#161B24' },
}

interface SurfaceRegistration {
  id: number
  surface: SystemBarSurface
}

let nextSurfaceId = 1
const surfaceStack: SurfaceRegistration[] = []
let currentIsDark: boolean | null = null

function getCurrentIsDark(): boolean {
  if (currentIsDark !== null) return currentIsDark
  if (typeof document === 'undefined') return false
  const root = document.documentElement
  return (
    root.getAttribute('data-theme') === 'dark' ||
    root.classList.contains('dark')
  )
}

export function getActiveSystemBarSurface(): SystemBarSurface {
  return surfaceStack.length > 0 ? surfaceStack[surfaceStack.length - 1].surface : 'app'
}

function applyResolvedSystemBars(): void {
  const isDark = getCurrentIsDark()
  const activeSurface = getActiveSystemBarSurface()
  const color = SYSTEM_BAR_COLORS[activeSurface][isDark ? 'dark' : 'light']
  updateSystemBars(color, isDark)
}

/**
 * Registra temporalmente una superficie visual que ocupa el borde superior/inferior
 * (p. ej. loader lunar, fondo atmosférico o cabecera sticky), resolviendo el color activo
 * mediante una pila LIFO para evitar colisiones de ciclo de vida entre componentes.
 */
export function registerSystemBarSurface(surface: SystemBarSurface): () => void {
  const id = nextSurfaceId++
  surfaceStack.push({ id, surface })
  applyResolvedSystemBars()

  return () => {
    const idx = surfaceStack.findIndex((entry) => entry.id === id)
    if (idx !== -1) {
      surfaceStack.splice(idx, 1)
      applyResolvedSystemBars()
    }
  }
}

/**
 * Actualiza el esquema de tema global y resincroniza las barras del sistema
 * respetando la superficie activa en la cima de la pila.
 */
export function syncSystemBarsForTheme(isDark: boolean): void {
  currentIsDark = isDark
  applyResolvedSystemBars()
}

/** Reinicia el estado interno del módulo (uso exclusivo en tests unitarios). */
export function resetSystemBarStateForTests(): void {
  surfaceStack.length = 0
  currentIsDark = null
  nextSurfaceId = 1
}

/**
 * Sincroniza dinámicamente las barras de sistema (Status Bar superior y
 * Navigation / Address Bar inferior) en iOS (Safari y PWA) y Android (Chrome y PWA)
 * con el fondo exacto de la interfaz en tiempo real.
 */
export function updateSystemBars(color: string, isDark: boolean) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const colorScheme = isDark ? 'dark' : 'light'

  // 1. Token CSS + fondo de <html> y <body> (WebKit Safari y Chromium muestrean estos elementos)
  root.style.setProperty('--system-bar-bg', color)
  root.style.backgroundColor = color
  if (document.body) {
    document.body.style.backgroundColor = color
  }

  // 2. Esquema de color en el elemento raíz
  root.style.colorScheme = colorScheme

  // 3. Meta etiqueta color-scheme (informa al navegador cómo renderizar controles y chrome)
  let colorSchemeMeta = document.getElementById('meta-color-scheme') as HTMLMetaElement | null
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
  }
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', colorScheme)
  }

  // 4. Meta etiqueta apple-mobile-web-app-status-bar-style
  // Mantener siempre 'default' garantiza que iOS adapte el color de la barra superior al de
  // <meta name="theme-color"> y ajuste automáticamente el contraste de reloj e iconos
  // (negros en modo claro, blancos en modo oscuro) incluso si el usuario cambia de tema.
  let appleStatusBarMeta = document.getElementById('meta-apple-status-bar') as HTMLMetaElement | null
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  }
  if (appleStatusBarMeta && appleStatusBarMeta.getAttribute('content') !== 'default') {
    appleStatusBarMeta.setAttribute('content', 'default')
  }

  // 5. Reemplazar el nodo <meta name="theme-color"> cuando cambia el color o existen
  // media queries heredadas: Safari/WebKit en iOS frecuentemente ignora mutaciones in-place
  // de `content` tras la carga inicial y requiere insertar un nodo nuevo en <head>.
  const themeMetas = Array.from(document.querySelectorAll('meta[name="theme-color"]'))
  const isAlreadySynced =
    themeMetas.length === 1 &&
    themeMetas[0].id === 'meta-theme-color' &&
    !themeMetas[0].hasAttribute('media') &&
    themeMetas[0].getAttribute('content') === color

  if (!isAlreadySynced) {
    if (document.head) {
      for (const existingMeta of themeMetas) {
        if (existingMeta.parentNode) {
          existingMeta.parentNode.removeChild(existingMeta)
        }
      }
      const meta = document.createElement('meta')
      meta.id = 'meta-theme-color'
      meta.setAttribute('name', 'theme-color')
      meta.setAttribute('content', color)
      document.head.appendChild(meta)
    } else if (themeMetas.length > 0) {
      const primaryMeta = themeMetas[0]
      if (!primaryMeta.id) {
        primaryMeta.id = 'meta-theme-color'
      }
      if (primaryMeta.hasAttribute('media')) {
        primaryMeta.removeAttribute('media')
      }
      if (primaryMeta.getAttribute('content') !== color) {
        primaryMeta.setAttribute('content', color)
      }
      for (let i = 1; i < themeMetas.length; i++) {
        const extraMeta = themeMetas[i]
        if (extraMeta.parentNode) {
          extraMeta.parentNode.removeChild(extraMeta)
        }
      }
    }
  }
}
