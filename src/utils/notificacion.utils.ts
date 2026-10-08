/**
 * Remueve enlaces/URLs y frases introductorias a enlaces de los mensajes
 * para que en la versión web (centro de notificaciones) nunca se muestre un link.
 */
export function limpiarMensajeNotificacion(mensaje?: string | null): string {
  if (!mensaje) return ''

  // 1. Eliminar enlaces markdown: [texto](url) -> texto
  let texto = mensaje.replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/gi, '$1')

  // 2. Eliminar URLs directas (con o sin frases introductorias como "desde", "en", etc.)
  texto = texto
    .replace(
      /(?:,\s*)?(?:desde|en|ingresando a|a través de|accediendo a|haciendo clic en|haciendo click en|visita|visitando)?\s*:?\s*(?:https?:\/\/|www\.)\S+/gi,
      ''
    )
    .trim()

  // 3. Limpiar signos de puntuación colgantes al final (: o ,)
  texto = texto.replace(/[:,]+$/, '').trim()

  // 4. Limpiar espacios múltiples
  texto = texto.replace(/\s+/g, ' ')

  // 5. Asegurar puntuación final si hay contenido
  if (texto && !/[.!?]$/.test(texto)) {
    texto += '.'
  }

  return texto
}
