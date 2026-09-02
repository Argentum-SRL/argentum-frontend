/**
 * utils/genero.ts — Utilidades para concordancia de género en textos y saludos de la interfaz.
 */

export type Sexo = 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir' | null | undefined

/**
 * Retorna el saludo de bienvenida adecuado según el sexo del usuario.
 * @param sexo Sexo del usuario
 * @param nombre Nombre opcional para concatenar
 */
export function getSaludoBienvenida(sexo: Sexo, nombre?: string | null): string {
  let saludo = 'Te damos la bienvenida'
  if (sexo === 'femenino') {
    saludo = 'Bienvenida'
  } else if (sexo === 'masculino') {
    saludo = 'Bienvenido'
  }

  return nombre ? `${saludo}, ${nombre}` : saludo
}

/**
 * Flexiona una palabra o frase según el sexo del usuario.
 */
export function flexionarGenero(
  sexo: Sexo,
  masculino: string,
  femenino: string,
  neutro?: string
): string {
  if (sexo === 'femenino') return femenino
  if (sexo === 'masculino') return masculino
  return neutro !== undefined ? neutro : masculino
}
