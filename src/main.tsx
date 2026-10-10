import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'sileo/styles.css'
import './styles/sileo.css'
import App from './App.tsx'
import { ModalProvider } from './components/ui/ModalProvider/ModalProvider'

// Auto-recuperación ante chunks desactualizados tras un nuevo despliegue en producción
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const reloadKey = 'argentum_chunk_reload_ts'
  const now = Date.now()
  const lastReload = Number(sessionStorage.getItem(reloadKey) || '0')
  if (now - lastReload > 10000) {
    sessionStorage.setItem(reloadKey, String(now))
    window.location.reload()
  }
})

// Desregistrar cualquier service worker viejo y purgar Cache Storage para evitar que se sirva JS/HTML obsoleto
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((sw) => sw.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key))
  })
}

// Silenciar warnings informativos ruidosos de librerías externas (Google Identity Services)
const filterGsi = (originalFn: (...args: unknown[]) => void) => (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[GSI_LOGGER]')) return
  originalFn(...args)
}
console.warn = filterGsi(console.warn)
console.info = filterGsi(console.info)
console.error = filterGsi(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
