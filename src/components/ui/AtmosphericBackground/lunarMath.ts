/**
 * Calcula el path SVG matemáticamente exacto para cualquier fase lunar continua [0, 1).
 * Proyección ortográfica física de una esfera iluminada.
 *
 * @param progress Progreso continuo [0, 1): 0 = Nueva, 0.5 = Llena, 1 = Nueva
 * @param cx Coordenada X del centro
 * @param cy Coordenada Y del centro
 * @param R Radio de la esfera lunar
 */
export function getMoonPhasePath(progress: number, cx = 50, cy = 50, R = 24): string {
  // Normalizar entre 0 y 1
  const p = ((progress % 1) + 1) % 1
  const epsilon = 0.001

  // Luna Nueva (área 0)
  if (p < epsilon || p > 1 - epsilon) {
    return ''
  }

  // Luna Llena (disco completo)
  if (Math.abs(p - 0.5) < epsilon) {
    return `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A ${R} ${R} 0 1 0 ${cx} ${cy - R} Z`
  }

  const theta = p * 2 * Math.PI
  // Semieje horizontal del terminador elíptico
  const rx = Math.max(0.001, R * Math.abs(Math.cos(theta)))

  if (p < 0.5) {
    // Fase Creciente (Waxing): Luz en el limbo izquierdo (orientación austral / Argentum)
    const sweepTerminator = p < 0.25 ? 0 : 1
    return `M ${cx} ${cy - R} A ${R} ${R} 0 0 0 ${cx} ${cy + R} A ${rx} ${R} 0 0 ${sweepTerminator} ${cx} ${cy - R} Z`
  } else {
    // Fase Menguante (Waning): Luz en el limbo derecho
    const sweepTerminator = p < 0.75 ? 0 : 1
    return `M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} A ${rx} ${R} 0 0 ${sweepTerminator} ${cx} ${cy - R} Z`
  }
}
