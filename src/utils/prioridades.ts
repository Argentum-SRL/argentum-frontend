export interface PrioridadOpcion {
  id: number
  texto: string
}

export const PRIORIDADES: PrioridadOpcion[] = [
  { id: 1, texto: 'Control de mi plata, aunque sea poca' },
  { id: 2, texto: 'Respaldo ante imprevistos' },
  { id: 3, texto: 'Aprender a invertir y que mi plata crezca' },
  { id: 4, texto: 'Usar mi plata para estudiar o formarme' },
  { id: 5, texto: 'Vivir con lo justo sin deberle a nadie' },
  { id: 6, texto: 'Ayudar a mi familia o a quien lo necesita' },
  { id: 7, texto: 'Darme gustos sin culpas' },
  { id: 8, texto: 'Menos estrés económico, sentirme libre' },
]

export function alternarPrioridad(seleccion: number[], id: number): number[] {
  if (seleccion.includes(id)) {
    return seleccion.filter((item) => item !== id)
  }
  if (seleccion.length >= 3) {
    return seleccion
  }
  return [...seleccion, id]
}

export function mismasPrioridades(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((item) => setA.has(item))
}

