// El registro ya no devuelve el usuario (decisión 2A), así que la pantalla de verificación usa el email que escribió la persona.
export function emailParaVerificar(email: string): string {
  return email.trim().toLowerCase()
}

