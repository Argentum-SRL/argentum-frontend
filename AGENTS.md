# REGLAS OBLIGATORIAS DE FRONTEND — ARGENTUM

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
   - **Selectores No Cápsula por Naturaleza (no se migran):** Grilla de días del mes (`CicloFinancieroSelector` `.dayGrid`), muestras de color (`ColorPicker`), grilla de categorías (`CategoriaSelector` `.catGrid`), listas de filtros complejos (`FilterBar`), tarjetas de elección con contenido rico (`ui/SelectableSurface`, `PresupuestoModal` `.renewalOptions`, `CalculoCuotasResumen` `.planGrid`), y muestrarios comparativos de diseño (`InteractiveDemos`).
   - **Tokens de Controles de Admin:** Controles reales de formulario de admin (`searchInput`, `filterSelect`, etc.) usan altura 44px, radio 12px, padding-x 14px, fuente 15px (16px en <= 768px para R32 = 0).
10. **Verificación Previa y Candado:**
   - Correr `npm run lint` y `node scripts/audit-design-rules.mjs` antes de cualquier commit.
   - La línea base solo se actualiza con `node scripts/audit-design-rules.mjs --update-baseline` y nunca debe sufrir aumentos.
   - En cada push corre el candado automático; está prohibido usar `--no-verify`.
11. **Plan vigente y deuda conocida (21/10/2026):** Plan único en el Project de Claude.ai: `claude/PLAN_VIGENTE_21-10.md`. El front todavía hace cuentas de plata en `PagarResumenModal`, `DebitoEnDolares`, `CalculoCuotasResumen`, `useTools`, `ConvenienciaWizard`, `TransferenciaModal` y `useReintegro`: no copiar ese patrón; todo cálculo nuevo de plata (porcentajes, cuotas, conversiones, umbrales) viene del backend (se migra en el Bloque E del plan). Todavía no hay pruebas de front (Vitest entra en el Bloque E). La carpeta de auditorías es `D:\Argentum\auditorias` (variable `ARGENTUM_AUDITORIAS_DIR`); nunca `..\auditorias`.
