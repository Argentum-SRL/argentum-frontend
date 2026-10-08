# SISTEMA GLOBAL DE ELEVACIÓN Y PROFUNDIDAD — ARGENTUM

> **Principio Fundamental:**  
> **"SHADOW IS HIERARCHY, NOT DECORATION."**  
> Una sombra en Argentum no existe para embellecer un componente ni para dibujar un borde difuso. Existe con un único propósito semántico: **comunicar visual y físicamente qué superficie se encuentra por encima de otra en el eje Z**.

---

## 1. CONCEPTOS FUNDAMENTALES

### ¿Qué significa Elevation?
La elevación representa la distancia percibida en el eje Z entre una superficie y su plano contenedor inmediatamente inferior. A mayor elevación:
* El desplazamiento vertical de la sombra directa (*key shadow*) aumenta de manera sutil.
* El desenfoque (*blur*) se expande suavemente.
* La dispersión (*spread*) se mantiene negativa (`-1px` a `-6px`) para evitar que la sombra ensucie elementos adyacentes.
* La sombra ambiental (*ambient cushion*) envuelve la superficie simulando la dispersión de luz del entorno sin producir manchas oscuras.

### La Pregunta Rectora
> **"¿Qué elemento está físicamente por encima de cuál?"**  
> Si un elemento está al mismo nivel que su contenedor o sus hermanos, **no lleva sombra** (`--elevation-none`).  
> Si un elemento se despliega, despega o superpone sobre otro, recibe el token correspondiente a su altura en el eje Z.

---

## 2. ESCALA SEMÁNTICA GLOBAL DE TOKENS

Todos los tokens de elevación están centralizados y controlados en [elevation.css](file:///Users/manuelmartinez/Documents/GitHub/argentum/argentum-frontend/src/styles/elevation.css).

```css
:root {
  /* Tinte azul noche (#0D2045) para un despegue ambiental armónico y suave */
  --shadow-color-rgb: 13, 25, 45;

  --elevation-none:            none;
  --elevation-xs:              0 1px 2px rgba(var(--shadow-color-rgb), 0.04), 0 1px 1px rgba(var(--shadow-color-rgb), 0.02);
  --elevation-sm:              0 2px 5px -1px rgba(var(--shadow-color-rgb), 0.05), 0 1px 2px rgba(var(--shadow-color-rgb), 0.02);
  --elevation-md:              0 6px 14px -2px rgba(var(--shadow-color-rgb), 0.07), 0 2px 5px -1px rgba(var(--shadow-color-rgb), 0.03);
  --elevation-lg:              0 14px 30px -5px rgba(var(--shadow-color-rgb), 0.09), 0 4px 10px -2px rgba(var(--shadow-color-rgb), 0.04);
  --elevation-xl:              0 20px 40px -6px rgba(var(--shadow-color-rgb), 0.12), 0 6px 14px -2px rgba(var(--shadow-color-rgb), 0.05);

  /* Selección contextual de tarjetas e ítems */
  --elevation-selection:       0 3px 8px -1px rgba(var(--shadow-color-rgb), 0.08), 0 1px 3px rgba(var(--shadow-color-rgb), 0.04);
  --elevation-selection-modal: 0 4px 10px -2px rgba(var(--shadow-color-rgb), 0.10), 0 1px 3px rgba(var(--shadow-color-rgb), 0.04);
}

:root.dark, [data-theme="dark"] {
  /* Escala calibrada específicamente para Dark Mode:
     Opacidades discretas que integran la sombra con el fondo oscuro,
     sugiriendo profundidad sin transformarse en una mancha negra sucia. */
  --shadow-color-rgb: 0, 0, 0;

  --elevation-none:            none;
  --elevation-xs:              0 1px 2px rgba(0, 0, 0, 0.16);
  --elevation-sm:              0 2px 5px -1px rgba(0, 0, 0, 0.22), 0 1px 2px rgba(0, 0, 0, 0.12);
  --elevation-md:              0 6px 14px -2px rgba(0, 0, 0, 0.26), 0 2px 5px -1px rgba(0, 0, 0, 0.16);
  --elevation-lg:              0 14px 32px -5px rgba(0, 0, 0, 0.32), 0 4px 10px -2px rgba(0, 0, 0, 0.18);
  --elevation-xl:              0 20px 40px -6px rgba(0, 0, 0, 0.36), 0 6px 14px -2px rgba(0, 0, 0, 0.20);

  /* Selección contextual Dark Mode */
  --elevation-selection:       0 3px 8px -1px rgba(0, 0, 0, 0.22), 0 1px 3px rgba(0, 0, 0, 0.12);
  --elevation-selection-modal: 0 4px 10px -2px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.14);
}
```

---

## 3. JERARQUÍA ESPACIAL Y CONTEXTO

La elevación es estrictamente contextual y respeta la jerarquía espacial de la interfaz:

```
Página / Canvas (Nivel 0)
└── Card / Contenedor (Nivel 1 o 2: --elevation-none / --elevation-sm)
    └── Elemento Interno en Reposo (Nivel 0: --elevation-none)
    └── Elemento Seleccionado en Página (Nivel SEL: --elevation-selection)
        └── Dropdown / Popover / Menú (Nivel 3: --elevation-md)
            └── Modal / Diálogo / Drawer (Nivel 4: --elevation-lg)
                └── Elemento Interno en Modal (Nivel 0: --elevation-none)
                └── Tarjeta Seleccionada dentro de Modal (Nivel SEL-MODAL: --elevation-selection-modal)
                    └── Notificación Flotante Crítica / Toast / FAB (Nivel 5: --elevation-xl)
```

### Regla de Oro contra la Contaminación Visual
**Un elemento interno nunca debe competir visualmente con el contenedor que está por encima de él.**
* ❌ Evitar: `elemento pequeño + sombra grande dentro de card + sombra dentro de modal + sombra sobre fondo`.
* ✅ Aplicar: Los hijos dentro de un modal o card tienen `box-shadow: var(--elevation-none)`. Solo cuando un hijo adquiere un rol activo o seleccionado adquiere un sutil despegue (`--elevation-xs` o `--elevation-selection-modal`).

---

## 4. MATRIZ DE APLICACIÓN POR COMPONENTE

| Nivel | Token | Desplazamiento & Blur | Componentes & Usos Autorizados |
| :--- | :--- | :--- | :--- |
| **0** | `--elevation-none` | `0px` | Superficies planas o contenidas: celdas de tabla, listas de transacciones, inputs en reposo o focus, filas de configuración, badges, elementos anidados. |
| **1** | `--elevation-xs` | `1px / 2px` | Micro-despegue: pastilla activa en selector segmental (`SegmentedControl`, Tabs compactas), micro-hover de filas interactivas, thumbs de switches/toggles. |
| **2** | `--elevation-sm` | `2px / 5px` | Baja elevación: Cards principales en reposo (`DashboardCard`, `MetricCard`, `BilleteraCard`), botones primarios en hover, tooltips flotantes. |
| **3** | `--elevation-md` | `6px / 14px` | Media elevación: menús contextuales, desplegables (`SelectInput`), filtros flotantes (`FilterPopover`), calendarios emergentes (`DatePicker`). |
| **4** | `--elevation-lg` | `14px / 30px` | Alta elevación: ventanas modales (`ModalShell`, `TransaccionModal`), paneles laterales deslizables (`Drawer`), láminas móviles inferiores (`BottomSheet`). |
| **5** | `--elevation-xl` | `20px / 40px` | Máxima elevación: alertas flotantes (`Sileo Toast`), botones de acción flotante fijos (`FAB`), mockups de presentación flotantes. |
| **SEL** | `--elevation-selection` | `3px / 8px` | Selección física en páginas: tarjeta de método de pago, opción de plan o moneda en vista estándar. |
| **SEL-M** | `--elevation-selection-modal` | `4px / 10px` | Selección física dentro de modales: tarjeta de billetera seleccionada en carrusel de transacción. |

---

## 5. BOTONES Y CONTROLES (INGRESO / EGRESO, TABS, ACCIONES)

### Estados de Interacción:
* **DEFAULT:**
  * Superficie estable.
  * Botones estándar o planos: `box-shadow: var(--elevation-none)`.
  * Botones primarios destacados: `box-shadow: var(--elevation-xs)`.
* **HOVER:**
  * Micro-elevación física sutil: `transform: translateY(-1px); box-shadow: var(--elevation-sm);`.
  * En dispositivos táctiles (mobile) el hover no es vinculante.
* **ACTIVE / PRESSED:**
  * Compresión táctil instantánea: `transform: translateY(0); box-shadow: var(--elevation-xs);` o `--elevation-none`.
* **SELECTED (ej. Selector Egreso / Ingreso / Transferencia):**
  * La opción activa actúa como pastilla física despegada:
  * `box-shadow: var(--elevation-xs); transform: translateY(-0.5px);`.
  * No requiere bordes chillones ni brillos artificiales; la elevación comunica qué modo está presionado.
* **FOCUS:**
  * Foco accesible por teclado: `outline: 2px solid var(--primary); outline-offset: 2px; box-shadow: var(--elevation-none);`.
  * Prohibido simular focus con spreads multicolores de `box-shadow`.
* **DISABLED:**
  * Plano y apagado: `transform: none; box-shadow: var(--elevation-none); opacity: 0.5; pointer-events: none;`.

---

## 6. INPUTS Y FORMULARIOS

### Regla para Campos de Entrada:
* Los campos de texto, números y áreas de texto se apoyan directamente en el canvas o en el modal.
* **DEFAULT:** `border: 1px solid var(--border); box-shadow: var(--elevation-none);`
* **FOCUS:** `border-color: var(--primary); outline: 2px solid var(--primary); outline-offset: -1px; box-shadow: var(--elevation-none);`
* **ERROR:** `border-color: var(--error); outline: 2px solid var(--error); outline-offset: -1px; box-shadow: var(--elevation-none);`
* **Por qué no usar box-shadow de 4 colores en focus:** Las sombras de foco extendidas (`0 0 0 4px rgba(...)`) generan ruido visual, compiten con el contenido de las tarjetas adyacentes y se cortan cuando el contenedor tiene `overflow: hidden`.

---

## 7. SELECCIÓN DE TARJETAS Y WALLETS: ELEVACIÓN COMO PROTAGONISTA

La selección se basa en la metáfora:
> **"Esta tarjeta está ligeramente por encima de las demás"**  
> y NO: **"Esta tarjeta tiene un borde grueso o un halo luminoso"**.

### Reglas de Diseño de Selección:
1. **Micro-elevación física (`translateY`):**
   El elemento seleccionado se aproxima físicamente al usuario (`translateY(-2px)` en desktop, `-1px` en mobile).
2. **Sombra contextual:**
   `--elevation-selection` en página, `--elevation-selection-modal` dentro de diálogos.
3. **Opacidad constante al 100%:**
   Las tarjetas no seleccionadas conservan `opacity: 1`. Jamás apagar (`opacity: 0.7`) ni desaturar tarjetas hermanas.
4. **Sin distorsión de escala:**
   `scale: 1`. Modificar `scale(1.03)` desenfoca fuentes en pantallas estándar y altera el grid layout.
5. **Checkmark opcional:**
   Cualquier indicador de verificación (icono check) es opcional y secundario; la elevación debe bastar.

### Primitiva Arquitectónica: `SelectableSurface`
Ubicación: `@/components/ui/SelectableSurface`

```tsx
import { SelectableSurface } from '@/components/ui'

// En una página estándar:
<SelectableSurface selected={isSelected} onClick={onToggle}>
  <TarjetaContenido />
</SelectableSurface>

// Dentro de un modal:
<SelectableSurface selected={billeteraId === b.id} context="modal" onClick={() => setBilleteraId(b.id)}>
  <BilleteraCard billetera={b} />
</SelectableSurface>
```

---

## 8. ADAPTACIÓN RESPONSIVE

El sistema está validado en los 5 breakpoints canónicos:
* **320px** (Mobile compacto)
* **375px** (Mobile estándar)
* **768px** (Tablet)
* **1024px** (Desktop laptop)
* **1440px** (Desktop amplio)

### Reglas Responsive:
1. **No inventar sombras arbitrarias por media query:** Los tokens se mantienen coherentes en todos los tamaños.
2. **Prevención de Clipping:** En contenedores con scroll horizontal o vertical (`overflow: auto`), garantizar al menos `padding: 4px` para que el blur de la elevación no se recorte en los extremos del contenedor.
3. **Touch vs Hover:** En pantallas táctiles (`@media (hover: none)`), no depender de estados `:hover` para comunicar interactividad; utilizar `:active` con transiciones cortas (80ms a 120ms).
4. **Modales a BottomSheets:** En mobile (<768px), los modales se presentan como láminas inferiores ancladas al fondo de la pantalla con `--elevation-lg`, proyectando sombra exclusivamente hacia arriba.

---

## 9. LIGHT MODE VS DARK MODE

| Característica | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Color Base de Sombra** | `rgba(13, 25, 45, ...)` (Tinte azul noche profundo) | `rgba(0, 0, 0, ...)` (Negro puro suave) |
| **Opacidad Key Shadow** | Discreta (0.04 a 0.12) | Moderada (0.16 a 0.36) |
| **Luz Ambiental** | Amplia dispersión para separar del fondo claro | Sombra compacta que resalta superficies contra fondos oscuros |
| **Efecto Mancha Negra** | Inexistente (sombra luminosa) | Evitado mediante spread negativo y blur extendido |

---

## 10. CUÁNDO NO USAR SOMBRA (`--elevation-none`)

1. **Elementos dentro de contenedores que ya tienen sombra:** Botones secundarios, badges, inputs y elementos decorativos dentro de una card o modal deben usar `box-shadow: var(--elevation-none)`.
2. **Celdas y filas de tabla:** Para separar filas, utilizar `border-bottom: 1px solid var(--border)` o alternancia de fondo (`var(--surface-alt)`), nunca sombras individuales por fila.
3. **Indicadores de estado o Badges:** Para badges de estado ("Pagado", "Pendiente"), usar fondo suave y color tipográfico, jamás `box-shadow: 0 0 8px #10b981`.
4. **Barras de progreso y medidores:** No aplicar sombras internas (`box-shadow: inset ...`) para simular volumen o relieve.
5. **Divisores y separadores:** Usar bordes semánticos de 1px.

---

## 11. EJEMPLOS DE CÓDIGO: CORRECTO VS INCORRECTO

### Caso 1: Selector de Tipo de Operación (Egreso / Ingreso)

```css
/* ❌ INCORRECTO: Glow verde/rojo y sombra dispersa */
.typeButtonActive {
  background: #10b981;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); /* Glow artificial */
  transform: scale(1.05); /* Descuadra layout */
}

/* ✅ CORRECTO: Micro-elevación física sutil sobre la base */
.typeButtonActive {
  background: var(--surface);
  box-shadow: var(--elevation-xs);
  transform: translateY(-0.5px);
  color: var(--primary);
}
```

### Caso 2: Menú Desplegable / Dropdown

```css
/* ❌ INCORRECTO: Sombra dura hardcodeada y sin token */
.dropdownMenu {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: none;
}

/* ✅ CORRECTO: Nivel MD con borde semántico */
.dropdownMenu {
  box-shadow: var(--elevation-md);
  border: 1px solid var(--border);
  background: var(--surface);
}
```

### Caso 3: Input de Formulario

```css
/* ❌ INCORRECTO: Sombras de halo multicolor simulando foco */
.input:focus {
  box-shadow: 0 0 0 3px rgba(13, 32, 69, 0.08), 0 1px 2px rgba(0,0,0,0.05);
}

/* ✅ CORRECTO: Outline estándar accesible y elevación plana */
.input:focus {
  outline: 2px solid var(--primary);
  outline-offset: -1px;
  box-shadow: var(--elevation-none);
}
```

### Caso 4: Tarjeta de Billetera Seleccionada dentro de TransaccionModal

```css
/* ❌ INCORRECTO: Apagar a las otras tarjetas y mancha negra en dark */
.walletUnselected {
  opacity: 0.75;
}
.walletSelected {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  border: 2px solid var(--primary);
}

/* ✅ CORRECTO: Ambas conservan 100% de opacidad, elevación modal contextual */
.wallet {
  opacity: 1;
  box-shadow: var(--elevation-none);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.wallet[data-selected="true"] {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: var(--elevation-selection-modal);
}
```

---

## 12. GUARDRAIL DE CÓDIGO (AUDITORÍA AUTOMÁTICA)

Para garantizar que ninguna nueva contribución agregue sombras hardcodeadas:

```bash
npm run audit:elevation
```

El script inspecciona todos los archivos `.css`, `.tsx` y `.ts` en `src/`, validando que el 100% de las declaraciones de elevación utilicen los tokens `var(--elevation-*)`.
