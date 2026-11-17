// Arma un aviso de la campanita a partir del texto guardado.
// Primer renglón = título (va en negrita); el resto, párrafos y listas ("- ").
// Los avisos viejos con marcas de WhatsApp (*negrita*, _cursiva_, "• ") se muestran limpios.

export interface BloqueAviso {
  tipo: 'parrafo' | 'lista'
  texto?: string
  items?: string[]
}

export interface Aviso {
  titulo: string
  bloques: BloqueAviso[]
}

const RX_LINK_INICIAL = new RegExp(
  '(?:,\\s*)?(?:desde|en|ingresando a|a través de|accediendo a|' +
    'haciendo clic en|haciendo click en|visita|visitando)?\\s*:?\\s*' +
    '(?:https?:\\/\\/|www\\.)\\S+',
  'giu'
)

// Saca links y frases que los presentan de un renglón (la web nunca muestra un link escrito).
function sinLinks(linea: string): string {
  return linea
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/giu, '$1')
    .replace(RX_LINK_INICIAL, '')
}

// Saca las marcas de WhatsApp de los avisos viejos.
function sinMarcas(linea: string): string {
  return linea
    .replace(/\*([^*\n]+)\*/gu, '$1')
    .replace(/(?<![\p{L}\p{N}])_([^_\n]+)_(?![\p{L}\p{N}])/gu, '$1')
    .replace(/^•\s+/u, '- ')
}

export function parsearAviso(mensaje?: string | null): Aviso {
  if (!mensaje) return { titulo: '', bloques: [] }
  const lineas = mensaje
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => sinMarcas(sinLinks(l)).replace(/\s+/gu, ' ').trim())
    .filter((l) => l.length > 0)
  if (lineas.length === 0) return { titulo: '', bloques: [] }
  const bloques: BloqueAviso[] = []
  for (const l of lineas.slice(1)) {
    if (l.startsWith('- ')) {
      const ultimo = bloques[bloques.length - 1]
      const item = l.slice(2).trim()
      if (ultimo && ultimo.tipo === 'lista' && ultimo.items) {
        ultimo.items.push(item)
      } else {
        bloques.push({ tipo: 'lista', items: [item] })
      }
    } else {
      bloques.push({ tipo: 'parrafo', texto: l })
    }
  }
  return { titulo: lineas[0], bloques }
}
