import { useCallback, useEffect, useState } from 'react'
import {
  CLAVE_PREFERENCIA,
  guardarPreferenciaSonido,
  leerPreferenciaSonido,
  type AlmacenSimple,
} from '@/utils/sonidoAvisos'
import { reproducirAviso } from '@/services/reproductorAvisos'

const suscriptoresLocales = new Set<(activo: boolean) => void>()

// Obtiene window.localStorage de forma segura (null si no existe o si el navegador lo bloquea).
function obtenerAlmacenSeguro(): AlmacenSimple | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function notificarSuscriptoresLocales(activo: boolean): void {
  for (const listener of suscriptoresLocales) {
    listener(activo)
  }
}

export interface UsoSonidoAvisos {
  activo: boolean
  cambiarActivo: (activo: boolean) => void
}

// Hook para leer, cambiar y sincronizar la preferencia local de sonido de avisos en este dispositivo.
export function useSonidoAvisos(): UsoSonidoAvisos {
  const [activo, setActivo] = useState<boolean>(() =>
    leerPreferenciaSonido(obtenerAlmacenSeguro())
  )

  useEffect(() => {
    suscriptoresLocales.add(setActivo)

    if (typeof window === 'undefined') {
      return () => {
        suscriptoresLocales.delete(setActivo)
      }
    }

    const alCambiarStorage = (evento: StorageEvent) => {
      if (evento.key === CLAVE_PREFERENCIA || evento.key === null) {
        setActivo(leerPreferenciaSonido(obtenerAlmacenSeguro()))
      }
    }

    window.addEventListener('storage', alCambiarStorage)
    return () => {
      suscriptoresLocales.delete(setActivo)
      window.removeEventListener('storage', alCambiarStorage)
    }
  }, [])

  const cambiarActivo = useCallback((nuevoValor: boolean) => {
    guardarPreferenciaSonido(obtenerAlmacenSeguro(), nuevoValor)
    setActivo(nuevoValor)
    notificarSuscriptoresLocales(nuevoValor)
    if (nuevoValor) {
      // Suena inmediatamente dentro del gesto del clic para que el usuario escuche cómo es el aviso.
      void reproducirAviso()
    }
  }, [])

  return { activo, cambiarActivo }
}

