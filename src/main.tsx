import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ModalProvider } from './components/ui/ModalProvider/ModalProvider'

// Desregistrar cualquier service worker viejo para evitar que cachée JS desactualizado
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((sw) => sw.unregister())
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
