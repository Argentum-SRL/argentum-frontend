# REGLAS OBLIGATORIAS DE FRONTEND — ARGENTUM

Nota: `.agents/`, `.claude/` y `.codex/` no se versionan en Git. Este archivo es la fuente canónica.

1. **Constitución Visual:** Leer `DISENO_UNIFICADO.md` antes de tocar cualquier CSS o TSX de interfaz.
2. **Tokens Estrictos:** Usar únicamente variables de `tokens.css` y `elevation.css`. Prohibido introducir sombras, z-index, radios o espaciados literales sueltos.
3. **Selectores Canónicos:** Todo selector segmentado debe usar `ui/SegmentedControl` (cápsula oficial). No crear `.segmentedBar`, `.methodGrid`, etc.
4. **Anatomía de Modales:** Respetar la estructura oficial de `DISENO_UNIFICADO.md` (lateral 20px, radio 20px, stepDots arriba, dos botones en footer sin bordes divisores).
5. **Prohibiciones Clave:** Prohibido agregar `!important` y márgenes negativos (`margin: -...`). Prohibido rebote en animaciones (`cubic-bezier > 1`).
6. **Verificación Previa:** Correr `npm run lint` (incluye `audit:rules`) y `npm run build` antes de subir cambios. La línea base no puede subir.
7. **Dudas o Casos no Cubiertos:** Preguntar directamente a Sebastián antes de inventar nuevos estilos o excepciones.
8. Antes de cada push corre solo un control (se instala con npm install o npm run dev). Si corta el push, corregí lo que marca. No uses --no-verify.
