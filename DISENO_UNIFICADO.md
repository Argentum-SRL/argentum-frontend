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
| `--space-xs` | `4px` | Padding interno de controles compactos. |
| `--space-icon` | `6px` | Separación exclusiva entre ícono y texto; separación interna de controles. |
| `--space-sm` | `8px` | Gap entre etiqueta y campo (`--modal-label-gap`), grupos de opciones (`--modal-option-gap`). |
| `--space-md` | `12px` | Separación entre campos (`--modal-field-gap`), gap entre botones de footer (`--modal-footer-btn-gap`). |
| `--space-lg` | `16px` | Separación entre bloques en móviles `<= 480px` (`--modal-block-gap`), padding de tarjetas. |
| `--space-xl` | `20px` | Separación entre bloques (`--modal-block-gap`), header a contenido (`--modal-header-gap`), padding lateral (`--modal-pad-x`). |
| `--space-2xl` | `24px` | Separación vertical de último contenido a footer (`--modal-footer-gap`). |
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
| Píldora Activa | `--elevation-pill` | 6px | 8px | `--elevation-reach-pill`: `8px` |
| Nivel 1 (Micro) | `--elevation-xs` | 4px | 4px | `--elevation-reach-xs`: `4px` |
| Nivel 2 (Baja) | `--elevation-sm` | 16px | 18px | `--elevation-reach-sm`: `18px` |
| Nivel 3 (Media) | `--elevation-md` | 20px | 20px | `--elevation-reach-md`: `20px` |
| Nivel 4 (Alta) | `--elevation-lg` | 44px | 46px | `--elevation-reach-lg`: `46px` |
| Nivel 5 (Máxima) | `--elevation-xl` | 60px | 60px | `--elevation-reach-xl`: `60px` |
| Selección Tarjeta | `--elevation-selection` | 34px | 38px | `--elevation-reach-selection`: `38px` |
| Selección en Modal | `--elevation-selection-modal` | 38px | 44px | `--elevation-reach-selection-modal`: `44px` |
| Selección en Carrusel | `--elevation-selection-carousel` | 18px | 20px | `--elevation-reach-selection-carousel`: `20px` |

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

> **Política de Z-Index (Regla R01):**  
> - Los valores enteros literales de `0` a `99` son **VÁLIDOS** para control de orden y apilamiento local dentro de un componente o subárbol aislado.  
> - A partir de `100` inclusive, o cualquier valor negativo menor a 0, debe utilizarse obligatoriamente un token semántico `var(--z-*)`.  
> - Todo selector con z-index fuera de ese rango es auditado y bloqueado por R01.

> **Contextos de Apilamiento (Stacking Context):** Un elemento con `z-index: 500` crea un nuevo contexto para sus hijos. Cualquier menú desplegable abierto dentro de un modal que deba montar en portal requiere `--z-popover-top` (550) para quedar indefectiblemente por encima del cuerpo del modal sin competir con toasts globales (`--z-toast: 600`).
> 
> **Filtros desplegables:** la barra de filtros lleva z-index var(--z-dropdown) y el listado nunca lleva z-index mayor.

---

## 5. Selector Cápsula Oficial (`SegmentedControl`)

### Excepción Permanente de Diseño: BalanceCard
El selector de moneda (Pesos/Dólares) del componente `BalanceCard` (`src/components/dashboard/BalanceCard/BalanceCard.tsx` y `BalanceCard.module.css`; clases `.currencyToggle`, `.currencyBtn`, `.currencyBtnActive`) conserva de forma permanente e inalterable su diseño redondeado original por directiva de producto de Sebastián. Queda estrictamente excluido de migraciones de selectores, remapeos de elevaciones y escalas de gap.

### Unificación Total de Selectores (Fase fv3r)
TODO selector de elección propio del producto (tabs, pills, toggles) usa la cápsula oficial `ui/SegmentedControl`, incluidas las pantallas Perfil, Herramientas, Admin y la página Diseño.
- **Excepciones permanentes:** `ui/SegmentedControl.*` y `components/dashboard/BalanceCard/**` (su `.currencyToggle` no se migra).
- **Controles no cápsula por naturaleza (no se migran):** Grilla de días del mes (`CicloFinancieroSelector` `.dayGrid`), muestras de color (`ColorPicker`), grilla de categorías (`CategoriaSelector` `.catGrid`), listas de filtros con muchas opciones desplegables (`FilterBar`), tarjetas de elección con contenido rico (`ui/SelectableSurface`, `PresupuestoModal` `.renewalOptions`, `CalculoCuotasResumen` `.planGrid`), y muestrarios comparativos del catálogo de diseño (`InteractiveDemos`).

El selector cápsula es el control oficial unificado para selección mutuamente excluyente (pestañas, tipos de movimiento, métodos de pago, filtros, frecuencias, etc.). Corresponde a la cápsula de la "Opción 1" de la página admin Diseño (sin pista, sin card, sin fondo detrás), con el botón elegido en `var(--primary)` y texto blanco; la "Opción 4" tiene pista o card y NO es la oficial.
Diseño final sin pista contenedora (sin card ni fondo detrás de los botones): botones sueltos en fila con gap 6px (`--selector-gap`). El botón inactivo no tiene fondo ni borde, con texto gris (`var(--text-2)`), 13px y peso 600. El botón elegido se destaca con fondo `var(--primary)`, texto `#FFFFFF`, peso 700 y sombra suave `var(--elevation-pill)` (alcance 8px), idéntico al punto activo del indicador de pasos. El hover sobre botones inactivos solo cambia el color del texto a `var(--text)` sin aplicar fondo.
ui/SegmentedControl ES la cápsula de la "Opción 1" de la página admin Diseño (sin pista, sin card, sin fondo detrás), con el botón elegido en `var(--primary)` y texto blanco por decisión de Sebastián del 17/10; la "Opción 4" tiene pista o card y NO es la oficial.

### Tokens y Medidas del Selector
- `--radius-selector-pill`: `10px` (radio del botón de selección).
- `--selector-gap`: `var(--space-icon)` (`6px`).
- `--selector-pill-h`: `40px` (y `44px` en pantallas táctiles con `@media (pointer: coarse)`).
- `--selector-pill-h-stacked`: `56px` (modo vertical o apilado con ícono superior).
- `--selector-pill-bg-active`: `var(--primary)`.
- `--selector-pill-text-active`: `#FFFFFF`.

**Geometría Táctil y Accesibilidad:**  
Píldora de 40px en entornos de escritorio y 44px en entornos táctiles (`@media (pointer: coarse)`), satisfaciendo plenamente el objetivo táctil de 44px exigido por WCAG 2.5.5 (Target Size Enhanced).

### Propiedad opcional `description`
El tipo `SegmentedControlOption` admite la prop opcional `description?: string`:
- **Para qué sirve:** Renderiza una segunda línea de texto auxiliar bajo la etiqueta (`label`) dentro de un contenedor en columna (`.text`), con tipografía compacta (11px), peso 500, opacidad 0.8 y ellipsis en caso de desborde.
- **Cuándo usarla:** Especialmente útil en modos apilados (`layout="stacked"`) donde se requiera exhibir un valor asociado o dato numérico complementario (por ejemplo, cotizaciones de divisas como `$ 1.234` debajo de la denominación `MEP` o `BLUE`) evitando truncamientos horizontales en modales angostos.
- **Carácter opcional:** Si no se define `description`, el DOM conserva la estructura estándar de una sola línea (`span.label`) sin envoltorio adicional.

### Propiedad opcional `badge`
El tipo `SegmentedControlOption` admite la prop opcional `badge?: number | string`:
- **Para qué sirve:** Renderiza un indicador compacto con fondo adaptativo (`.badge`) inmediatamente después de la etiqueta.
- **Cuándo usarlo:** Contador junto a la etiqueta (por ejemplo, número de transacciones o registros de historial en pestañas).
- **Carácter opcional:** Si no se define `badge`, no se genera ningún elemento adicional.

### Layout multilínea `wrap`
El componente `SegmentedControl` admite la opción `layout="wrap"` (además de `'inline'` y `'stacked'`):
- **Para qué sirve:** Distribuye los botones del selector en varias filas (`flex-wrap: wrap`) con autoajuste flexible (`flex: 1 1 auto`) y espaciado horizontal padding `--space-md`.
- **Cuándo usarlo:** Listas de 4 o más opciones que no entran en una fila (por ejemplo, frecuencias de cobro como mensual, bimestral, trimestral, semestral, anual).

### Estado de Migración a SegmentedControl
| Ubicación | Componente / Selector | Estado | Observación |
| :--- | :--- | :--- | :--- |
| `BalanceCard.tsx` | Toggle de Moneda (Pesos / Dólares) | Excepción explícita | Se preserva el diseño original redondeado con píldora blanca activa y track translúcido (.currencyToggle / .currencyBtn) por preferencia visual expresa de Sebastián. NO migrar a SegmentedControl. |
| `CicloFinancieroSelector.tsx` | Días Frecuentes (Presets Rápidos) | Migrado | `fullWidth={false}`, `layout="inline"`. Limpieza de `.quickDayBtn`, `.quickDayBtnActive`. |
| `CicloFinancieroSelector.tsx` | Modo, Calendario y Reglas hábiles | No migrado | No es selector de opciones excluyentes de texto corto: tarjetas explicativas con subtítulos y grilla 1..31. |
| `GoalDetailModal.tsx` | Pill de Moneda | No migrado | Badge informativo de solo lectura (`<span>`), no es un control interactivo de selección. |
| `PresupuestoDetailModal.tsx` | Pills de Moneda y Período | No migrado | Badges informativos de solo lectura (`<span>`), no son controles interactivos de selección. |
| `PresupuestoModal.tsx` | Atajos de Categorías (`presetsBar`) y `catCard*` | No migrado | Atajos por lote sobre estado multiselección con acción "Limpiar", y tarjetas colapsables con subcategorías. |
| `PagarResumenModal.tsx` | Chips de Monto Rápido (`quickChipsRow`) | No migrado | Atajos para prellenar input numérico libre (`MontoInput`); el modal ya usa `SegmentedControl` para `tipoPago`. |
| `FilterBar.tsx` | Presets de fecha y submit `Aplicar` | No migrado | Selector de tipo ya usa `SegmentedControl`; `typePillActive` eliminado del submit; presets de fecha son acciones rápidas de popover. |
| `TabFinanzas.tsx` | Selector de Moneda Principal (Pesos / Dólares) | Migrado | `fullWidth={false}` en página de usuario. Limpieza de `.currencySelectGrid`, `.currencyOptionCard`. |
| `DashboardPage.tsx` | Tabs de unidad ($ / %) | No migrado | Requiere modificar `DashboardPage.parte1.css` fuera de permitidas.txt. |
| `TabFinanzas.tsx` | Tarjetas de Tipo de Dólar | No migrado | Grilla de tarjetas informativas complejas con cotizaciones dinámicas (compra/venta). |

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
  - Gap entre botones: `--modal-footer-btn-gap` (`12px`).

---

## 7. Anatomía Unificada del Modal y Sistema de Espaciado

### Fundamento y Principios de Diseño
El sistema de espaciado para formularios, modales y hojas inferiores de Argentum se basa en las mejores prácticas internacionales de diseño de interacción y sistemas de diseño de gobierno e industria, fundamentadas en el principio de proximidad de Gestalt (la relación espacial comunica relación semántica con una razón de distancias de al menos 2:1 entre niveles jerárquicos):
- **Scottish Government Design System — Form Spacing:** [designsystem.gov.scot/guidance/forms/form-spacing](https://designsystem.gov.scot/guidance/forms/form-spacing) (separaciones consistentes entre etiqueta-campo y grupos de campos).
- **Hennepin County Design System — Spacing and Sizing in Forms:** [hennepincounty.gov/design-system/patterns/forms/spacing-sizing](https://hennepincounty.gov/design-system/patterns/forms/spacing-sizing) (distancia entre campos 24px o 50-75% de la altura del control; secciones al doble o triple).
- **Phoenix Group — Compound Design System:** [compound.thephoenixgroup.com](https://compound.thephoenixgroup.com) (etiqueta a campo 8px, entre grupos de campos 16px, entre fieldsets 16-32px, último campo a botones 32px, error a siguiente grupo 16px).
- **Liferay Lexicon — Forms Design Pattern:** [liferay.design/lexicon/core-components/forms](https://liferay.design/lexicon/core-components/forms) (relleno 24px escritorio / 16px móvil, 24px entre componentes consecutivos, 48px/32px título a formulario).
- **IBM Carbon Design System — Form Style:** [carbondesignsystem.com/components/form/style](https://carbondesignsystem.com/components/form/style) (escala estructurada y ritmo vertical predecible).
- **Ontario Design System — Spacing:** [designsystem.ontario.ca](https://designsystem.ontario.ca) (etiquetas vinculadas estrechamente a sus controles en base 8px).
- **Nielsen Norman Group — Web Form Design Best Practices:** [nngroup.com/articles/web-form-design](https://nngroup.com/articles/web-form-design) (la etiqueta debe estar perceptiblemente más cerca de su campo que de cualquier otro elemento; una sola columna de lectura).

### Escala Canónica de Espaciado en Modales (Sistema v3 por Relación)
El sistema de espaciado para formularios, modales y hojas inferiores de Argentum se basa en el principio de proximidad de Gestalt (el espacio entre elementos comunica su grado de relación semántica; cosas relacionadas van juntas, cosas distintas separadas):

| Token | Valor | Propósito Semántico |
| :--- | :--- | :--- |
| `--modal-label-gap` | `8px` | Separación vertical entre etiqueta, texto de ayuda o mensaje de error y su control. El texto de ayuda va adentro del campo. |
| `--modal-option-gap` | `8px` | Separación entre ítems de una misma pregunta: filas de opciones/toggles, radios, chips, tarjetas de lista corta, pestañas (`[data-modal-options]`). |
| `--modal-field-gap` | `12px` | Separación vertical entre campos consecutivos dentro del mismo bloque temático (misma pregunta o tema). |
| `--modal-block-gap` | `20px` (`16px` en `max-width: 480px`) | Separación vertical entre bloques temáticos independientes (preguntas distintas). Se reduce en móviles para optimizar altura. |
| `--modal-section-title-gap` | `10px` | Separación vertical entre el subtítulo de un bloque y su primer elemento. |
| `--modal-header-gap` | `20px` | Separación vertical entre el encabezado del modal y el primer bloque de contenido. |
| `--modal-footer-gap` | `24px` | Separación vertical entre el último bloque de contenido y la botonera del pie (footer). |
| `--modal-footer-btn-gap` | `12px` | Separación (gap) horizontal o vertical entre los botones de acción del footer. |
| `--modal-pad-x` | `20px` | Relleno lateral uniforme en el cuerpo y pie del modal. |

Regla de Gestalt: ninguna distancia entre campos (`12px`) puede ser mayor o igual que la distancia entre bloques (`20px` / `16px`). Los grupos de opciones (`8px`) y las etiquetas/ayudas (`8px`) se mantienen cohesionados con su control.

### Mecanismo Único por Atributos de Marcado
Para evitar CSS duplicado o ad-hoc en cada modal, el espaciado se gobierna centralizadamente desde `Modal.module.css` mediante atributos HTML semánticos:
- `[data-modal-frame]`: Contenedores estructurales (slide, `modalContainer`, `formContainer`, `slidesContainer`, `mobileDrawerContainer`, etc.). Aplica `display: flex; flex-direction: column; gap: 0; width: 100%; min-height: 0;`. Header, cuerpo y footer se separan exclusivamente por sus tokens normativos, nunca por gap del frame estructural.
- `[data-modal-stack]`: SOLO el contenedor del CUERPO del modal (el área de contenido scrolleable o editable). Gap = `--modal-block-gap` (20px / 16px). NUNCA en contenedores estructurales ni en elementos que contengan directamente header o footer (R26 = 0).
- `[data-modal-block]`: Contenedor de un grupo de elementos de UNA sola pregunta o tema con gap `--modal-field-gap` (12px). Un aviso/alerta que comenta al grupo va dentro del mismo bloque a 12px.
- `[data-modal-field]`: Contenedor de control + su etiqueta/ayuda/error con gap `--modal-label-gap` (8px). El texto de ayuda vive DENTRO del campo, debajo del control, sin márgenes propios inline.
- `[data-modal-options]`: Contenedor de lista de ítems de una misma pregunta (toggles, tarjetas de opción, radios, chips) con gap `--modal-option-gap` (8px).
- `[data-modal-section-title]`: Subtítulo o encabezado de bloque; aplica `margin-bottom: var(--modal-section-title-gap)` (10px).
- `[data-modal-delete]`: Identifica la acción destructiva de eliminar la entidad del modal; se ubica exclusivamente al final del contenido (último bloque), nunca en el header ni en el footer.
- **Prohibición de estilos inline en modales (R27):** Queda terminantemente prohibido usar estilos inline con `margin` o `padding` vertical para forzar separaciones dentro de modales; el ritmo visual se gobierna exclusivamente por los tokens y atributos del sistema.

### Estructura Canónica del Modal

1. **Indicador de Pasos Superior (`stepDots`):**
   - Fijo en la parte superior del modal a través de la prop opcional `stepDots={{ total, current }}` (current empieza en 0).
   - Si el modal tiene **una sola etapa** (`total <= 1`), NO se muestran puntos de paso.
   - Con `total > 1`, se expone como un contenedor accesible `role="progressbar"` con `aria-valuenow`, `aria-valuemin="1"`, `aria-valuemax` y `aria-label="Paso X de Y"`.
   - Tokens: `--stepdots-pad`, `--stepdot-height` (5px), `--stepdot-active-width` (20px), `--stepdot-inactive-width` (6px), `--stepdot-gap` (`var(--space-icon)` = 6px). Definición única en `Modal.module.css`.
2. **Encabezado y Contenido:**
   - `--modal-pad-x`: `20px` lateral.
   - `--modal-header-gap`: `20px` de separación hacia el contenido.
   - `--modal-radius`: `var(--radius-modal)` (`20px`).
   - `--modal-max-h`: `90dvh` (solo unidades dvh en modales y hojas).
   - Altura fluida por contenido scrolleable interno con footer fijo.
3. **Acciones Destructivas:**
   - Botón marcado con `[data-modal-delete]` al final del último bloque de contenido con confirmación, **nunca** compartiendo el footer.
4. **Footer:**
   - Implementado mediante `ModalFooter` (`secondary?: ReactNode`, `primary: ReactNode`).
   - Separación hacia el contenido: `var(--modal-footer-gap)` (`24px`).
   - Gap entre botones: `var(--modal-footer-btn-gap)` (`12px`).
   - Sin borde divisor superior (`border-top: none`).
   - Cancelar: `flex: 1`, Confirmar / Principal: `flex: 2`. Sin acción secundaria: el principal ocupa todo el ancho.
5. **Apilamiento y Cierre de Modales Múltiples:**
   - Soporte para modales y hojas anidadas (por ejemplo selectores de fecha o país abiertos desde un modal):
   - Contador de bloqueo de scroll a nivel de módulo en `Modal.tsx` (`activeModalsCount`) que restaura el scroll del body solo al desmontar el último modal abierto.
   - Pila de escape (`modalEscapeStack`) que garantiza que al presionar la tecla `Escape` se cierre exclusivamente el modal superior (último montado) sin cerrar el modal inferior.
   - Overlay unificado en capa `z-index: var(--z-modal)`.

### Ejemplo Canónico de Uso en React:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Título"
  stepDots={{ total: 2, current: 0 }}
  footer={
    <ModalFooter
      secondary={<Button variant="secondary" onClick={onClose}>Cancelar</Button>}
      primary={<Button onClick={guardar}>Confirmar</Button>}
    />
  }
>
  <div>Contenido del modal</div>
</Modal>
```

> **Altura de modales y modales de varios pasos:** todos los modales resuelven su altura exclusivamente mediante CSS (`max-height: var(--modal-max-h); overflow: hidden; min-height: 0;`), con el cuerpo scrolleando por dentro (`overflow-y: auto; flex: 1;`) y el footer siempre visible fijo al fondo (`flex-shrink: 0;`). Sin mediciones en JS ni hooks de altura adaptativa (100% de los modales migrados del hook `useAdaptiveModalHeight` al patrón CSS estándar). En modales de varios pasos, el paso activo va en el flujo normal y los inactivos en absolute y ocultos. Los pasos de un modal no tienen alto fijo; alto por contenido con tope var(--modal-max-h); en modales y hojas solo dvh.

### Carrusel Canónico Único (`[data-modal-carousel]`)
Todos los carruseles horizontales de tarjetas de billeteras o crédito dentro de modales se definen de manera unificada mediante atributos semánticos en `Modal.module.css`:
- **Scroller (`[data-modal-carousel]`):**
  - Desplazamiento horizontal con `overflow-x: auto; overflow-y: hidden;`.
  - Sangrado lateral *full-bleed*: `margin-inline: calc(-1 * var(--modal-pad-x))` con comentario `r03-ok`, compensado exactamente con `padding-inline: var(--modal-pad-x)` y `scroll-padding-inline: var(--modal-pad-x)`. La primera card queda perfectamente alineada al contenido (a 20px) y al deslizar se ve continua hasta el borde del modal.
  - Alojamiento vertical de sombras: `padding-top: var(--carousel-reach-top)` (3px) y `padding-bottom: var(--carousel-reach-bottom)` (15px), correspondientes al alcance real de `--elevation-selection-carousel`.
  - Compensación vertical sin agrandar el layout: `margin-top: calc(-1 * var(--carousel-reach-top))` y `margin-bottom: calc(-1 * var(--carousel-reach-bottom))` con el comentario normativo de patrón (4): `/* r03-ok: compensa el padding que aloja la sombra de selección para que el carrusel mida lo mismo que sus cards */`.
  - Resultado: la distancia visible de la etiqueta a la card es exactamente `--modal-label-gap` (8px) y de la card al siguiente bloque es `--modal-block-gap` (20px / 16px en <=480px) o `--modal-footer-gap` (24px), sin holguras sobrantes.
- **Pista (`[data-modal-carousel-track]`):**
  - Flexbox en fila con `gap: 12px` y `scroll-snap-type: x mandatory`.
  - Centrado automático cuando hay una sola card (`carouselCenter`) y alineación al inicio (`carouselStart`) cuando hay varias.
  - Prohibido crear clases duplicadas como `.billeterasCarouselScroller`, `.billeteraSelectWrap`, `.tarjetaSelectWrap` o overrides `:global(.wc*)` en modales (custodiado por regla R23).

### Card de Billetera Unificada (`BilleteraCard`)
El componente `BilleteraCard` soporta dos variantes unificadas:
1. `variant="full"` (por defecto): Geometría inalterable para la página Billeteras y su pila de tarjetas móviles (con menú kebab, navegación y frontCard activa).
2. `variant="select"`: Variante estándar obligatoria para todo carrusel o selector en modales:
   - Proporción estricta de tarjeta ID-1 (1.65 / 1).
   - Ancho fluido gobernado por contenedor: `width: min(clamp(var(--select-card-w-min, 208px), 72cqi, var(--select-card-w-max, 248px)), calc(100cqi - 48px))` sobre `[data-modal-carousel]` (`container-type: inline-size`).
   - Pisos tipográficos de legibilidad estricta: `.selectTipo` piso 10px (`clamp(10px, 4.4cqi, 10.5px)`) y `.selectMonedaBadge` piso 9px (`clamp(9px, 4cqi, 9.5px)`).
   - Dimensionamiento interno escalable mediante Container Queries (`container-type: inline-size` y unidades `cqi`).
   - Contenido unificado: Logo circular de 28px, nombre en una línea con ellipsis, estrella de billetera principal o ícono de inversión, y slot opcional para insignias contextuales (ej. "Cuenta en pesos"). Sin kebab ni botones de navegación.
   - Zona inferior: Línea de metadatos con el tipo ("Cuenta", "Efectivo", "Inversión") y chip de moneda ("ARS" / "USD"), y el saldo principal grande en formato tabular que nunca se corta.
   - La previsualización de tarjetas de crédito (`RealCardPreview`) adopta la misma proporción 1.65:1 y dimensiones para convivir armónicamente en carruseles mixtos.

### Criterio de Scroll Legítimo y Form Body Único (Decisión 4)
- **Scroll Único del Modal Base:** En formularios y diálogos estándar, el scroll vertical es único y reside exclusivamente en el contenedor `.content` del `Modal` base. Se prohíbe el doble scroll interno en `.formBody`, slides o pasos de formulario (`overflow-y: auto` ilegítimo).
- **Excepciones Legítimas Acotadas por Diseño:** Un `overflow-y: auto` propio es legítimo únicamente en:
  1. Catálogos y pickers de selección acotados con buscador (ej. `BankPickerModal.pickerBody`, `SearchModal`).
  2. Listas de cuentas o entidades dentro de filtros (ej. `TransferenciasFilterMobileModal.accountsList` con max-height).
  3. Feeds de actividad o notificaciones (ej. `NotificacionesDrawer.scrollArea`).
  4. Historiales temporales y áreas de recorte (ej. `BudgetHistoryModal`, `FotoCropModal`).
- **Paddings Internos de Sub-tarjetas vs Duplicados Perimetrales:** Se distingue estrictamente el padding interno de tarjetas o acordeones (ej. `.opcionesAvanzadasContent { padding: 14px }` en `EditBilleteraModal`), el cual es justificado, del padding perimetral que duplica los márgenes del modal base (eliminado en `ModalErrorBoundary`, `BalanceCicloModal`, `ProyeccionModal`, etc.).

### Ícono de Movimiento Unificado (`MovimientoAvatar` y `resolverVisualMovimiento`)
Todo listado o fila de transacciones, cuotas o movimientos debe utilizar exclusivamente el componente canónico `ui/MovimientoAvatar`, alimentado por la función pura `resolverVisualMovimiento(entrada)` (`src/lib/utils/movimientoVisual.utils.ts`).  
El orden estricto de resolución es:
- **S1 (Suscripciones):** Si el movimiento proviene de una suscripción (`suscripcion_id`, cuota de grupo con suscripción, o coincidencia exacta de descripción con el catálogo), muestra el logo oficial de la marca vía `findServicioCatalogo(nombre)`. Si es una suscripción sin logo o genérica (ej. "Gimnasio"), recurre al `SubcategoriaIcon` de su subcategoría.
- **S2 (Aportes/Retiros de Metas):** Ícono unificado `Target` en todos los listados (eliminando inconsistencias con íconos genéricos de ahorro).
- **S3 (Subcategoría específica):** `SubcategoriaIcon` correspondiente a la subcategoría del movimiento.
- **S4 (Subcategoría general u otros):** `CategoriaIcon` de la categoría padre (o ícono por defecto).
- **S5 (Movimientos pendientes de IA):** Ícono por defecto con distintivo de chispa.
- **S6 (Transferencias):** Ícono vectorial propio de transferencia.
Prohibido renderizar íconos de subcategoría o categoría directamente dentro de bucles `.map` de movimientos fuera de `MovimientoAvatar` (regla R24).

#### Caché de Suscripciones (Decisión 6)
`MovimientoAvatar` dispara en su primer montaje la carga compartida de suscripciones vía una única promesa (`getCachedSuscripciones()`), incluso cuando el movimiento no incluye `suscripcion_id`, permitiendo matchear por nombre servicios como Netflix en el Dashboard. Dicha caché se invalida reactivamente llamando a `setCachedSuscripciones(data)` desde `SuscripcionesPage` y `SuscripcionModal` tras crear, modificar o eliminar registros.

### Regla Canónica para Inputs de Monto (`MontoInput`)
Todo campo de formulario destinado a ingresar o editar montos de dinero debe utilizar de manera obligatoria el componente canónico `ui/MontoInput`. Los campos numéricos dedicados a cuotas, porcentajes, plazos o tasas de cambio conservan inputs numéricos estándar.

---

### Variante Bottom Sheet (`variant="sheet"`)
El componente `Modal` soporta la prop `variant?: 'dialog' | 'sheet'` (por defecto `'dialog'`).
- En modo `'sheet'`, el modal se ancla al fondo de la pantalla en todas las resoluciones, adopta bordes redondeados superiores (`border-radius: var(--modal-radius) var(--modal-radius) 0 0`), ancho completo responsivo hasta un máximo canónico y padding inferior adaptado al área segura (`env(safe-area-inset-bottom)`).
- Todos los diálogos, modales de error y sheets (incluyendo `MobileMoreSheet` y `ModalErrorBoundary`) componen sobre esta base unificada.
- El overlay se apila rigurosamente en `z-index: var(--z-modal)`.
- Indicador de pasos: se gestiona exclusivamente a través de la prop `stepDots={{ total, current }}` del Modal base.

## 8. Reglas de Contención y Entorno

- **Caja Confinada:** Ningún elemento interactivo puede generar desbordes laterales o barras de scroll involuntarias.
- **Política de Márgenes Negativos (Regla R03):** Queda terminantemente prohibido el uso arbitrario de márgenes negativos. Un margen negativo es VÁLIDO únicamente si responde a uno de los cuatro patrones documentados de diseño:
  1. *Solapamiento intencional:* Efecto físico de cartas o tarjetas apiladas (ejemplo: pila interactiva de tarjetas en billeteras).
  2. *Sangrado a los bordes (full-bleed):* Extensión intencional de un elemento hacia los extremos dentro de un contenedor con padding perimetral (ejemplo: carruseles dentro de modales).
  3. *Alineación óptica o colapso de borde:* Ajuste sub-píxel de 1 a 2 px para microalineación visual.
  4. *Compensación de padding de sombra de selección en carrusel:* Compensa el padding vertical necesario para alojar la sombra de selección y elevación sin alterar la altura visible del carrusel ni la distancia a sus etiquetas/elementos adyacentes (`/* r03-ok: compensa el padding que aloja la sombra de selección para que el carrusel mida lo mismo que sus cards */`).
  Cada margen negativo válido debe contar obligatoriamente en la línea inmediatamente anterior con un comentario estructurado:
  `/* r03-ok: <motivo concreto en español, mínimo 15 caracteres, redactado analizando el componente> */`.
  Cualquier margen negativo sin esta anotación es computado como violación estricta por el auditor (R03).
- **Focos Seguros:** Todo `focus-visible` debe usar un `outline-offset: -2px` hacia adentro para evitar ser recortado por contenedores con `overflow: hidden`.
- **Política de Borrado por Terminal:** Queda terminantemente prohibido borrar archivos desde la terminal o scripts salvo autorización explícita de Sebastián en el prompt del paso, cumpliendo rigurosamente las 4 pruebas de orfandad (sin imports estáticos/dinámicos, sin referencias en configs/json, sin menciones en código y tsc idéntico antes/después).

---

## 9. Animaciones y Física de Movimiento

- **Curvas Easing Funcionales:** Prohibido el uso de curvas con rebote elástico (`cubic-bezier` con $y_1$ o $y_2 > 1$).
- **Selectores Sin Transform:** Las píldoras de selección no deben aplicar `scale()` o `translateY()` al cambiar de estado; la profundidad se comunica con elevación (`--elevation-pill`), peso de fuente y luminancia.
- **Accesibilidad Motriz:** Toda transición debe anularse bajo `@media (prefers-reduced-motion: reduce)`.

---

## 10. Lo Terminantemente Prohibido

1. ❌ Usar `z-index` con literales $\ge 100$ o negativos fuera de `var(--z-*)` (los valores 0 a 99 son válidos exclusivamente para orden local dentro de un componente).
2. ❌ Usar `border-radius: 24px` (el radio estándar es `--radius-modal: 20px` o `--radius-control: 12px`).
3. ❌ Márgenes negativos en cualquier propiedad `margin` sin comentario `/* r03-ok: ... */` que documente su patrón legítimo.
4. ❌ Sombras hardcodeadas que no usen `var(--elevation-*)`.
5. ❌ Sombras con `!important`.
6. ❌ Curvas `cubic-bezier` con valores de aceleración $> 1.0$.
7. ❌ Líneas divisorias (`border-top`) en selectores de clase `footer`.
8. ❌ Valores de `gap` en px que no pertenezcan a la escala `{0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48}`.
9. ❌ `overflow-x: hidden !important`.
10. ❌ Nuevos componentes modales en TSX que no compongan sobre `ui/Modal`.
11. ❌ Nuevas implementaciones ad-hoc de barras segmentadas fuera de `SegmentedControl`.
12. ❌ Definiciones duplicadas de `.stepDots` en CSS (R13 = 1: únicamente en `Modal.module.css`).
13. ❌ Espaciados no canónicos en CSS de modales/hojas (R20): prohibido margin-top/bottom o gap fuera de 8px, 16px o 24px, o sin usar tokens `var(--modal-*)`.
14. ❌ Contenedores con overflow que recorta sin padding suficiente para contener sombras o levantamientos (R21).
15. ❌ Modales con elementos de formulario que no implementen `[data-modal-block]` (R22).
16. ❌ Elementos `<select>` nativos de HTML en módulos de la app (`pages/app/**`) (R34 = 0). Todo dropdown o selector de opciones debe utilizar `SelectInput` (`@/components/ui/SelectInput`) o superficies de selección unificadas.
17. ❌ Márgenes perimetrales redundantes en raíces de páginas/módulos (`pages/app/**`) (R35 = 0): prohibido declarar `padding-inline` propio, `max-width` artificial centrado con `margin: 0 auto`, o `padding-bottom` que duplique el despeje de la barra de navegación móvil gestionado por `AppLayout`.
18. ❌ Textos o etiquetas visibles al usuario con siglas "ARS" o "USD" (R36 = 0). La interfaz debe presentar exclusivamente "Pesos" (en vez de "ARS") y "Dólares" (en vez de "USD"), formateando billeteras con `formatMoneda(moneda)` y montos con `formatMonto(monto, moneda)`.

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

## 12. Sistema Responsive

### Escala de Puntos de Corte Permitida y Rangos de Dispositivos
La arquitectura responsive de Argentum se rige por la escala canónica custodiada por R15 (`{360, 479, 480, 639, 640, 719, 720, 767, 768, 1023, 1024, 1279, 1280, 1439, 1440, 1919, 1920, 2559, 2560}`):

| Rango de Ancho | Clasificación de Dispositivo | Escala / Variables |
| :--- | :--- | :--- |
| `320px - 359px` | Teléfonos chicos (iPhone SE) | Vista compacta, sin truncamiento en selectores |
| `360px - 479px` | Teléfonos estándar | Vista móvil base |
| `480px - 767px` | Teléfonos grandes y tablet vertical | Bottom sheets activos |
| `768px - 1023px` | Tablet | Modales flotantes centrados |
| `1024px - 1439px` | Notebook | Layout de escritorio estándar |
| `1440px - 1919px` | Monitor | Layout amplio (`--screen-scale: 1`) |
| `1920px - 2559px` | Monitor grande | Factor de escala `--screen-scale: 1.1` (+10%) |
| `2560px` o más | Monitor muy grande / 4K | Factor de escala `--screen-scale: 1.2` (+20%) |

### Reglas Normativas Responsive
1. **Contención de la Cápsula (`SegmentedControl`):** La cápsula nunca corta texto con ellipsis (`text-overflow`) ni oculta contenido (`overflow: hidden`). Si el contenedor no tiene espacio suficiente, el track pasa fluidamente a la siguiente fila (`flex-wrap: wrap`).
2. **Propiedad `fullWidth`:** El modificador `fullWidth` solo se permite dentro de modales o en selectores que se ocultan en escritorio (`MOBILE-ONLY`). Los grupos de nivel página en escritorio no deben llevar `fullWidth`.
3. **Anchos Centralizados de Modales y Bottom Sheets:** Todos los modales y bottom sheets derivan sus medidas exclusivamente de las clases base del componente `Modal` (`.sm`, `.md`, `.lg`, `.xl`) y variables asociadas (`--modal-w-sm`, `--modal-w-md`, `--modal-w-md-wide`, `--modal-w-lg`, `--modal-w-xl`). Si un modal requiere un ancho específico, declara localmente `--modal-w: var(--modal-w-md-wide);` sin duplicar bloques de `@media` ni pisar con `!important`.
4. **Prohibición de Anchos Rígidos con `!important`:** Queda terminantemente prohibido declarar `width` o `max-width` fijos de 300px o más con `!important` en archivos CSS (custodiado por regla R17).
5. **Áreas Seguras Móviles (Safe Area):** Todo bottom sheet debe respetar el margen inferior del sistema mediante `padding-bottom: max(var(--modal-content-pad-bottom), env(safe-area-inset-bottom, 0px))` y análogamente en el footer.

### Matriz de Prueba
Toda verificación o certificación responsive debe comprobar el correcto renderizado en la siguiente matriz de resoluciones y condiciones:
- **Anchos:** 320px, 375px, 390px, 430px, 768px, 1024px, 1440px, 1920px, 2560px y 3840px.
- **Temas:** Modo Claro y Modo Oscuro.
- **Orientación:** Vertical y Horizontal en dispositivos móviles.

---

## 13. Estado de Migración de Pantallas

| Pantalla / Módulo | Estado | Tanda Planificada |
| :--- | :--- | :--- |
| Filtros de Transacciones y Transferencias | Hecho (tanda 2) | Tanda 2 |
| Modal base (ui/Modal) | Hecho (tanda 3a) | Tanda 3a |
| Selectores de TransaccionModal y TransferenciaModal | Hecho (tanda 3b) | Tanda 3b |
| Selectores de Metas, Presupuestos, Pagar resumen y Suscripción | Hecho | Tanda 3c |
| Altura adaptativa: TransaccionModal | Hecho | Tanda 3d |
| Carruseles de billeteras y tarjetas (6 copias) | Hecho | Tanda 3e |
| Espaciado modales: Transacciones y Transferencias | Hecho | Tanda 3f |
| Espaciado modales: resto | Hecho | Tanda 3g |
| Pestañas, filtros y grupos de opciones (Transacciones, Billeteras, Metas, Presupuestos, filtros, Cuotas, Explicativo, Presupuesto, Herramientas) | Hecho | Tanda 3h |
| Bottom sheets de filtros | Hecho | Tanda 3i |
| Tamaños de modal y bottom sheet centralizados | Hecho | Tanda 3i |
| Pestañas y selectores pendientes (Perfil: animación hover en íconos; Administración: AdminPage, AnimacionPreviewPage, MonitorWppPanel; Dashboard: switch $/%; PresupuestoModal: presets multiselección; PagarResumenModal: quickChips; tarjetas de elección: onboarding, CicloFinancieroSelector, StepMoneda, SuscripcionModal catálogo; BalanceCard: botones de moneda) | Pendiente | Tandas siguientes |
| Espaciado modales: reglas saltadas (márgenes negativos y rem: SuscripcionModal.module.css, NotificacionesConfigModal.module.css, ProyeccionModal.module.css) | Pendiente | Tanda de estructura |
| Altura adaptativa: resto de modales | Hecho | Tanda 3l |
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

## 14. Referencias y Fuentes Normativas

- **Scottish Government Design System — Form Spacing:**  
  https://designsystem.gov.scot/guidance/forms/form-spacing
- **Hennepin County Design System — Spacing and Sizing in Forms:**  
  https://hennepincounty.gov/design-system/patterns/forms/spacing-sizing
- **Phoenix Group — Compound Design System Forms Spacing:**  
  https://compound.thephoenixgroup.com
- **Liferay Lexicon — Forms Design Pattern:**  
  https://liferay.design/lexicon/core-components/forms
- **IBM Carbon Design System — Form Style:**  
  https://carbondesignsystem.com/components/form/style
- **Ontario Design System — Spacing:**  
  https://designsystem.ontario.ca
- **Nielsen Norman Group — Web Form Design Best Practices:**  
  https://nngroup.com/articles/web-form-design
- **Queensland Government Design System — Spacing System:**  
  https://designsystem.qld.gov.au/styles/spacing
- **Dylan Tarre — Z-Index Scale Architecture:**  
  https://skills.cat/skills/dylantarre/design-system-skills/z-index-scale
- **W3C CSSWG — Clip Path & Shadow Containment Issue #9107:**  
  https://github.com/w3c/csswg-drafts/issues/9107
- **W3C WCAG 2.2 — Understanding Target Size (Enhanced) Success Criterion 2.5.5:**  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html

---

## 15. Sistema Canónico de Controles Base, Foco y Movimiento (Fase fv3n)

### 15.1 Tokens de Control de Entrada y Botones
Todos los controles estándar del sistema (`Input`, `Field`, `SelectInput`, `DateInput`, `TimeInput`, `PhoneCountrySelect`, `ColorPicker` y `Button`) derivan obligatoriamente de la escala centralizada en `tokens.css`:

| Token | Valor | Propósito |
| :--- | :--- | :--- |
| `--control-h` | `44px` | Altura estándar de todos los controles de entrada y botones interactivos. Satisface WCAG 2.5.5. |
| `--control-h-sm` | `36px` | Altura compacta exclusiva para controles o botones secundarios acotados. |
| `--control-radius` | `12px` | Radio de curvatura unificado para todos los controles del sistema (alineado con `Button`). |
| `--control-pad-x` | `14px` | Relleno horizontal uniforme en controles de texto y selectores. |
| `--control-font` | `15px` | Tamaño tipográfico en controles para pantallas de escritorio. |
| `--control-font-mobile` | `16px` | Tamaño tipográfico normativo en controles editables (`input`, `select`, `textarea`) en pantallas `<= 768px` para prevenir zoom automático indeseado en Safari iOS. |
| `--control-disabled-opacity` | `0.5` | Opacidad estándar para controles en estado deshabilitado (`:disabled` / `aria-disabled="true"`). |
| `--focus-ring` | `0 0 0 3px color-mix(in srgb, var(--primary) 35%, transparent)` | Indicador de foco por teclado de alta visibilidad (contraste `>= 3:1` sobre superficies del sistema). |
| `--modal-footer-btn-gap` | `12px` | Separación estándar oficial entre botones de acción en el pie de modales y hojas. |

#### Tabla de Controles del Sistema (Valores Resueltos)

| Control | Alto | Radio | Padding-X | Font Desktop | Font Mobile (<=768px) | Opacidad Deshabilitado | Foco Visible | Dentro del Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ui/Input` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/Field` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/SelectInput` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/DateInput` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/TimeInput` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/PhoneCountrySelect` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/ColorPicker` | `44px` | `12px` | `14px` | `15px` | `16px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/Button` | `44px` (`36px` sm) | `12px` | `16px` (`14px` sm) | `15px` | `15px` | `0.5` | `var(--focus-ring)` | SÍ |
| `ui/MontoInput (Hero)` | auto | `16px` | `16px` | `36px` | `36px` | `0.5` | `var(--focus-ring)` en contenedor | DESVÍO IDENTIDAD |
| `ui/MontoInput (Compact)` | auto | `12px` | `14px` | `36px` | `36px` | `0.5` | `var(--focus-ring)` en contenedor | DESVÍO IDENTIDAD |
| `ui/MontoInput (Outlined)` | `44px` | `12px` | `14px` | `15px` (prefijo `16px`) | `16px` | `0.5` | `var(--focus-ring)` en contenedor | SÍ |
| `ui/MontoInput (Compact+Outlined)` | `44px` | `12px` | `14px` | `15px` (prefijo `16px`) | `16px` | `0.5` | `var(--focus-ring)` en contenedor | SÍ |

### 15.2 Foco Accesible por Selector Base (Regla R28)
Todo selector interactivo en todo el alcance que aplique `outline: none` o `outline: 0` debe contar obligatoriamente en el mismo selector base con una regla `:focus`, `:focus-visible` o `:focus-within` que declare un indicador visual perceptible (`box-shadow: var(--focus-ring);`, borde perimetral en `var(--primary)` o `outline` visible). Se prohíbe silenciar el foco por teclado sin proporcionar retorno físico equivalente (R28 = 0).

### 15.3 Transiciones y Accesibilidad de Movimiento (Reglas R29 y R30)
- **Prohibición de `transition: all` (R29):** Queda terminantemente prohibido el uso de `transition: all` en componentes base, páginas, dominio y administración. Cada regla debe explicitar exactamente las propiedades transicionadas (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`, `color`, `filter`). R29 = 0.
- **Tokens de Movimiento Físico:**
  - `--motion-fast`: `150ms` (interacciones inmediatas, feedback táctil).
  - `--motion-base`: `220ms` (transiciones de estado y elevación).
  - `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)` (curva física canónica de desaceleración sin rebote).
- **Cobertura Obligatoria de Reduced-Motion por Selector Base (R30):** Toda animación (`@keyframes` / `animation`) o transición CSS en todo el alcance debe incluir cobertura explícita bajo `@media (prefers-reduced-motion: reduce)` en el mismo selector base (`transition: none; animation: none;`), preservando en loaders e indicadores de carga un ritmo atenuado sin inducir fatiga visual. R30 = 0.

### 15.4 Prevención de Hover Pegado en Pantallas Táctiles (Regla R31)
Todo efecto de interacción `:hover` que induzca movimiento o cambio dimensional (`transform`, `translate`, `scale`) en componentes o páginas del alcance debe estar estrictamente confinado dentro de `@media (hover: hover) and (pointer: fine)`. Esto previene que los elementos queden permanentemente elevados o distorsionados tras una pulsación táctil en dispositivos móviles o tabletas (R31 = 0). Las mutaciones cromáticas neutrales (`background-color`, `color`, `box-shadow`) pueden residir fuera de dicha media query para feedback inmediato.

### 15.5 Prevención de Auto-Zoom en Safari iOS (Regla R32)
Todo control de entrada real (`<input>`, `<select>`, `<textarea>`) en pantallas `<= 768px` debe resolver su tamaño de fuente a un mínimo normativo de `16px` (mediante `--control-font-mobile: 16px` o la regla defensiva de `index.css`). Queda prohibido el uso de tamaños inferiores a 16px en campos interactivos en vista móvil, eliminando el zoom forzado de viewport de iOS (R32 = 0).

### 15.6 Separación Unificada en Botoneras de Pie de Modal (Regla R33)
Toda fila o contenedor directo de botones de acción en el pie de un modal (`ModalFooter` o prop `footer`) debe usar obligatoriamente `gap: var(--modal-footer-btn-gap)` (12px). Se prohíbe el uso de separaciones divergentes (6px, 8px, literales sueltos) en pies de diálogo o wizard (R33 = 0).

### 15.7 Cobertura Universal y Cierre del Rediseño (Fase fv3p)
El rediseño visual por capas ha concluido exitosamente cubriendo el 100% de `src/`:
- **Capas previas completadas:** fv3m a fv3m5 (unificación canónica de modales y hojas), fv3n (unificación de controles base `src/components/ui/` y estructura `src/components/layout/`), fv3o (pantallas `src/pages/app/`, `src/pages/auth/`, onboarding, dominio y hojas globales).
- **Cierre en fv3p:** Extensión de reglas R28 a R33 a la administración interna (`src/pages/admin/**` y `src/pages/AdminPage.module.css`), corrección de regresión en `MontoInput` compact (36px restaurado), neutralización de conflictos en `data-modal-field` con filas, ajuste de transiciones con propiedades faltantes, normalización de EOL y actualización del baseline.
- **Excepciones Permanentes:**
  - `ui/SegmentedControl.*`: componente primitivo canónico intocable.
  - `src/components/dashboard/BalanceCard/*`: componente con excepción de diseño consolidada (selector `.currencyToggle` conserva diseño original).

### 15.8 Regla Normativa para data-modal-field en Filas Flex (D1-B)
El atributo `data-modal-field` inyecta desde `Modal.module.css` la regla `:global([data-modal-field]) { display: flex; flex-direction: column; width: 100%; gap: var(--modal-label-gap); }` con especificidad `0,1,0`. Cuando un control o grupo de controles requiera internamente disposición en fila horizontal (`display: flex; flex-direction: row;`), su clase CSS debe declararse explícitamente como selector compuesto:
```css
.miFila,
.miFila[data-modal-field] {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: auto;
}
```
La especificidad `0,2,0` garantiza que la fila flex prevalezca de forma determinista sobre la cascada del modal independientemente del orden de importación de módulos CSS.

### 15.9 Sistema de Equivalencia Estricta (Script Claude 12_equivalencia.mjs)
Para certificar cero regresiones visuales accidentales, los cambios de cascada y especificidad se auditan con el verificador de PostCSS de Claude:
- Evaluación exhaustiva en 40 entornos: 10 viewports (320x568 a 1440x900, incluyendo 844x390 y 390x844) x 2 perfiles de interacción (escritorio `hover: hover` / táctil `hover: none`) x 2 temas (claro / oscuro).
- Resolución estricta de cascada modular (`!important` > especificidad > orden de aparición), resolviendo `var()` a partir de `tokens.css` y `rem` a `px`.
- Límites documentados del análisis estático: no modela DOM en tiempo de ejecución, cascada cruzada entre archivos distintos ni estilos inline de TSX. Todo cambio no cubierto por tokens ni neutralización táctil documentada se clasifica estrictamente en fichas de control.

### 15.10 Pendientes de Decisión para Validación Visual de Sebastián
1. **BalanceCard y SegmentedControl:** Conservan transiciones y selectores internos sin alterar.
2. **Selectores Heredados (R12):** 17 definiciones de selectores de tabs/pills/toggles propios listadas para eventual migración tras validación en capturas reales.
3. **Controles Propios de Administración:** La administración conserva sus dimensiones internas funcionales (altos, radios y paddings propios) sin unificación forzada a escala de app.
4. **Declaraciones `!important` en Administración:** 53 declaraciones conservadas en 6 módulos de `pages/admin/**` y `AdminPage.module.css`.
5. **Desbordes Estáticos (B8):** Fondos ambientales decorativos de ancho amplio y contenedores de página con ancho natural gobernado por `AppLayout`.

---

## 16. Barras del Sistema Móvil, Safe Areas y PWA (Nov 2026)

### 16.1 Arquitectura y Mecanismo Técnico
Para que la barra de notificaciones superior (reloj, batería, notch/Dynamic Island) y la barra inferior/direcciones en iOS (Safari y PWA standalone) y Android (Chrome y PWA standalone) coincidan **exactamente al píxel y sin desfasaje temporal** con el fondo activo tanto en modo claro como en modo oscuro:

1. **Pre-render sin flash (`index.html` + `public/manifest.json`):**
   - `index.html` ejecuta un script inline sincrónico en `<head>` antes del primer pintado: resuelve el tema guardado (`localStorage`), asigna `data-theme="dark"` / `.dark` y fija la variable CSS `--system-bar-bg` al tono inicial del loader (`#FAF7F2` en claro, `#060B14` en oscuro).
   - `<meta id="meta-apple-status-bar" name="apple-mobile-web-app-status-bar-style" content="default" />` **debe permanecer siempre en `'default'`** (prohibido `black-translucent`). Así iOS toma el color real de `<meta name="theme-color">` y ajusta automáticamente los íconos de estado (negros sobre claro, blancos sobre oscuro).
   - `public/manifest.json` declara `"display": "standalone"`, `"background_color": "#FAF7F2"`, `"theme_color": "#FAF7F2"`.
   - *(Nota técnica iOS PWA):* si una PWA instalada en pantalla de inicio fue agregada antes de una actualización de `theme-color`, iOS puede conservar en caché el primer lanzamiento hasta completar el ciclo o reinstalar el acceso directo en Home Screen.

2. **Raíz del documento (`src/index.css`):**
   - `html` y `body` aplican `background-color: var(--system-bar-bg, var(--page));`, con `transition: color 0.2s ease;` en `html` (sin animar `background-color`). WebKit/Safari y Chromium muestrean estos nodos detrás de los márgenes y rebotes de scroll.

3. **Coordinación centralizada por pila LIFO (`src/utils/systemTheme.ts` + `src/context/ThemeProvider.tsx`):**
   - `ThemeProvider` invoca `syncSystemBarsForTheme(isDark)` ante cualquier cambio de tema.
   - Todo módulo que ocupa temporalmente el borde superior/inferior por encima del fondo `--page` llama a `registerSystemBarSurface(surface)` dentro de `useLayoutEffect` y retorna su función de limpieza (`useLayoutEffect(() => registerSystemBarSurface('...'), [])`).
   - `registerSystemBarSurface` administra una **pila LIFO**: si un hijo (`LunarLoading`) monta antes que un padre (`ThemeProvider`) o se superponen capas (`AtmosphericBackground` encima de `TermsPage`), siempre prevalece la superficie visible en la cima de la pila sin colisiones ni sobreescrituras al desmontar fuera de orden.
   - `updateSystemBars(color, isDark)` actualiza:
     - `--system-bar-bg`, `html.style.backgroundColor` y `body.style.backgroundColor`.
     - `root.style.colorScheme` y `<meta name="color-scheme">`.
     - Reemplaza el nodo `<meta id="meta-theme-color" name="theme-color">` en `<head>` (eliminando `<meta name="theme-color" media="...">` heredados) únicamente cuando cambia el hex, ya que Safari/WebKit frecuentemente ignora mutaciones `setAttribute('content')` in-place tras la carga inicial.

---

### 16.2 Tabla Canónica de Superficies (`SYSTEM_BAR_COLORS`)
Toda superficie de borde en la aplicación corresponde exclusivamente a una de las cuatro llaves definidas en [`SYSTEM_BAR_COLORS`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/utils/systemTheme.ts#L15-L20):

| Superficie (`SystemBarSurface`) | Token CSS Vinculado (`src/index.css`) | Light Hex | Dark Hex | Dónde aplica |
| :--- | :--- | :--- | :--- | :--- |
| `'app'` (default fallback) | `--page` | `#F5F4F0` | `#0E1117` | Shell principal (`AppLayout.main`), pantallas `/app/*`, columna derecha/móvil de `AuthLayout` |
| `'loading'` | `--lunar-bg` | `#FAF7F2` | `#060B14` | `LunarLoading` / `AtmosphericLoading` fullscreen (`fullScreen={true}`), `AnimacionPreviewPage` |
| `'atmospheric'` | top/bottom de `AtmosphericBackground` + `--lunar-bg-deep` en oscuro | `#FAF4EC` | `#020408` | `AtmosphericBackground` montado en `OnboardingPage`, `CrearPasswordBloqueo`, `NotFoundPage`, `RootErrorBoundary`, `PageErrorBoundary`, preview `ambient` |
| `'surface'` | `--surface` | `#FFFFFF` | `#161B24` | Pantallas independientes con cabecera `sticky`/`fixed` flush en `top: 0` usando `--surface` (ej. `TermsPage`) |

---

### 16.3 Reglas Críticas Anti-Desfasaje y Protección de Safe Areas
1. **Regla anti-lag frente al wildcard `*` de `src/index.css`:**
   - `src/index.css` define globalmente `*, *::before, *::after { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }`.
   - Mientras tanto, `updateSystemBars()` cambia `html`, `body` y `<meta name="theme-color">` de forma **instantánea (0ms)** al alternar el tema.
   - **OBLIGATORIO:** Todo contenedor raíz de página, overlay fullscreen, cabecera `sticky`/`fixed` en `top: 0` o bloque full-bleed con margen negativo que toque los bordes superior/inferior DEBE declarar un `transition:` explícito que excluya `background` y `background-color` (ejemplo: `transition: color 0.2s ease;` o `transition: border-color 0.2s ease, color 0.2s ease;`) e incluirse dentro de `@media (prefers-reduced-motion: reduce)` en el mismo archivo CSS (Regla **R30**).
   - **Prohibido** usar `transition: background ...` o `transition: background-color ...` en `.container`, `.main`, `.root`, `.pageRoot`, `.header`, `.footer`, `.topSafeBlend`, `.bottomSafeBlend`, `.topVignette`, `.bottomVignette` ni `.emptyState` fullscreen.
2. **Prohibido pisar `background-color` en gradientes de raíz:**
   - En superficies fullscreen con `radial-gradient` (como `AtmosphericBackground`), usar `background-image: radial-gradient(...)` junto a `background-color: #FAF4EC;` / `#020408;` — nunca el shorthand `background: radial-gradient(...)` que resetea `background-color` a `transparent`.
3. **Sellado sólido de Safe Areas (`env(safe-area-inset-*)`):**
   - Todas las viñetas y velos perimetrales (`.topSafeBlend`, `.bottomSafeBlend`, `.topVignette`, `.bottomVignette`) extienden el color exacto **100% sólido** desde `0%` hasta `env(safe-area-inset-top, 0px)` / `env(safe-area-inset-bottom, 0px)` antes de difuminar hacia `transparent`. Esto impide que halos de luz (`.lightSourceGlow`), estrellas de `<ConstellationCanvas />` o scroll del contenido tiñan la zona del reloj/notch o barra inferior.
4. **Prohibido montar superficies en ramas ocultas por CSS (`display: none`):**
   - CSS `display: none` **no desmonta React ni evita `useLayoutEffect`**. Nunca renderizar `<AtmosphericBackground>` ni llamar `registerSystemBarSurface(...)` dentro de bloques ocultos solo por `@media` (como un panel solo desktop). En `AuthLayout`, el `.leftPanel` de escritorio usa `<ConstellationCanvas />` directo y **no** `<AtmosphericBackground>`, dejando que en móvil `< 768px` la superficie activa siga siendo `'app'` (`var(--page)`).
5. **Contención de `!important` (Regla R10):**
   - Si una superficie entra en `@media (prefers-reduced-motion: reduce)`, agrupar el selector dentro de una regla existente o declarar `transition: none;` sin sumar nuevos `!important` fuera del presupuesto auditado.

---

### 16.4 Inventario Verificado de Módulos (Cobertura 100%)

| Módulo / Ruta | Superficie Activa | Mecanismo y CSS Verificado | Estado |
| :--- | :--- | :--- | :--- |
| **`index.html` + `public/manifest.json`** | Inicial `'loading'` -> resuelta por tema | Script pre-render sincrónico, `status-bar-style="default"`, `viewport-fit=cover`, manifest `standalone` `#FAF7F2` | Verificado |
| **`src/index.css` + `ThemeProvider.tsx`** | Sincroniza tema global + fallback `'app'` | `html`/`body` leen `--system-bar-bg` sin animar `background-color`; `syncSystemBarsForTheme(isDark)` en `useLayoutEffect` | Verificado |
| **`RootLayout` + `ProtectedRoute` (`<Suspense>` / guard)** | `'loading'` (`LunarLoading`) | `registerSystemBarSurface('loading')`, `.container` sin transición de fondo, `.topSafeBlend`/`.bottomSafeBlend` sólidos en `env(safe-area-inset-*)` | Verificado |
| **`RootErrorBoundary` / `PageErrorBoundary`** | `'atmospheric'` | `<AtmosphericBackground role="alert">` fullscreen con `.topVignette`/`.bottomVignette` sólidos hasta `safe-area` | Verificado |
| **`CrearPasswordBloqueo`** (`ProtectedRoute`) | `'atmospheric'` | `<AtmosphericBackground fullScreen>` + `<Modal>` encima (`overflow` sin cortar `safe-area`) | Verificado |
| **`OnboardingPage`** (`/onboarding`) | `'atmospheric'` | `<AtmosphericBackground className={styles.page}>` en carga (`OnboardingSkeleton`) y pasos; `padding-top` con `env(safe-area-inset-top)` | Verificado |
| **`AuthLayout` + todas las pantallas Auth** (`/login`, `/register`, `/login/telefono`, `/auth/verificar-email`, `/auth/verificar-telefono`, `/auth/recuperar-password`, `/reset-password`) | `'app'` (`--page`) | En móvil (`<768px`), `.mobile` cubre viewport sin `background` transition; `.leftPanel` desktop usa `<ConstellationCanvas />` (sin `<AtmosphericBackground>`) | Verificado |
| **`NotFoundPage`** (`*` y `/app/*`) | `'atmospheric'` | `<AtmosphericBackground role="main">` empuja `'atmospheric'` en pila LIFO sobre `ThemeProvider` / `AppLayout` | Verificado |
| **`TermsPage`** (`/terminos`) | `'surface'` (`--surface`) | `registerSystemBarSurface('surface')`; `.header` sticky en `top: 0` + `.container` + `.footer` sin transición de `background-color` y con `safe-area-inset-top/bottom` | Verificado |
| **`AppLayout` + módulos `/app/*`** (`Dashboard`, `Billeteras`, `BilleteraDetalle`, `Transacciones`, `Analisis`, `Presupuestos`, `Metas`, `LoQueSeRepite`, `Perfil`, `Tools`, `AdminPage`, `DisenoPage`) | `'app'` (`--page`) | `.main` con `background: var(--page)` y `transition: color 0.2s ease`; `.content` en móvil compensa `env(safe-area-inset-top)` sin cabecera opaca fija arriba; `MobileBottomNav` flota con `safe-area-inset-bottom` | Verificado |
| **`SuscripcionesPage` (`.emptyState` full-bleed)** | `'app'` (`--page`) | `.emptyRoot` sangra hasta `safe-area-inset-top` con `.emptyState { background: var(--page); }` y transición explícita sin `background-color` | Verificado |
| **`AnimacionPreviewPage`** (`/animacion`, `/app/animacion`) | `'loading'` (o `'atmospheric'` en tab `ambient`) | `.pageRoot` con `#FAF7F2` / `#060B14` y `transition: color 0.2s ease` sin lag de fondo; tabs `hero`/`ambient` delegan en pila LIFO | Verificado |
| **Modales, Sheets, Drawers y Toast** (`Modal`, `SearchModal`, `MobileMoreSheet`, `NotificacionesDrawer`, `ModalErrorBoundary`, `SileoToaster`) | Preserva superficie activa debajo del backdrop | Overlays usan backdrop translúcido con `z-index: var(--z-modal)` + `backdrop-filter`; bottom sheets compensan `env(safe-area-inset-bottom)`; `sileo.css` móvil posiciona bajo `safe-area-inset-top` | Verificado |

---

### 16.5 Guía Obligatoria para Módulos Nuevos (Playbook y Plantillas)

Antes de crear cualquier página o vista nueva, elegir **exactamente uno** de estos 5 casos y aplicar su patrón completo:

- **Caso A — Pantalla estándar dentro de `/app/*` (`AppLayout`):**
  - Hereda automáticamente `'app'` (`var(--page)`).
  - **No** llamar `registerSystemBarSurface`, **no** colocar `position: sticky/fixed; top: 0` sólido sobre la barra superior en móvil, y respetar el padding del contenedor `.content`.

- **Caso B — Pantalla fullscreen inmersiva / Error / Auth / Onboarding:**
  - Envolver la vista en `<AtmosphericBackground>` (o `<LunarLoading fullScreen>` si es estado de carga inicial). No duplicar `registerSystemBarSurface` en la página hija.
  - Si se usa clase wrapper (`className={styles.pageRoot}`), NO asignar `background`/`background-color` propio encima ni agregar `transition: background-color`.

- **Caso C — Página independiente con cabecera sticky/fixed en `top: 0` (tipo `TermsPage`):**
  1. Si la cabecera en `top: 0` usa `--surface` (`#FFFFFF` / `#161B24`), registrar en TSX:
     ```tsx
     useLayoutEffect(() => {
       return registerSystemBarSurface('surface')
     }, [])
     ```
     Si usa un tono distinto permanente, primero agregar la nueva superficie en `SystemBarSurface` y `SYSTEM_BAR_COLORS` (`src/utils/systemTheme.ts`), reflejar su token en `src/index.css` y agregar el assertion en `src/utils/systemTheme.test.ts`.
  2. Incluir `env(safe-area-inset-top, 0px)` en el `padding-top` de `.headerContent` y `env(safe-area-inset-bottom, 0px)` en `.footer`.
  3. En CSS Module, anular el wildcard `*` en `.container` y `.header` (y `.footer` si usa `--surface`) y cubrir **R30**:
     ```css
     .container { transition: color 0.2s ease; }
     .header { position: sticky; top: 0; background: var(--surface); transition: border-color 0.2s ease, color 0.2s ease; }
     @media (prefers-reduced-motion: reduce) {
       .container, .header { transition: none; animation: none; }
     }
     ```

- **Caso D — Bloque interno con sangrado al borde superior en móvil (tipo `SuscripcionesPage` `.emptyRoot`):**
  1. Mantener fondo idéntico a `--page` en el borde superior del bloque (o si es otra superficie completa, usar `registerSystemBarSurface`).
  2. Nunca animar `background` ni `background-color` en la propiedad `transition` del contenedor sangrado y añadirlo a `@media (prefers-reduced-motion: reduce)`.

- **Caso E — Modales, Bottom Sheets, Drawers o Paneles Ocultos Responsive:**
  1. Modales y sheets centrados/anclados abajo usan el `<Modal variant="dialog" | "sheet">` canónico (no cambian `registerSystemBarSurface`, excepto un modal fullscreen opaco edge-to-edge).
  2. Si un componente tiene dos layouts (`desktop` y `mobile`) alternados por CSS `display: none`, **nunca** montar `<AtmosphericBackground>` ni `registerSystemBarSurface` dentro del layout desktop oculto en móvil.

#### Checklist Pre-Push para Cualquier Módulo Nuevo
- [ ] Usa una de las 4 superficies de `SYSTEM_BAR_COLORS` (o amplía `SYSTEM_BAR_COLORS` + `systemTheme.test.ts` si realmente introduce superficie nueva).
- [ ] Ningún contenedor raíz, sticky/fixed `top: 0`, vignette o full-bleed anima `background` ni `background-color` (y todos declaran `transition` sin fondo para neutralizar `*` de `src/index.css`).
- [ ] Todo selector tocado tiene cobertura bajo `@media (prefers-reduced-motion: reduce)` (Regla R30) y cero `!important` nuevos (Regla R10).
- [ ] Se respetan `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
- [ ] Todo contenido móvil de primer nivel respeta `calc(env(safe-area-inset-top, 0px) + var(--mobile-top-clearance, 48px))` (sin duplicar `safe-area-inset-top` dentro de `AppLayout` ni poner `backdrop-filter` en headers opacos sticky `top: 0`).
- [ ] Se agregaron las aserciones de la nueva ruta/CSS en `src/utils/systemTheme.test.ts`.
- [ ] Verificación completa verde antes de commitear: `npm test`, `npm run lint` (`eslint` + `audit:rules`) y `npm run build`.

---

### 16.6 Zona de Desenfoque / Transición Superior en iOS 26 (Dynamic Island / Pocket Blur)

1. **Diagnóstico empírico verificado:**
   - En iOS 26 (iPhone con Dynamic Island como iPhone 16 Pro, Safari y PWA `standalone` con `apple-mobile-web-app-status-bar-style="default"`), el sistema proyecta un degradado progresivo suave (*scroll pocket / progressive blur feather*) por debajo de la línea de `env(safe-area-inset-top)` para fundir la transición entre la barra de estado y el contenido desplazable.
   - Mediante análisis píxel a píxel sobre capturas reales en iPhone 16 Pro (`DashboardPage`, `TransaccionesPage` y `PresupuestosPage`), el desvanecimiento alcanza exactamente **~36.0–36.4 CSS px** por debajo de `env(safe-area-inset-top, 0px)` (~95 CSS px desde el borde físico superior). El espaciado previo de `16px–24px` dejaba los encabezados y botones superiores dentro de ese tramo difuminado.
   - Nota CSS: en la app web propia **no existe** ningún overlay CSS `blur()` superior; el único `backdrop-filter` estructural en cabecera era redundante en `TermsPage.module.css` (`.header` ya opaco con `var(--surface)` en `top: 0`), el cual se eliminó para no sumar doble desenfoque sobre iOS.

2. **Token canónico único (`--mobile-top-clearance: 48px` en `src/styles/tokens.css`):**
   - `36.4px` de alcance máximo de transición + `11.6px` de margen de seguridad (Display Zoom / Larger Text) = **`48px`** (`calc(env(safe-area-inset-top, 0px) + var(--mobile-top-clearance, 48px))`), alineado con `--space-5xl`.

3. **Reglas obligatorias de holgura superior en toda la app:**
   - **Propietario único de `env(safe-area-inset-top)`:** En todas las pantallas `/app/*` y `/admin/*`, el shell [`AppLayout.module.css`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/components/layout/AppLayout/AppLayout.module.css) (`.content` en `max-width: 767px`) aplica el padding superior único `calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))`.
   - **Prohibido duplicar `env(safe-area-inset-top)` o sumar padding superior en hijos de `AppLayout`:** Ninguna página hija dentro de `AppLayout` puede agregar `env(safe-area-inset-top)` ni `padding-top > 0` en móvil (`<= 767px`). Todo contenido arranca exactamente en `48px + safe-area`. Excepción acoplada: bloques full-bleed con margen negativo superior (como [`SuscripcionesPage.module.css`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/pages/app/suscripciones/SuscripcionesPage.module.css) `.emptyRoot` y `.emptyState`) deben referenciar obligatoriamente `var(--mobile-top-clearance, 48px)` en ambos lados para mantener simetría exacta.
   - **Cero `backdrop-filter` sobre cabeceras opacas sticky `top: 0`:** Toda barra opaca anclada en `top: 0` (`TermsPage`) omite `backdrop-filter` y respeta `padding-top: calc(env(safe-area-inset-top, 0px) + var(--mobile-top-clearance, 48px))` en móvil (`<= 767px`), ajustando `scroll-margin-top` para anclas internas.
   - **Tope vertical en Modales y Bottom Sheets (`Modal.module.css`):** Para evitar que hojas altas en teléfonos grandes alcancen la franja blur superior, `.sheet` y `@media (max-width: 767px) .container` imponen `max-height: min(var(--modal-max-h), calc(100dvh - env(safe-area-inset-top, 0px) - var(--mobile-top-clearance, 48px)))`.
   - **Alineación unificada en pantallas standalone, controles flotantes y toasts:** Todo componente fuera de `AppLayout` o `position: fixed` en el borde superior en móvil usa `var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px)`.

4. **Mapa completo de cobertura superior en móvil (`<= 767px`):**

| Módulo / Elemento | Archivo CSS / TSX | Mecanismo aplicado |
| :--- | :--- | :--- |
| **Token global** | `src/styles/tokens.css` | `--mobile-top-clearance: 48px;` |
| **Shell `/app/*` y `/admin/*`** (Dashboard, Billeteras, BilleteraDetalle, Transacciones, Analisis, Presupuestos, Metas, LoQueSeRepite, Perfil, Herramientas, Admin, Diseno + todos los Skeletons) | `src/components/layout/AppLayout/AppLayout.module.css` | `.content` móvil con `padding-top: calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))` |
| **Normalización interna `/app/*`** | `PerfilPage.parte1.css`, `DashboardPage.parte1.css`, `LoQueSeRepitePage.module.css`, `AnalisisPage.module.css`, `DisenoPage.module.css` | Eliminado doble `env(safe-area-inset-top)` en Perfil; `padding-top: 0` móvil para alineación exacta en `48px` |
| **Sangrado full-bleed Suscripciones** | `src/pages/app/suscripciones/SuscripcionesPage.module.css` | `.emptyRoot` (margen negativo) y `.emptyState` sincronizados con `var(--mobile-top-clearance, 48px)` |
| **Términos y Condiciones (`/terminos`)** | `src/pages/TermsPage.module.css` | Removido `backdrop-filter` de `.header`; `.headerContent` móvil a `+ var(--mobile-top-clearance, 48px)` y `.section` `scroll-margin-top` compensado |
| **Auth (`/login`, `/register`, `/login/telefono`, `/auth/*`, `/reset-password`)** | `src/components/auth/AuthLayout/AuthLayout.module.css` | `.mobileInner` y `.standalone` (móvil) a `+ var(--mobile-top-clearance, 48px)`; `.themeToggle` alineado |
| **Botón flotante de tema** | `src/components/ui/ThemeToggle/ThemeToggle.module.css` | `.floating` móvil en `top: calc(env(safe-area-inset-top, 0px) + var(--mobile-top-clearance, 48px))` |
| **Onboarding (`/onboarding`)** | `src/pages/onboarding/OnboardingPage.module.css` | `.page` móvil con `padding-top: + var(--mobile-top-clearance, 48px)` y `.header` `padding-right: 52px` para despejar `ThemeToggle` |
| **Bloqueo crear contraseña** | `src/components/auth/CrearPasswordBloqueo/CrearPasswordBloqueo.module.css` | `.bgHeader` móvil (`<= 767px`) a `+ var(--mobile-top-clearance, 48px)` |
| **Preview Admin (`/animacion`, `/app/animacion` e íconos)** | `AnimacionPreviewPage.module.css`, `IconPlayground.tsx` | `.reopenControlsBtn`, `.modularShowcase` e `IconPlayground` en móvil despejan `env(safe-area-inset-top) + var(--mobile-top-clearance, 48px)` |
| **Pantallas de carga, Error 404 y ErrorBoundaries** | `LunarLoading.module.css`, `AtmosphericBackground.module.css` | Conservan velos opacos sobre el safe area e inyectan `padding-top: + var(--mobile-top-clearance, 48px)` en móvil |
| **Modales y Bottom Sheets** | `src/components/ui/Modal/Modal.module.css` | `.sheet` y `.container` móvil limitados por `min(var(--modal-max-h), calc(100dvh - env(safe-area-inset-top, 0px) - var(--mobile-top-clearance, 48px)))` |
| **Toasts móviles (`Sileo`)** | `SileoToaster.tsx`, `src/styles/sileo.css` | `[data-sileo-viewport]` y `offset.top` unificados en `calc(var(--mobile-top-clearance, 48px) + env(safe-area-inset-top, 0px))` |

---

## 17. Norma Canónica de Márgenes, Contenedores y Ritmo Vertical de Módulos (Desktop y Mobile)

### 17.1 Principio de Propietario Único del Shell (`AppLayout`)
Para garantizar alineación matemática perfecta y ausencia de saltos o desalineaciones visuales al cambiar de pantalla:
1. **El contenedor [`AppLayout.module.css`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/components/layout/AppLayout/AppLayout.module.css) es el ÚNICO dueño de los márgenes y rellenos perimetrales exteriores:**
   - **Márgenes laterales (Eje X):**
     - Mobile (`<= 767px`): `var(--container-px-mobile, 20px)`.
     - Tablet (`768px - 1024px`): `var(--container-px-tablet, 32px)`.
     - Desktop (`> 1024px`): `var(--container-px-desktop, 48px)`.
     - *Prohibición:* Ninguna página o módulo hijo dentro de `/app/*` puede declarar `padding-inline` propio, `max-width` artificial centrado con `margin: 0 auto` (como el previo `1440px` de Análisis), ni márgenes que desplacen los bordes izquierdo o derecho respecto al resto de la aplicación.
   - **Margen inferior y despeje de barra flotante (Eje Y Bottom en Móvil):**
     - La barra de navegación móvil [`MobileBottomNav`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/components/layout/MobileBottomNav/MobileBottomNav.module.css) mide 56px de alto y flota a `calc(24px + env(safe-area-inset-bottom, 0px))`.
     - `AppLayout.module.css` gestiona centralizadamente el despeje mediante `.main { padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px)); }` y `.content { padding-bottom: 24px; }`.
     - *Prohibición:* Queda terminantemente prohibido que módulos o vistas hijas agreguen `padding-bottom` con `safe-area-inset-bottom` o reservas extras (como los previos `88px` de Dashboard, `96px` de BilleteraDetalle o `88px` de Tools). Esto duplicaba el despeje generando vacíos blancos antiestéticos al llegar al final del scroll.
   - **Margen superior en escritorio (Eje Y Top en Desktop):**
     - El encabezado desktop unificado es flotante (`56px` + `12px` top) y `AppLayout.module.css` aplica `padding-top: 68px` en `.main` y `padding: 40px ...` en `.content`.
     - *Prohibición:* Las páginas hijas inician inmediatamente con su encabezado a `padding: 0`. Prohibido añadir `padding-top: 24px` propio en desktop (como el previo en `LoQueSeRepitePage`), que hacía descender el título respecto a las demás pantallas.

### 17.2 Tokens Canónicos de Ritmo Vertical entre Bloques
Los contenedores principales de página (`.page`, `.root`, `.container`) se estructuran como columnas flexibles con la escala canónica:
- **En Celular (`max-width: 767px`):** `gap: var(--module-gap-mobile, 16px);` (o `20px` según densidad).
- **En Computadora (`min-width: 768px`):** `gap: var(--module-gap-desktop, 24px);`.
- **Prohibición de espaciadores artificiales:** Prohibido el uso de pseudoelementos `::after` con alturas fijas (`16px`, `32px`, `36px`) para forzar holgura al final de las páginas.

### 17.3 Plantilla Base para la Raíz de Nuevos Módulos
```css
/* MiModuloPage.module.css */
.page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--module-gap-mobile, 16px);
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .page {
    padding-top: 0;
  }
}

@media (min-width: 768px) {
  .page {
    gap: var(--module-gap-desktop, 24px);
  }
}
```

---

## 18. Norma Canónica de Listas Desplegables (Dropdowns) y Selectores Unificados

### 18.1 Reemplazo Absoluto de `<select>` Nativo (`SelectInput`)
Para mantener coherencia estética, consistencia de interacciones y accesibilidad táctil óptima en todos los tamaños de pantalla:
1. **Componente Canónico:** Toda lista desplegable de selección simple en módulos de la app (`pages/app/**`) debe implementarse exclusivamente con `SelectInput` (`import { SelectInput, type SelectOption } from '@/components/ui'`).
2. **Prohibición de `<select>` nativo:** Queda terminantemente prohibido utilizar el elemento HTML nativo `<select>` en módulos de la aplicación. Esta restricción está custodiada por la regla de auditoría **R34** con línea base 0. Un `<select>` nativo romperá `npm run audit:rules` y abortará automáticamente `git push`.

### 18.2 Comportamiento Responsive Adaptativo
`SelectInput` adapta su renderizado automáticamente según el ancho del viewport:
- **En Computadora / Desktop (`min-width: 768px`):**
  - Se abre como panel flotante elevado portalizado en el `document.body` (`z-index: var(--z-modal)`).
  - Posicionamiento dinámico con detección de límites de ventana para prevenir desbordes laterales.
  - Altura máxima acotada (`max-height: 280px`) con scroll vertical nativo suave para listas extensas.
  - Soporte de tamaño compacto (`size="sm"`) con altura de 36px y tipografía de 13px para filtros, encabezados y barras de control secundarias (como en Análisis y comparativas).
- **En Celular / Mobile (`max-width: 767px`):**
  - Se transforma automáticamente en Bottom Sheet modal canónico (`Modal variant="sheet"`).
  - Áreas táctiles cómodas de al menos 44px de altura por ítem (`padding: 13px 14px`), eliminando dificultades de selección en pantallas pequeñas.
  - Título contextual claro, backdrop difuminado y cierre intuitivo por pulsación externa o botón de cierre.

---

## 19. Norma Canónica de Nomenclatura de Monedas: "Pesos" y "Dólares" (Sin "ARS" ni "USD" en la UI)

### 19.1 Principio de Experiencia Humana y Sin Tecnicismos
Para evitar frialdad bancaria y siglas técnicas innecesarias en la interfaz:
1. **Regla de Oro:** En ningún texto, etiqueta, menú desplegable, botón, badge, pill, tooltip o mensaje visible para el usuario final deben aparecer las siglas técnicas de código ISO "ARS" ni "USD".
2. **Nombres Canónicos:**
   - Para moneda local se utiliza siempre la palabra **"Pesos"** (o "pesos").
   - Para moneda extranjera se utiliza siempre la palabra **"Dólares"** (o "dólares").
3. **Preservación del Modelo Interno (Sin Roturas):** Los modelos de datos, columnas de base de datos, enums de TypeScript/Python (`'ARS' | 'USD'`), parámetros de consulta y endpoints de API continúan utilizando los identificadores estándar `'ARS'` y `'USD'`. La transformación a "Pesos" y "Dólares" se realiza en la capa de presentación mediante el helper centralizado [`formatMoneda(moneda)`](file:///c:/Users/sebas/OneDrive/Documentos/GitHub/argentum-frontend/src/utils/format.ts).
4. **Candado Pre-Push (R36):** La regla automática **R36** en `scripts/audit-design-rules.mjs` verifica que ningún archivo de vista o componente renderice directamente las palabras "ARS" o "USD" en la UI visible. Si se detecta alguna ocurrencia, el hook pre-push aborta el `git push` de manera inmediata.



