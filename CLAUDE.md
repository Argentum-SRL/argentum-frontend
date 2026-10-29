# REGLAS OBLIGATORIAS DE FRONTEND — ARGENTUM

## Cómo responderle a Sebastián (regla n.º 1, 26/10/2026)
Sin explicaciones y sin vueltas. Solo: indicaciones, prompts, pushear o no, comandos completos y decisiones de negocio, siempre en pasos simples. Nada de causas técnicas, diagnósticos ni hallazgos.

Nota: `.agents/`, `.claude/` y `.codex/` no se versionan en Git. Este archivo es la fuente canónica.

1. **Constitución Visual:** Leer `DISENO_UNIFICADO.md` antes de tocar cualquier CSS o TSX de interfaz.
2. **Tokens Estrictos:** Usar únicamente variables de `tokens.css` y `elevation.css`. Prohibido introducir sombras, z-index, radios o espaciados literales sueltos.
3. **Selectores Canónicos:** Todo selector segmentado debe usar `ui/SegmentedControl` (la cápsula de la "Opción 1" de la página admin Diseño [sin pista, sin card, sin fondo detrás], con el botón elegido en `var(--primary)` y texto blanco; la "Opción 4" tiene pista o card y NO es la oficial; botones sueltos con gap 6px (`var(--selector-gap)`); botón inactivo transparente, sin borde, texto gris (`var(--text-2)`), 13px, peso 600; botón elegido con fondo `var(--primary)`, texto `#FFFFFF`, peso 700 y sombra suave `var(--elevation-pill)` con alcance 8px, igual que el punto activo del indicador de pasos; alto 40px, 44px en táctil y 56px apilado; admite `description?: string` para segunda línea de 11px en modo apilado; admite `badge?: number | string` para contadores; admite layout `'wrap'`; por decisión de Sebastián del 17/10). No crear `.segmentedBar`, `.methodGrid`, etc. Excepción permanente: selector de moneda de `BalanceCard` conserva su diseño redondeado original (`.currencyToggle` con píldora blanca activa y track translúcido).
4. **Anatomía y Espaciado de Modales:** Respetar la estructura oficial de `DISENO_UNIFICADO.md`:
   - Sistema de espaciado v3 basado en Gestalt por relación (cosas relacionadas, juntas; cosas distintas, separadas):
     - 8px etiqueta, texto de ayuda o error a control (`--modal-label-gap`). El hint/ayuda vive DENTRO del campo `[data-modal-field]`.
     - 8px lista de opciones/toggles de una misma pregunta (`--modal-option-gap`).
     - 12px campo a campo en el mismo bloque (`--modal-field-gap`).
     - 20px bloque a bloque (`--modal-block-gap`, 16px en pantallas <= 480px).
     - 10px subtítulo de bloque a primer elemento (`--modal-section-title-gap`).
     - 20px header a primer bloque (`--modal-header-gap`).
     - 24px último bloque a botonera de footer (`--modal-footer-gap`).
     - 12px separación entre botones de footer (`--modal-footer-btn-gap`).
     - 20px lateral (`--modal-pad-x`).
   - Mecanismo único centralizado por atributos de marcado en `Modal.module.css`:
     - `[data-modal-frame]`: contenedores estructurales (slide, `modalContainer`, `formContainer`, `slidesContainer`, `mobileDrawerContainer`) con flex columna y `gap: 0`.
     - `[data-modal-stack]`: SOLO el contenedor del CUERPO del modal con gap `--modal-block-gap`. Prohibido en contenedores estructurales o que contengan directamente header o footer (R26 = 0).
     - `[data-modal-block]`: columna flex con gap `--modal-field-gap` (bloques de campos de una misma pregunta; requerido en modales con formulario, R22 = 0).
     - `[data-modal-field]`: columna flex con gap `--modal-label-gap` (control + etiqueta/ayuda/error).
     - `[data-modal-options]`: lista de opciones de una misma pregunta con gap `--modal-option-gap`.
     - `[data-modal-section-title]`: subtítulo de bloque con margen inferior `--modal-section-title-gap`.
     - `[data-modal-delete]`: botón o contenedor de eliminar entidad al final del último bloque de contenido (nunca en header ni footer).
     - Prohibición absoluta de estilos inline con `margin` o `padding` vertical dentro de modales (R27 = 0).
     - `[data-modal-carousel]` y `[data-modal-carousel-track]`: carrusel canónico único de tarjetas/billeteras. Scroller con sangrado full-bleed (`margin-inline: calc(-1 * var(--modal-pad-x))`, `padding-inline: var(--modal-pad-x)`), alojamiento vertical de sombras (`padding-top: var(--carousel-reach-top)`, `padding-bottom: var(--carousel-reach-bottom)`) y compensación con margen negativo patrón (4). Prohibido clases duplicadas de carrusel o overrides `:global(.wc*)` en modales (R23 = 0).
   - Componente `Modal` canónico con soporte `variant?: 'dialog' | 'sheet'` (sheet anclado abajo, handle superior, radio 20px 20px 0 0, `safe-area-inset-bottom`, overlay en `var(--z-modal)`).
   - Apilamiento robusto: contador de scroll lock a nivel módulo y pila de escape (`modalEscapeStack`) para cerrar solo el modal superior sin cerrar los inferiores.
   - Indicador de pasos unificado: prop `stepDots={{ total, current }}` en `<Modal>`, definición única en `Modal.module.css` (R13 = 1).
   - Pie de modal unificado con `ModalFooter` (Cancelar flex 1, Confirmar flex 2, gap 12px con `--modal-footer-btn-gap`, sin border-top divisor).
   - Capa de overlay en `z-index: var(--z-modal)`. Altura adaptativa por CSS natural con tope `var(--modal-max-h: 90dvh)` y scroll interno.
   - **Foco y teclado (fase_g2_modal_sin_autofocus):** al abrir un modal, un paso o una pantalla, el campo principal se enfoca solo en compu con autoFocus={esPunteroFino()} (src/utils/foco.ts); en celular el teclado nunca se abre solo. Cuando la persona toca para escribir (buscador, lupa, lápiz de editar nombre) el foco va siempre. Lo controla npm run audit:autofocus sobre todo src.
   - Criterio de scroll legítimo y form body único: En modales de formulario el scroll reside exclusivamente en el `Modal` base (`.content`). Prohibido doble scroll en `.formBody` o pasos; `overflow-y: auto` propio solo es legítimo en pickers o listas acotadas por diseño (bancos, búsqueda, notificaciones, cuentas en filtros).
5. **Componentes Canónicos de Dominio:**
   - **Card de Billetera Unificada (`BilleteraCard`):** Soporta `variant="full"` (geometría de página y pila inalterada) y `variant="select"` para carruseles/selectores (proporción ID-1 1.65:1, ancho fluido con container queries `min(clamp(..., 72cqi, ...), calc(100cqi - 48px))`, pisos tipográficos de 10px en `.selectTipo` y 9px en `.selectMonedaBadge`, saldo grande sin truncar, logo 28px + nombre + estrella/inversión + slot contextual). `RealCardPreview` con misma proporción y cromo.
   - **Ícono de Movimiento Unificado (`MovimientoAvatar` y `resolverVisualMovimiento`):** Único componente y función pura para filas de transacciones/movimientos/cuotas. Orden: S1 Suscripciones (logo de marca o subcategoría), S2 Metas (Target unificado), S3 Subcategoría específica, S4 Categoría padre/default, S5 IA pendiente, S6 Transferencia. Caché compartida de suscripciones cargada en primer montaje (`getCachedSuscripciones`) e invalidada reactivamente vía `setCachedSuscripciones`. Prohibido renderizar íconos sueltos en bucles `.map` fuera de `MovimientoAvatar` (R24 = 0).
   - **Inputs de Dinero (`MontoInput`):** Todo input de monto de dinero debe usar obligatoriamente `ui/MontoInput`. Otros inputs numéricos (cuotas, porcentajes, plazos) conservan inputs estándar.
6. **Sombras y Contención Estricta (R04, R05, R21):**
   - Toda sombra proviene exclusivamente de un token `var(--elevation-*)` (R04 = 0). Prohibido `box-shadow` con `!important` (R05 = 0).
   - Ningún contenedor que recorta (`overflow: hidden/auto/scroll/clip`) corta sombras, focos ni levantamientos (`transform`/`scale`).
7. **Prohibiciones Absolutas:**
   - Prohibido `z-index` fuera de escala: los literales enteros 0 a 99 son válidos exclusivamente para orden local dentro de un componente; de 100 en adelante o valores negativos requieren obligatoriamente tokens `var(--z-*)` (R01 = 0 salvo Drawer muerto con 100).
   - Prohibido `border-radius: 24px` en modales/hojas (R02 = 0; usar `20px` o `var(--modal-radius)`).
   - Prohibidos márgenes negativos salvo los cuatro patrones documentados (1: solapamiento de pila, 2: sangrado full-bleed, 3: colapso óptico 1-2px, 4: compensación de padding de sombra de selección en carrusel) que cuenten obligatoriamente con comentario `/* r03-ok: <motivo de al menos 15 caracteres> */` en la línea anterior (R03 = 0).
   - Prohibido borrado de archivos por terminal o scripts salvo autorización explícita de Sebastián en el prompt del paso, cumpliendo las 4 pruebas de orfandad (sin imports estáticos/dinámicos, sin referencias en configs/json, sin menciones en código y tsc idéntico antes/después).
   - Prohibidos rebotes en curvas easing (`cubic-bezier` con y > 1, R06 = 0; usar `cubic-bezier(0.16, 1, 0.3, 1)`).
   - Prohibido `border-top` en selectores footer (R07 = 0).
   - Prohibido `overflow-x: hidden !important` (R09 = 0).
   - Prohibido ancho rígido `width/max-width >= 300px !important` (R17 = 0).
   - Prohibido uso de `vh` en alturas (usar `dvh`, R19 = 0 en código vivo).
   - Prohibido modales con formularios que omitan `[data-modal-block]` (R22 = 0).
   - Prohibido selectores propios de carrusel/card de billetera fuera de Modal base y BilleteraCard/RealCardPreview (R23 = 0).
   - Prohibido renderers de movimientos con SubcategoriaIcon/CategoriaIcon directamente en loops `.map` fuera de MovimientoAvatar (R24 = 0).
   - Prohibido tocar `BalanceCard.tsx` y `BalanceCard.module.css` (salvo la estrella unificada de cuenta principal en tamaño 12 y strokeWidth 2.4).
8. **Controles Base, Dominio, Foco y Movimiento (Fases fv3n a fv3p — Cierre):**
   - **Controles Unificados:** Todos los controles (`Input`, `Field`, `SelectInput`, `DateInput`, `TimeInput`, `PhoneCountrySelect`, `ColorPicker`, `Button`, y `MontoInput` outlined) derivan de tokens `--control-h` (44px, sm 36px), `--control-radius` (12px), `--control-pad-x` (14px), `--control-font` (15px, 16px en `<= 768px` para evitar auto-zoom iOS), y `--control-disabled-opacity` (0.5). `MontoInput` hero y compact preservan tamaño protagónico (36px, radio 16px y 12px) pero heredan opacidad deshabilitada y anillo de foco en contenedor.
   - **Foco Accesible por Selector Base (R28):** Cero `outline: none|0` sin `:focus`, `:focus-visible` o `:focus-within` con indicador visible (`var(--focus-ring)` o borde visible) en el mismo selector base (R28 = 0).
   - **Movimiento y Accesibilidad (R29, R30):** Cero `transition: all` en todo el alcance universal (R29 = 0). Tokens `--motion-fast` (150ms), `--motion-base` (220ms), `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`. Todo movimiento cubierto por selector base bajo `@media (prefers-reduced-motion: reduce)` (R30 = 0).
   - **Hover Táctil (R31):** Efectos hover con `transform`/`scale` confinados a `@media (hover: hover) and (pointer: fine)` en todo el alcance (R31 = 0).
   - **Prevención de Zoom en iOS (R32):** Inputs, select y textarea reales con tamaño de fuente resuelto `>= 16px` en `<= 768px` (R32 = 0).
   - **Separación de Botones en Footer de Modal (R33):** Toda fila de botones del pie de modal debe usar obligatoriamente `gap: var(--modal-footer-btn-gap)` (12px) (R33 = 0).
   - **Alcance Universal y Excepciones:** Aplica al 100% de `src/`, incluyendo administración (`src/pages/admin/**` y `src/pages/AdminPage.module.css`). Excepciones permanentes intocables: `ui/SegmentedControl.*` y `BalanceCard.*`.
   - **Regla data-modal-field en Filas:** Controles en fila flex usan `.clase, .clase[data-modal-field] { display: flex; flex-direction: row; }` (especificidad 0,2,0) para no colapsar a columna flex.
   - **Contención de `!important`:** Prohibido agregar `!important` nuevos.
9. **Selectores de Elección Unificados (Fase fv3r):**
   - **Cápsula Oficial Universal:** TODO selector de elección propio del producto (tabs, pills, toggles) usa la cápsula oficial `ui/SegmentedControl`, incluidas las pantallas Perfil, Herramientas, Admin y Diseño.
   - **Excepciones Permanentes:** `ui/SegmentedControl.*` y `BalanceCard.*` (su `.currencyToggle` no se migra).
   - **Selectores No Cápsula por Naturaleza (no se migran):** Tambor giratorio de días del mes (`CicloFinancieroSelector` Apple Wheel Picker), muestras de color (`ColorPicker`), grilla de categorías (`CategoriaSelector` `.catGrid`), listas de filtros complejos (`FilterBar`), tarjetas de elección con contenido rico (`ui/SelectableSurface`, `PresupuestoModal` `.renewalOptions`, `CalculoCuotasResumen` `.planGrid`), y muestrarios comparativos de diseño (`InteractiveDemos`).
   - **Tokens de Controles de Admin:** Controles reales de formulario de admin (`searchInput`, `filterSelect`, etc.) usan altura 44px, radio 12px, padding-x 14px, fuente 15px (16px en <= 768px para R32 = 0).
10. **Verificación Previa y Candado:**
   - Correr `npm run lint` y `node scripts/audit-design-rules.mjs` antes de cualquier commit.
   - La línea base solo se actualiza con `node scripts/audit-design-rules.mjs --update-baseline` y nunca debe sufrir aumentos.
   - En cada push corre el candado automático; está prohibido usar `--no-verify`.
11. **Plan vigente y deuda conocida (21/10/2026):** Plan único en el Project de Claude.ai: `claude/PLAN_VIGENTE_21-10.md`. El front no hace cuentas de plata: las pide al backend con useSimulacionBackend. Lo que queda son ayudas de escritura (src/utils/ayudasEscritura.ts) y dibujo, registradas en scripts/formulas-plata-base.json; npm run audit:plata falla si aparece una cuenta nueva. Pruebas de front con Vitest (npm test). La cuota, el total financiado y el recargo de una compra en cuotas los calcula el backend (GET /grupos-cuotas/simular con useSimularCuotas); el front no los calcula. La carpeta de auditorías es `D:\Argentum\auditorias` (variable `ARGENTUM_AUDITORIAS_DIR`); nunca `..\auditorias`.

12. **Patrón Obligatorio de Skeleton Mirroring y Reglas Responsive (Fase G3, 29/10/2026):**
    - **Skeleton Mirroring Estricto:** Toda pantalla, widget o módulo que consuma datos asíncronos (`isLoading` / `isPending`) debe proyectar un skeleton estructurado que replique exactamente el layout, dimensiones, bordes (`border-radius`), espaciados (`gap`, `padding`) y aspect-ratio del componente final. Prohibido el uso de pantallas en blanco, spinners aislados sin layout o contenedores vacíos que provoquen salto visual (CLS = 0).
    - **Fluidez y Anchos Relativos (320px a 1920px+):**
      - Prohibido el uso de anchos rígidos en píxeles (`width: Xpx` con X > 300px o sin contenedor responsive). Todo esqueleto debe emplear contenedores fluidos (`width: 100%`, `flex: 1`, `minmax(0, 1fr)`).
      - Bloques y líneas de texto deben utilizar anchos porcentuales deliberados (`40%`, `50%`, `60%`, `70%`, `80%`, `100%`) con alturas consistentes (`rem` o tokens de diseño).
      - Elementos cuadrangulares, tarjetas o avatares deben usar `aspect-ratio` o tokens de tamaño relativo.
    - **Centralización en Design System:** Todos los templates de skeleton deben residir y exportarse desde `src/components/ui/Skeleton/Skeleton.tsx` con estilos en `Skeleton.module.css` usando exclusivamente tokens oficiales (`--surface`, `--surface-alt`, `--border`). Prohibido definir clases ad-hoc `.skeleton` sueltas en CSS modules de páginas.
    - **Accesibilidad y Movimiento:** Todo skeleton debe incluir `role="status"`, `aria-label` descriptivo, texto oculto `.srOnly` para lectores de pantalla, y `animation: none` bajo `@media (prefers-reduced-motion: reduce)`.

13. **Ciclo Financiero y Finanzas de Perfil (Fase G4, 29/10/2026):**
    - **Heurística de Reducción de Carga Cognitiva (Ley de Hick y Diseño Minimalista Nielsen #8):** Máxima densidad informativa útil, mínima carga mental. Prohibido incluir párrafos explicativos obvios o notas redundantes a pie de tarjeta (`.cardNote`). Textos directos, jerarquía visual limpia y eliminación de cajas anidadas artificiales.
    - **Layout Responsive Full-Width:** `TabFinanzas` en `PerfilPage` utiliza layout de dos columnas fluidas (`.tabGridColumns` y `.tabCol`), eliminando constricciones arbitrarias de ancho (`max-width: 680px`) para aprovechar monitores desktop de 13", 16" y 32" sin espacios muertos. Padding inferior con safe-area clearance móvil (`calc(120px + env(safe-area-inset-bottom, 20px))`) para evitar solapamiento con la barra de navegación flotante.
    - **Apple Wheel Picker Obligatorio:** Quedan terminantemente prohibidas las cuadrículas tipo bingo de 31 botones, los sliders continuos para fechas ordinales y los inputs de texto numérico para seleccionar días del mes. La selección de día ordinal (1 al 31) se realiza exclusivamente mediante el componente `AppleWheelPicker` (`UIPickerView` / Tambor Cilíndrico iOS) con inercia física, snap-to-center nativo (`scroll-snap-type: y mandatory`), soporte de arrastre de cursor en desktop (`PointerEvents` con captura), rueda de mouse/trackpad, lente de vidrio esmerilado central (*Apple Frosted Glass* de 44px) y máscara de degradé 3D superior e inferior (`mask-image: linear-gradient(...)`).
    - **Modalidades de Cobro Limpias:**
      1. *Día hábil bancario:* A la izquierda y activo por defecto. Estructurado en exactamente tres opciones sin etiquetas de marketing ("más común", "popular" eliminadas):
         - 1° opción: *1° día hábil del mes*.
         - 2° opción: *Último día hábil del mes*.
         - 3° opción: *Fila unificada sin cajas anidadas* con el resto de opciones (2° a 10° día hábil del mes y Último viernes del mes). Presenta exactamente la misma anatomía plana y limpia que las opciones 1 y 2 (círculo de radio a la izquierda, título y chevron sutil a la derecha sin contenedores, bordes ni fondos de input invasivos), abriendo un bottom sheet (`Modal variant="sheet"`) en dispositivos móviles o un popover flotante en escritorio.
      2. *Día del mes:* Con el tambor giratorio Apple. Para personas que cobran en un rango de fechas (freelancers, comisiones), se les instruye en una única línea concisa a elegir su día ancla de reinicio.
    - **Arquitectura Móvil Optimizada y Divulgación Progresiva:**
      - *Reordenamiento de Jerarquía Móvil:* En dispositivos móviles, las secciones se ordenan por prioridad de configuración: 1. Moneda de cuenta, 2. Ciclo financiero de cobro, 3. Memoria de comercios. El ciclo de cobro ya no queda sepultado debajo de listas largas.
      - *Comercios Recordados Colapsable:* En pantallas móviles (< 1024px), la sección de comercios recordados inicia colapsada como un acordeón compacto de una sola fila con chevron animado (`ChevronDown`), ahorrando más de 300px de scroll vertical y revelándose bajo demanda.
      - *Guardado Unificado (Cero duplicidad):* Eliminación de múltiples barras de guardado fragmentadas dentro de cada tarjeta. Una única barra de acción unificada gestiona y sincroniza tanto moneda como ciclo con un solo toque y feedback coordinado.
      - *Dólar y Tambor Compactos:* El selector de cotización de dólar mantiene una cuadrícula 2x2 compacta de 48px de altura (evitando apilar 4 tarjetas verticales de 300px en móviles). Orden canónico de opciones de dólar: 1. *Dólar Oficial* (seleccionado automáticamente por defecto al activar operaciones en dólares), 2. *Dólar MEP*, 3. *Dólar Blue*, 4. *Dólar Tarjeta*. Etiquetas directas y limpias sin paréntesis redundantes ("Operar también en dólares", "Dólar Oficial" sin "(BNA)"). El tambor cilíndrico Apple Wheel Picker reduce su visor a 132px (3 filas visibles exactas de 44px) en móviles para evitar ocupar la pantalla completa, con texto de cobro por rango en un único renglón sin quiebres de línea.
      - *SegmentedControl Adaptativo en Móviles (375x667 SE y pantallas angostas):* Eliminación del empaquetado forzado de etiqueta lateral con control de píldoras. En móviles, tanto `.monedaBlock` (Pesos / Dólares) como `.contingencyRow` (Si cae fin de semana: Antes / Mismo día / Después) apilan su etiqueta arriba y expanden el `SegmentedControl` a 100% de ancho con `fullWidth` y `flex-wrap: nowrap` (padding `0 var(--space-sm)`), distribuyendo el ancho equitativamente entre las opciones en un único renglón horizontal continuo sin quiebres ni saltos de línea.
    - **Compatibilidad con el Motor Backend:** Se traduce limpiamente al día ancla efectivo (`tipo: 'dia_fijo'`), garantizando integridad en `get_ciclo_fechas`, cero migraciones destructivas y compatibilidad absoluta con presupuestos y dashboards.
    - **Iconografía Unificada Sin Emojis:** Prohibición absoluta de emojis en la pestaña de finanzas. Uso exclusivo de vectores SVG del sistema unificado de íconos (`Calendar`, `Landmark`, `Clock`, `Check`, `AlertCircle`, `Coins`, `Receipt`, `Save`).

14. **Master Profile Hero Card (Fase G5, 29/10/2026):**
    - **Jerarquía y Protagonismo de Identidad (Nombre y Foto como Centro Visual):**
      1. *Avatar y Nombre Dominantes:* Avatar circular limpio (64px desktop, 54px tablet, 48px mobile; sin badges de cámara invasivos sobre el círculo; clic abre crop) y nombre de usuario en tipografía bold destacada (20px desktop, 16.5px mobile), garantizando que la identidad sea el foco visual primario. Se eliminaron definitivamente los botones de copiar email y teléfono del hero (en todos los dispositivos), manteniendo el encabezado despojado y limpio.
      2. *Alertas de Verificación Discretas (`.heroAlertsInline`):* Si existen verificaciones pendientes (`Email pendiente`, `WhatsApp pendiente`), se muestran como micro-tags compactos de 18px de altura con tipografía secundaria (10px, peso 500, ícono 10px y fondo translúcido sutil) ubicados directamente junto al nombre en `.heroTopRow`, eliminando bloques gigantes o renglones dedicados que compitan con la identidad. Si están verificados, no se muestra ningún chip.
      3. *Resumen Financiero Integrado y Sin Cajas (`.heroGlanceZone`):* Eliminación total de contenedores, tarjetas, bordes y fondos anidados. Se integra como una línea de estado limpia y tipográfica (`display: inline-flex; align-items: center; gap: 4px`) dentro de `.heroDetails`: ícono SVG de moneda (`Coins` 12px) + valor (`Pesos`, con pill `MEP` si aplica) + separador de punto (`•`) + ícono SVG de calendario (`Calendar` 12px) + ciclo (`Día 30 del mes`).
    - **Ultra-compactación Móvil y Layout de Fila Única (iPhone SE 375x667):**
      - En dispositivos móviles (< 640px), la tarjeta no se divide en dos filas ni contiene barras flotantes inferiores: el avatar se ubica a la izquierda y a su derecha se apilan en solo dos líneas compactas: 1. Nombre + micro-tag de alerta, 2. Meta-línea de moneda y ciclo.
      - Altura total reducida a ~72px (ahorro de más de 60px respecto a layouts previos), 100% de visibilidad above the fold, cero scroll horizontal y cero contenedores anidados.
    - **Cero símbolos de moneda redundantes:** Eliminación universal de "($)" y "(US$)" en todo el módulo de perfil, reservándolos exclusivamente dentro de los botones del selector de moneda de `TabFinanzas`.
    - **Tokens y Accesibilidad:** Uso exclusivo de tokens `--surface`, `--surface-alt`, `--border`, `--radius-modal`, `--elevation-sm`, `--space-*`, foco visible en avatar interactivo y botones, hover de escala confinado a puntero fino, y cobertura total bajo `@media (prefers-reduced-motion: reduce)`.
