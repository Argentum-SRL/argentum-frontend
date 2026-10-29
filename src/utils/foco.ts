// -*- coding: utf-8 -*-
/**
 * Detección de puntero fino (mouse o trackpad) vs pantallas táctiles.
 * Retorna true en computadoras de escritorio y laptops; false en dispositivos móviles.
 */
export function esPunteroFino(): boolean {
  const mm =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia
      : typeof globalThis !== 'undefined' &&
        typeof (globalThis as unknown as { matchMedia?: (q: string) => { matches: boolean } }).matchMedia === 'function'
      ? (globalThis as unknown as { matchMedia: (q: string) => { matches: boolean } }).matchMedia
      : undefined
  return Boolean(mm && mm('(hover: hover) and (pointer: fine)').matches)
}
