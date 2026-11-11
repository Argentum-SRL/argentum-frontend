// Servicio encargado de reproducir el sonido corto de aviso en el navegador.
// Es el único módulo de src/ que interactúa con AudioContext y HTMLAudioElement.

const RUTA_SONIDO = `${import.meta.env.BASE_URL}sonidos/aviso.mp3`
const VOLUMEN = 0.8
const TOPE_RESUME_MS = 300

let contexto: AudioContext | null = null
let bufferAudio: AudioBuffer | null = null
let promesaCarga: Promise<AudioBuffer> | null = null
let desbloqueoNotificado = false

const listenersDesbloqueo = new Set<() => void>()

// Crea o devuelve el AudioContext único del módulo; null si el navegador no soporta Web Audio.
function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (contexto) return contexto

  const ConstructorAudio =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!ConstructorAudio) return null

  try {
    contexto = new ConstructorAudio()
    return contexto
  } catch {
    return null
  }
}

// Descarga y decodifica el archivo MP3 una sola vez; si falla, limpia la promesa para permitir reintentos.
async function cargarBuffer(): Promise<AudioBuffer> {
  if (bufferAudio) return bufferAudio
  const ctx = obtenerContexto()
  if (!ctx) {
    throw new Error('Web Audio no disponible')
  }
  if (promesaCarga) return promesaCarga

  promesaCarga = (async () => {
    try {
      const respuesta = await fetch(RUTA_SONIDO)
      if (!respuesta.ok) {
        throw new Error(`No se pudo descargar el sonido (${respuesta.status})`)
      }
      const bytes = await respuesta.arrayBuffer()
      const decodificado = await ctx.decodeAudioData(bytes)
      bufferAudio = decodificado
      return decodificado
    } catch (error) {
      promesaCarga = null
      throw error
    }
  })()

  return promesaCarga
}

// Espera una promesa sin colgarse más de topeMs milisegundos.
async function esperarConTope(promesa: Promise<void>, topeMs: number): Promise<void> {
  let timerId: ReturnType<typeof setTimeout> | null = null
  try {
    await Promise.race([
      promesa.catch(() => {
        // Si resume() falla por política de autoplay, se evalúa luego el state del contexto
      }),
      new Promise<void>((resolve) => {
        timerId = setTimeout(resolve, topeMs)
      }),
    ])
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
  }
}

// Registra una función para ejecutarse cuando el primer gesto del usuario desbloquee el audio.
export function alDesbloquear(fn: () => void): () => void {
  listenersDesbloqueo.add(fn)
  return () => {
    listenersDesbloqueo.delete(fn)
  }
}

// Escucha el primer gesto del usuario para desbloquear Web Audio (incluido Safari iOS) y avisar a los pendientes.
export function instalarDesbloqueo(): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  if (contexto && contexto.state === 'running') {
    return () => {}
  }

  const opciones: AddEventListenerOptions = { capture: true, passive: true }

  const limpiar = () => {
    window.removeEventListener('pointerdown', manejarGesto, opciones)
    window.removeEventListener('touchend', manejarGesto, opciones)
    window.removeEventListener('keydown', manejarGesto, opciones)
  }

  const notificarDesbloqueo = () => {
    if (desbloqueoNotificado) return
    desbloqueoNotificado = true
    limpiar()
    for (const fn of Array.from(listenersDesbloqueo)) {
      try {
        fn()
      } catch {
        // Aislamos cada callback para no cortar al resto
      }
    }
  }

  function manejarGesto() {
    const ctx = obtenerContexto()
    if (!ctx) {
      limpiar()
      return
    }

    // Safari en iOS requiere reproducir un buffer silencioso dentro del propio gesto para habilitar el canal.
    try {
      const bufferSilencio = ctx.createBuffer(1, 1, 22050)
      const fuenteSilencio = ctx.createBufferSource()
      fuenteSilencio.buffer = bufferSilencio
      fuenteSilencio.connect(ctx.destination)
      fuenteSilencio.start(0)
    } catch {
      // Ignoramos errores al inicializar el buffer silencioso
    }

    void cargarBuffer().catch(() => {
      // Si falla la precarga, se reintentará al reproducir
    })

    if (ctx.state === 'running') {
      notificarDesbloqueo()
      return
    }

    if (ctx.state === 'suspended') {
      void ctx
        .resume()
        .then(() => {
          if (ctx.state === 'running') {
            notificarDesbloqueo()
          }
        })
        .catch(() => {
          // Si sigue suspendido, el listener espera al próximo gesto
        })
    }
  }

  window.addEventListener('pointerdown', manejarGesto, opciones)
  window.addEventListener('touchend', manejarGesto, opciones)
  window.addEventListener('keydown', manejarGesto, opciones)

  return limpiar
}

// Reproduce la campanita de aviso una vez; devuelve true si sonó o false si quedó bloqueado o falló.
export async function reproducirAviso(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // 1) Intentamos primero con Web Audio API
  const ctx = obtenerContexto()
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await esperarConTope(ctx.resume(), TOPE_RESUME_MS)
      }

      // Si no está en running, el autoplay sigue bloqueado y el respaldo HTML tampoco podría sonar.
      if (ctx.state !== 'running') {
        return false
      }

      const buffer = await cargarBuffer()
      const fuente = ctx.createBufferSource()
      fuente.buffer = buffer
      const ganancia = ctx.createGain()
      ganancia.gain.value = VOLUMEN
      fuente.connect(ganancia)
      ganancia.connect(ctx.destination)
      fuente.start(0)
      return true
    } catch {
      // Si falló la carga/decodificación o Web Audio lanzó un error, probamos el respaldo con HTMLAudio
    }
  }

  // 2) Respaldo con HTMLAudioElement si no hay Web Audio o si la vía Web Audio falló
  try {
    const audio = new Audio(RUTA_SONIDO)
    audio.volume = VOLUMEN
    await audio.play()
    return true
  } catch {
    return false
  }
}

