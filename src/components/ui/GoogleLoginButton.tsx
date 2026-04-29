import { memo } from 'react'
import { GoogleLogin } from '@react-oauth/google'

interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: { credential: string }) => void
  onError: () => void
}

const GoogleLoginButton = memo(function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          if (import.meta.env.DEV) {
            console.log('[Auth][Google] Credential recibido del botón Google', {
              credentialLength: credentialResponse.credential.length,
              credentialPrefix: `${credentialResponse.credential.slice(0, 12)}...`,
            })
          }
          onSuccess({ credential: credentialResponse.credential })
        } else if (import.meta.env.DEV) {
          console.warn('[Auth][Google] El botón Google respondió sin credential')
        }
      }}
      onError={() => {
        if (import.meta.env.DEV) {
          console.error('[Auth][Google] onError disparado desde GoogleLogin')
        }
        onError()
      }}
    />
  )
})

export default GoogleLoginButton
