# CONSTITUCIÓN DEL DISEÑO UNIFICADO — ARGENTUM

Documento normativo de arquitectura visual, tokens, componentes canónicos y reglas de interfaz para Argentum Frontend.  
Cualquier desarrollo, refactorización o auditoría de componentes debe adherir estrictamente a los estándares definidos en esta especificación.

---

## 1. Principios y Uso de este Documento

1. **Unicidad del Sistema:** Todo valor de espaciado, radio, color, sombra o apilamiento debe derivar exclusivamente de las variables CSS de tokens (`tokens.css` y `elevation.css`). Prohibido introducir píxeles literales o tokens ad-hoc.
2. **Jerarquía Funcional:** El diseño transmite estructura lógica sin depender de ornamentaciones innecesarias ni movimientos distractores.
3. **Contención Física:** Ningún elemento puede desbordar o recortar visualmente sus sombras o focos sobre sus contenedores vecinos.
4. **Protección Automática:** Cada regla está custodiada por controles automatizados (`npm run audit:rules`), impidiendo regresiones en el flujo de integración continua.

---

## 2. Escala de Espaciado

La escala de espaciado de Argentum está calibrada para ofrecer ritmo vertical armónico y predictibilidad en todas las densidades de pantalla.

| Token | Valor | Uso Normativo |
| :--- | :--- | :--- |
| `--space-2xs` | `2px` | Ajustes sub-pixel, bordes internos, microalineación. |
| `--space-xs` | `4px` | Padding interno de controles compactos, pista de selectores. |
| `--space-icon` | `6px` | Separación exclusiva entre ícono y texto; separación interna de controles. |
| `--space-sm` | `8px` | Gap entre etiqueta y campo (`--modal-label-gap`), grupos compactos. |
| `--space-md` | `12px` | Padding vertical de secciones, gap entre botones de footer (`--modal-footer-gap`). |
| `--space-lg` | `16px` | Separación estándar entre campos (`--modal-field-gap`), padding de tarjetas. |
| `--space-xl` | `20px` | Padding lateral obligatorio en modales y sheets (`--modal-pad-x`). |
| `--space-2xl` | `24px` | Separación vertical entre bloques principales de contenido (`--modal-group-gap`). |
| `--space-3xl` | `32px` | Separación entre módulos o secciones mayores. |
| `--space-4xl` | `40px` | Márgenes estructurales y descansos visuales amplios. |
| `--space-5xl` | `48px` | Separación máxima entre macrosecciones de layout. |

---

## 3. Sombras, Niveles, Alcance y Regla de Contención

El sistema de elevación traduce profundidad espacial en una escala de 5 niveles principales, más los estados semánticos de selección y la cápsula oficial.

### Tabla de Elevación y Alcance (Reach)

El **alcance** (`reach`) mide cuántos píxeles se extiende la sombra fuera de la caja perimetral del elemento.  
Fórmula conservadora de cálculo:  
$$\text{alcance} = |\text{offset-x}| + |\text{offset-y}| + \text{blur} + \max(\text{spread}, 0)$$  
Para sombras compuestas por múltiples capas, rige el valor máximo entre capas.

| Nivel Semántico | Token de Sombra | Alcance Light | Alcance Dark | Token de Alcance Máximo |
| :--- | :--- | :--- | :--- | :--- |
| Píldora Activa | `--elevation-pill` | 4px | 4px | `--elevation-reach-pill`: `4px` |
| Nivel 1 (Micro) | `--elevation-xs` | 4px | 4px | `--elevation-reach-xs`: `4px` |
| Nivel 2 (Baja) | `--elevation-sm` | 16px | 18px | `--elevation-reach-sm`: `18px` |
| Nivel 3 (Media) | `--elevation-md` | 20px | 20px | `--elevation-reach-md`: `20px` |
| Nivel 4 (Alta) | `--elevation-lg` | 44px | 46px | `--elevation-reach-lg`: `46px` |
| Nivel 5 (Máxima) | `--elevation-xl` | 60px | 60px | `--elevation-reach-xl`: `60px` |
| Selección Tarjeta | `--elevation-selection` | 34px | 38px | `--elevation-reach-selection`: `38px` |
| Selección en Modal | `--elevation-selection-modal` | 38px | 44px | `--elevation-reach-selection-modal`: `44px` |

### Regla Fundamental de Contención
Un contenedor con `overflow: hidden`, `overflow: auto` o `overflow: clip` **debe tener un padding mayor o igual al alcance de la sombra mayor de sus hijos en ese eje**.  
> **Prohibición:** Queda terminantemente prohibido compensar cortes de sombra aplicando márgenes negativos (`margin: -...`).

---

## 4. Capas de Apilamiento (Z-Index)

El apilamiento z-index está estructurado por capas semánticas fijas. Todo contexto de apilamiento en Argentum debe referenciar exclusivamente estos tokens:

| Token | Valor | Propósito y Contexto de Apilamiento |
| :--- | :--- | :--- |
| `--z-base` | `0` | Flujo normal y base del documento. |
| `--z-raised` | `1` | Elementos interactivos sobre la base con leve elevación. |
| `--z-dropdown` | `100` | Menús desplegables estándar y autocompletados en página. |
| `--z-sticky` | `200` | Encabezados fijos al scroll (`position: sticky`). |
| `--z-fixed` | `300` | Barras de navegación persistentes y controles flotantes fijos. |
| `--z-overlay` | `400` | Telón de fondo oscuro (backdrop) para modales y drawers. |
| `--z-modal` | `500` | Diálogos modales y hojas inferiores (drawers/sheets). |
| `--z-popover-top` | `550` | Desplegables, selectores o datepickers abiertos desde adentro de un modal vía portal. |
| `--z-toast` | `600` | Notificaciones flotantes globales y toasts de feedback. |
| `--z-tooltip` | `700` | Capa superior absoluta para información contextual de ayuda. |

> **Contextos de Apilamiento (Stacking Context):** Un elemento con `z-index: 500` crea un nuevo contexto para sus hijos. Cualquier menú desplegable abierto dentro de un modal que deba montar en portal requiere `--z-popover-top` (550) para quedar indefectiblemente por encima del cuerpo del modal sin competir con toasts globales (`--z-toast: 600`).
> 
> **Filtros desplegables:** la barra de filtros lleva z-index var(--z-dropdown) y el listado nunca lleva z-index mayor.

---

## 5. Selector Cápsula Oficial (`SegmentedControl`)

El selector cápsula es el control oficial unificado para selección mutuamente excluyente (pestañas, tipos de movimiento, métodos de pago, filtros, frecuencias, etc.).

### Tokens y Medidas del Selector
- `--radius-selector-track`: `14px` (radio exterior de la pista contenedora).
- `--radius-selector-pill`: `10px` (radio de la píldora activa interior, concéntrico con la pista).
- `--selector-track-pad`: `var(--space-xs)` (`4px`).
- `--selector-gap`: `var(--space-xs)` (`4px`).
- `--selector-pill-h`: `40px` (modo horizontal o inline).
- `--selector-pill-h-stacked`: `56px` (modo vertical o apilado con ícono superior).
- `--selector-track-bg`: `var(--page)` (fondo neutro de la pista).
- `--selector-track-border`: `var(--border)` (borde sutil contenedor).
- `--selector-pill-bg-active`: `var(--surface)` en light / `var(--surface-alt)` en dark.
- `--selector-pill-border-active`: `transparent` en light / `rgba(255, 255, 255, 0.10)` en dark.
- `--selector-hover-bg`: `rgba(0, 0, 0, 0.04)` en light / `rgba(255, 255, 255, 0.05)` en dark.

**Geometría Táctil y Accesibilidad:**  
Píldora (40px) + padding de pista (4px) + borde (1px) = **~50px de altura total**, superando con holgura el objetivo táctil de 44px exigido por WCAG 2.5.5 (Target Size Enhanced).

### Ejemplo Canónico de Uso en React:
```tsx
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import { useState } from 'react'

type TipoMovimiento = 'gasto' | 'ingreso'

const OPCIONES: SegmentedControlOption<TipoMovimiento>[] = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'ingreso', label: 'Ingreso' },
]

export function FiltroTipo() {
  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')

  return (
    <SegmentedControl
      options={OPCIONES}
      value={tipo}
      onChange={setTipo}
      fullWidth
      ariaLabel="Seleccionar tipo de transacción"
    />
  )
}
```

---

## 6. Botones de Acción (`ui/Button`)

El componente canónico `ui/Button` estandariza las interacciones principales en modales y páginas:

- **Variantes soportadas:**
  - `primary`: Botón principal de confirmación / guardado.
  - `secondary`: Acción secundaria neutral.
  - `outline`: Acción bordeada de soporte.
  - `ghost`: Botón sin fondo para acciones contextuales discretas.
  - `danger`: Acción destructiva explícita (e.g. eliminar).
- **Regla del Footer de Modales:**
  El footer de todo modal debe contener exactamente **dos botones**, sin línea divisoria superior:
  - Botón "Cancelar" o secundario: `flex: 1`
  - Botón "Confirmar" / principal: `flex: 2`
  - Gap entre botones: `--modal-footer-gap` (`var(--space-md)` = 12px).

---

## 7. Anatomía Unificada del Modal

La estructura de modales en Argentum sigue un patrón invariable:

1. **Indicador de Pasos Superior (`stepDots`):**
   - Fijo en la parte superior del modal.
   - Si el modal tiene **una sola etapa**, NO se muestran puntos de paso.
   - Tokens: `--stepdots-pad`, `--stepdot-height` (5px), `--stepdot-active-width` (20px), `--stepdot-inactive-width` (6px), `--stepdot-gap` (`var(--space-icon)` = 6px).
2. **Encabezado y Contenido:**
   - El título y los botones de volver/cerrar pertenecen al flujo del contenido scrolleable, no a una cabecera fija que robe espacio.
   - `--modal-pad-x`: `var(--space-xl)` (`20px`) en todo el lateral.
   - `--modal-content-pad-top`: `var(--space-md)` (`12px`).
   - `--modal-content-pad-bottom`: `var(--space-lg)` (`16px`).
   - `--modal-field-gap`: `var(--space-lg)` (`16px`) entre campos consecutivos.
   - `--modal-group-gap`: `var(--space-2xl)` (`24px`) entre bloques temáticos.
   - `--modal-label-gap`: `var(--space-sm)` (`8px`) entre etiqueta e input.
   - `--modal-radius`: `var(--radius-modal)` (`20px`).
   - `--modal-max-h`: `90dvh`.
3. **Acciones Destructivas:**
   - Botones de peligro como "Eliminar" se colocan al final del contenido del modal con confirmación, **nunca** compartiendo el footer de navegación.
4. **Footer:**
   - `--modal-footer-pad-top`: `var(--space-md)` (`12px`).
   - `--modal-footer-pad-bottom`: `var(--space-lg)` (`16px`).
   - `--modal-footer-gap`: `var(--space-md)` (`12px`).
   - **Sin borde divisor superior** (`border-top: none`).
   - Dos botones: Cancelar (`flex: 1`) + Confirmar (`flex: 2`).

### Sección Pendiente
altura adaptativa automática y unificación del contenedor ui/Modal, incluidos MobileMoreSheet y Drawer, se resuelven en la tanda del Modal base.

---

## 8. Reglas de Contención y Entorno

- **Caja Confinada:** Ningún elemento interactivo puede generar desbordes laterales o barras de scroll involuntarias.
- **Prohibición de Márgenes Negativos:** Los márgenes negativos para "compensar" padding o estirar fondos violan el modelo de contención y están prohibidos.
- **Focos Seguros:** Todo `focus-visible` debe usar un `outline-offset: -2px` hacia adentro para evitar ser recortado por contenedores con `overflow: hidden`.

---

## 9. Animaciones y Física de Movimiento

- **Curvas Easing Funcionales:** Prohibido el uso de curvas con rebote elástico (`cubic-bezier` con $y_1$ o $y_2 > 1$).
- **Selectores Sin Transform:** Las píldoras de selección no deben aplicar `scale()` o `translateY()` al cambiar de estado; la profundidad se comunica con elevación (`--elevation-pill`), peso de fuente y luminancia.
- **Accesibilidad Motriz:** Toda transición debe anularse bajo `@media (prefers-reduced-motion: reduce)`.

---

## 10. Lo Terminantemente Prohibido

1. ❌ Usar `z-index` con literales arbitrarios fuera de `-1, 0, 1, 2, 3` o de las variables `--z-*`.
2. ❌ Usar `border-radius: 24px` (el radio estándar es `--radius-modal: 20px` o `--radius-control: 12px`).
3. ❌ Márgenes negativos en cualquier propiedad `margin`.
4. ❌ Sombras hardcodeadas que no usen `var(--elevation-*)`.
5. ❌ Sombras con `!important`.
6. ❌ Curvas `cubic-bezier` con valores de aceleración $> 1.0$.
7. ❌ Líneas divisorias (`border-top`) en selectores de clase `footer`.
8. ❌ Valores de `gap` en px que no pertenezcan a la escala `{0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48}`.
9. ❌ `overflow-x: hidden !important`.
10. ❌ Nuevos componentes modales en TSX que no compongan sobre `ui/Modal`.
11. ❌ Nuevas implementaciones ad-hoc de barras segmentadas fuera de `SegmentedControl`.
12. ❌ Nuevas definiciones dispersas de `.stepDots` en CSS.

---

## 11. Comandos de Verificación Previos al Commit

Antes de registrar cualquier cambio en el repositorio, deben ejecutarse:

```bash
# 1. Chequeo de sintaxis, reglas de diseño y tipos
npm run lint

# 2. Auditoría estricta de reglas de diseño contra la línea base
npm run audit:rules

# 3. Compilación completa de producción (Vite + TypeScript)
npm run build
```

### Candado antes de subir cambios
Al correr npm install o npm run dev se instala un control que corre npm run audit:rules en cada git push y lo corta si se rompen las reglas.
El CI de GitHub repite este mismo control en cada integración remota.
La línea base solo se baja con node scripts/audit-design-rules.mjs --update-baseline, nunca a mano.
Si el control corta el push, hay que corregir las reglas señaladas antes de reintentar.
No se usa --no-verify bajo ninguna circunstancia para eludir la verificación de diseño.
El objetivo del candado es asegurar que los cambios de todos los colaboradores respeten el diseño unificado de forma automática.

---

## 12. Estado de Migración de Pantallas

| Pantalla / Módulo | Estado | Tanda Planificada |
| :--- | :--- | :--- |
| Filtros de Transacciones y Transferencias | Hecho (tanda 2) | Tanda 2 |
| Transacciones | Pendiente | Fases Futuras |
| Transferencias | Pendiente | Fases Futuras |
| Tarjetas | Pendiente | Fases Futuras |
| Metas | Pendiente | Fases Futuras |
| Presupuestos | Pendiente | Fases Futuras |
| Billeteras | Pendiente | Fases Futuras |
| Suscripciones | Pendiente | Fases Futuras |
| Dashboard | Pendiente | Fases Futuras |
| Perfil | Pendiente | Fases Futuras |
| Herramientas / Admin | Pendiente | Fases Futuras |

---

## 13. Referencias y Fuentes Normativas

- **Queensland Government Design System — Spacing System:**  
  https://designsystem.qld.gov.au/styles/spacing
- **Dylan Tarre — Z-Index Scale Architecture:**  
  https://skills.cat/skills/dylantarre/design-system-skills/z-index-scale
- **W3C CSSWG — Clip Path & Shadow Containment Issue #9107:**  
  https://github.com/w3c/csswg-drafts/issues/9107
- **W3C WCAG 2.2 — Understanding Target Size (Enhanced) Success Criterion 2.5.5:**  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
