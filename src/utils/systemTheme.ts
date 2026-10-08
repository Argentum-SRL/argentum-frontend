/**
 * Sincroniza dinámicamente las barras de sistema (Status Bar superior y
 * Navigation / Address Bar inferior) en iOS (Safari y PWA) y Android (Chrome y PWA)
 * con el fondo exacto de la interfaz en tiempo real.
 */
export function updateSystemBars(color: string, isDark: boolean) {
  if (typeof document === 'undefined') return

  // 1. Fondo de <html> y <body> (WebKit Safari y Chromium muestrean estos elementos para tintar barras)
  document.documentElement.style.backgroundColor = color
  if (document.body) {
    document.body.style.backgroundColor = color
  }

  // 2. Esquema de color en el elemento raíz
  const colorScheme = isDark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = colorScheme

  // 3. Meta etiqueta color-scheme (informa al navegador cómo renderizar controles del sistema y chrome)
  let colorSchemeMeta = document.getElementById('meta-color-scheme') as HTMLMetaElement | null
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
  }
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', colorScheme)
  }

  // 4. Meta etiqueta apple-mobile-web-app-status-bar-style
  // 'default' permite que iOS adapte automáticamente los iconos a negro en fondo claro o blanco en fondo oscuro.
  // 'black-translucent' se reserva para fondo oscuro inmersivo.
  let appleStatusBarMeta = document.getElementById('meta-apple-status-bar') as HTMLMetaElement | null
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  }
  if (appleStatusBarMeta) {
    appleStatusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default')
  }

  // 5. Meta etiquetas theme-color:
  // Actualizar todas las etiquetas meta theme-color y eliminar cualquier atributo 'media'
  // para que Safari y Chrome no usen queries obsoletas que fuercen modos oscuros en páginas claras.
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]')
  if (themeMetas.length > 0) {
    themeMetas.forEach((meta) => {
      meta.setAttribute('content', color)
      if (meta.hasAttribute('media')) {
        meta.removeAttribute('media')
      }
    })
  } else {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', color)
    document.head.appendChild(meta)
  }
}
