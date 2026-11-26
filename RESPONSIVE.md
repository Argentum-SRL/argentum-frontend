# RESPONSIVE — CELULAR, TABLET Y ESCRITORIO EN ARGENTUM

Fuente única y obligatoria para cualquier cambio que dependa del ancho de pantalla. Todo agente (Antigravity, Claude, Codex) la lee ANTES de tocar estilos cuando el pedido menciona celular, mobile, tablet, escritorio, desktop, compu o un dispositivo. Si algo de otro documento la contradice, manda este archivo. Vigente desde el 26/11/2026 (fases FS2B a F2).

## 1. Los tres rangos (no hay otros)

| Nombre | Ancho | Qué abarca | CSS (copiar tal cual) | JS (solo con el hook) | Anchos donde se verifica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Celular (mobile) | hasta 767,98px | Todos los celulares: chicos (320–359), medianos (360–399), grandes (400–479) y plegables o celulares acostados (480–767) | `@media (max-width: 767.98px)` | `useViewport().esCelular` | 320, 360, 375, 393, 412, 440, 480, 600 y 767 (y que 768 no cambie) |
| Tablet | 768 a 1023,98px | Tablets chicas y grandes en vertical, plegables abiertos | `@media (min-width: 768px) and (max-width: 1023.98px)` | `useViewport().esTablet` | 768, 820 y 1023 (y que 767 y 1024 no cambien) |
| Escritorio (desktop) | desde 1024px | Tablets acostadas, notebooks, monitores comunes y muy grandes | `@media (min-width: 1024px)` | `useViewport().esEscritorio` | 1024, 1280, 1440 y 1920 (y que 1023 no cambie) |

- Los modelos de celular (Galaxy, iPhone, Pixel) son solo ejemplos de que hay celulares chicos, medianos y grandes: nada se diseña para un modelo puntual. Todo tiene que verse bien en CUALQUIER ancho del rango, desde el más chico hasta el más grande; por eso se verifica en varios anchos repartidos y no en uno.
- "Tablet y escritorio juntos" (todo lo que no es celular): `@media (min-width: 768px)` / `!useViewport().esCelular`.
- Pantallas muy grandes: no se agregan cortes. El tamaño crece solo con `--screen-scale` (1 hasta 1919px, 1,1 desde 1920px y 1,2 desde 2560px), que vive únicamente en `src/styles/tokens.css`.
- JS: el ancho se lee SOLO con `useViewport()` de `src/hooks/useViewport.ts` (`tipo`, `esCelular`, `esTablet`, `esEscritorio`). Prohibido `window.innerWidth <=/>=` y `matchMedia('(max-width: …)')` fuera del hook. Restar `window.innerWidth - ancho` para posicionar un popover sí está permitido.

## 2. Cómo interpretar un pedido de Sebastián

| Lo que dice | Qué se toca | Qué NO se toca |
| :--- | :--- | :--- |
| "en mobile", "en el celular", "en mi teléfono", "en el iPhone", "en el Samsung" | Solo el bloque `@media (max-width: 767.98px)` del archivo del componente (o la rama `esCelular` en JS). | Estilos base, tablet y escritorio. |
| "en tablet", "en el iPad" | Solo el bloque `@media (min-width: 768px) and (max-width: 1023.98px)` (o `esTablet`). | Celular y escritorio. |
| "en escritorio", "en desktop", "en la compu", "en la notebook", "en el monitor" | Solo `@media (min-width: 1024px)` (o `esEscritorio`). Si el cambio también tiene que valer en tablet, decilo en la respuesta y usá `@media (min-width: 768px)`. | Celular. |
| "en todos lados", "siempre", o no nombra pantalla y el cambio no depende del ancho | Los estilos base del componente. | — |
| Nombra un ancho o un modelo ("en 360 se corta", "en mi Samsung") | Se corrige en su rango (celular, tablet o escritorio) con un valor fluido que sirva para todo el rango, nunca con un corte nuevo para ese ancho o modelo. | Los otros rangos. |

Reglas para escribir el cambio:
1. Cada archivo .css tiene como máximo un bloque por rango (`767.98`, tablet, `1024`, y si hace falta `min-width: 768px`). Si ya existe, el cambio va adentro; si no existe, se crea uno solo, después de los estilos base del componente.
2. Nada de `!important` para ganarle a otro bloque: si no aplica, el orden o la especificidad están mal y se corrige eso.
3. Al terminar, se mide en los anchos de la tabla del rango tocado y en los bordes del rango vecino (767/768 o 1023/1024) para confirmar que el otro rango no cambió.

## 3. Qué es distinto en cada rango (cómo está hoy y cómo tiene que quedar todo lo nuevo)

| Tema | Celular (< 768) | Tablet (768–1023,98) | Escritorio (≥ 1024) |
| :--- | :--- | :--- | :--- |
| Navegación | Barra inferior (`MobileBottomNav`) + menú "Más" (`MobileMoreSheet`) + cabecera móvil | Cabecera superior compacta: sin título del logo ni nombre/email del usuario (perfil como botón circular) | Cabecera superior completa |
| Margen lateral del contenido | `--container-px-mobile` (20px) + área segura; arriba `--mobile-top-clearance` (48px) + área segura | 32px arriba, `--container-px-tablet` (32px) a los costados | 40px arriba, `--container-px-desktop` (48px); ancho máximo `--content-max-w` |
| Modales | Hoja desde abajo (bottom sheet) a todo el ancho; pie con `--modal-footer-pad-bottom` = máx(24px, área segura + 16px) | Ventana centrada con el ancho de su tamaño (`--modal-w-sm/md/lg/xl`); pie 20px | Igual que tablet |
| Calendario y hora (DateInput / TimeInput) | Hoja desde abajo | Ventanita (popover) | Ventanita (popover) |
| Grillas de tarjetas | 1 columna (salvo grillas de íconos chicos, como categorías en 4 columnas) | 2 o 3 columnas según el componente | Las columnas del diseño de escritorio |
| Texto de botones | Puede pasar a 2 renglones (`white-space: normal; text-wrap: balance`) | 1 renglón si entra | 1 renglón si entra |
| Gráficos de barras de Presupuestos y Metas | Columnas de 86px como mínimo; si no entran todas asoma media barra; nombres hasta 2 renglones | Igual | Igual |
| Tablas | Con su contenedor en `overflow-x: auto` | Igual | Igual |

## 4. Reglas que valen en los tres rangos

- Letra mínima 11px en todo texto que se lee (en CSS, en Tailwind `text-[Npx]` y en `fontSize` en línea). Si no entra, se deja partir en 2 renglones (line-clamp + title) o se ajusta el espacio; nunca se achica la letra. Única excepción: la letra de respaldo dentro de un ícono o avatar de 20px o menos.
- Zona de toque mínima 44 × 44px con un área invisible (`::before` o `::after` con `inset` negativo) sin cambiar lo que se ve. La cápsula (`SegmentedControl`) queda en 28px visibles con su área de toque ya resuelta.
- Montos: nunca cortados con "…". Si no entran, `MontoFit` muestra la forma corta (`formatMontoCorto`: "$ 1,2 M") con el monto completo en `title` y `aria-label`. En `PageSummaryBar`, todo ítem con monto lleva `valorCorto`.
- `white-space: nowrap` solo con ellipsis + title, con `MontoFit`, o con el comentario `/* nowrap-ok: <motivo> */` en la misma línea.
- Nada de `100vw` (incluye la barra de scroll y genera desborde horizontal): `100%`.
- Anchos fijos grandes con `min(Npx, 100%)`.
- Excepciones permanentes: el selector Pesos/Dólares de `BalanceCard`; la cápsula sin pista, card ni fondo detrás; el pie de los modales (`ModalFooter`).

## 5. Ajustes finos dentro del celular (chico vs grande) sin cortes nuevos

Si algo se ve bien en un celular grande pero apretado en uno chico, no se agrega `@media (max-width: 400px)` ni nada parecido. Se usa un valor fluido que vaya de A (en el celular más chico, 320px) a B (en 768px):

`clamp(A, calc(A + (B - A) * (100vw - 320px) / 448), B)`

Ejemplo: gap de 8px en 320 y 12px desde 768 → `gap: clamp(8px, calc(8px + 4 * (100vw - 320px) / 448), 12px);`. Los valores fluidos que ya existen (calculados desde 360) no se rehacen. Si el componente vive dentro de una caja que no ocupa todo el ancho, se usa una container query (`container-type: inline-size` y unidades `cqi`) en vez de `vw`. También sirven `min()`, `max()`, `flex-wrap` y `grid-template-columns: repeat(auto-fit, minmax(min(Npx, 100%), 1fr))`.

## 6. Prohibido

- Cualquier corte de ancho distinto de los de la sección 1 (639, 640, 600, 480, 479, 420, 360, 920, 1100, etc.).
- La sintaxis de rango (`width < 768px`, `768px <= width`): no funciona en celulares viejos.
- `max-width: 768px`, `max-width: 767px`, `max-width: 1024px` y `max-width: 1023px` (se solapan o dejan huecos en los bordes).
- `window.innerWidth` o `matchMedia` de ancho fuera de `useViewport`.
- Achicar la letra o el área de toque para que algo entre.

## 7. Controles automáticos (si fallan, el cambio está mal; nunca se aflojan para que pasen)

- `src/styles/puntosDeCorte.test.ts`: cortes oficiales, sin rango ni solapes, legado congelado (la lista LEGADO y `TOPE_LEGADO` solo pueden bajar). Hoy quedan cortes viejos en áreas todavía no revisadas, incluido `@media (max-width: 480px)` de `tokens.css` para `--modal-block-gap`: se migran en las fases por área, nunca se copian.
- `src/components/ui/uiResponsive.test.ts`: componentes compartidos (letra, nowrap, toque, botones de cerrar con área de 44px).
- `src/styles/responsiveAreas.test.ts`: las mismas reglas para cada carpeta ya revisada (lista `AREAS`; cada fase agrega la suya).
- `npm run lint` (incluye `audit:rules`, regla R15 de cortes).

## 8. Checklist antes de dar algo por terminado

1. ¿El cambio está solo en el rango pedido? ¿Los bordes del rango vecino (767/768, 1023/1024) quedaron iguales?
2. ¿Se midió en todos los anchos del rango (sección 1), desde el más chico hasta el más grande, y no solo en uno?
3. ¿Hay desborde horizontal (`scrollWidth > clientWidth` en `html`)? Tiene que ser 0.
4. ¿Hay letra < 11px, montos con "…", tocables < 44px o textos cortados sin title?
5. ¿Pasan `npx vitest run`, `npx tsc -b` y `npm run lint`?
