import usuarioService from '@/services/usuario.service'

let bienvenidaTriggered = false

/**
 * Dispara el modal explicativo de bienvenida financiera exactamente una sola vez por ciclo de sesión.
 * Si tanto el perfil financiero como la proyección califican simultáneamente con mostrar_modal_bienvenida=true:
 * 1. El modal se abre UNA SOLA VEZ (en la solapa que llegó primero, o 'perfil' si llegan juntas).
 * 2. El endpoint de persistencia (/marcar-modal-financiero-visto) se llama UNA SOLA VEZ.
 */
export function triggerBienvenidaFinancieraOnce(
  open: (id: 'bienvenidaFinanciera', options: { data: { initialTab: 'perfil' | 'proyeccion' } }) => void,
  preferredTab: 'perfil' | 'proyeccion' = 'perfil'
): boolean {
  if (bienvenidaTriggered) {
    return false
  }
  bienvenidaTriggered = true
  open('bienvenidaFinanciera', { data: { initialTab: preferredTab } })
  void usuarioService.marcarModalFinancieroVisto()
  return true
}

export function resetBienvenidaTriggerState(): void {
  bienvenidaTriggered = false
}

export function isBienvenidaTriggered(): boolean {
  return bienvenidaTriggered
}
