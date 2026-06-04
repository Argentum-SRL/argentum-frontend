# Cards — Logos de tarjetas de crédito/débito

Esta carpeta contiene los logos SVG de las marcas de tarjetas.

## Convención de nombres

Los archivos deben llamarse exactamente igual al `logoPath` definido en
`src/lib/constants/cards.ts`. Se aceptan **SVG** y **PNG**.

| Archivo                              | Marca             |
|--------------------------------------|-------------------|
| `visa.svg`                           | Visa              |
| `mastercard.svg`                     | Mastercard        |
| `amex.svg`                           | American Express  |
| `naranja.svg`                        | Naranja           |
| `cabal.svg`                          | Cabal             |
| `logo_tarjeta_galicia_blanco.png`    | Galicia           |

## Cómo agregar un nuevo logo

1. Copiá el SVG en esta carpeta con el nombre correspondiente.
2. Agregá la entrada en `src/lib/constants/cards.ts`.
3. El glob en `tarjetas.utils.ts` lo va a levantar automáticamente.

> Los SVGs deben ser cuadrados o con viewBox definido. Tamaño recomendado: 40×40px.
