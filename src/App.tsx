import { GoogleOAuthProvider } from '@react-oauth/google'
import { RouterProvider } from 'react-router-dom'
import router from './router'

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''


  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  )
}
