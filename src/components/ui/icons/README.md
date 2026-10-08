# Argentum Icon System

El **Sistema de Iconografía Animada de Argentum** es la **fuente única de verdad** para todos los iconos vectoriales del frontend.

Combina geometría SVG estándar (viewBox `0 0 24 24`, stroke `2px`, `currentColor`) con animaciones internas calibradas mediante Motion para React, detección automática de ancestros interactivos (**Parent Hover**) y accesibilidad completa.

---

## 1. Regla de Oro: Prohibición de Imports Directos

> **PROHIBIDO:** Ningún componente del frontend de Argentum debe importar iconos directamente desde `lucide-react`.

```tsx
// ❌ INCORRECTO
import { Search, Wallet, ArrowRightLeft } from 'lucide-react';

// ✅ CORRECTO (Fuente Única de Verdad)
import { Search, Wallet, TransferIcon } from '@/components/ui/icons';
```

---

## 2. Estructura y Arquitectura

```text
src/components/ui/icons/
├── core/
│   ├── types.ts            # Definiciones de IconProps, Controls y MotionSignature
│   └── use-parent-hover.ts # Hook DOM para Parent Hover, teclado, touch y reduced-motion
├── motion/
│   ├── easings.ts          # Curvas cúbicas argentum, mechanical y gentle
│   └── signatures.ts       # Registro declarativo de las 39 firmas cinéticas
├── primitives/
│   └── index.ts            # Componentes auxiliares (DrawPath, SlidePart, RotatePart, etc.)
├── animated/
│   ├── [nombre].tsx        # Módulos SVG vectoriales animados individuales
│   └── index.ts            # Re-export centralizado de todos los iconos
├── semantic/
│   └── index.ts            # Alias canónicos del dominio financiero (TransferIcon, etc.)
├── README.md               # Esta documentación
└── index.ts                # Barril principal expuesto al frontend
```

---

## 3. Cómo Importar un Icono

Todos los iconos se consumen desde `@/components/ui/icons`:

```tsx
import { Search, Wallet, Transfer, CircleCheck } from '@/components/ui/icons';

export function MiComponente() {
  return (
    <button className="flex items-center gap-2">
      <Search size={18} />
      <span>Buscar movimientos</span>
    </button>
  );
}
```

### Parent Hover Automático
No es necesario pasar callbacks ni manejar estados de hover manuales. El hook `useParentHover` detecta automáticamente el ancestro interactivo más cercano (`<button>`, `<a>`, `[role="button"]`, `.group`, o `[data-icon-parent]`) y activa la animación del icono cuando el contenedor recibe hover, focus por teclado o tap en pantallas táctiles.

---

## 4. Conceptos Semánticos Canónicos

Para evitar inconsistencias en la interfaz, Argentum define conceptos canónicos para acciones y estados:

| Concepto | Icono Canónico | Alias Semántico |
| :--- | :--- | :--- |
| Transferencia de fondos | `Transfer` | `TransferIcon` |
| Billetera / Cuentas | `Wallet` | — |
| Tarjeta de crédito/débito | `CreditCard` | `CardIcon` |
| Edición / Modificar | `Pencil` | — |
| Eliminar / Descartar | `Trash2` | — |
| Éxito / Confirmado | `CircleCheck` / `Check` | — |
| Alerta / Saldo bajo | `AlertTriangle` | — |
| Error / Validación | `AlertCircle` | — |
| Búsqueda | `Search` | — |
| Seguridad / Protección | `Shield` | `SecurityIcon` |

Reutilizá siempre la representación canónica en lugar de crear variantes ad-hoc.

---

## 5. Cómo Agregar un Nuevo Icono

Si un nuevo flujo requiere un icono que aún no está presente en el sistema:

1. **Crear el módulo SVG animado** en `src/components/ui/icons/animated/<nombre>.tsx`:
   - Utilizá viewBox `0 0 24 24`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={strokeWidth}`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
   - Utilizá `useParentHover(isHovered)` para enlazar los controles de Motion.
   - Animá únicamente partes internas (`motion.path`, `motion.g`, `motion.line`), **NUNCA** apliques transformaciones de scale/bounce al contenedor completo.
2. **Definir la Motion Signature**:
   - Asignale una firma en `src/components/ui/icons/motion/signatures.ts` o reutilizá una existente (ej. `optical-sweep`, `directional-flow`, `path-draw`).
3. **Re-exportar en el barrel de animated**:
   - Agregá `export * from './<nombre>';` en `src/components/ui/icons/animated/index.ts`.
4. **Verificar en el Playground**:
   - Abrí `/admin/animaciones` para inspeccionar la respuesta visual, el parent-hover y el comportamiento en reduced motion.

---

## 6. Motion Signatures y Primitivas

Cada icono tiene una identidad cinética (**Motion Signature**) alineada con su significado:

- `directional-flow`: Desplazamiento secuencial en ejes direccionales (flechas, transferencias).
- `optical-sweep`: Giro y oscilación simulando refracción o rastreo visual (búsqueda).
- `lid-open`: Apertura y elevación de tapas o cubiertas (papelera, carpetas).
- `pendulum`: Oscilación armónica pivotada (campana de notificaciones).
- `wallet-clasp`: Cierre y broche de billetera.
- `card-glide`: Deslizamiento y leve inclinación de tarjeta plástica.
- `path-draw`: Dibujado secuencial del trazo vectorial (check, firmas).
- `shackle-unlock`: Apertura mecánica del arco de candado.

---

## 7. Accesibilidad y Rendimiento

- **Reduced Motion**: Si el usuario tiene activo `prefers-reduced-motion`, las transformaciones espaciales y rotaciones se desactivan automáticamente, preservando un feedback sutil sin provocar fatiga visual.
- **Teclado y Touch**: Los eventos `focus` y `blur` del ancestro interactivo disparan la animación, así como `touchstart`/`touchend` en dispositivos móviles.
- **Cero Re-renders Innecesarios**: La sincronización de hover se realiza a nivel del árbol DOM mediante referencias directas a Motion Controls, evitando re-renders en cascada en listas, tablas y dashboards.
- **Bundle Ultraligero**: Todo el catálogo de más de 97 iconos animados ocupa apenas ~10 kB gzipped y es 100% tree-shakeable.
